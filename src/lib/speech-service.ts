// Audio & Speech Service for InterviewAI
// Provides reliable Web Speech Synthesis (with Gender matching), 
// Audio stop enforcement, and Web Speech Recognition.

export type PersonaGender = 'female' | 'male';

let currentUtterance: SpeechSynthesisUtterance | null = null;

/**
 * Immediately cancels any playing speech across the application.
 */
export function stopSpeech(): void {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
      currentUtterance = null;
    } catch (e) {
      console.warn('speechSynthesis.cancel error:', e);
    }
  }
}

/**
 * Finds the most suitable voice based on the interviewer persona gender.
 */
export function getVoiceForGender(gender: PersonaGender): SpeechSynthesisVoice | null {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return null;
  }

  const voices = window.speechSynthesis.getVoices();
  if (!voices || voices.length === 0) return null;

  const femaleKeywords = ['zira', 'samantha', 'victoria', 'karen', 'susan', 'fiona', 'moira', 'tessa', 'veena', 'female', 'natural'];
  const maleKeywords = ['david', 'george', 'alex', 'daniel', 'oliver', 'james', 'mark', 'male', 'guy', 'richard'];

  const englishVoices = voices.filter(v => v.lang.startsWith('en'));
  const candidatePool = englishVoices.length > 0 ? englishVoices : voices;

  if (gender === 'female') {
    // 1. Search name containing female indicator
    const foundFemale = candidatePool.find(v =>
      femaleKeywords.some(keyword => v.name.toLowerCase().includes(keyword))
    );
    if (foundFemale) return foundFemale;

    // 2. Avoid explicit male voices
    const nonMale = candidatePool.find(v =>
      !maleKeywords.some(keyword => v.name.toLowerCase().includes(keyword))
    );
    if (nonMale) return nonMale;
  } else {
    // Male search
    const foundMale = candidatePool.find(v =>
      maleKeywords.some(keyword => v.name.toLowerCase().includes(keyword))
    );
    if (foundMale) return foundMale;

    // Avoid explicit female voices
    const nonFemale = candidatePool.find(v =>
      !femaleKeywords.some(keyword => v.name.toLowerCase().includes(keyword))
    );
    if (nonFemale) return nonFemale;
  }

  return candidatePool[0] || null;
}

/**
 * Speaks an interviewer question audibly with gender-matched voice.
 */
export function speakQuestion(
  text: string,
  personaGender: PersonaGender = 'female',
  onStart?: () => void,
  onEnd?: () => void,
  onError?: (err: any) => void
): void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    if (onEnd) onEnd();
    return;
  }

  // Cancel any ongoing speech first to prevent overlap
  stopSpeech();

  if (!text || text.trim().length === 0) {
    if (onEnd) onEnd();
    return;
  }

  // Ensure voices are loaded (Chrome sometimes loads them asynchronously)
  const initSpeech = () => {
    try {
      const utterance = new SpeechSynthesisUtterance(text);
      currentUtterance = utterance;

      const voice = getVoiceForGender(personaGender);
      if (voice) {
        utterance.voice = voice;
      }

      // Gender pitch tuning as fallback guarantee
      if (personaGender === 'female') {
        utterance.pitch = 1.15;
        utterance.rate = 0.95;
      } else {
        utterance.pitch = 0.88;
        utterance.rate = 0.95;
      }

      utterance.onstart = () => {
        if (onStart) onStart();
      };

      utterance.onend = () => {
        currentUtterance = null;
        if (onEnd) onEnd();
      };

      utterance.onerror = (e) => {
        // Interrupted/canceled error is normal when user moves forward
        currentUtterance = null;
        if (e.error !== 'interrupted' && e.error !== 'canceled') {
          console.warn('SpeechSynthesis error:', e);
          if (onError) onError(e);
        }
        if (onEnd) onEnd();
      };

      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.warn('Failed to start speech synthesis:', err);
      if (onEnd) onEnd();
    }
  };

  if (window.speechSynthesis.getVoices().length === 0) {
    window.speechSynthesis.onvoiceschanged = () => {
      window.speechSynthesis.onvoiceschanged = null;
      initSpeech();
    };
  } else {
    initSpeech();
  }
}

/**
 * Speech Recognition Wrapper for real-time speech-to-text.
 */
export class LiveSpeechRecognizer {
  private recognition: any = null;
  private isListening = false;
  private onTranscriptUpdate: (text: string) => void;
  private onErrorCallback?: (err: string) => void;
  private onEndCallback?: () => void;
  private accumulatedText = '';

  constructor(
    onTranscriptUpdate: (text: string) => void,
    onError?: (err: string) => void,
    onEnd?: () => void
  ) {
    this.onTranscriptUpdate = onTranscriptUpdate;
    this.onErrorCallback = onError;
    this.onEndCallback = onEnd;

    if (typeof window !== 'undefined') {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

      if (SpeechRecognition) {
        this.recognition = new SpeechRecognition();
        this.recognition.continuous = true;
        this.recognition.interimResults = true;
        this.recognition.lang = 'en-US';

        this.recognition.onresult = (event: any) => {
          let interimTranscript = '';
          let finalTranscript = '';

          for (let i = event.resultIndex; i < event.results.length; ++i) {
            const piece = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalTranscript += piece + ' ';
            } else {
              interimTranscript += piece;
            }
          }

          if (finalTranscript) {
            this.accumulatedText += finalTranscript;
          }

          const fullCurrentText = (this.accumulatedText + interimTranscript).trim();
          this.onTranscriptUpdate(fullCurrentText);
        };

        this.recognition.onerror = (e: any) => {
          if (e.error !== 'no-speech') {
            console.warn('SpeechRecognition error:', e.error);
            if (this.onErrorCallback) this.onErrorCallback(e.error);
          }
        };

        this.recognition.onend = () => {
          this.isListening = false;
          if (this.onEndCallback) this.onEndCallback();
        };
      }
    }
  }

  public isSupported(): boolean {
    return !!this.recognition;
  }

  public start(existingText: string = ''): boolean {
    if (!this.recognition) return false;
    this.accumulatedText = existingText ? existingText.trim() + ' ' : '';
    try {
      this.recognition.start();
      this.isListening = true;
      return true;
    } catch (e) {
      console.warn('Failed to start speech recognition:', e);
      return false;
    }
  }

  public stop(): void {
    if (!this.recognition || !this.isListening) return;
    try {
      this.recognition.stop();
      this.isListening = false;
    } catch (e) {
      console.warn('Failed to stop speech recognition:', e);
    }
  }
}
