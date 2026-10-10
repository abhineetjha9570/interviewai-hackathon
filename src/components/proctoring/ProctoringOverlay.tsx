'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ShieldAlert, Maximize2, Camera, AlertTriangle, Eye, VideoOff } from 'lucide-react';

interface ProctoringOverlayProps {
  interviewId?: string;
  isActive: boolean;
  onViolation?: (type: string, penalty: number) => void;
  onTerminate?: () => void;
  showCameraPreview?: boolean;
}

export default function ProctoringOverlay({
  interviewId,
  isActive = true,
  onViolation,
  onTerminate,
  showCameraPreview = true,
}: ProctoringOverlayProps) {
  const [integrityScore, setIntegrityScore] = useState(100);
  const [violationCount, setViolationCount] = useState(0);
  const [activeWarning, setActiveWarning] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [hasCameraPermission, setHasCameraPermission] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const MAX_VIOLATIONS = 6;

  // Record violation
  const recordViolation = async (type: string, details: string, penalty: number = 3) => {
    if (!isActive) return;

    setViolationCount((prev) => {
      const nextCount = prev + 1;
      if (nextCount >= MAX_VIOLATIONS && onTerminate) {
        onTerminate();
      }
      return nextCount;
    });

    setIntegrityScore((prev) => Math.max(0, prev - penalty));
    setActiveWarning(`${details} (Penalty -${penalty} Integrity Score)`);

    // Clear alert after 4 seconds
    setTimeout(() => {
      setActiveWarning(null);
    }, 4500);

    if (onViolation) {
      onViolation(type, penalty);
    }

    try {
      await fetch('/api/proctoring/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          interviewId,
          eventType: type,
          details,
          penaltyPoints: penalty,
        }),
      });
    } catch (_) {}
  };

  // Browser anti-cheat event listeners
  useEffect(() => {
    if (!isActive) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        recordViolation('TAB_SWITCH', 'Tab switch or minimization detected. Return to the interview immediately!', 4);
      }
    };

    const handleWindowBlur = () => {
      recordViolation('WINDOW_BLUR', 'Window focus lost. Please do not switch to external applications.', 3);
    };

    const handleCopy = (e: ClipboardEvent) => {
      recordViolation('COPY_ATTEMPT', 'Copying content during proctored evaluation is prohibited.', 2);
    };

    const handlePaste = (e: ClipboardEvent) => {
      recordViolation('PASTE_ATTEMPT', 'Pasting code or text from external sources is disabled.', 2);
    };

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      recordViolation('RIGHT_CLICK', 'Right click and context inspection is disabled during interviews.', 1);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // F12 or Ctrl+Shift+I / Ctrl+Shift+C / Ctrl+U
      if (
        e.key === 'F12' ||
        (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'C' || e.key === 'J')) ||
        (e.ctrlKey && e.key === 'u')
      ) {
        e.preventDefault();
        recordViolation('DEVTOOLS_SHORTCUT', 'Developer tools shortcut detected.', 5);
      }
    };

    const handleFullscreenChange = () => {
      const isFull = !!document.fullscreenElement;
      setIsFullscreen(isFull);
      if (!isFull) {
        recordViolation('FULLSCREEN_EXIT', 'Fullscreen mode exited. Please return to fullscreen.', 3);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);
    document.addEventListener('copy', handleCopy);
    document.addEventListener('paste', handlePaste);
    document.addEventListener('contextmenu', handleContextMenu);
    window.addEventListener('keydown', handleKeyDown);
    document.addEventListener('fullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      document.removeEventListener('copy', handleCopy);
      document.removeEventListener('paste', handlePaste);
      document.removeEventListener('contextmenu', handleContextMenu);
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, [isActive]);

  // Camera preview setup
  useEffect(() => {
    if (!showCameraPreview) return;

    async function startCamera() {
      try {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: { width: 320, height: 240 },
            audio: false,
          });
          streamRef.current = stream;
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
          setHasCameraPermission(true);
        }
      } catch (err) {
        setHasCameraPermission(false);
      }
    }

    startCamera();

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, [showCameraPreview]);

  const requestFullscreen = () => {
    if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen().catch(() => {});
    }
  };

  return (
    <>
      {/* Active Violation Alert Banner */}
      {activeWarning && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 max-w-lg w-full px-4 animate-in fade-in slide-in-from-top-4 duration-200">
          <div className="p-4 rounded-2xl bg-red-600/95 text-white shadow-2xl border-2 border-red-400 backdrop-blur-md flex items-center gap-3.5">
            <div className="p-2 bg-red-700/80 rounded-xl shrink-0">
              <ShieldAlert className="w-6 h-6 text-white animate-pulse" />
            </div>
            <div className="flex-1">
              <p className="text-xs font-bold uppercase tracking-wider text-red-200">Proctoring Warning</p>
              <p className="text-sm font-semibold mt-0.5">{activeWarning}</p>
            </div>
          </div>
        </div>
      )}

      {/* Proctoring HUD / Status Chip */}
      <div className="fixed bottom-4 right-4 z-40 flex flex-col items-end gap-2">
        {/* Camera Feed Thumbnail */}
        {showCameraPreview && (
          <div className="w-36 h-28 rounded-2xl overflow-hidden bg-slate-900 border-2 border-slate-700 shadow-xl relative group">
            {hasCameraPermission ? (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover transform -scale-x-100"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center p-2 text-center text-slate-400">
                <VideoOff className="w-5 h-5 mb-1" />
                <span className="text-[10px]">Camera Standby</span>
              </div>
            )}
            {/* Live Indicator */}
            <div className="absolute top-2 left-2 flex items-center gap-1 px-1.5 py-0.5 rounded bg-black/60 backdrop-blur-sm text-[9px] text-emerald-400 font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
              <span>PROCTORED</span>
            </div>
          </div>
        )}

        {/* Integrity Score Badge */}
        <div className="px-3.5 py-2 rounded-2xl bg-slate-900/90 text-white border border-slate-800 shadow-xl backdrop-blur-md flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-indigo-400" />
            <span className="text-xs font-semibold text-slate-300">Integrity:</span>
          </div>
          <span
            className={`text-xs font-bold px-2 py-0.5 rounded-md ${
              integrityScore >= 90
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : integrityScore >= 75
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                : 'bg-red-500/20 text-red-400 border border-red-500/30'
            }`}
          >
            {integrityScore} / 100
          </span>

          {!isFullscreen && (
            <button
              onClick={requestFullscreen}
              className="p-1 rounded-lg bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 text-xs transition-colors"
              title="Enter Fullscreen"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </>
  );
}
