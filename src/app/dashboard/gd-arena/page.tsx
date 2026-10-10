'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  Users,
  Mic,
  MicOff,
  Sparkles,
  Play,
  Clock,
  QrCode,
  Copy,
  Check,
  ChevronRight,
  ArrowRight,
  AlertCircle,
  HelpCircle,
  Award,
  Volume2,
  VolumeX,
  Share2,
  LogOut,
  BarChart3,
  MessageSquare,
  Bot,
  UserCheck,
  Send,
  CheckCircle2,
  XCircle,
  FileText,
  Shield,
  RefreshCw,
  Plus,
  Compass,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import {
  GD_PERSONALITIES,
  GD_TOPICS,
  type GDTopicItem,
  type NextTurnResult,
} from '@/lib/gd-orchestrator';
import {
  speakGDPersonality,
  stopGDSpeech,
  GDSpeechRecognizer,
  GDWebRTCMeshEngine,
} from '@/lib/gd-audio-engine';

type ArenaView = 'DASHBOARD' | 'MULTIPLAYER_ROOM' | 'AI_PRACTICE' | 'REPORT';

function GDArenaInner() {
  const searchParams = useSearchParams();

  // Active view state
  const [view, setView] = useState<ArenaView>('DASHBOARD');

  // Candidate identity
  const [candidateName, setCandidateName] = useState('Candidate');
  const [myPlayerId, setMyPlayerId] = useState('');

  // Selected topic & config
  const [selectedTopic, setSelectedTopic] = useState(GD_TOPICS[0].title);
  const [customTopic, setCustomTopic] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(GD_TOPICS[0].category);
  const [durationMinutes, setDurationMinutes] = useState(10);
  const [maxParticipants, setMaxParticipants] = useState(6);
  const [language, setLanguage] = useState('English');
  const [difficulty, setDifficulty] = useState('Intermediate');
  const [hasAiModerator, setHasAiModerator] = useState(true);

  // Modals
  const [showCreateMultiplayerModal, setShowCreateMultiplayerModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showAIPracticeModal, setShowAIPracticeModal] = useState(false);
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  // Multiplayer Room State
  const [roomCode, setRoomCode] = useState('');
  const [isHost, setIsHost] = useState(false);
  const [roomState, setRoomState] = useState<any>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [multiplayerMicMuted, setMultiplayerMicMuted] = useState(false);
  const [isLocalSpeaking, setIsLocalSpeaking] = useState(false);

  // AI Practice State
  const [aiPracticeActive, setAiPracticeActive] = useState(false);
  const [aiHistory, setAiHistory] = useState<any[]>([]);
  const [activeAiSpeaker, setActiveAiSpeaker] = useState<string | null>(null);
  const [aiTurnStatus, setAiTurnStatus] = useState<string>('IDLE'); // 'IDLE' | 'LISTENING' | 'THINKING' | 'SPEAKING'
  const [liveCandidateTranscript, setLiveCandidateTranscript] = useState('');
  const [manualTextEntry, setManualTextEntry] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [remainingTimerSec, setRemainingTimerSec] = useState(600);

  // Report state
  const [currentReport, setCurrentReport] = useState<any>(null);
  const [pastReports, setPastReports] = useState<any[]>([]);
  const [reportLoading, setReportLoading] = useState(false);

  // Refs for audio & speech
  const recognizerRef = useRef<GDSpeechRecognizer | null>(null);
  const webRtcRef = useRef<GDWebRTCMeshEngine | null>(null);
  const timerIntervalRef = useRef<any>(null);
  const pollIntervalRef = useRef<any>(null);

  // Initial user & reports fetch
  useEffect(() => {
    async function loadInitial() {
      try {
        const uRes = await fetch('/api/auth/me');
        const uJson = await uRes.json();
        if (uJson?.user?.name) {
          setCandidateName(uJson.user.name);
        }
      } catch (_) {}

      try {
        const rRes = await fetch('/api/gd/report');
        const rJson = await rRes.json();
        if (rJson?.reports) {
          setPastReports(rJson.reports);
        }
      } catch (_) {}
    }
    loadInitial();

    // Check URL join parameter
    const joinCode = searchParams.get('join');
    if (joinCode) {
      setJoinCodeInput(joinCode.toUpperCase());
      setShowJoinModal(true);
    }
  }, [searchParams]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopGDSpeech();
      if (webRtcRef.current) webRtcRef.current.destroy();
      if (recognizerRef.current) recognizerRef.current.stop();
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, []);

  // =========================================================================
  // MULTIPLAYER GD ACTIONS (MODE A)
  // =========================================================================

  const handleCreateMultiplayerRoom = async () => {
    try {
      const finalTopic = customTopic.trim() || selectedTopic;
      const res = await fetch('/api/gd/room/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: finalTopic,
          category: selectedCategory,
          durationMinutes,
          maxParticipants,
          language,
          difficulty,
          hasAiModerator,
          hostName: candidateName,
        }),
      });

      const json = await res.json();
      if (!res.ok || json.error) {
        alert(json.error || 'Failed to create room');
        return;
      }

      setRoomCode(json.roomCode);
      setMyPlayerId(json.hostPlayerId);
      setIsHost(true);
      setInviteUrl(json.inviteUrl);
      setQrCodeUrl(json.qrCodeDataUrl);
      setRoomState(json.roomState);
      setRemainingTimerSec(durationMinutes * 60);

      setShowCreateMultiplayerModal(false);
      setView('MULTIPLAYER_ROOM');

      // Initialize WebRTC local microphone
      initMultiplayerWebRTC(json.roomCode, json.hostPlayerId);
      startMultiplayerPolling(json.roomCode, json.hostPlayerId);
    } catch (e) {
      console.error(e);
      alert('Error creating multiplayer room.');
    }
  };

  const handleJoinMultiplayerRoom = async () => {
    const code = joinCodeInput.trim().toUpperCase();
    if (!code) {
      alert('Please enter a room code');
      return;
    }

    try {
      const res = await fetch('/api/gd/room/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomCode: code,
          playerName: candidateName,
        }),
      });

      const json = await res.json();
      if (!res.ok || json.error) {
        alert(json.error || 'Failed to join room');
        return;
      }

      setRoomCode(code);
      setMyPlayerId(json.playerId);
      setIsHost(false);
      setRoomState(json.roomState);
      setRemainingTimerSec(json.roomState.remainingSec || 600);

      setShowJoinModal(false);
      setView('MULTIPLAYER_ROOM');

      // Initialize WebRTC
      initMultiplayerWebRTC(code, json.playerId);
      startMultiplayerPolling(code, json.playerId);
    } catch (e) {
      console.error(e);
      alert('Error joining room.');
    }
  };

  const handleStartDiscussion = async () => {
    if (!isHost) return;
    try {
      const res = await fetch('/api/gd/room/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomCode,
          hostPlayerId: myPlayerId,
        }),
      });
      const json = await res.json();
      if (!res.ok || json.error) {
        alert(json.error || 'Failed to start');
        return;
      }
      setRoomState(json.roomState);

      // Play moderator opening if present
      const firstModEntry = json.roomState?.transcripts?.find(
        (t: any) => t.speakerRole === 'AI_MODERATOR'
      );
      if (firstModEntry) {
        speakGDPersonality(firstModEntry.text, 'MODERATOR');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const initMultiplayerWebRTC = async (code: string, playerId: string) => {
    if (webRtcRef.current) webRtcRef.current.destroy();

    const rtc = new GDWebRTCMeshEngine({
      roomCode: code,
      myPlayerId: playerId,
      onRemoteStream: () => {},
      onSignalNeeded: async (toPlayerId, type, payload) => {
        try {
          await fetch('/api/gd/signal', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              roomCode: code,
              playerId,
              action: 'POST',
              toPlayerId,
              type,
              payload,
            }),
          });
        } catch (_) {}
      },
    });

    await rtc.initLocalMedia();
    webRtcRef.current = rtc;
  };

  const startMultiplayerPolling = (code: string, playerId: string) => {
    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);

    pollIntervalRef.current = setInterval(async () => {
      try {
        // 1. Fetch room state
        const res = await fetch(`/api/gd/room/state?code=${code}&playerId=${playerId}`);
        const json = await res.json();
        if (json?.roomState) {
          setRoomState(json.roomState);
          setRemainingTimerSec(json.roomState.remainingSec);

          if (json.roomState.phase === 'COMPLETED') {
            clearInterval(pollIntervalRef.current);
            loadReportForSession(code);
            return;
          }

          // Check if peers need WebRTC offer
          if (webRtcRef.current) {
            json.roomState.participants.forEach((p: any) => {
              if (p.playerId !== playerId && !p.isAi) {
                // If this participant joined earlier, initiate offer
                if (playerId < p.playerId) {
                  webRtcRef.current?.connectToPeer(p.playerId);
                }
              }
            });
          }
        }

        // 2. Pull WebRTC signals
        const sigRes = await fetch('/api/gd/signal', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            roomCode: code,
            playerId,
            action: 'PULL',
          }),
        });
        const sigJson = await sigRes.json();
        if (sigJson?.signals && Array.isArray(sigJson.signals)) {
          for (const sig of sigJson.signals) {
            await webRtcRef.current?.handleSignal(sig.fromPlayerId, sig.type, sig.payload);
          }
        }

        // 3. Send speaking ping
        if (webRtcRef.current) {
          const vol = webRtcRef.current.getLocalVolume();
          const speaking = vol > 15;
          setIsLocalSpeaking(speaking);
          await fetch('/api/gd/room/action', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              roomCode: code,
              playerId,
              isSpeaking: speaking,
              isMuted: multiplayerMicMuted,
            }),
          });
        }
      } catch (_) {}
    }, 1200);
  };

  const toggleMultiplayerMic = () => {
    if (webRtcRef.current) {
      const nowMuted = webRtcRef.current.toggleMute();
      setMultiplayerMicMuted(nowMuted);
    }
  };

  const handleEndMultiplayerSession = async () => {
    if (confirm('Conclude this Group Discussion and generate your evaluation report?')) {
      try {
        await fetch('/api/gd/room/action', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            roomCode,
            playerId: myPlayerId,
            action: 'COMPLETE',
          }),
        });
        if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
        loadReportForSession(roomCode);
      } catch (_) {}
    }
  };

  // =========================================================================
  // AI PRACTICE GD (MODE B)
  // =========================================================================

  const handleStartAIPractice = async () => {
    const finalTopic = customTopic.trim() || selectedTopic;
    setSelectedTopic(finalTopic);
    setShowAIPracticeModal(false);
    setView('AI_PRACTICE');
    setAiPracticeActive(true);
    setRemainingTimerSec(durationMinutes * 60);

    // Initialize speech recognizer
    const recognizer = new GDSpeechRecognizer(
      (text) => setLiveCandidateTranscript(text),
      (status) => {
        if (status === 'LISTENING') setIsRecording(true);
        if (status === 'IDLE') setIsRecording(false);
      }
    );
    recognizerRef.current = recognizer;

    // Start timer countdown
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    timerIntervalRef.current = setInterval(() => {
      setRemainingTimerSec((prev) => {
        if (prev <= 1) {
          clearInterval(timerIntervalRef.current);
          handleConcludeAIPractice();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Trigger AI Moderator Opening
    setAiTurnStatus('THINKING');
    try {
      const res = await fetch('/api/gd/ai/turn', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: finalTopic,
          durationMinutes,
          language,
          difficulty,
          action: 'OPENING',
        }),
      });
      const json = await res.json();
      if (json?.turn) {
        handlePlayAITurn(json.turn);
      }
    } catch (_) {
      setAiTurnStatus('IDLE');
    }
  };

  const handlePlayAITurn = (turn: NextTurnResult) => {
    setActiveAiSpeaker(turn.speakerId);
    setAiTurnStatus('SPEAKING');

    const entry = {
      speakerId: turn.speakerId,
      speakerName: turn.speakerName,
      speakerRole: turn.role,
      aiPersonality: turn.speakerId,
      text: turn.text,
      timestampSec: (durationMinutes * 60) - remainingTimerSec,
      durationSec: turn.estimatedDurationSec,
    };

    setAiHistory((prev) => [...prev, entry]);

    // Audible voice synthesis using verified profile
    speakGDPersonality(
      turn.text,
      turn.speakerId,
      undefined,
      () => {
        setActiveAiSpeaker(null);
        setAiTurnStatus('IDLE');
      },
      () => {
        setActiveAiSpeaker(null);
        setAiTurnStatus('IDLE');
      }
    );
  };

  const handleCandidateSubmitUtterance = async () => {
    // Stop recording if active
    let spokenText = liveCandidateTranscript.trim();
    if (recognizerRef.current) {
      const finalSpeech = recognizerRef.current.stop();
      if (finalSpeech) spokenText = finalSpeech;
    }
    setIsRecording(false);

    const manual = manualTextEntry.trim();
    const fullText = (spokenText + (manual ? ` ${manual}` : '')).trim();

    if (!fullText) {
      alert('Please speak or type a point to contribute.');
      return;
    }

    // Stop any ongoing AI speech so candidate can take the floor
    stopGDSpeech();
    setActiveAiSpeaker(null);

    const elapsed = (durationMinutes * 60) - remainingTimerSec;
    const humanDuration = Math.max(3, Math.round(fullText.split(' ').length / 2.5));

    const humanEntry = {
      speakerId: 'candidate_me',
      speakerName: candidateName,
      speakerRole: 'HUMAN',
      text: fullText,
      timestampSec: elapsed,
      durationSec: humanDuration,
    };

    const updatedHistory = [...aiHistory, humanEntry];
    setAiHistory(updatedHistory);
    setLiveCandidateTranscript('');
    setManualTextEntry('');

    // Trigger AI response to candidate
    setAiTurnStatus('THINKING');
    try {
      const res = await fetch('/api/gd/ai/turn', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: selectedTopic,
          durationMinutes,
          language,
          difficulty,
          action: 'NEXT_TURN',
          candidateUtterance: fullText,
          history: updatedHistory,
          totalElapsedSec: elapsed,
        }),
      });
      const json = await res.json();
      if (json?.turn) {
        handlePlayAITurn(json.turn);
      } else {
        setAiTurnStatus('IDLE');
      }
    } catch (_) {
      setAiTurnStatus('IDLE');
    }
  };

  const handleNextAITurnManual = async () => {
    if (activeAiSpeaker) return; // Prevent overlapping AI turns

    setAiTurnStatus('THINKING');
    const elapsed = (durationMinutes * 60) - remainingTimerSec;

    try {
      const res = await fetch('/api/gd/ai/turn', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: selectedTopic,
          durationMinutes,
          language,
          difficulty,
          action: 'NEXT_TURN',
          history: aiHistory,
          totalElapsedSec: elapsed,
        }),
      });
      const json = await res.json();
      if (json?.turn) {
        handlePlayAITurn(json.turn);
      } else {
        setAiTurnStatus('IDLE');
      }
    } catch (_) {
      setAiTurnStatus('IDLE');
    }
  };

  const toggleRecording = () => {
    if (!recognizerRef.current) return;
    if (isRecording) {
      recognizerRef.current.stop();
      setIsRecording(false);
    } else {
      stopGDSpeech();
      setActiveAiSpeaker(null);
      recognizerRef.current.start(liveCandidateTranscript);
      setIsRecording(true);
    }
  };

  const handleConcludeAIPractice = async () => {
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    stopGDSpeech();
    if (recognizerRef.current) recognizerRef.current.stop();

    setReportLoading(true);
    setView('REPORT');

    try {
      const res = await fetch('/api/gd/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: `AI_${Date.now()}`,
          userName: candidateName,
          topic: selectedTopic,
          durationMinutes,
          mode: 'AI_PRACTICE',
          transcript: aiHistory,
        }),
      });
      const json = await res.json();
      if (json?.report) {
        setCurrentReport(json.report);
        confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setReportLoading(false);
    }
  };

  const loadReportForSession = async (sessionId: string) => {
    setReportLoading(true);
    setView('REPORT');
    try {
      const res = await fetch(`/api/gd/report?sessionId=${sessionId}`);
      const json = await res.json();
      if (json?.report) {
        setCurrentReport(json.report);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setReportLoading(false);
    }
  };

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // =========================================================================
  // VIEW RENDERERS
  // =========================================================================

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* 1. Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/80 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wider uppercase bg-indigo-50 text-indigo-700 border border-indigo-200/60">
              Live Voice Simulations
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <span>Group Discussion Arena</span>
            <Users className="w-6 h-6 text-indigo-600" />
          </h1>
          <p className="text-sm md:text-base text-slate-500 font-normal mt-0.5">
            Practice with real people or challenge AI participants.
          </p>
        </div>

        {view !== 'DASHBOARD' && (
          <button
            onClick={() => {
              if (confirm('Leave current session and return to GD Arena Dashboard?')) {
                stopGDSpeech();
                setView('DASHBOARD');
              }
            }}
            className="self-start md:self-auto px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 shadow-sm transition-all flex items-center gap-1.5"
          >
            <span>Exit Session</span>
            <LogOut className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* 2. MAIN DASHBOARD VIEW */}
      {view === 'DASHBOARD' && (
        <div className="space-y-8">
          {/* Two Distinct Modes Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* MODE A: MULTIPLAYER GD */}
            <div className="p-7 rounded-3xl bg-white border border-slate-200/90 shadow-sm hover:shadow-md transition-all space-y-6 flex flex-col justify-between group">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold shadow-sm">
                    <Users className="w-6 h-6" />
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700">
                    2 to 8 Students
                  </span>
                </div>
                <div>
                  <span className="text-[11px] font-bold tracking-wider uppercase text-indigo-600">
                    Mode A
                  </span>
                  <h3 className="text-xl font-extrabold text-slate-900">Multiplayer GD</h3>
                  <p className="text-xs font-semibold text-slate-500">Practice with Friends</p>
                </div>
                <p className="text-sm text-slate-600 leading-relaxed font-normal">
                  Create a discussion room, invite participants via code or QR, and practise a live group discussion with real students with peer-to-peer audio mesh and optional AI moderator.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  onClick={() => setShowCreateMultiplayerModal(true)}
                  className="w-full py-3 px-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-indigo-600/20 transition-all active:scale-95"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create Room</span>
                </button>
                <button
                  onClick={() => setShowJoinModal(true)}
                  className="w-full py-3 px-4 rounded-2xl bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-xs border border-slate-200/80 flex items-center justify-center gap-1.5 transition-all active:scale-95"
                >
                  <QrCode className="w-4 h-4" />
                  <span>Join Room</span>
                </button>
              </div>
            </div>

            {/* MODE B: AI PRACTICE GD */}
            <div className="p-7 rounded-3xl bg-white border border-slate-200/90 shadow-sm hover:shadow-md transition-all space-y-6 flex flex-col justify-between group">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold shadow-sm">
                    <Bot className="w-6 h-6" />
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-purple-100/70 text-purple-700">
                    4 Distinct Personalities
                  </span>
                </div>
                <div>
                  <span className="text-[11px] font-bold tracking-wider uppercase text-purple-600">
                    Mode B
                  </span>
                  <h3 className="text-xl font-extrabold text-slate-900">AI Practice GD</h3>
                  <p className="text-xs font-semibold text-slate-500">Practice with AI</p>
                </div>
                <p className="text-sm text-slate-600 leading-relaxed font-normal">
                  Practise with four AI participants featuring different personalities and voices (Arjun, Meera, Kabir, Sara) + 1 impartial AI Moderator with intelligent turn-taking.
                </p>
              </div>

              {/* Personality Pills */}
              <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600">
                <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                  <span className="font-bold text-slate-800">Arjun:</span> Dominator
                </div>
                <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="w-2 h-2 rounded-full bg-blue-500" />
                  <span className="font-bold text-slate-800">Meera:</span> Analyst
                </div>
                <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="font-bold text-slate-800">Kabir:</span> Quiet Thinker
                </div>
                <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  <span className="font-bold text-slate-800">Sara:</span> Critical Mind
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => setShowAIPracticeModal(true)}
                  className="w-full py-3 px-4 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-purple-600/20 transition-all active:scale-95"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Start AI Practice</span>
                </button>
              </div>
            </div>
          </div>

          {/* Curated GD Topics Browser */}
          <div className="p-7 rounded-3xl bg-white border border-slate-200/80 shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Explore Curated GD Topics</h3>
                <p className="text-xs text-slate-500">Pick from actual campus and corporate recruitment topics</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {GD_TOPICS.map((topicItem) => (
                <div
                  key={topicItem.id}
                  onClick={() => {
                    setSelectedTopic(topicItem.title);
                    setSelectedCategory(topicItem.category);
                    setShowAIPracticeModal(true);
                  }}
                  className={`p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                    selectedTopic === topicItem.title
                      ? 'border-indigo-600 bg-indigo-50/40 shadow-sm'
                      : 'border-slate-200/80 hover:border-slate-300 bg-slate-50/40 hover:bg-white'
                  }`}
                >
                  <div className="space-y-1.5">
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-white border border-slate-200 text-slate-700 inline-block">
                      {topicItem.category}
                    </span>
                    <h4 className="text-sm font-bold text-slate-900 line-clamp-2 leading-snug">
                      {topicItem.title}
                    </h4>
                    <p className="text-xs text-slate-500 line-clamp-2 font-normal leading-relaxed">
                      {topicItem.description}
                    </p>
                  </div>
                  <div className="flex items-center justify-between text-[11px] font-semibold text-indigo-600 pt-1 border-t border-slate-200/60">
                    <span>Select & Practice</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Past Performance Reports Tab */}
          {pastReports.length > 0 && (
            <div className="p-7 rounded-3xl bg-white border border-slate-200/80 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Your Past Discussion Reports</h3>
                  <p className="text-xs text-slate-500">Evidence-linked feedback from previous sessions</p>
                </div>
                <BarChart3 className="w-5 h-5 text-indigo-600" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pastReports.map((rep) => (
                  <div
                    key={rep.id}
                    onClick={() => {
                      setCurrentReport(rep);
                      setView('REPORT');
                    }}
                    className="p-4 rounded-2xl border border-slate-200/80 hover:border-indigo-300 hover:bg-indigo-50/30 transition-all cursor-pointer flex items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                        {rep.mode}
                      </span>
                      <h4 className="text-xs font-bold text-slate-900 line-clamp-1">{rep.topic}</h4>
                      <p className="text-[11px] text-slate-500">
                        Speaking: {rep.speakingTimeSec}s · Score: {rep.overallScore}/100
                      </p>
                    </div>
                    <span className="text-xs font-bold text-indigo-600 flex items-center gap-1">
                      <span>View</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 3. MULTIPLAYER ROOM VIEW (Lobby & In-Progress) */}
      {view === 'MULTIPLAYER_ROOM' && (
        <div className="space-y-6">
          {/* Room Header & Authoritative Timer */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700">
                  {roomState?.phase === 'LOBBY' ? 'Waiting Lobby' : 'Live Group Discussion'}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700">
                  {roomState?.language || language}
                </span>
              </div>
              <h2 className="text-xl md:text-2xl font-extrabold text-slate-900">
                {roomState?.topic || selectedTopic}
              </h2>
            </div>

            {/* Authoritative Server Countdown Timer */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-900 text-white font-mono text-lg font-bold shadow-sm">
                <Clock className="w-5 h-5 text-indigo-400" />
                <span>{formatTimer(remainingTimerSec)}</span>
              </div>

              {/* Mic Toggle Button */}
              <button
                onClick={toggleMultiplayerMic}
                className={`p-3 rounded-2xl border transition-all ${
                  multiplayerMicMuted
                    ? 'bg-rose-50 text-rose-600 border-rose-200'
                    : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                }`}
                title={multiplayerMicMuted ? 'Unmute Microphone' : 'Mute Microphone'}
              >
                {multiplayerMicMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* LOBBY SPECIFIC VIEW: Room code, QR code & Participant checklist */}
          {roomState?.phase === 'LOBBY' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left 2 Cols: Participants List */}
              <div className="lg:col-span-2 p-6 rounded-3xl bg-white border border-slate-200/80 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">Participants in Lobby</h3>
                    <p className="text-xs text-slate-500">
                      {roomState?.participants?.length || 1} of {roomState?.maxParticipants || 6} joined
                    </p>
                  </div>
                  {isHost && (
                    <button
                      onClick={handleStartDiscussion}
                      className="py-2.5 px-5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-indigo-600/20 transition-all active:scale-95"
                    >
                      <Play className="w-4 h-4 fill-white" />
                      <span>Start Discussion Now</span>
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {roomState?.participants?.map((p: any) => (
                    <div
                      key={p.playerId}
                      className="p-3.5 rounded-2xl border border-slate-200/70 bg-slate-50/70 flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={p.avatar}
                          alt={p.name}
                          className="w-10 h-10 rounded-full border border-slate-200 object-cover"
                        />
                        <div>
                          <p className="text-xs font-bold text-slate-800 flex items-center gap-1">
                            <span>{p.name}</span>
                            {p.isHost && (
                              <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                                Host
                              </span>
                            )}
                            {p.isAi && (
                              <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-purple-100 text-purple-700">
                                AI
                              </span>
                            )}
                          </p>
                          <p className="text-[10px] text-slate-400">
                            {p.isAi ? 'Impartial Guide' : 'Microphone Ready'}
                          </p>
                        </div>
                      </div>
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-emerald-200" />
                    </div>
                  ))}
                </div>

                {!isHost && (
                  <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200/70 text-xs text-amber-800 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Waiting for the room host to start the group discussion...</span>
                  </div>
                )}
              </div>

              {/* Right 1 Col: Room Code & Mobile QR Code */}
              <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-sm space-y-4 flex flex-col justify-between">
                <div className="space-y-3">
                  <h3 className="font-bold text-slate-900 text-base">Invite Participants</h3>

                  {/* Room Code Badge */}
                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Room Code
                      </span>
                      <p className="font-mono text-xl font-extrabold text-indigo-600 tracking-wider">
                        {roomCode}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(roomCode);
                        setCopiedCode(true);
                        setTimeout(() => setCopiedCode(false), 2000);
                      }}
                      className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-indigo-600 shadow-sm"
                    >
                      {copiedCode ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* QR Code */}
                  {qrCodeUrl && (
                    <div className="flex flex-col items-center justify-center p-3 rounded-2xl bg-slate-50 border border-slate-200">
                      <img src={qrCodeUrl} alt="QR Code" className="w-40 h-40 rounded-xl" />
                      <p className="text-[10px] text-slate-500 font-medium mt-1">
                        Scan from mobile to join discussion
                      </p>
                    </div>
                  )}
                </div>

                {/* Share Link Button */}
                {inviteUrl && (
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(inviteUrl);
                      setCopiedLink(true);
                      setTimeout(() => setCopiedLink(false), 2000);
                    }}
                    className="w-full py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>{copiedLink ? 'Link Copied!' : 'Copy Shareable Link'}</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* ACTIVE IN-PROGRESS DISCUSSION VIEW: Voice Grid + Live Transcript */}
          {roomState?.phase === 'IN_PROGRESS' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Participant Tiles Grid (Left 2 Cols) */}
              <div className="lg:col-span-2 space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {roomState?.participants?.map((p: any) => {
                    const speaking = p.isSpeaking || (p.playerId === myPlayerId && isLocalSpeaking);
                    return (
                      <div
                        key={p.playerId}
                        className={`p-5 rounded-3xl bg-white border transition-all flex flex-col items-center text-center space-y-3 relative ${
                          speaking
                            ? 'border-emerald-500 ring-4 ring-emerald-100 shadow-lg'
                            : 'border-slate-200/80 shadow-sm'
                        }`}
                      >
                        <div className="relative">
                          <img
                            src={p.avatar}
                            alt={p.name}
                            className="w-20 h-20 rounded-full object-cover border-2 border-white shadow-md"
                          />
                          {speaking && (
                            <span className="absolute -bottom-1 -right-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500 text-white animate-pulse">
                              Speaking
                            </span>
                          )}
                        </div>

                        <div>
                          <p className="text-xs font-bold text-slate-900 line-clamp-1">{p.name}</p>
                          <p className="text-[10px] text-slate-400 font-medium">
                            {p.isHost ? 'Host' : p.isAi ? 'AI Moderator' : 'Participant'}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Session Actions Footer */}
                <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-3 h-3 rounded-full ${
                        isLocalSpeaking ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'
                      }`}
                    />
                    <span className="text-xs text-slate-600 font-medium">
                      {isLocalSpeaking ? 'Microphone Active' : 'Microphone Idle'}
                    </span>
                  </div>

                  <button
                    onClick={handleEndMultiplayerSession}
                    className="py-2 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all"
                  >
                    <span>Conclude GD</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Live Transcript Drawer (Right 1 Col) */}
              <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-sm space-y-3 flex flex-col h-[480px]">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <h3 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Live Transcript</span>
                  </h3>
                  <span className="text-[10px] text-slate-400">
                    {roomState?.transcripts?.length || 0} entries
                  </span>
                </div>

                <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
                  {roomState?.transcripts?.map((t: any, idx: number) => (
                    <div key={idx} className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs space-y-1">
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="font-bold text-slate-800">{t.speakerName}</span>
                        <span className="text-slate-400 font-mono">
                          {formatTimer(t.timestampSec || 0)}
                        </span>
                      </div>
                      <p className="text-slate-600 leading-relaxed font-normal">{t.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 4. AI PRACTICE GD VIEW (Mode B) */}
      {view === 'AI_PRACTICE' && (
        <div className="space-y-6">
          {/* Header Bar */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-50 text-purple-700">
                  AI Practice Mode
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700">
                  {language}
                </span>
              </div>
              <h2 className="text-xl md:text-2xl font-extrabold text-slate-900">{selectedTopic}</h2>
            </div>

            {/* Timers & Conclude Action */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-slate-900 text-white font-mono text-lg font-bold shadow-sm">
                <Clock className="w-5 h-5 text-purple-400" />
                <span>{formatTimer(remainingTimerSec)}</span>
              </div>

              <button
                onClick={handleConcludeAIPractice}
                className="py-2.5 px-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all"
              >
                <span>Conclude & View Report</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* AI Moderator Banner */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-50 via-indigo-50 to-purple-50 border border-purple-200/60 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <img
                src={GD_PERSONALITIES.MODERATOR.avatar}
                alt="Moderator"
                className="w-10 h-10 rounded-full object-cover border border-purple-300"
              />
              <div>
                <p className="text-xs font-bold text-slate-900 flex items-center gap-1">
                  <span>{GD_PERSONALITIES.MODERATOR.name}</span>
                  <span className="text-[10px] text-purple-700 bg-purple-100 px-1.5 py-0.2 rounded font-semibold">
                    AI Moderator
                  </span>
                </p>
                <p className="text-[11px] text-slate-500">
                  {activeAiSpeaker === 'MODERATOR' ? 'Moderator speaking...' : 'Impartial Guide · Timekeeper'}
                </p>
              </div>
            </div>

            <div className="text-xs text-slate-400 font-medium">
              Status:{' '}
              <span className="font-bold text-slate-700">
                {aiTurnStatus === 'SPEAKING'
                  ? 'Active Speaker'
                  : aiTurnStatus === 'THINKING'
                  ? 'Thinking...'
                  : 'Listening to Candidate'}
              </span>
            </div>
          </div>

          {/* 4 AI Participants Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {['ARJUN', 'MEERA', 'KABIR', 'SARA'].map((key) => {
              const p = GD_PERSONALITIES[key];
              const isSpeaking = activeAiSpeaker === key;

              return (
                <div
                  key={key}
                  className={`p-5 rounded-3xl bg-white border transition-all flex flex-col items-center text-center space-y-3 relative ${
                    isSpeaking
                      ? 'border-purple-600 ring-4 ring-purple-100 shadow-xl'
                      : 'border-slate-200/80 shadow-sm'
                  }`}
                >
                  <div className="relative">
                    <img
                      src={p.avatar}
                      alt={p.name}
                      className="w-20 h-20 rounded-full object-cover border-2 border-white shadow-md"
                    />
                    {isSpeaking && (
                      <span className="absolute -bottom-1 -right-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-purple-600 text-white animate-pulse">
                        Speaking
                      </span>
                    )}
                  </div>

                  <div className="space-y-0.5">
                    <p className="text-sm font-extrabold text-slate-900">{p.name}</p>
                    <p className="text-[11px] font-bold text-purple-700">{p.roleTitle}</p>
                    <p className="text-[10px] text-slate-400 font-medium">{p.description}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Student Interactive Speech Bar & Live Transcript */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Speech Input Console (Left 2 Cols) */}
            <div className="lg:col-span-2 p-6 rounded-3xl bg-white border border-slate-200/80 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs">
                    You
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">{candidateName}</h3>
                    <p className="text-[10px] text-slate-400">Speak or type your contribution</p>
                  </div>
                </div>

                <button
                  onClick={handleNextAITurnManual}
                  disabled={!!activeAiSpeaker}
                  className="py-1.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition-all"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Pass Turn to AI</span>
                </button>
              </div>

              {/* Real-time transcribed text display */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 min-h-[90px] text-sm text-slate-800 leading-relaxed font-normal">
                {liveCandidateTranscript || manualTextEntry ? (
                  <span>{liveCandidateTranscript} {manualTextEntry}</span>
                ) : (
                  <span className="text-slate-400 italic">
                    Click "Speak (Mic ON)" or type below to offer your perspective...
                  </span>
                )}
              </div>

              {/* Text Fallback Input */}
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={manualTextEntry}
                  onChange={(e) => setManualTextEntry(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleCandidateSubmitUtterance();
                  }}
                  placeholder="Or type your argument here (fallback if microphone disabled)..."
                  className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-2">
                <button
                  onClick={toggleRecording}
                  className={`py-2.5 px-5 rounded-2xl font-bold text-xs flex items-center gap-2 shadow-sm transition-all ${
                    isRecording
                      ? 'bg-rose-600 hover:bg-rose-700 text-white animate-pulse'
                      : 'bg-purple-600 hover:bg-purple-700 text-white'
                  }`}
                >
                  {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                  <span>{isRecording ? 'Listening (Click to Pause)' : 'Speak (Mic ON)'}</span>
                </button>

                <button
                  onClick={handleCandidateSubmitUtterance}
                  className="py-2.5 px-6 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all active:scale-95"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Submit Argument</span>
                </button>
              </div>
            </div>

            {/* AI Practice Live Transcript (Right 1 Col) */}
            <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-sm space-y-3 flex flex-col h-[380px]">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h3 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-purple-600" />
                  <span>Discussion Transcript</span>
                </h3>
                <span className="text-[10px] text-slate-400">{aiHistory.length} turns</span>
              </div>

              <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
                {aiHistory.map((t, idx) => (
                  <div
                    key={idx}
                    className={`p-2.5 rounded-xl text-xs space-y-1 ${
                      t.speakerRole === 'HUMAN'
                        ? 'bg-indigo-50/70 border border-indigo-200/60'
                        : t.speakerRole === 'AI_MODERATOR'
                        ? 'bg-purple-50/70 border border-purple-200/60'
                        : 'bg-slate-50 border border-slate-100'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="font-bold text-slate-800">{t.speakerName}</span>
                      <span className="text-slate-400 font-mono">
                        {formatTimer(t.timestampSec || 0)}
                      </span>
                    </div>
                    <p className="text-slate-700 leading-relaxed font-normal">{t.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. POST-GD EVIDENCE-LINKED REPORT VIEW */}
      {view === 'REPORT' && (
        <div className="space-y-8 animate-in fade-in duration-300">
          {reportLoading ? (
            <div className="p-12 text-center rounded-3xl bg-white border border-slate-200">
              <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin mx-auto mb-3" />
              <p className="font-bold text-slate-800 text-sm">Compiling Evidence-Linked Report...</p>
              <p className="text-xs text-slate-400 mt-1">Analyzing timestamps and transcript quotes</p>
            </div>
          ) : currentReport ? (
            <div className="space-y-6">
              {/* Summary Hero Row */}
              <div className="p-7 rounded-3xl bg-white border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-2 max-w-xl">
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700">
                    GD Performance Evaluation
                  </span>
                  <h2 className="text-2xl font-extrabold text-slate-900">{currentReport.topic}</h2>
                  <p className="text-xs text-slate-600 leading-relaxed font-normal">
                    {currentReport.summary}
                  </p>
                  <p className="text-[11px] text-slate-400 italic">
                    Note: AI speaking time is strictly excluded from candidate analytics.
                  </p>
                </div>

                {/* Score & Speaking Share Gauges */}
                <div className="flex items-center gap-6 shrink-0">
                  <div className="text-center p-4 rounded-2xl bg-indigo-50/60 border border-indigo-100">
                    <span className="text-3xl font-extrabold text-indigo-700">
                      {currentReport.overallScore}
                    </span>
                    <span className="text-[10px] text-slate-400 block font-bold">/ 100 Overall</span>
                  </div>
                  <div className="text-center p-4 rounded-2xl bg-emerald-50/60 border border-emerald-100">
                    <span className="text-3xl font-extrabold text-emerald-700">
                      {currentReport.speakingTimeSec}s
                    </span>
                    <span className="text-[10px] text-slate-400 block font-bold">Speaking Time</span>
                  </div>
                </div>
              </div>

              {/* Insufficient Evidence Warning Banner */}
              {currentReport.insufficientEvidence && (
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div className="text-xs space-y-1">
                    <p className="font-bold">Insufficient Speech Evidence Registered</p>
                    <p className="text-amber-800 leading-relaxed">
                      You spoke for under 15 seconds during this session. In corporate GD rounds, silence prevents evaluators from scoring your reasoning or leadership. Aim for at least 60–90 seconds of substantive participation.
                    </p>
                  </div>
                </div>
              )}

              {/* 5 Core Metrics Grid */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {[
                  { label: 'Participation', score: currentReport.participationScore, color: 'text-indigo-600' },
                  { label: 'Idea Quality', score: currentReport.ideaQualityScore, color: 'text-purple-600' },
                  { label: 'Relevance', score: currentReport.topicRelevanceScore, color: 'text-blue-600' },
                  { label: 'Collaboration', score: currentReport.collaborationScore, color: 'text-emerald-600' },
                  { label: 'Arguments', score: currentReport.argumentScore, color: 'text-amber-600' },
                ].map((item, i) => (
                  <div key={i} className="p-4 rounded-2xl bg-white border border-slate-200/80 text-center space-y-1">
                    <span className="text-xs text-slate-500 font-semibold">{item.label}</span>
                    <p className={`text-xl font-extrabold ${item.color}`}>{item.score}%</p>
                  </div>
                ))}
              </div>

              {/* Evidence-Linked Strengths & Improvements */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Strengths */}
                <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-sm space-y-4">
                  <div className="flex items-center gap-2 text-emerald-700">
                    <CheckCircle2 className="w-5 h-5" />
                    <h3 className="font-bold text-sm">Evidence-Linked Strengths</h3>
                  </div>

                  <div className="space-y-3">
                    {currentReport.strengths?.map((s: any, idx: number) => (
                      <div key={idx} className="p-3.5 rounded-2xl bg-emerald-50/50 border border-emerald-100 space-y-1.5 text-xs">
                        <div className="flex items-center justify-between">
                          <p className="font-bold text-slate-900">{s.point}</p>
                          <span className="text-[10px] text-emerald-700 font-mono font-bold">{s.timestamp}</span>
                        </div>
                        <p className="text-slate-600 italic leading-relaxed">"{s.evidenceQuote}"</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Areas for Improvement */}
                <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-sm space-y-4">
                  <div className="flex items-center gap-2 text-amber-700">
                    <AlertCircle className="w-5 h-5" />
                    <h3 className="font-bold text-sm">Evidence-Linked Opportunities</h3>
                  </div>

                  <div className="space-y-3">
                    {currentReport.improvements?.map((imp: any, idx: number) => (
                      <div key={idx} className="p-3.5 rounded-2xl bg-amber-50/50 border border-amber-100 space-y-1.5 text-xs">
                        <div className="flex items-center justify-between">
                          <p className="font-bold text-slate-900">{imp.point}</p>
                          <span className="text-[10px] text-amber-700 font-mono font-bold">{imp.timestamp}</span>
                        </div>
                        <p className="text-slate-600 italic leading-relaxed">"{imp.evidenceQuote}"</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Actionable Next Steps */}
              {currentReport.nextSteps && (
                <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-sm space-y-3">
                  <h3 className="font-bold text-slate-900 text-sm">Actionable Next Steps for Next GD</h3>
                  <div className="space-y-2">
                    {currentReport.nextSteps.map((step: string, idx: number) => (
                      <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-700">
                        <span className="w-5 h-5 rounded-full bg-indigo-50 text-indigo-700 font-bold flex items-center justify-center shrink-0 text-[10px]">
                          {idx + 1}
                        </span>
                        <p className="leading-relaxed">{step}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Return to Dashboard */}
              <div className="pt-2">
                <button
                  onClick={() => setView('DASHBOARD')}
                  className="py-3 px-6 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-indigo-600/20 transition-all mx-auto"
                >
                  <span>Return to GD Arena</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <p>No report available.</p>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODALS */}
      {/* ========================================================================= */}

      {/* CREATE MULTIPLAYER MODAL */}
      {showCreateMultiplayerModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 md:p-8 space-y-5 border border-slate-200 shadow-2xl animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600">
                Mode A Configuration
              </span>
              <h3 className="text-xl font-extrabold text-slate-900">Create Multiplayer Room</h3>
              <p className="text-xs text-slate-500">Configure topic, duration, and participant settings</p>
            </div>

            {/* Custom or Preset Topic */}
            <div className="space-y-2 text-xs">
              <label className="font-bold text-slate-800">Discussion Topic</label>
              <input
                type="text"
                value={customTopic}
                onChange={(e) => setCustomTopic(e.target.value)}
                placeholder={selectedTopic}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
              />
              <span className="text-[10px] text-slate-400">
                Or select from preset topics below:
              </span>
              <select
                value={selectedTopic}
                onChange={(e) => setSelectedTopic(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50 font-medium"
              >
                {GD_TOPICS.map((t) => (
                  <option key={t.id} value={t.title}>
                    [{t.category}] {t.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Duration & Max Participants */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-800">Duration (Minutes)</label>
                <select
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(parseInt(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 font-medium"
                >
                  <option value={5}>5 Minutes</option>
                  <option value={10}>10 Minutes</option>
                  <option value={15}>15 Minutes</option>
                  <option value={20}>20 Minutes</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-800">Max Participants</label>
                <select
                  value={maxParticipants}
                  onChange={(e) => setMaxParticipants(parseInt(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 font-medium"
                >
                  <option value={2}>2 Participants</option>
                  <option value={4}>4 Participants</option>
                  <option value={6}>6 Participants</option>
                  <option value={8}>8 Participants</option>
                </select>
              </div>
            </div>

            {/* Language & Moderator Toggle */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-800">Language</label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 font-medium"
                >
                  <option value="English">English</option>
                  <option value="Hindi-English Mixed">Hindi-English Mixed</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-800">AI Moderator</label>
                <select
                  value={hasAiModerator ? 'yes' : 'no'}
                  onChange={(e) => setHasAiModerator(e.target.value === 'yes')}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 font-medium"
                >
                  <option value="yes">Enabled (Dr. Radhika)</option>
                  <option value="no">Disabled</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3">
              <button
                onClick={() => setShowCreateMultiplayerModal(false)}
                className="py-2.5 px-4 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateMultiplayerRoom}
                className="py-2.5 px-5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/20"
              >
                Create Room
              </button>
            </div>
          </div>
        </div>
      )}

      {/* JOIN ROOM MODAL */}
      {showJoinModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 md:p-8 space-y-5 border border-slate-200 shadow-2xl animate-in zoom-in-95 duration-200">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600">
                Join Discussion
              </span>
              <h3 className="text-xl font-extrabold text-slate-900">Enter Room Code</h3>
              <p className="text-xs text-slate-500">Provide the 6-character room code shared by your host</p>
            </div>

            <div className="space-y-2 text-xs">
              <label className="font-bold text-slate-800">Room Code</label>
              <input
                type="text"
                value={joinCodeInput}
                onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
                placeholder="e.g. GD9821"
                maxLength={8}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-center font-mono text-lg font-extrabold tracking-widest uppercase focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3">
              <button
                onClick={() => setShowJoinModal(false)}
                className="py-2 px-4 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={handleJoinMultiplayerRoom}
                className="py-2.5 px-5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/20"
              >
                Join Discussion
              </button>
            </div>
          </div>
        </div>
      )}

      {/* START AI PRACTICE MODAL */}
      {showAIPracticeModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 md:p-8 space-y-5 border border-slate-200 shadow-2xl animate-in zoom-in-95 duration-200">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-purple-600">
                Mode B Configuration
              </span>
              <h3 className="text-xl font-extrabold text-slate-900">Configure AI Practice GD</h3>
              <p className="text-xs text-slate-500">
                You will practice with 4 AI participants (Arjun, Meera, Kabir, Sara) + 1 AI Moderator
              </p>
            </div>

            <div className="space-y-2 text-xs">
              <label className="font-bold text-slate-800">Topic</label>
              <input
                type="text"
                value={customTopic}
                onChange={(e) => setCustomTopic(e.target.value)}
                placeholder={selectedTopic}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-purple-500 font-medium"
              />
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-800">Duration</label>
                <select
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(parseInt(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 font-medium"
                >
                  <option value={5}>5 Minutes</option>
                  <option value={10}>10 Minutes</option>
                  <option value={15}>15 Minutes</option>
                  <option value={20}>20 Minutes</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-800">Language</label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 font-medium"
                >
                  <option value="English">English</option>
                  <option value="Hindi-English Mixed">Hindi-English Mixed</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3">
              <button
                onClick={() => setShowAIPracticeModal(false)}
                className="py-2.5 px-4 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={handleStartAIPractice}
                className="py-2.5 px-5 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md shadow-purple-600/20"
              >
                Start Practice Session
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function GDArenaPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-slate-400">Loading GD Arena...</div>
      }
    >
      <GDArenaInner />
    </Suspense>
  );
}
