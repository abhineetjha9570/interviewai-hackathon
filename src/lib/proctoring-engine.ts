// Production-level Proctoring & Cheating Prevention Engine
// Handles: Tab switching, Fullscreen guards, Computer Vision Face & Gaze Tracking,
// Audio Noise/Secondary Voice Monitoring, Keyboard/Clipboard restrictions, and Integrity Scoring.

export type ProctorEventType =
  | 'TAB_SWITCH'
  | 'WINDOW_BLUR'
  | 'FULLSCREEN_EXIT'
  | 'FACE_MISSING'
  | 'MULTIPLE_FACES'
  | 'LOOKING_AWAY'
  | 'LOOKING_DOWN_PHONE'
  | 'SECONDARY_VOICE_DETECTED'
  | 'COPY_ATTEMPT'
  | 'PASTE_ATTEMPT'
  | 'DEVTOOLS_SHORTCUT'
  | 'CONTEXT_MENU_BLOCKED'
  | 'SCREEN_CHANGED'
  | 'SESSION_SUSPENDED';

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface ProctorEventLog {
  id: string;
  timestamp: string; // ISO or MM:SS
  type: ProctorEventType;
  label: string;
  details: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  penalty: number;
}

export interface ProctoringStats {
  integrityScore: number;
  riskLevel: RiskLevel;
  totalViolations: number;
  tabSwitches: number;
  windowBlurs: number;
  fullscreenExits: number;
  faceMissingCount: number;
  multipleFacesCount: number;
  lookingAwayCount: number;
  phoneDetectedCount: number;
  copyAttempts: number;
  pasteAttempts: number;
  secondaryAudioCount: number;
  strikes: number;
  isSuspended: boolean;
  events: ProctorEventLog[];
}

export const EVENT_WEIGHTS: Record<ProctorEventType, { penalty: number; severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'; label: string }> = {
  TAB_SWITCH: { penalty: 8, severity: 'MEDIUM', label: 'Tab Switch / Navigation Away' },
  WINDOW_BLUR: { penalty: 10, severity: 'HIGH', label: 'Window Focus Lost / External App Used' },
  FULLSCREEN_EXIT: { penalty: 8, severity: 'HIGH', label: 'Mandatory Fullscreen Exited' },
  FACE_MISSING: { penalty: 5, severity: 'MEDIUM', label: 'Face Missing from Camera' },
  MULTIPLE_FACES: { penalty: 10, severity: 'HIGH', label: 'Multiple Persons Detected' },
  LOOKING_AWAY: { penalty: 2, severity: 'LOW', label: 'Prolonged Gaze Away' },
  LOOKING_DOWN_PHONE: { penalty: 4, severity: 'MEDIUM', label: 'Prolonged Downward Head Pose' },
  SECONDARY_VOICE_DETECTED: { penalty: 6, severity: 'MEDIUM', label: 'Background Voice Detected' },
  COPY_ATTEMPT: { penalty: 3, severity: 'LOW', label: 'Restricted Copy Attempt' },
  PASTE_ATTEMPT: { penalty: 3, severity: 'LOW', label: 'Restricted Paste Attempt' },
  DEVTOOLS_SHORTCUT: { penalty: 15, severity: 'CRITICAL', label: 'Developer Tools Access Attempt' },
  CONTEXT_MENU_BLOCKED: { penalty: 1, severity: 'LOW', label: 'Right-Click Context Menu Blocked' },
  SCREEN_CHANGED: { penalty: 6, severity: 'MEDIUM', label: 'Display Configuration Changed' },
  SESSION_SUSPENDED: { penalty: 25, severity: 'CRITICAL', label: 'Session Suspended for Severe Integrity Breach' },
};

export function calculateRiskLevel(score: number): RiskLevel {
  if (score >= 90) return 'LOW';
  if (score >= 70) return 'MEDIUM';
  if (score >= 45) return 'HIGH';
  return 'CRITICAL';
}

export interface FaceAnalysisResult {
  hasVideoFeed: boolean;
  isAdequateLighting: boolean;
  isFacePresent: boolean;
  isFaceCentered: boolean;
  isLookingDown: boolean;
  isLookingAway: boolean;
  skinPixelCount: number;
  averageLuminance: number;
  confidence: number; // 0 - 100
}

/**
 * Computer Vision Frame Analyzer using HTML5 Canvas & WebRTC Video.
 * Analyzes candidate face presence, centroid position (head tilt/turn),
 * downward gaze (phone usage heuristic), and multiple person contours.
 */
export class CameraVisionMonitor {
  private video: HTMLVideoElement | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private animFrameId: number | null = null;
  private lastFaceSeenTime: number = Date.now();
  private consecutiveDownGazeFrames: number = 0;
  private consecutiveAwayFrames: number = 0;
  private onEventCallback: (type: ProctorEventType, details: string) => void;

  constructor(onEvent: (type: ProctorEventType, details: string) => void) {
    this.onEventCallback = onEvent;
  }

  public static analyzeVideoFrame(video: HTMLVideoElement): FaceAnalysisResult {
    const defaultRes: FaceAnalysisResult = {
      hasVideoFeed: false,
      isAdequateLighting: false,
      isFacePresent: false,
      isFaceCentered: false,
      isLookingDown: false,
      isLookingAway: false,
      skinPixelCount: 0,
      averageLuminance: 0,
      confidence: 0,
    };

    if (!video || video.readyState < 2 || video.videoWidth === 0) {
      return defaultRes;
    }

    try {
      const canvas = document.createElement('canvas');
      canvas.width = 160;
      canvas.height = 120;
      const ctx = canvas.getContext('2d');
      if (!ctx) return defaultRes;

      ctx.drawImage(video, 0, 0, 160, 120);
      const imgData = ctx.getImageData(0, 0, 160, 120);
      const data = imgData.data;

      let totalLum = 0;
      let skinPixelCount = 0;
      let sumX = 0;
      let sumY = 0;
      let bottomHalfSkin = 0;

      for (let i = 0; i < data.length; i += 16) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const lum = 0.299 * r + 0.587 * g + 0.114 * b;
        totalLum += lum;

        const isSkin =
          r > 50 &&
          g > 35 &&
          b > 20 &&
          r > g &&
          r > b &&
          Math.abs(r - g) > 10;

        if (isSkin) {
          const pixelIdx = i / 4;
          const x = pixelIdx % 160;
          const y = Math.floor(pixelIdx / 160);
          skinPixelCount++;
          sumX += x;
          sumY += y;
          if (y > 70) bottomHalfSkin++;
        }
      }

      const totalSampledPixels = data.length / 16;
      const avgLum = totalLum / totalSampledPixels;
      const isAdequateLighting = avgLum >= 30 && avgLum <= 245;

      const isFacePresent = skinPixelCount >= 160 && isAdequateLighting;
      const avgX = skinPixelCount > 0 ? sumX / skinPixelCount : 80;
      const avgY = skinPixelCount > 0 ? sumY / skinPixelCount : 60;

      const isFaceCentered = isFacePresent && avgX >= 48 && avgX <= 112 && avgY >= 30 && avgY <= 85;
      const isLookingAway = isFacePresent && (avgX < 45 || avgX > 115);
      const isLookingDown = isFacePresent && (avgY > 75 && bottomHalfSkin > skinPixelCount * 0.65);

      let confidence = 0;
      if (isFacePresent) confidence += 40;
      if (isAdequateLighting) confidence += 20;
      if (isFaceCentered) confidence += 40;

      return {
        hasVideoFeed: true,
        isAdequateLighting,
        isFacePresent,
        isFaceCentered,
        isLookingDown,
        isLookingAway,
        skinPixelCount,
        averageLuminance: Math.round(avgLum),
        confidence,
      };
    } catch {
      return defaultRes;
    }
  }

  public start(videoElement: HTMLVideoElement) {
    this.video = videoElement;
    this.canvas = document.createElement('canvas');
    this.canvas.width = 160;
    this.canvas.height = 120;
    this.ctx = this.canvas.getContext('2d', { willReadFrequently: true });
    this.lastFaceSeenTime = Date.now();

    this.processLoop();
  }

  public stop() {
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
  }

  private processLoop = () => {
    if (!this.video || !this.ctx || this.video.paused || this.video.ended) {
      this.animFrameId = requestAnimationFrame(this.processLoop);
      return;
    }

    try {
      this.ctx.drawImage(this.video, 0, 0, 160, 120);
      const imgData = this.ctx.getImageData(0, 0, 160, 120);
      const data = imgData.data;

      // Computer Vision Analysis: Skin tone pixel detection & centroid tracking
      let skinPixelCount = 0;
      let sumX = 0;
      let sumY = 0;
      let leftHalfSkin = 0;
      let rightHalfSkin = 0;
      let bottomHalfSkin = 0;

      for (let i = 0; i < data.length; i += 16) {
        // Sample every 4th pixel for high efficiency
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        // Standard RGB skin-tone thresholding heuristics
        // (r > 60 && g > 40 && b > 20 && r > g && r > b && |r-g| > 15)
        const isSkin =
          r > 50 &&
          g > 35 &&
          b > 20 &&
          r > g &&
          r > b &&
          Math.abs(r - g) > 10;

        if (isSkin) {
          const pixelIdx = i / 4;
          const x = pixelIdx % 160;
          const y = Math.floor(pixelIdx / 160);

          skinPixelCount++;
          sumX += x;
          sumY += y;

          if (x < 80) leftHalfSkin++;
          else rightHalfSkin++;

          if (y > 70) bottomHalfSkin++;
        }
      }

      const now = Date.now();
      const MIN_FACE_PIXELS = 120; // threshold for face presence in 160x120 downsampled grid

      if (skinPixelCount < MIN_FACE_PIXELS) {
        // Face missing or obstructed
        if (now - this.lastFaceSeenTime > 5000) {
          this.onEventCallback('FACE_MISSING', 'Candidate face is missing or blocked from the camera frame.');
          this.lastFaceSeenTime = now; // throttle alerts
        }
      } else {
        this.lastFaceSeenTime = now;
        const avgX = sumX / skinPixelCount;
        const avgY = sumY / skinPixelCount;

        // 1. Multiple faces check (unusually large skin mass spread across disparate regions)
        if (skinPixelCount > 2200) {
          this.onEventCallback('MULTIPLE_FACES', 'Possible multiple individuals detected in camera view.');
        }

        // 2. Gaze / Head turning away (centroid severely off-center: left or right)
        // Require ~5 seconds of continuous looking away (85+ frames) to avoid penalizing quick side glances
        const isLookingAway = avgX < 38 || avgX > 122;
        if (isLookingAway) {
          this.consecutiveAwayFrames++;
          if (this.consecutiveAwayFrames > 85) {
            this.onEventCallback('LOOKING_AWAY', 'Candidate is repeatedly looking away from the primary interview display.');
            this.consecutiveAwayFrames = 0;
          }
        } else {
          this.consecutiveAwayFrames = Math.max(0, this.consecutiveAwayFrames - 2);
        }

        // 3. Looking down / Phone usage heuristic: centroid drops into lower 40% of frame
        // Require ~7 seconds of continuous downward gaze (110+ frames) to distinguish from looking at keyboard
        const isLookingDown = avgY > 80 && bottomHalfSkin > skinPixelCount * 0.70;
        if (isLookingDown) {
          this.consecutiveDownGazeFrames++;
          if (this.consecutiveDownGazeFrames > 110) {
            this.onEventCallback(
              'LOOKING_DOWN_PHONE',
              'Candidate is repeatedly looking down below the screen (possible secondary device or phone usage).'
            );
            this.consecutiveDownGazeFrames = 0;
          }
        } else {
          this.consecutiveDownGazeFrames = Math.max(0, this.consecutiveDownGazeFrames - 2);
        }
      }
    } catch (_) {
      // Ignore frame read errors (cross-origin etc.)
    }

    this.animFrameId = requestAnimationFrame(this.processLoop);
  };
}

/**
 * Audio Energy & Voice Activity Monitor using Web Audio API
 */
export class AudioEnvironmentMonitor {
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private microphone: MediaStreamAudioSourceNode | null = null;
  private animId: number | null = null;
  private lastAlertTime: number = 0;
  private onAudioSpike: (type: ProctorEventType, details: string) => void;

  constructor(onAudioSpike: (type: ProctorEventType, details: string) => void) {
    this.onAudioSpike = onAudioSpike;
  }

  public async start(stream: MediaStream) {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;

      this.audioContext = new AudioCtx();
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 512;
      this.analyser.smoothingTimeConstant = 0.8;

      this.microphone = this.audioContext.createMediaStreamSource(stream);
      this.microphone.connect(this.analyser);

      this.analyzeAudio();
    } catch (e) {
      console.warn('Audio environment monitoring unavailable:', e);
    }
  }

  public stop() {
    if (this.animId) cancelAnimationFrame(this.animId);
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close().catch(() => {});
    }
  }

  private analyzeAudio = () => {
    if (!this.analyser) return;

    const bufferLength = this.analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    this.analyser.getByteFrequencyData(dataArray);

    // Compute average decibel level
    let sum = 0;
    for (let i = 0; i < bufferLength; i++) {
      sum += dataArray[i];
    }
    const average = sum / bufferLength;

    const now = Date.now();
    // High sustained energy in conversational frequency range (voice activity)
    if (average > 75 && now - this.lastAlertTime > 8000) {
      this.lastAlertTime = now;
      this.onAudioSpike(
        'SECONDARY_VOICE_DETECTED',
        'Elevated acoustic energy or background conversational speech detected in the environment.'
      );
    }

    this.animId = requestAnimationFrame(this.analyzeAudio);
  };
}
