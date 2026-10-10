'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Camera,
  Mic,
  Maximize2,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RefreshCw,
  ShieldCheck,
  ShieldAlert,
  ArrowRight,
  Eye,
  Sliders,
  Sparkles,
  Info
} from 'lucide-react';
import { CameraVisionMonitor, FaceAnalysisResult } from '@/lib/proctoring-engine';

interface PreInterviewSecurityGateProps {
  sessionTitle: string;
  company?: string;
  role?: string;
  onSecurityPassed: (stream: MediaStream) => void;
  onCancel: () => void;
}

export default function PreInterviewSecurityGate({
  sessionTitle,
  company = 'Google',
  role = 'Software Engineer',
  onSecurityPassed,
  onCancel,
}: PreInterviewSecurityGateProps) {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraStatus, setCameraStatus] = useState<'INITIALIZING' | 'VERIFYING' | 'PASS' | 'ERROR'>('INITIALIZING');
  const [micStatus, setMicStatus] = useState<'INITIALIZING' | 'VERIFYING' | 'PASS' | 'ERROR'>('INITIALIZING');
  const [faceStatus, setFaceStatus] = useState<'INITIALIZING' | 'SCANNING' | 'CENTERED' | 'NOT_DETECTED' | 'LIGHTING_POOR'>('INITIALIZING');
  const [screenCheckStatus, setScreenCheckStatus] = useState<'PASS' | 'WARN'>('PASS');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Audio level meter
  const [micVolume, setMicVolume] = useState<number>(0);
  const [faceConfidence, setFaceConfidence] = useState<number>(0);
  const [isEnteringFullscreen, setIsEnteringFullscreen] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const faceVerifiedFramesRef = useRef<number>(0);

  // 1. Initialize Hardware Devices (Camera + Microphone)
  const initializeDevices = async () => {
    setCameraStatus('INITIALIZING');
    setMicStatus('INITIALIZING');
    setFaceStatus('INITIALIZING');
    setErrorMessage(null);
    faceVerifiedFramesRef.current = 0;

    // Clean up previous stream if any
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
    }

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('WebRTC mediaDevices API is not supported in this browser environment.');
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          frameRate: { ideal: 30, min: 15 },
        },
        audio: true,
      });

      // Verify active video track
      const videoTracks = mediaStream.getVideoTracks();
      if (!videoTracks.length || videoTracks[0].readyState !== 'live') {
        throw new Error('Video camera track could not be activated or is in standby.');
      }

      // Verify active audio track
      const audioTracks = mediaStream.getAudioTracks();
      if (!audioTracks.length || audioTracks[0].readyState !== 'live') {
        throw new Error('Microphone audio track could not be activated.');
      }

      setStream(mediaStream);
      setCameraStatus('VERIFYING');
      setMicStatus('VERIFYING');

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play().catch(() => {});
      }

      // Start Audio Volume Analyzer
      setupAudioMonitoring(mediaStream);

      // Start Face Detection Verification Loop
      setFaceStatus('SCANNING');
    } catch (err: any) {
      console.error('Security Gate Hardware Failure:', err);
      setCameraStatus('ERROR');
      setMicStatus('ERROR');
      setFaceStatus('NOT_DETECTED');

      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setErrorMessage(
          'Camera and Microphone permissions were denied. Please click the camera/lock icon in your browser URL bar, enable permissions for this site, and click "Retry Security Verification".'
        );
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        setErrorMessage(
          'Camera or Microphone is currently in use by another desktop application (e.g., Zoom, Teams, Skype). Please close external video apps and retry.'
        );
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setErrorMessage(
          'No camera or microphone hardware device was found. A functional webcam and microphone are mandatory for anti-cheat verification.'
        );
      } else {
        setErrorMessage(err.message || 'Failed to initialize security surveillance devices.');
      }
    }
  };

  // Setup Web Audio Volume Meter
  const setupAudioMonitoring = (mediaStream: MediaStream) => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;

      const audioCtx = new AudioCtx();
      audioContextRef.current = audioCtx;
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      analyserRef.current = analyser;

      const source = audioCtx.createMediaStreamSource(mediaStream);
      source.connect(analyser);

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      let sustainedVoiceCounter = 0;

      const checkVolume = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);

        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const avg = sum / bufferLength;
        const normalized = Math.min(100, Math.round((avg / 128) * 100));
        setMicVolume(normalized);

        // If audio level responds to sound/speech, confirm mic is functional
        if (normalized > 5) {
          sustainedVoiceCounter++;
          if (sustainedVoiceCounter >= 4) {
            setMicStatus('PASS');
          }
        }

        animFrameRef.current = requestAnimationFrame(checkVolume);
      };

      checkVolume();
    } catch (e) {
      console.warn('Audio metering error:', e);
      setMicStatus('PASS'); // fallback if audio context restricted
    }
  };

  // Face Verification Loop
  useEffect(() => {
    if (!stream || cameraStatus === 'ERROR') return;

    const interval = setInterval(() => {
      if (!videoRef.current || videoRef.current.readyState < 2) return;

      const analysis: FaceAnalysisResult = CameraVisionMonitor.analyzeVideoFrame(videoRef.current);
      setFaceConfidence(analysis.confidence);

      if (!analysis.isAdequateLighting) {
        setFaceStatus('LIGHTING_POOR');
        return;
      }

      if (analysis.isFacePresent) {
        setCameraStatus('PASS');
        if (analysis.isFaceCentered) {
          setFaceStatus('CENTERED');
          faceVerifiedFramesRef.current += 1;
        } else {
          setFaceStatus('SCANNING');
        }
      } else {
        setFaceStatus('NOT_DETECTED');
        faceVerifiedFramesRef.current = Math.max(0, faceVerifiedFramesRef.current - 1);
      }
    }, 250);

    return () => clearInterval(interval);
  }, [stream, cameraStatus]);

  useEffect(() => {
    initializeDevices();

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(() => {});
      }
    };
  }, []);

  // Multi-screen detection
  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).screen) {
      if ((window.screen as any).isExtended) {
        setScreenCheckStatus('WARN');
      }
    }
  }, []);

  // Mandatory Fullscreen Entry and Launch
  const handleStartWithFullscreen = async () => {
    setIsEnteringFullscreen(true);

    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      }

      if (stream) {
        onSecurityPassed(stream);
      }
    } catch (err) {
      console.warn('Fullscreen request failed or was cancelled:', err);
      // Even if browser blocks auto-fullscreen, pass stream so user can proceed with proctor modal
      if (stream) {
        onSecurityPassed(stream);
      }
    } finally {
      setIsEnteringFullscreen(false);
    }
  };

  const isAllChecksPassed =
    cameraStatus === 'PASS' &&
    (micStatus === 'PASS' || micVolume > 3) &&
    (faceStatus === 'CENTERED' || faceConfidence >= 60);

  return (
    <div className="max-w-3xl mx-auto p-8 rounded-3xl bg-white border border-slate-200/90 shadow-xl space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-pulse" />
            <h2 className="text-xl font-black text-slate-800 tracking-tight">
              Pre-Interview Security Verification Gate
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Mandatory biometric camera, microphone, and fullscreen validation for {sessionTitle} ({company} · {role})
          </p>
        </div>

        <span className="self-start sm:self-center px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-rose-50 text-rose-700 border border-rose-200">
          Proctoring Mandatory
        </span>
      </div>

      {/* Error / Denial Guidance Banner */}
      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-800 space-y-2">
          <div className="flex items-center gap-2 font-bold text-rose-900">
            <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>Hardware Verification Required</span>
          </div>
          <p className="text-rose-700 leading-relaxed">{errorMessage}</p>
          <div className="pt-1">
            <button
              onClick={initializeDevices}
              className="px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry Security Verification</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Verification Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
        {/* Left: Live Camera View with Face Reticle */}
        <div className="md:col-span-6 flex flex-col items-center">
          <div className="w-full aspect-[4/3] rounded-2xl overflow-hidden bg-slate-950 border-2 border-slate-800 relative shadow-inner">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover transform -scale-x-100"
            />

            {/* Computer Vision Face Reticle */}
            <div
              className={`absolute inset-6 rounded-2xl border-2 pointer-events-none transition-all duration-300 ${
                faceStatus === 'CENTERED'
                  ? 'border-emerald-500 shadow-[0_0_16px_rgba(16,185,129,0.35)]'
                  : faceStatus === 'SCANNING'
                  ? 'border-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.25)] animate-pulse'
                  : 'border-rose-500/80 animate-pulse'
              }`}
            >
              {/* Corner brackets */}
              <span className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-inherit" />
              <span className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-inherit" />
              <span className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-inherit" />
              <span className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-inherit" />
            </div>

            {/* Live Camera Status Badge */}
            <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-black/70 backdrop-blur-md text-[10px] font-extrabold uppercase tracking-wider">
              {faceStatus === 'CENTERED' ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                  <span className="text-emerald-400">Face Verified & Centered</span>
                </>
              ) : faceStatus === 'SCANNING' ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                  <span className="text-amber-400">Center Face in Frame</span>
                </>
              ) : faceStatus === 'LIGHTING_POOR' ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  <span className="text-amber-400">Low Lighting Detected</span>
                </>
              ) : (
                <>
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                  <span className="text-rose-400">No Face Detected</span>
                </>
              )}
            </div>

            {/* Confidence Gauge */}
            <div className="absolute bottom-3 right-3 px-2 py-0.5 rounded-lg bg-black/60 text-[9px] font-mono text-slate-300">
              Biometric Conf: {faceConfidence}%
            </div>
          </div>
          <p className="text-[11px] text-slate-400 text-center mt-2">
            Look directly at the camera. Ensure your face is well-lit and centered.
          </p>
        </div>

        {/* Right: Security Checklist */}
        <div className="md:col-span-6 space-y-3.5">
          {/* Check 1: Camera Active */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2.5">
              <Camera className="w-4 h-4 text-indigo-600 shrink-0" />
              <div>
                <p className="font-bold text-slate-800">Webcam Hardware Stream</p>
                <p className="text-[10px] text-slate-500">Live 30fps video feed & frame capture</p>
              </div>
            </div>
            {cameraStatus === 'PASS' ? (
              <span className="text-emerald-600 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" /> Ready
              </span>
            ) : cameraStatus === 'ERROR' ? (
              <span className="text-rose-600 font-bold flex items-center gap-1">
                <XCircle className="w-4 h-4" /> Blocked
              </span>
            ) : (
              <span className="text-slate-400 font-semibold animate-pulse">Initializing...</span>
            )}
          </div>

          {/* Check 2: Face Presence & Bounding */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2.5">
              <Eye className="w-4 h-4 text-indigo-600 shrink-0" />
              <div>
                <p className="font-bold text-slate-800">Face Detection & Centering</p>
                <p className="text-[10px] text-slate-500">Computer Vision centroid calibration</p>
              </div>
            </div>
            {faceStatus === 'CENTERED' ? (
              <span className="text-emerald-600 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" /> Verified
              </span>
            ) : faceStatus === 'SCANNING' ? (
              <span className="text-amber-600 font-bold flex items-center gap-1">
                <AlertTriangle className="w-4 h-4" /> Align Face
              </span>
            ) : (
              <span className="text-slate-400 font-semibold">Scanning...</span>
            )}
          </div>

          {/* Check 3: Microphone & Audio Level */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Mic className="w-4 h-4 text-indigo-600 shrink-0" />
                <div>
                  <p className="font-bold text-slate-800">Microphone Input</p>
                  <p className="text-[10px] text-slate-500">Speak to test audio sensitivity</p>
                </div>
              </div>
              {micStatus === 'PASS' || micVolume > 3 ? (
                <span className="text-emerald-600 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" /> Active
                </span>
              ) : (
                <span className="text-slate-400 font-semibold animate-pulse">Speak to test...</span>
              )}
            </div>

            {/* Live Volume Meter Bar */}
            <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
              <div
                className="h-full bg-emerald-500 transition-all duration-75"
                style={{ width: `${Math.max(5, micVolume)}%` }}
              />
            </div>
          </div>

          {/* Check 4: Fullscreen Enforcement */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2.5">
              <Maximize2 className="w-4 h-4 text-indigo-600 shrink-0" />
              <div>
                <p className="font-bold text-slate-800">Mandatory Fullscreen Lockdown</p>
                <p className="text-[10px] text-slate-500">Enforces distraction-free secure window</p>
              </div>
            </div>
            <span className="text-indigo-600 font-bold bg-indigo-50 px-2 py-0.5 rounded">
              Locked on Start
            </span>
          </div>
        </div>
      </div>

      {/* Security Policies Box */}
      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5 text-xs text-slate-600">
        <p className="font-bold text-slate-800 flex items-center gap-1.5">
          <ShieldAlert className="w-4 h-4 text-rose-600" />
          <span>Active Anti-Cheat Protocol Summary</span>
        </p>
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[11px] list-disc list-inside">
          <li>Tab switching & external window clicks immediately freeze questions.</li>
          <li>Continuous head movement & looking-down-at-phone heuristics active.</li>
          <li>Unauthorized copy, paste, and DevTools shortcuts are suppressed.</li>
          <li>3 consecutive focus breaches terminate the assessment attempt.</li>
        </ul>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between gap-3 pt-2">
        <button
          onClick={onCancel}
          className="py-3 px-5 rounded-2xl border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold text-xs transition-colors"
        >
          Cancel
        </button>

        <button
          onClick={handleStartWithFullscreen}
          disabled={!isAllChecksPassed || isEnteringFullscreen}
          className={`flex-1 py-3.5 rounded-2xl font-bold text-sm shadow-xl flex items-center justify-center gap-2 transition-all ${
            isAllChecksPassed
              ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/30 cursor-pointer animate-pulse'
              : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>
            {isEnteringFullscreen
              ? 'Locking Fullscreen...'
              : isAllChecksPassed
              ? 'Lock Fullscreen & Begin Proctored Interview'
              : 'Complete Camera & Audio Check to Begin'}
          </span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
