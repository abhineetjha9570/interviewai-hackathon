'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  Maximize2,
  Camera,
  VideoOff,
  Eye,
  AlertTriangle,
  Volume2,
  Smartphone,
  Users,
  Copy,
  Clock,
  ChevronDown,
  ChevronUp,
  X,
  Lock,
  PauseCircle,
  AlertOctagon,
  RotateCcw
} from 'lucide-react';
import {
  ProctorEventType,
  ProctorEventLog,
  EVENT_WEIGHTS,
  calculateRiskLevel,
  RiskLevel,
  CameraVisionMonitor,
  AudioEnvironmentMonitor,
  ProctoringStats
} from '@/lib/proctoring-engine';

interface SecureProctoringSuiteProps {
  interviewId?: string;
  isActive: boolean;
  initialStream?: MediaStream | null;
  onStatsUpdate?: (stats: ProctoringStats) => void;
  onSessionTerminated?: () => void;
  showCameraHUD?: boolean;
}

export default function SecureProctoringSuite({
  interviewId = 'interview-session',
  isActive = true,
  initialStream,
  onStatsUpdate,
  onSessionTerminated,
  showCameraHUD = true,
}: SecureProctoringSuiteProps) {
  const [integrityScore, setIntegrityScore] = useState(100);
  const [events, setEvents] = useState<ProctorEventLog[]>([]);
  const [activeWarning, setActiveWarning] = useState<string | null>(null);

  // Security Lock & Fullscreen State
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isFocusBreached, setIsFocusBreached] = useState(false);
  const [breachReason, setBreachReason] = useState<string>('Focus Lost');
  const [graceSeconds, setGraceSeconds] = useState(15);
  const [strikes, setStrikes] = useState(0);
  const [isSuspended, setIsSuspended] = useState(false);

  // Hardware State
  const [hasCameraPermission, setHasCameraPermission] = useState(false);
  const [hasMicPermission, setHasMicPermission] = useState(false);
  const [visionTrackingStatus, setVisionTrackingStatus] = useState<
    'CENTERED' | 'LOOKING_AWAY' | 'LOOKING_DOWN' | 'MISSING' | 'MULTIPLE'
  >('CENTERED');
  const [showLogDrawer, setShowLogDrawer] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(initialStream || null);
  const visionMonitorRef = useRef<CameraVisionMonitor | null>(null);
  const audioMonitorRef = useRef<AudioEnvironmentMonitor | null>(null);
  const penaltyThrottleRef = useRef<Record<string, number>>({});
  const isSuspendedRef = useRef<boolean>(false);

  // Record a proctoring event with escalating repeat penalties
  const recordEvent = (type: ProctorEventType, details: string) => {
    if (!isActive || isSuspendedRef.current) return;

    const now = Date.now();
    // Throttle duplicate events within 5.0 seconds to prevent rapid multiple deductions
    if (penaltyThrottleRef.current[type] && now - penaltyThrottleRef.current[type] < 5000) {
      return;
    }
    penaltyThrottleRef.current[type] = now;

    const baseWeight = EVENT_WEIGHTS[type] || { penalty: 3, severity: 'MEDIUM', label: 'Suspicious Behavior' };

    // Escalating penalty for repeated violations
    const existingCount = events.filter((e) => e.type === type).length;
    const multiplier = existingCount === 0 ? 1 : existingCount === 1 ? 1.25 : 1.75;
    const finalPenalty = Math.round(baseWeight.penalty * multiplier);

    const dateObj = new Date();
    const timeStr = dateObj.toTimeString().split(' ')[0];

    const newLog: ProctorEventLog = {
      id: `${type}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: timeStr,
      type,
      label: baseWeight.label,
      details: `${details} (Incident #${existingCount + 1})`,
      severity: existingCount >= 2 ? 'HIGH' : baseWeight.severity,
      penalty: finalPenalty,
    };

    const newScore = Math.max(0, integrityScore - finalPenalty);
    setIntegrityScore(newScore);

    setEvents((prev) => {
      const updatedEvents = [newLog, ...prev];
      const calculatedRisk = calculateRiskLevel(newScore);

      const stats: ProctoringStats = {
        integrityScore: newScore,
        riskLevel: calculatedRisk,
        totalViolations: updatedEvents.length,
        tabSwitches: updatedEvents.filter((e) => e.type === 'TAB_SWITCH').length,
        windowBlurs: updatedEvents.filter((e) => e.type === 'WINDOW_BLUR').length,
        fullscreenExits: updatedEvents.filter((e) => e.type === 'FULLSCREEN_EXIT').length,
        faceMissingCount: updatedEvents.filter((e) => e.type === 'FACE_MISSING').length,
        multipleFacesCount: updatedEvents.filter((e) => e.type === 'MULTIPLE_FACES').length,
        lookingAwayCount: updatedEvents.filter((e) => e.type === 'LOOKING_AWAY').length,
        phoneDetectedCount: updatedEvents.filter((e) => e.type === 'LOOKING_DOWN_PHONE').length,
        copyAttempts: updatedEvents.filter((e) => e.type === 'COPY_ATTEMPT').length,
        pasteAttempts: updatedEvents.filter((e) => e.type === 'PASTE_ATTEMPT').length,
        secondaryAudioCount: updatedEvents.filter((e) => e.type === 'SECONDARY_VOICE_DETECTED').length,
        strikes,
        isSuspended: isSuspendedRef.current,
        events: updatedEvents,
      };

      if (onStatsUpdate) {
        onStatsUpdate(stats);
      }

      return updatedEvents;
    });

    // Show warning toast
    setActiveWarning(`${baseWeight.label}: ${details}`);
    setTimeout(() => setActiveWarning(null), 4500);

    // Update vision HUD
    if (type === 'LOOKING_AWAY') setVisionTrackingStatus('LOOKING_AWAY');
    else if (type === 'LOOKING_DOWN_PHONE') setVisionTrackingStatus('LOOKING_DOWN');
    else if (type === 'FACE_MISSING') setVisionTrackingStatus('MISSING');
    else if (type === 'MULTIPLE_FACES') setVisionTrackingStatus('MULTIPLE');
    else setTimeout(() => setVisionTrackingStatus('CENTERED'), 2000);

    // Backend logging
    fetch('/api/proctoring/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        interviewId,
        eventType: type,
        details,
        penaltyPoints: finalPenalty,
      }),
    }).catch(() => {});
  };

  // Immediate Lockdown on Breach (Blur, Tab Switch, Fullscreen Exit)
  const triggerFocusLockdown = (reason: string, eventType: ProctorEventType) => {
    if (isSuspendedRef.current) return;

    setIsFocusBreached(true);
    setBreachReason(reason);
    setGraceSeconds(12);

    recordEvent(eventType, reason);

    setStrikes((prevStrikes) => {
      const nextStrikes = prevStrikes + 1;
      if (nextStrikes >= 3) {
        // Suspend session on 3 strikes
        handleSuspendSession();
      }
      return nextStrikes;
    });
  };

  // Terminate/Suspend Session for severe cheating
  const handleSuspendSession = () => {
    isSuspendedRef.current = true;
    setIsSuspended(true);
    recordEvent('SESSION_SUSPENDED', 'Candidate exceeded maximum permitted security violations (3 Strikes).');
    if (onSessionTerminated) {
      onSessionTerminated();
    }
  };

  // Browser security event listeners
  useEffect(() => {
    if (!isActive) return;

    // Check initial fullscreen
    setIsFullscreen(!!document.fullscreenElement);

    // 1. Tab switching & visibility
    const handleVisibility = () => {
      if (document.hidden) {
        triggerFocusLockdown(
          'Candidate navigated away to another browser tab or minimized window.',
          'TAB_SWITCH'
        );
      }
    };

    // 2. Window focus loss / External application (e.g. ChatGPT window clicked)
    const handleBlur = () => {
      triggerFocusLockdown(
        'Interview window lost focus. External desktop application (e.g. ChatGPT, browser window, or IDE) was activated.',
        'WINDOW_BLUR'
      );
    };

    // 3. Fullscreen state changes
    const handleFullscreen = () => {
      const isFull = !!document.fullscreenElement;
      setIsFullscreen(isFull);
      if (!isFull && !isSuspendedRef.current) {
        triggerFocusLockdown(
          'Candidate exited mandatory fullscreen mode.',
          'FULLSCREEN_EXIT'
        );
      }
    };

    // 4. Keyboard Shortcuts Interception (DevTools, Print, Inspect)
    const handleKeyDown = (e: KeyboardEvent) => {
      // F12 or DevTools inspection
      if (
        e.key === 'F12' ||
        (e.ctrlKey && e.shiftKey && ['I', 'J', 'C'].includes(e.key.toUpperCase())) ||
        (e.ctrlKey && e.key.toLowerCase() === 'u')
      ) {
        e.preventDefault();
        e.stopPropagation();
        recordEvent('DEVTOOLS_SHORTCUT', 'Candidate attempted to trigger Developer Tools inspection shortcut.');
        return false;
      }

      // Prohibit Print Screen / Print dialog
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        recordEvent('DEVTOOLS_SHORTCUT', 'Print / Screen capture command blocked.');
        return false;
      }

      // Prohibit copy attempt on questions
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'c') {
        const selection = window.getSelection()?.toString();
        if (selection && selection.length > 5) {
          recordEvent('COPY_ATTEMPT', 'Unauthorized text copy command intercepted on interview questions.');
        }
      }

      // Prohibit paste attempt
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'v') {
        recordEvent('PASTE_ATTEMPT', 'Clipboard paste command intercepted in proctored assessment.');
      }
    };

    // 5. Right-click context menu suppression
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      recordEvent('CONTEXT_MENU_BLOCKED', 'Right-click context menu interaction blocked.');
      return false;
    };

    // 6. Direct copy/cut prevention
    const handleCopy = (e: ClipboardEvent) => {
      e.preventDefault();
      recordEvent('COPY_ATTEMPT', 'Direct clipboard copy action blocked.');
    };

    const handlePaste = (e: ClipboardEvent) => {
      recordEvent('PASTE_ATTEMPT', 'External clipboard paste intercepted.');
    };

    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('blur', handleBlur);
    document.addEventListener('fullscreenchange', handleFullscreen);
    window.addEventListener('keydown', handleKeyDown, true);
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('copy', handleCopy);
    document.addEventListener('paste', handlePaste);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('blur', handleBlur);
      document.removeEventListener('fullscreenchange', handleFullscreen);
      window.removeEventListener('keydown', handleKeyDown, true);
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('copy', handleCopy);
      document.removeEventListener('paste', handlePaste);
    };
  }, [isActive]);

  // Grace countdown timer when focus/fullscreen is breached
  useEffect(() => {
    if (!isFocusBreached || isSuspended) {
      setGraceSeconds(12);
      return;
    }

    const timer = setInterval(() => {
      setGraceSeconds((prev) => {
        if (prev <= 1) {
          recordEvent(
            'WINDOW_BLUR',
            'Candidate failed to restore interview window focus within permitted grace period.'
          );
          setStrikes((s) => {
            const next = s + 1;
            if (next >= 3) handleSuspendSession();
            return next;
          });
          return 12;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isFocusBreached, isSuspended]);

  // Attach and Initialize Webcam & Audio Monitors
  useEffect(() => {
    if (!isActive) return;

    let activeStream: MediaStream | null = initialStream || null;

    async function setupStream() {
      try {
        if (!activeStream) {
          activeStream = await navigator.mediaDevices.getUserMedia({
            video: { width: 320, height: 240, frameRate: { ideal: 20 } },
            audio: true,
          });
        }

        mediaStreamRef.current = activeStream;
        setHasCameraPermission(true);
        setHasMicPermission(true);

        if (videoRef.current) {
          videoRef.current.srcObject = activeStream;
          videoRef.current.play().catch(() => {});
        }

        // 1. Initialize Computer Vision
        visionMonitorRef.current = new CameraVisionMonitor((type, details) => {
          recordEvent(type, details);
        });
        if (videoRef.current) {
          visionMonitorRef.current.start(videoRef.current);
        }

        // 2. Initialize Audio Monitoring
        audioMonitorRef.current = new AudioEnvironmentMonitor((type, details) => {
          recordEvent(type, details);
        });
        audioMonitorRef.current.start(activeStream);
      } catch (err) {
        console.error('Proctoring camera attachment error:', err);
        setHasCameraPermission(false);
        setHasMicPermission(false);
      }
    }

    setupStream();

    return () => {
      if (visionMonitorRef.current) visionMonitorRef.current.stop();
      if (audioMonitorRef.current) audioMonitorRef.current.stop();
      // Only stop tracks if created locally and not passed from gate
      if (!initialStream && mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, [isActive, initialStream]);

  // Resume Session and Re-lock Fullscreen
  const handleResumeAndRelock = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      }
      setIsFullscreen(true);
      setIsFocusBreached(false);
    } catch {
      setIsFocusBreached(false);
    }
  };

  const risk = calculateRiskLevel(integrityScore);

  return (
    <>
      {/* =========================================================================
          1. IMPENETRABLE OPAQUE SCREEN OCCLUSION MODAL (BREACH LOCKDOWN)
          Completely hides questions and editor when focus is lost or ChatGPT opened!
          ========================================================================= */}
      {(isFocusBreached || isSuspended) && (
        <div className="fixed inset-0 z-[999] bg-slate-950/98 backdrop-blur-3xl flex items-center justify-center p-6 animate-in fade-in duration-150 select-none">
          <div className="max-w-lg w-full p-8 rounded-3xl bg-slate-900 border-2 border-rose-500 shadow-2xl text-center space-y-6 text-white">
            <div className="w-16 h-16 rounded-2xl bg-rose-600/20 text-rose-400 flex items-center justify-center mx-auto border border-rose-500/40 animate-pulse">
              {isSuspended ? <AlertOctagon className="w-8 h-8" /> : <Lock className="w-8 h-8" />}
            </div>

            <div className="space-y-2">
              <span className="text-[11px] font-extrabold uppercase tracking-widest text-rose-400 bg-rose-950/80 px-3 py-1 rounded-full border border-rose-800">
                {isSuspended ? 'Session Terminated' : 'Security Breach: Screen Obscured'}
              </span>

              <h2 className="text-xl font-extrabold text-white tracking-tight">
                {isSuspended ? 'Assessment Suspended' : 'Interview Content Temporarily Hidden'}
              </h2>

              <p className="text-xs text-slate-300 leading-relaxed">
                {isSuspended
                  ? 'This interview session has been permanently frozen and locked due to 3 consecutive security breaches (focus loss, external application use, or sustained fullscreen exit). An incident log has been dispatched to the recruiting team.'
                  : `${breachReason} All interview questions and editor code are obscured to prevent unauthorized external AI assistance.`}
              </p>
            </div>

            {/* Strikes Indicator */}
            <div className="flex items-center justify-center gap-3 p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 text-xs">
              <span className="text-slate-400 font-semibold">Integrity Strikes:</span>
              <div className="flex gap-2">
                {[1, 2, 3].map((s) => (
                  <span
                    key={s}
                    className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs ${
                      strikes >= s
                        ? 'bg-rose-600 text-white shadow-md shadow-rose-600/40'
                        : 'bg-slate-800 text-slate-500'
                    }`}
                  >
                    {s}
                  </span>
                ))}
              </div>
              <span className="text-[10px] text-rose-400 font-mono">
                {strikes >= 3 ? 'Max Reached' : `${3 - strikes} Remaining`}
              </span>
            </div>

            {!isSuspended ? (
              <div className="space-y-3">
                <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-800/60 text-xs text-rose-300 flex items-center justify-center gap-2">
                  <Clock className="w-4 h-4 animate-spin text-rose-400" />
                  <span>
                    Auto-penalty countdown: <strong>{graceSeconds}s</strong>
                  </span>
                </div>

                <button
                  onClick={handleResumeAndRelock}
                  className="w-full py-3.5 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-sm shadow-xl shadow-rose-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <Maximize2 className="w-4 h-4" />
                  <span>Return to Proctored Fullscreen & Resume</span>
                </button>
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700 text-xs text-slate-400">
                Assessment results locked with <strong>{integrityScore}/100 Integrity Score (Critical Risk)</strong>.
              </div>
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          2. TOAST WARNING BANNER (NON-MODAL INCIDENTS)
          ========================================================================= */}
      {activeWarning && !isFocusBreached && (
        <div className="fixed top-5 left-1/2 transform -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-3 duration-200 pointer-events-none">
          <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-rose-600 text-white shadow-2xl shadow-rose-600/40 border border-rose-400/50 text-xs font-bold">
            <AlertTriangle className="w-4 h-4 shrink-0 text-amber-300" />
            <span>{activeWarning}</span>
          </div>
        </div>
      )}

      {/* =========================================================================
          3. FLOATING PROCTORING HUD & WEBCAM VIDEO STREAM
          ========================================================================= */}
      <div className="fixed bottom-4 right-4 z-40 flex flex-col items-end gap-2 select-none">
        {/* Always mounted video element with live stream */}
        {showCameraHUD && (
          <div className="w-44 h-32 rounded-2xl overflow-hidden bg-slate-950 border-2 border-slate-700 shadow-2xl relative group">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover transform -scale-x-100 ${
                hasCameraPermission ? 'block' : 'hidden'
              }`}
            />

            {!hasCameraPermission && (
              <div className="w-full h-full flex flex-col items-center justify-center p-2 text-center text-slate-400">
                <VideoOff className="w-6 h-6 mb-1 text-slate-500 animate-pulse" />
                <span className="text-[10px]">Camera Initializing</span>
              </div>
            )}

            {/* Computer Vision Face Tracking Reticle */}
            {hasCameraPermission && (
              <>
                <div
                  className={`absolute inset-2.5 rounded-xl border-2 pointer-events-none transition-colors duration-200 ${
                    visionTrackingStatus === 'CENTERED'
                      ? 'border-emerald-500/80 shadow-[0_0_12px_rgba(16,185,129,0.25)]'
                      : visionTrackingStatus === 'LOOKING_AWAY'
                      ? 'border-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.3)] animate-pulse'
                      : visionTrackingStatus === 'LOOKING_DOWN'
                      ? 'border-rose-500 shadow-[0_0_12px_rgba(239,68,68,0.35)] animate-pulse'
                      : 'border-rose-600 shadow-[0_0_14px_rgba(239,68,68,0.5)] animate-ping'
                  }`}
                >
                  <span className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-inherit" />
                  <span className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-inherit" />
                  <span className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-inherit" />
                  <span className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-inherit" />
                </div>

                {/* Status Pill */}
                <div className="absolute top-2 left-2 flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-black/80 text-[8px] font-extrabold uppercase tracking-wider text-emerald-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                  <span>
                    {visionTrackingStatus === 'CENTERED'
                      ? 'Centered'
                      : visionTrackingStatus === 'LOOKING_AWAY'
                      ? 'Gaze Diverted'
                      : visionTrackingStatus === 'LOOKING_DOWN'
                      ? 'Phone / Down'
                      : 'Missing'}
                  </span>
                </div>
              </>
            )}

            {/* Mic Badge */}
            {hasMicPermission && (
              <div className="absolute bottom-2 right-2 p-1 rounded-md bg-black/70 text-slate-300">
                <Volume2 className="w-3 h-3 text-indigo-400" />
              </div>
            )}
          </div>
        )}

        {/* Live Integrity Score Pill */}
        <div className="px-3 py-1.5 rounded-2xl bg-slate-900/95 text-white border border-slate-700/80 shadow-2xl backdrop-blur-md flex items-center gap-2.5">
          <div className="flex items-center gap-1.5">
            <Eye className="w-3.5 h-3.5 text-indigo-400" />
            <span className="text-[11px] font-semibold text-slate-300">Integrity:</span>
          </div>

          <span
            className={`text-xs font-black px-2 py-0.5 rounded-lg border ${
              risk === 'LOW'
                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                : risk === 'MEDIUM'
                ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                : 'bg-rose-500/20 text-rose-400 border-rose-500/40'
            }`}
          >
            {integrityScore}/100 · {risk}
          </span>

          <button
            onClick={() => setShowLogDrawer(!showLogDrawer)}
            className="flex items-center gap-0.5 text-[10px] font-bold text-slate-400 hover:text-white px-1 py-0.5 rounded hover:bg-slate-800 transition-colors"
            title="View Proctoring Audit Log"
          >
            <span>{events.length}</span>
            {showLogDrawer ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
          </button>
        </div>

        {/* Expandable Audit Log Drawer */}
        {showLogDrawer && (
          <div className="w-80 max-h-56 overflow-y-auto p-3 rounded-2xl bg-slate-900/95 border border-slate-700 text-white shadow-2xl backdrop-blur-md text-xs space-y-2 animate-in fade-in slide-in-from-bottom-2 duration-150">
            <div className="flex items-center justify-between pb-1.5 border-b border-slate-800">
              <span className="font-extrabold text-[10px] uppercase tracking-wider text-slate-400">
                Incident Audit Trail
              </span>
              <span className="text-[9px] text-slate-500">{events.length} logged</span>
            </div>

            {events.length === 0 ? (
              <p className="text-[10px] text-slate-500 py-2 text-center">No violations logged. Clean session.</p>
            ) : (
              events.slice(0, 6).map((evt) => (
                <div key={evt.id} className="p-2 rounded-xl bg-slate-800/60 border border-slate-700/50 space-y-0.5">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="font-bold text-rose-300">{evt.label}</span>
                    <span className="font-mono text-slate-400">{evt.timestamp}</span>
                  </div>
                  <p className="text-[9px] text-slate-400 leading-tight">{evt.details}</p>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </>
  );
}
