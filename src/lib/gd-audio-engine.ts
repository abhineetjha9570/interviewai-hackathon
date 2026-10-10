// GD Arena — Client-Side Audio, Voice & WebRTC Peer Connection Engine
// Handles:
// 1. Web Speech Synthesis with verified gender, pitch & rate profiles for Arjun, Meera, Kabir, Sara & Moderator.
// 2. Real-time Web Speech Recognition for live candidate speech-to-text.
// 3. WebRTC Mesh Audio Engine with Google STUN, microphone tracks & remote stream management.
// 4. Web Audio API RMS Volume Analyzer for live animated speaking visualizers.

import { GD_PERSONALITIES } from './gd-orchestrator';

// =========================================================================
// 1. MULTI-PERSONALITY SPEECH SYNTHESIS ENGINE
// =========================================================================

let currentUtterance: SpeechSynthesisUtterance | null = null;

export function stopGDSpeech(): void {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
      currentUtterance = null;
    } catch (e) {
      console.warn('speechSynthesis cancel error:', e);
    }
  }
}

/**
 * Speaks text using the designated AI personality's verified acoustic profile.
 */
export function speakGDPersonality(
  text: string,
  personalityKey: 'ARJUN' | 'MEERA' | 'KABIR' | 'SARA' | 'MODERATOR',
  onStart?: () => void,
  onEnd?: () => void,
  onError?: (err: any) => void
): void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    if (onEnd) onEnd();
    return;
  }

  stopGDSpeech();

  if (!text || text.trim().length === 0) {
    if (onEnd) onEnd();
    return;
  }

  const personality = GD_PERSONALITIES[personalityKey] || GD_PERSONALITIES.MODERATOR;

  const initVoice = () => {
    try {
      const utterance = new SpeechSynthesisUtterance(text);
      currentUtterance = utterance;

      const voices = window.speechSynthesis.getVoices();
      const englishVoices = voices.filter((v) => v.lang.startsWith('en'));
      const pool = englishVoices.length > 0 ? englishVoices : voices;

      const femaleKeywords = ['zira', 'samantha', 'victoria', 'karen', 'susan', 'female', 'natural'];
      const maleKeywords = ['david', 'george', 'alex', 'daniel', 'mark', 'male', 'guy', 'james'];

      let chosenVoice: SpeechSynthesisVoice | null = null;
      if (personality.gender === 'female') {
        chosenVoice =
          pool.find((v) => femaleKeywords.some((k) => v.name.toLowerCase().includes(k))) ||
          pool.find((v) => !maleKeywords.some((k) => v.name.toLowerCase().includes(k))) ||
          null;
      } else {
        chosenVoice =
          pool.find((v) => maleKeywords.some((k) => v.name.toLowerCase().includes(k))) ||
          pool.find((v) => !femaleKeywords.some((k) => v.name.toLowerCase().includes(k))) ||
          null;
      }

      if (chosenVoice) {
        utterance.voice = chosenVoice;
      }

      // Exact personality-tuned pitch and rate
      utterance.pitch = personality.pitch;
      utterance.rate = personality.rate;

      utterance.onstart = () => {
        if (onStart) onStart();
      };

      utterance.onend = () => {
        currentUtterance = null;
        if (onEnd) onEnd();
      };

      utterance.onerror = (e) => {
        currentUtterance = null;
        if (e.error !== 'interrupted' && e.error !== 'canceled') {
          console.warn('SpeechSynthesis error:', e);
          if (onError) onError(e);
        }
        if (onEnd) onEnd();
      };

      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.warn('Failed to speak GD personality:', err);
      if (onEnd) onEnd();
    }
  };

  if (window.speechSynthesis.getVoices().length === 0) {
    window.speechSynthesis.onvoiceschanged = () => {
      window.speechSynthesis.onvoiceschanged = null;
      initVoice();
    };
  } else {
    initVoice();
  }
}

// =========================================================================
// 2. LIVE SPEECH-TO-TEXT RECOGNIZER
// =========================================================================

export class GDSpeechRecognizer {
  private recognition: any = null;
  private isListening = false;
  private onTranscriptUpdate: (text: string) => void;
  private onSpeechStatusChange?: (status: 'LISTENING' | 'IDLE' | 'ERROR') => void;
  private accumulatedText = '';

  constructor(
    onTranscriptUpdate: (text: string) => void,
    onSpeechStatusChange?: (status: 'LISTENING' | 'IDLE' | 'ERROR') => void
  ) {
    this.onTranscriptUpdate = onTranscriptUpdate;
    this.onSpeechStatusChange = onSpeechStatusChange;

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
            console.warn('GDSpeechRecognizer error:', e.error);
            if (this.onSpeechStatusChange) this.onSpeechStatusChange('ERROR');
          }
        };

        this.recognition.onend = () => {
          this.isListening = false;
          if (this.onSpeechStatusChange) this.onSpeechStatusChange('IDLE');
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
      if (this.onSpeechStatusChange) this.onSpeechStatusChange('LISTENING');
      return true;
    } catch (e) {
      console.warn('Failed to start speech recognition:', e);
      return false;
    }
  }

  public stop(): string {
    if (this.recognition && this.isListening) {
      try {
        this.recognition.stop();
      } catch (e) {}
    }
    this.isListening = false;
    if (this.onSpeechStatusChange) this.onSpeechStatusChange('IDLE');
    return this.accumulatedText.trim();
  }
}

// =========================================================================
// 3. WEBRTC MESH AUDIO ENGINE (Peer-to-Peer Voice for Multiplayer GD)
// =========================================================================

export interface WebRTCConfig {
  roomCode: string;
  myPlayerId: string;
  onRemoteStream: (peerPlayerId: string, stream: MediaStream) => void;
  onPeerSpeakingChange?: (peerPlayerId: string, isSpeaking: boolean) => void;
  onSignalNeeded: (toPlayerId: string, type: 'offer' | 'answer' | 'ice-candidate', payload: any) => void;
}

const RTC_CONFIG: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ],
};

export class GDWebRTCMeshEngine {
  private config: WebRTCConfig;
  private localStream: MediaStream | null = null;
  private peerConnections: Map<string, RTCPeerConnection> = new Map();
  private remoteAudioElements: Map<string, HTMLAudioElement> = new Map();
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private isMuted: boolean = false;
  private volumeCheckInterval: any = null;

  constructor(config: WebRTCConfig) {
    this.config = config;
  }

  /**
   * Initializes local microphone stream and volume meter.
   */
  public async initLocalMedia(): Promise<MediaStream | null> {
    if (typeof window === 'undefined' || !navigator.mediaDevices) {
      return null;
    }

    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: false,
      });

      // Setup audio analyzer for local voice activity detection
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) {
          this.audioContext = new AudioCtx();
          const source = this.audioContext.createMediaStreamSource(this.localStream);
          this.analyser = this.audioContext.createAnalyser();
          this.analyser.fftSize = 256;
          source.connect(this.analyser);
        }
      } catch (e) {
        console.warn('AudioContext volume analyzer setup error:', e);
      }

      return this.localStream;
    } catch (err) {
      console.warn('getUserMedia microphone error:', err);
      return null;
    }
  }

  /**
   * Toggles local microphone mute.
   */
  public toggleMute(mute?: boolean): boolean {
    if (!this.localStream) return true;
    const shouldMute = mute !== undefined ? mute : !this.isMuted;
    this.localStream.getAudioTracks().forEach((track) => {
      track.enabled = !shouldMute;
    });
    this.isMuted = shouldMute;
    return this.isMuted;
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  /**
   * Checks current local RMS volume level (0-100) to detect speaking.
   */
  public getLocalVolume(): number {
    if (!this.analyser || this.isMuted) return 0;
    const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteFrequencyData(dataArray);
    let sum = 0;
    for (let i = 0; i < dataArray.length; i++) {
      sum += dataArray[i];
    }
    const avg = sum / dataArray.length;
    return Math.min(100, Math.round((avg / 128) * 100));
  }

  /**
   * Connects to a new remote peer by initiating an SDP offer.
   */
  public async connectToPeer(remotePlayerId: string): Promise<void> {
    if (this.peerConnections.has(remotePlayerId)) return;

    const pc = this.createPeerConnection(remotePlayerId);
    this.peerConnections.set(remotePlayerId, pc);

    // Create and send SDP offer
    try {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      this.config.onSignalNeeded(remotePlayerId, 'offer', offer);
    } catch (e) {
      console.warn(`Failed to create offer for peer ${remotePlayerId}:`, e);
    }
  }

  /**
   * Handles incoming signaling messages (offer, answer, ice-candidate).
   */
  public async handleSignal(
    fromPlayerId: string,
    type: 'offer' | 'answer' | 'ice-candidate',
    payload: any
  ): Promise<void> {
    let pc = this.peerConnections.get(fromPlayerId);

    if (type === 'offer') {
      if (!pc) {
        pc = this.createPeerConnection(fromPlayerId);
        this.peerConnections.set(fromPlayerId, pc);
      }
      await pc.setRemoteDescription(new RTCSessionDescription(payload));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      this.config.onSignalNeeded(fromPlayerId, 'answer', answer);
    } else if (type === 'answer') {
      if (pc) {
        await pc.setRemoteDescription(new RTCSessionDescription(payload));
      }
    } else if (type === 'ice-candidate') {
      if (pc && payload) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(payload));
        } catch (e) {
          console.warn('addIceCandidate error:', e);
        }
      }
    }
  }

  private createPeerConnection(remotePlayerId: string): RTCPeerConnection {
    const pc = new RTCPeerConnection(RTC_CONFIG);

    // Add local tracks if available
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => {
        pc.addTrack(track, this.localStream!);
      });
    }

    // Remote track arrived
    pc.ontrack = (event) => {
      const remoteStream = event.streams[0];
      if (remoteStream) {
        this.config.onRemoteStream(remotePlayerId, remoteStream);

        // Play audio stream
        let audioEl = this.remoteAudioElements.get(remotePlayerId);
        if (!audioEl) {
          audioEl = new Audio();
          audioEl.autoplay = true;
          this.remoteAudioElements.set(remotePlayerId, audioEl);
        }
        audioEl.srcObject = remoteStream;
        audioEl.play().catch((e) => console.warn('Audio play error:', e));
      }
    };

    // ICE Candidate generation
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        this.config.onSignalNeeded(remotePlayerId, 'ice-candidate', event.candidate);
      }
    };

    return pc;
  }

  /**
   * Cleans up all peer connections, audio elements and media tracks.
   */
  public destroy(): void {
    if (this.volumeCheckInterval) {
      clearInterval(this.volumeCheckInterval);
    }

    this.peerConnections.forEach((pc) => {
      try {
        pc.close();
      } catch (e) {}
    });
    this.peerConnections.clear();

    this.remoteAudioElements.forEach((el) => {
      el.srcObject = null;
      el.remove();
    });
    this.remoteAudioElements.clear();

    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => track.stop());
      this.localStream = null;
    }

    if (this.audioContext) {
      this.audioContext.close().catch(() => {});
      this.audioContext = null;
    }

    stopGDSpeech();
  }
}
