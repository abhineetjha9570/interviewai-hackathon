'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  Trophy,
  Users,
  Clock,
  Zap,
  Play,
  CheckCircle2,
  XCircle,
  Copy,
  Check,
  ChevronRight,
  ChevronLeft,
  Flame,
  Award,
  Crown,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  RotateCcw,
  Plus,
  HelpCircle,
  Share2,
  Bookmark,
  Send,
  AlertTriangle,
  QrCode,
  X,
  Lock,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface Player {
  playerId: string;
  name: string;
  avatar: string;
  score: number;
  maxPossibleMarks?: number;
  correctAnswers?: number;
  questionsAnswered?: number;
  rank: number;
  isHost: boolean;
  connected: boolean;
  isFinished?: boolean;
}

interface QuestionView {
  orderIndex: number;
  questionId: string;
  title: string;
  topic: string;
  difficulty: string;
  description: string;
  options: string[];
  correctAnswer?: string | null;
  explanation?: string | null;
  mySelectedOption?: string | null;
  myIsFlagged?: boolean;
}

function ArenaMainContent() {
  const searchParams = useSearchParams();

  // Game session states
  const [inGame, setInGame] = useState(false);
  const [roomCode, setRoomCode] = useState('');
  const [myPlayerId, setMyPlayerId] = useState('');
  const [playerName, setPlayerName] = useState('Candidate');
  const [isHost, setIsHost] = useState(false);

  // Room state
  const [phase, setPhase] = useState<'LOBBY' | 'TEST_ACTIVE' | 'COMPLETED'>('LOBBY');
  const [roomTitle, setRoomTitle] = useState('Live Aptitude Arena');
  const [topic, setTopic] = useState('Quantitative Aptitude');
  const [totalQuestions, setTotalQuestions] = useState(10);
  const [testDurationMinutes, setTestDurationMinutes] = useState(10);
  const [questions, setQuestions] = useState<QuestionView[]>([]);
  const [activeQuestionIdx, setActiveQuestionIdx] = useState(0);
  const [leaderboard, setLeaderboard] = useState<Player[]>([]);
  const [totalPlayersCount, setTotalPlayersCount] = useState(1);

  // Timers
  const [remainingLobbySec, setRemainingLobbySec] = useState(600); // 10 minutes
  const [remainingTestSec, setRemainingTestSec] = useState(600); // Test timer

  // QR Code & Invitation
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string | null>(null);
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [customTunnelUrl, setCustomTunnelUrl] = useState('');
  const [isUpdatingQr, setIsUpdatingQr] = useState(false);
  const [showTunnelInput, setShowTunnelInput] = useState(false);

  // Modals & User feedback
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [isStartingTest, setIsStartingTest] = useState(false);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [focusWarning, setFocusWarning] = useState<string | null>(null);

  // Final scorecard
  const [scorecard, setScorecard] = useState<any>(null);

  // Host integrity summary
  const [integritySummary, setIntegritySummary] = useState<any[] | null>(null);

  // Global Leaderboard Data for landing view
  const [topGlobalResults, setTopGlobalResults] = useState<any[]>([]);
  const [personalBest, setPersonalBest] = useState<any>(null);

  const eventSourceRef = useRef<EventSource | null>(null);

  // Handle URL query params or sessionStorage reconnection on mount
  useEffect(() => {
    async function initSession() {
      if (typeof window === 'undefined') return;

      const paramRoom = searchParams.get('room');
      const paramPlayerId = searchParams.get('playerId');

      const savedCode = paramRoom || sessionStorage.getItem('arena_room_code');
      const savedPlayerId = paramPlayerId || sessionStorage.getItem('arena_player_id');

      if (savedCode && savedPlayerId) {
        try {
          const res = await fetch(`/api/arena/state?roomCode=${savedCode}&playerId=${savedPlayerId}`);
          if (res.ok) {
            const data = await res.json();
            if (data.state) {
              applyRoomState(data.state, savedPlayerId, savedCode);
              connectSseStream(savedCode, savedPlayerId);
              return;
            }
          }
        } catch (_) {}
      }

      // Fetch landing leaderboard data
      fetchLeaderboardData();
    }

    initSession();

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, [searchParams]);

  // Anti-cheat: Browser focus & tab visibility listener during TEST_ACTIVE
  useEffect(() => {
    if (phase !== 'TEST_ACTIVE' || !roomCode || !myPlayerId) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Tab switch detected
        logIntegrity('TAB_SWITCH', 'Candidate switched to another browser tab');
        setFocusWarning('Focus Notice: Tab switch recorded in test audit log.');
      } else {
        setTimeout(() => setFocusWarning(null), 5000);
      }
    };

    const handleWindowBlur = () => {
      logIntegrity('WINDOW_BLUR', 'Test window lost focus');
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
    };
  }, [phase, roomCode, myPlayerId]);

  const logIntegrity = async (eventType: string, details?: string) => {
    try {
      await fetch('/api/arena/integrity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomCode,
          playerId: myPlayerId,
          eventType,
          details,
        }),
      });
    } catch (_) {}
  };

  const fetchLeaderboardData = async () => {
    try {
      const res = await fetch('/api/arena/leaderboard');
      const json = await res.json();
      if (json.topResults) setTopGlobalResults(json.topResults);
      if (json.personalBest) setPersonalBest(json.personalBest);
    } catch (_) {}
  };

  // Connect SSE real-time stream
  const connectSseStream = (code: string, pId: string) => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const sse = new EventSource(`/api/arena/stream?roomCode=${code}&playerId=${pId}`);
    eventSourceRef.current = sse;

    sse.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        handleServerEvent(msg);
      } catch (err) {
        console.error('SSE JSON parse error:', err);
      }
    };

    sse.onerror = () => {
      // Automatic reconnection fallback
    };
  };

  // Handle incoming server events
  const handleServerEvent = (msg: { type: string; payload: any }) => {
    switch (msg.type) {
      case 'LOBBY_TICK':
        setRemainingLobbySec(msg.payload.remainingLobbySec);
        break;

      case 'PLAYER_JOINED':
        setTotalPlayersCount(msg.payload.totalPlayers);
        // Refresh room state to get full updated participant list
        refreshRoomState();
        break;

      case 'TEST_STARTED':
        if (msg.payload.questions && msg.payload.questions.length > 0) {
          setQuestions(msg.payload.questions);
          setActiveQuestionIdx(0);
        }
        setTotalQuestions(msg.payload.totalQuestions);
        setTestDurationMinutes(msg.payload.testDurationMinutes);
        setPhase('TEST_ACTIVE');
        refreshRoomState();
        break;

      case 'TEST_TICK':
        setRemainingTestSec(msg.payload.remainingTestSec);
        break;

      case 'LEADERBOARD_UPDATE':
        if (msg.payload.leaderboard) {
          setLeaderboard(msg.payload.leaderboard);
        }
        break;

      case 'INTEGRITY_ALERT':
        // For host view
        if (isHost) {
          refreshRoomState();
        }
        break;

      case 'TEST_COMPLETED':
        setPhase('COMPLETED');
        if (msg.payload.leaderboard) {
          setLeaderboard(msg.payload.leaderboard);
        }
        confetti({ particleCount: 120, spread: 70, origin: { y: 0.6 } });
        refreshRoomState();
        break;

      default:
        break;
    }
  };

  const refreshRoomState = async () => {
    if (!roomCode || !myPlayerId) return;
    try {
      const res = await fetch(`/api/arena/state?roomCode=${roomCode}&playerId=${myPlayerId}`);
      if (res.ok) {
        const data = await res.json();
        if (data.state) {
          applyRoomState(data.state, myPlayerId, roomCode);
        }
      }
    } catch (_) {}
  };

  // Real-time synchronization fallback while in lobby
  useEffect(() => {
    if (!inGame || phase !== 'LOBBY' || !roomCode || !myPlayerId) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/arena/state?roomCode=${roomCode}&playerId=${myPlayerId}`);
        if (res.ok) {
          const data = await res.json();
          if (data.state) {
            if (data.state.phase === 'TEST_ACTIVE' || data.state.phase === 'COMPLETED') {
              applyRoomState(data.state, myPlayerId, roomCode);
            } else {
              setTotalPlayersCount(data.state.totalPlayersCount || 1);
              if (data.state.leaderboard) setLeaderboard(data.state.leaderboard);
              if (data.state.remainingLobbySec !== undefined) {
                setRemainingLobbySec(data.state.remainingLobbySec);
              }
            }
          }
        }
      } catch (_) {}
    }, 1500);

    return () => clearInterval(interval);
  }, [inGame, phase, roomCode, myPlayerId]);

  const handleUpdateCustomOrigin = async () => {
    if (!roomCode || !customTunnelUrl.trim()) return;
    setIsUpdatingQr(true);
    try {
      const res = await fetch('/api/arena/qrcode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomCode,
          customOrigin: customTunnelUrl.trim(),
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setQrCodeDataUrl(data.qrCodeDataUrl);
        setInviteUrl(data.inviteUrl);
        setShowTunnelInput(false);
      }
    } catch (_) {
    } finally {
      setIsUpdatingQr(false);
    }
  };

  const applyRoomState = (state: any, pId: string, code: string) => {
    setInGame(true);
    setRoomCode(code);
    setMyPlayerId(pId);
    setPhase(state.phase);
    setRoomTitle(state.title);
    setTopic(state.topic);
    setTotalQuestions(state.totalQuestions);
    setTestDurationMinutes(state.testDurationMinutes);
    setIsHost(state.isHost);
    setRemainingLobbySec(state.remainingLobbySec);
    setRemainingTestSec(state.remainingTestSec);
    setLeaderboard(state.leaderboard || []);
    setTotalPlayersCount(state.totalPlayersCount || 1);
    setIntegritySummary(state.integritySummary || null);

    if (state.questions && state.questions.length > 0) {
      setQuestions(state.questions);
    }

    if (state.scorecard) {
      setScorecard(state.scorecard);
    }

    if (state.myPlayer) {
      setPlayerName(state.myPlayer.name);
    }

    // Persist to session
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('arena_room_code', code);
      sessionStorage.setItem('arena_player_id', pId);
    }
  };

  // Host: Create Room Action
  const handleCreateRoom = async () => {
    setStatusError(null);
    try {
      const res = await fetch('/api/arena/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Live Aptitude Arena',
          topic,
          testDurationMinutes: 10,
          totalQuestions: 10,
          maxPlayers: 50,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create room.');

      setRoomCode(data.roomCode);
      setMyPlayerId(data.hostPlayerId);
      setIsHost(true);
      setShowCreateModal(false);
      setInGame(true);
      setQrCodeDataUrl(data.qrCodeDataUrl || null);
      setInviteUrl(data.inviteUrl || null);

      sessionStorage.setItem('arena_room_code', data.roomCode);
      sessionStorage.setItem('arena_player_id', data.hostPlayerId);

      // Connect SSE
      connectSseStream(data.roomCode, data.hostPlayerId);
      refreshRoomState();
    } catch (err: any) {
      setStatusError(err.message);
    }
  };

  // Join Existing Room Action
  const handleJoinRoom = async () => {
    setStatusError(null);
    if (!joinCodeInput.trim()) {
      setStatusError('Please enter a 6-character room code.');
      return;
    }

    setIsJoining(true);
    try {
      const res = await fetch('/api/arena/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomCode: joinCodeInput.toUpperCase().trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 401 || data.code === 'AUTH_REQUIRED') {
          // Redirect to auth join flow
          window.location.href = `/aptitude-arena/join?room=${encodeURIComponent(joinCodeInput.trim())}`;
          return;
        }
        throw new Error(data.error || 'Failed to join room.');
      }

      setRoomCode(data.roomCode);
      setMyPlayerId(data.playerId);
      setIsHost(false);
      setShowJoinModal(false);
      setInGame(true);

      sessionStorage.setItem('arena_room_code', data.roomCode);
      sessionStorage.setItem('arena_player_id', data.playerId);

      connectSseStream(data.roomCode, data.playerId);
      refreshRoomState();
    } catch (err: any) {
      setStatusError(err.message);
    } finally {
      setIsJoining(false);
    }
  };

  // Host: Early Start Test
  const handleStartTestNow = async () => {
    if (!isHost) return;
    setIsStartingTest(true);
    setStatusError(null);
    try {
      const res = await fetch('/api/arena/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomCode, hostPlayerId: myPlayerId }),
      });
      const d = await res.json();
      if (!res.ok) {
        throw new Error(d.error || 'Failed to start test.');
      }
      if (d.questions && d.questions.length > 0) {
        setQuestions(d.questions);
        setActiveQuestionIdx(0);
      }
      setPhase('TEST_ACTIVE');
      if (d.state) {
        applyRoomState(d.state, myPlayerId, roomCode);
      }
    } catch (err: any) {
      setStatusError(err.message);
    } finally {
      setIsStartingTest(false);
    }
  };

  // Candidate: Select & Save Answer (+5 marks if correct, 0 if incorrect, no negative marking)
  const handleSelectOption = async (option: string) => {
    if (phase !== 'TEST_ACTIVE') return;

    // Optimistic UI update
    setQuestions((prev) =>
      prev.map((q, idx) => (idx === activeQuestionIdx ? { ...q, mySelectedOption: option } : q))
    );

    try {
      const res = await fetch('/api/arena/answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomCode,
          playerId: myPlayerId,
          questionIndex: activeQuestionIdx,
          selectedOption: option,
          isFlaggedForReview: questions[activeQuestionIdx]?.myIsFlagged || false,
        }),
      });

      if (!res.ok) {
        const d = await res.json();
        console.warn('Answer submit error:', d.error);
      }
    } catch (_) {}
  };

  // Toggle Flag for Review
  const handleToggleFlag = () => {
    setQuestions((prev) =>
      prev.map((q, idx) =>
        idx === activeQuestionIdx ? { ...q, myIsFlagged: !q.myIsFlagged } : q
      )
    );
  };

  // Submit and Finish Test Early
  const handleFinishTestEarly = async () => {
    const confirmFinish = window.confirm(
      'Are you sure you want to finalize and submit your test? You will receive your verified score immediately.'
    );
    if (!confirmFinish) return;

    try {
      const res = await fetch('/api/arena/finish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomCode, playerId: myPlayerId }),
      });

      const data = await res.json();
      if (res.ok && data.scorecard) {
        setScorecard(data.scorecard);
        setPhase('COMPLETED');
        confetti({ particleCount: 100, spread: 60 });
      }
    } catch (err: any) {
      alert('Error submitting test: ' + err.message);
    }
  };

  // Leave Game
  const handleLeaveRoom = () => {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('arena_room_code');
      sessionStorage.removeItem('arena_player_id');
    }
    if (eventSourceRef.current) eventSourceRef.current.close();
    setInGame(false);
    setRoomCode('');
    setMyPlayerId('');
    setPhase('LOBBY');
    setQuestions([]);
    setScorecard(null);
  };

  // Helpers
  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(Math.max(0, totalSeconds) / 60);
    const secs = Math.max(0, totalSeconds) % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const copyToClipboard = (text: string, type: 'LINK' | 'CODE') => {
    navigator.clipboard.writeText(text);
    if (type === 'LINK') {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } else {
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const handleShare = () => {
    if (navigator.share && inviteUrl) {
      navigator.share({
        title: 'InterviewAI Aptitude Arena',
        text: `Join room ${roomCode} for live real-time aptitude competition!`,
        url: inviteUrl,
      });
    } else {
      copyToClipboard(inviteUrl || '', 'LINK');
    }
  };

  const currentQ = questions[activeQuestionIdx];
  const myPlayer = leaderboard.find((p) => p.playerId === myPlayerId);

  // -----------------------------------------------------------------
  // VIEW 1: LOBBY VIEW (EXACT 10-MINUTE LOBBY & HOST CONTROLS)
  // -----------------------------------------------------------------
  if (inGame && phase === 'LOBBY') {
    return (
      <div className="space-y-6 animate-in fade-in duration-300">
        {/* Lobby Top Navigation Bar */}
        <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center font-black">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-white flex items-center gap-2">
                <span>{roomTitle}</span>
                <span className="text-xs px-2 py-0.5 rounded-md bg-indigo-950 text-indigo-300 border border-indigo-800/60 font-mono">
                  {roomCode}
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                10-Minute Waiting Lobby · Exact +5 Marks Per Question · No Negative Marking
              </p>
            </div>
          </div>

          <button
            onClick={handleLeaveRoom}
            className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 transition-colors"
          >
            Leave Lobby
          </button>
        </div>

        {/* 10-Minute Countdown Banner */}
        <div className="p-6 rounded-3xl bg-gradient-to-r from-indigo-950/70 via-purple-950/60 to-slate-900 border border-indigo-800/60 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-1 text-center md:text-left">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-indigo-400 flex items-center justify-center md:justify-start gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              Authoritative Lobby Countdown
            </span>
            <h3 className="text-xl font-black text-white">
              Test Starts Automatically When Timer Reaches 00:00
            </h3>
            <p className="text-xs text-slate-300 max-w-xl">
              All participants are synchronized to the exact server deadline. Late joiners are prohibited once the test begins.
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="px-6 py-3 rounded-2xl bg-slate-950/90 border border-indigo-500/40 text-center shadow-inner">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">Lobby Time Left</span>
              <span className="text-3xl font-black font-mono text-indigo-300">
                {formatTimer(remainingLobbySec)}
              </span>
            </div>

            {isHost && (
              <button
                onClick={handleStartTestNow}
                disabled={isStartingTest}
                className="py-4 px-6 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-extrabold text-sm shadow-xl shadow-indigo-600/30 flex items-center gap-2 transition-all disabled:opacity-50"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>{isStartingTest ? 'Starting...' : 'Start Test Now'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Two-Column Lobby Details: QR Code & Share on Left, Participants on Right */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: QR Code & Invitation Controls */}
          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-5">
            <h4 className="text-sm font-extrabold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <QrCode className="w-4 h-4 text-indigo-400" />
              Scan or Share to Join
            </h4>

            {/* QR Code Container */}
            <div className="p-4 rounded-2xl bg-white flex flex-col items-center justify-center shadow-md">
              {qrCodeDataUrl ? (
                <img
                  src={qrCodeDataUrl}
                  alt={`Join Aptitude Arena Room ${roomCode}`}
                  className="w-48 h-48 rounded-xl object-contain"
                />
              ) : (
                <div className="w-48 h-48 flex items-center justify-center text-slate-500 text-xs text-center p-2">
                  QR Code generated on room creation
                </div>
              )}
              <span className="text-[11px] font-bold text-slate-900 mt-2 font-mono">
                ROOM: {roomCode}
              </span>
            </div>

            {/* Invitation URL & Buttons */}
            <div className="space-y-2.5">
              <div className="flex gap-2">
                <button
                  onClick={() => copyToClipboard(roomCode, 'CODE')}
                  className="flex-1 py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                >
                  {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedCode ? 'Copied Code!' : 'Copy Code'}</span>
                </button>

                <button
                  onClick={handleShare}
                  className="flex-1 py-2.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow transition-colors"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Share Link</span>
                </button>
              </div>

              {inviteUrl && (
                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-400 break-all select-all font-mono">
                  {inviteUrl}
                </div>
              )}

              {/* Mobile LAN / Tunnel helper */}
              <div className="p-2.5 rounded-xl bg-indigo-950/30 border border-indigo-900/50 text-[11px] text-indigo-300">
                <span className="font-bold block">Mobile Network Access:</span>
                This QR code uses your host machine IP so any mobile device on your Wi-Fi network connects directly.
              </div>

              {isHost && (
                <div className="pt-1">
                  {!showTunnelInput ? (
                    <button
                      type="button"
                      onClick={() => setShowTunnelInput(true)}
                      className="text-[11px] text-indigo-400 hover:text-indigo-300 font-bold underline"
                    >
                      + Use Custom Public Tunnel / Domain (ngrok / Cloudflare)
                    </button>
                  ) : (
                    <div className="space-y-2 p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs">
                      <label className="font-bold text-slate-300 block text-[11px]">
                        Public Tunnel or Domain URL
                      </label>
                      <input
                        type="url"
                        placeholder="https://abc.ngrok-free.app"
                        value={customTunnelUrl}
                        onChange={(e) => setCustomTunnelUrl(e.target.value)}
                        className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={handleUpdateCustomOrigin}
                          disabled={isUpdatingQr || !customTunnelUrl.trim()}
                          className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold rounded-lg text-[11px]"
                        >
                          {isUpdatingQr ? 'Updating...' : 'Update QR'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowTunnelInput(false)}
                          className="px-2 py-1 bg-slate-800 text-slate-400 rounded-lg text-[11px]"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Rules Reminder */}
            <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-1 text-xs text-slate-400">
              <p className="font-bold text-slate-300">Competition Format:</p>
              <ul className="list-disc list-inside space-y-0.5 text-[11px]">
                <li>Total Questions: {totalQuestions} questions</li>
                <li>Scoring: +5 Marks (Correct) / 0 Marks (Wrong / Skip)</li>
                <li>No negative marking</li>
                <li>Free question navigation with review palette</li>
              </ul>
            </div>
          </div>

          {/* Right Column: Verified Participant Grid (up to 50 players) */}
          <div className="lg:col-span-2 p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-extrabold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-400" />
                Verified Participants ({leaderboard.length}/50)
              </h4>
              <span className="text-xs text-slate-400">
                {isHost ? 'Host Administrator View' : 'Participant Waiting Room'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 max-h-[460px] overflow-y-auto p-1">
              {leaderboard.map((p, idx) => (
                <div
                  key={p.playerId}
                  className={`p-3.5 rounded-2xl border flex items-center justify-between ${
                    p.playerId === myPlayerId
                      ? 'bg-indigo-950/40 border-indigo-500/70'
                      : 'bg-slate-950/70 border-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-xl">{p.avatar || 'Candidate'}</span>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-white truncate flex items-center gap-1">
                        <span>{p.name}</span>
                        {p.isHost && <Crown className="w-3 h-3 text-amber-400 shrink-0" />}
                      </p>
                      <span className="text-[10px] text-slate-500 block">
                        {p.isHost ? 'Host Organizer' : 'Verified Candidate'}
                      </span>
                    </div>
                  </div>

                  <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" title="Online" />
                </div>
              ))}
            </div>

            <p className="text-[11px] text-slate-500 text-center pt-2">
              All participant identities are securely verified via server-side session credentials.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // -----------------------------------------------------------------
  // VIEW 2: TEST ACTIVE VIEW (FREE NAVIGATION, EXACT +5/0 SCORING)
  // -----------------------------------------------------------------
  if (inGame && phase === 'TEST_ACTIVE') {
    if (!currentQ || questions.length === 0) {
      return (
        <div className="min-h-[460px] flex flex-col items-center justify-center p-8 rounded-3xl bg-slate-900 border border-slate-800 text-center space-y-4 animate-in fade-in">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto shadow-lg shadow-indigo-500/20" />
          <h3 className="text-lg font-extrabold text-white">Synchronizing Assessment...</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Connecting test engine, synchronizing synchronized clock, and loading Question 1...
          </p>
        </div>
      );
    }

    const answeredCount = questions.filter((q) => q.mySelectedOption).length;
    const currentScore = myPlayer?.score || 0;
    const maxMarks = totalQuestions * 5;

    return (
      <div className="space-y-6 animate-in fade-in duration-300">
        {/* Anti-Cheat Focus Warning Banner */}
        {focusWarning && (
          <div className="p-3 rounded-2xl bg-amber-950/60 border border-amber-800 text-amber-300 text-xs flex items-center gap-2 animate-in fade-in">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{focusWarning}</span>
          </div>
        )}

        {/* Global Active Test Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl">
          <div className="flex items-center gap-3">
            <div className="px-3.5 py-1.5 rounded-xl bg-indigo-950 border border-indigo-800 text-indigo-300 font-bold text-xs">
              Q {activeQuestionIdx + 1} of {totalQuestions}
            </div>
            <div>
              <span className="text-[11px] text-slate-400 uppercase tracking-wider block font-bold">
                {currentQ.topic} · {currentQ.difficulty}
              </span>
              <span className="text-xs text-white font-bold">
                Question Marks: +5 Marks (Correct) · 0 (Wrong / Skip)
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Live Authoritative Global Timer */}
            <div className="px-5 py-2 rounded-2xl bg-slate-950 border border-slate-800 flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-400" />
              <span className="font-mono text-lg font-black text-white">
                {formatTimer(remainingTestSec)}
              </span>
            </div>

            {/* Current Score Counter */}
            <div className="px-4 py-2 rounded-2xl bg-indigo-950/60 border border-indigo-800/80 text-center">
              <span className="text-[10px] text-indigo-300 uppercase tracking-wider block font-bold">
                My Score
              </span>
              <span className="text-sm font-black text-indigo-200">
                {currentScore} / {maxMarks}
              </span>
            </div>

            {/* Submit & Finish Test Early */}
            <button
              onClick={handleFinishTestEarly}
              className="py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-lg shadow-emerald-600/30 transition-all flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Submit Test</span>
            </button>
          </div>
        </div>

        {/* Main Test Layout: Question Canvas on Left, Question Palette & Leaderboard on Right */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Question & Options Area */}
          <div className="lg:col-span-2 p-7 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl space-y-6 flex flex-col justify-between min-h-[500px]">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-extrabold text-white">
                  {currentQ.title}
                </h3>
                <button
                  onClick={handleToggleFlag}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors border ${
                    currentQ.myIsFlagged
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                      : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                  }`}
                >
                  <Bookmark className="w-3.5 h-3.5" />
                  <span>{currentQ.myIsFlagged ? 'Flagged' : 'Flag for Review'}</span>
                </button>
              </div>

              <p className="text-sm text-slate-300 leading-relaxed font-normal bg-slate-950/60 p-4 rounded-2xl border border-slate-850">
                {currentQ.description}
              </p>

              {/* Multiple Choice Options */}
              <div className="space-y-3 pt-2">
                {currentQ.options.map((opt, optIdx) => {
                  const isSelected = currentQ.mySelectedOption === opt;
                  const optionLabel = String.fromCharCode(65 + optIdx);

                  return (
                    <button
                      key={optIdx}
                      type="button"
                      onClick={() => handleSelectOption(opt)}
                      className={`w-full p-4 rounded-2xl border text-left flex items-center gap-3 transition-all ${
                        isSelected
                          ? 'bg-indigo-600/20 border-indigo-500 ring-2 ring-indigo-500/30 text-white shadow-lg'
                          : 'bg-slate-950/70 border-slate-800 hover:border-slate-700 text-slate-300'
                      }`}
                    >
                      <span
                        className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                          isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {optionLabel}
                      </span>
                      <span className="text-xs font-medium leading-relaxed">{opt}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Bottom Question Navigation Controls */}
            <div className="flex items-center justify-between pt-6 border-t border-slate-800">
              <button
                type="button"
                disabled={activeQuestionIdx === 0}
                onClick={() => setActiveQuestionIdx((prev) => Math.max(0, prev - 1))}
                className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-colors disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Previous</span>
              </button>

              <span className="text-xs text-slate-400 font-medium">
                {answeredCount} of {totalQuestions} Answered
              </span>

              <button
                type="button"
                disabled={activeQuestionIdx === totalQuestions - 1}
                onClick={() => setActiveQuestionIdx((prev) => Math.min(totalQuestions - 1, prev + 1))}
                className="py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 transition-colors disabled:opacity-40"
              >
                <span>Next Question</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Right Column: Question Palette & Top 50 Live Leaderboard */}
          <div className="space-y-6">
            {/* Question Palette Navigation Grid */}
            <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-300">
                  Question Palette
                </h4>
                <div className="flex items-center gap-3 text-[10px] text-slate-400 font-semibold">
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    Answered
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    Flagged
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-slate-700" />
                    Skip
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-5 gap-2">
                {questions.map((q, qIdx) => {
                  const isCurrent = qIdx === activeQuestionIdx;
                  const isAnswered = !!q.mySelectedOption;
                  const isFlagged = !!q.myIsFlagged;

                  let colorStyle = 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700';
                  if (isAnswered) colorStyle = 'bg-emerald-950/70 border-emerald-500/80 text-emerald-300';
                  if (isFlagged) colorStyle = 'bg-amber-950/70 border-amber-500/80 text-amber-300';
                  if (isCurrent) colorStyle += ' ring-2 ring-indigo-400';

                  return (
                    <button
                      key={qIdx}
                      type="button"
                      onClick={() => setActiveQuestionIdx(qIdx)}
                      className={`h-10 rounded-xl border text-xs font-bold flex items-center justify-center transition-all ${colorStyle}`}
                    >
                      {qIdx + 1}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Live Top 1 to 50 Leaderboard */}
            <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                  <Flame className="w-4 h-4 text-amber-400" />
                  Live Leaderboard (Top 50)
                </h4>
                <span className="text-[10px] text-slate-500">Updates on accepted answers</span>
              </div>

              <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
                {leaderboard.slice(0, 50).map((player, rIdx) => {
                  const isMe = player.playerId === myPlayerId;
                  return (
                    <div
                      key={player.playerId}
                      className={`p-2.5 rounded-xl border flex items-center justify-between text-xs ${
                        isMe
                          ? 'bg-indigo-950/50 border-indigo-500 text-white font-bold'
                          : 'bg-slate-950/60 border-slate-800/80 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="w-5 text-center font-bold text-slate-400 text-[11px]">
                          #{player.rank || rIdx + 1}
                        </span>
                        <span className="truncate">{player.name}</span>
                        {isMe && (
                          <span className="px-1.5 py-0.2 rounded bg-indigo-600 text-[9px] text-white">
                            YOU
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="font-mono font-extrabold text-indigo-300">
                          {player.score} pts
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // -----------------------------------------------------------------
  // VIEW 3: TEST COMPLETED & FINAL SCORECARD ANALYSIS
  // -----------------------------------------------------------------
  if (inGame && phase === 'COMPLETED') {
    if (!scorecard) {
      return (
        <div className="min-h-[460px] flex flex-col items-center justify-center p-8 rounded-3xl bg-slate-900 border border-slate-800 text-center space-y-4 animate-in fade-in">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto shadow-lg shadow-emerald-500/20" />
          <h3 className="text-lg font-extrabold text-white">Calculating Verified Scorecard...</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Aggregating all candidate responses, calculating ranks, and preparing performance review...
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-6 animate-in fade-in duration-300">
        {/* Completion Trophy Card */}
        <div className="p-8 rounded-3xl bg-gradient-to-r from-indigo-950/80 via-purple-950/70 to-slate-900 border border-indigo-700/60 shadow-2xl text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto shadow-lg shadow-amber-500/20">
            <Trophy className="w-8 h-8" />
          </div>

          <div>
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-indigo-400">
              Official Assessment Results
            </span>
            <h2 className="text-3xl font-black text-white mt-1">
              Test Completed · Verified Rank #{scorecard.rank}
            </h2>
            <p className="text-xs text-slate-300 mt-1 max-w-md mx-auto">
              Your results are final and mathematically verified. All questions are scored at exactly 5 marks each with zero negative marking.
            </p>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto pt-2">
            <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">Total Score</span>
              <span className="text-2xl font-black text-indigo-300">
                {scorecard.totalScore} / {scorecard.maxPossibleMarks}
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">Accuracy</span>
              <span className="text-2xl font-black text-emerald-400">
                {scorecard.accuracyPct}%
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">Correct / Total</span>
              <span className="text-2xl font-black text-white">
                {scorecard.correctAnswers} / {scorecard.totalQuestions}
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">Time Taken</span>
              <span className="text-2xl font-black text-slate-200">
                {Math.round(scorecard.timeTakenSec)}s
              </span>
            </div>
          </div>

          <div className="pt-2 flex flex-wrap justify-center gap-3">
            <Link
              href={scorecard.recommendedPracticeUrl || '/practice?category=Aptitude'}
              className="py-3 px-6 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs shadow-xl shadow-indigo-600/30 flex items-center gap-2 transition-all"
            >
              <span>Practice Weak Areas in Practice Mode</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <button
              onClick={handleLeaveRoom}
              className="py-3 px-6 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-colors"
            >
              Return to Arena Hub
            </button>
          </div>
        </div>

        {/* Detailed Question Review with Step-by-Step Explanations */}
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
          <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            Complete Question Review & Verified Explanations
          </h3>

          <div className="space-y-4">
            {scorecard.questionReview?.map((q: any, i: number) => {
              const isCorrect = q.isCorrect;
              return (
                <div
                  key={i}
                  className={`p-5 rounded-2xl border space-y-3 ${
                    isCorrect
                      ? 'bg-emerald-950/20 border-emerald-800/50'
                      : q.selectedOption
                      ? 'bg-rose-950/20 border-rose-800/50'
                      : 'bg-slate-950/50 border-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">
                      Q{q.orderIndex}. {q.title}
                    </span>
                    <span
                      className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                        isCorrect
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                          : q.selectedOption
                          ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                          : 'bg-slate-800 text-slate-400 border-slate-700'
                      }`}
                    >
                      {isCorrect ? '+5 Marks' : q.selectedOption ? '0 Marks (Incorrect)' : '0 Marks (Skipped)'}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300">{q.description}</p>

                  <div className="text-xs space-y-1 pt-1">
                    <p className="text-slate-400">
                      Your Answer:{' '}
                      <span className={isCorrect ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                        {q.selectedOption || 'None (Skipped)'}
                      </span>
                    </p>
                    <p className="text-slate-400">
                      Verified Correct Answer:{' '}
                      <span className="text-emerald-400 font-bold">{q.correctAnswer}</span>
                    </p>
                  </div>

                  {q.explanation && (
                    <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-850 text-xs text-slate-300 leading-relaxed">
                      <span className="font-bold text-indigo-400 block mb-0.5">Solution & Deduction:</span>
                      {q.explanation}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // -----------------------------------------------------------------
  // VIEW 4: LANDING & HUB SCREEN (CREATE OR JOIN ROOM)
  // -----------------------------------------------------------------
  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Hero Card */}
      <div className="p-8 rounded-3xl bg-gradient-to-r from-indigo-900/40 via-purple-900/30 to-slate-900 border border-indigo-700/40 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2 max-w-xl text-center md:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold border border-indigo-500/30">
            <Zap className="w-3.5 h-3.5 text-indigo-400" />
            <span>Real-Time Placement Arena</span>
          </div>
          <h1 className="text-3xl font-black tracking-tight text-white">
            Live Aptitude Arena
          </h1>
          <p className="text-sm text-slate-300 leading-relaxed">
            Compete live against up to 50 candidates in real time. Features exact 10-minute lobby countdowns, verified Google identity, server-authoritative scoring (+5 marks / 0 wrong), and live deterministic leaderboards.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 shrink-0">
          <button
            onClick={() => setShowCreateModal(true)}
            className="py-3.5 px-6 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs shadow-xl shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Host New Room</span>
          </button>

          <button
            onClick={() => setShowJoinModal(true)}
            className="py-3.5 px-6 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-extrabold text-xs border border-slate-700 flex items-center justify-center gap-2 transition-all"
          >
            <Users className="w-4 h-4" />
            <span>Join with Code</span>
          </button>
        </div>
      </div>

      {/* Feature Highlights Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-2">
          <div className="w-10 h-10 rounded-2xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center font-bold">
            <QrCode className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-extrabold text-white">QR Code & Mobile Join</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Hosts receive high-resolution QR codes and shareable invitation links. Candidates scan with any smartphone camera to open the authenticated join room.
          </p>
        </div>

        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-2">
          <div className="w-10 h-10 rounded-2xl bg-emerald-600/20 text-emerald-400 flex items-center justify-center font-bold">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-extrabold text-white">Exact +5 / 0 Scoring</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Every question awards strictly 5 marks for correct answers, 0 for incorrect or skipped. Zero negative marking. Completely server-authoritative and tamper-proof.
          </p>
        </div>

        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-2">
          <div className="w-10 h-10 rounded-2xl bg-purple-600/20 text-purple-400 flex items-center justify-center font-bold">
            <Clock className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-extrabold text-white">10-Minute Synchronized Lobby</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            10-minute authoritative countdown ticker prevents timing drift. Host can trigger early start any time, or room starts automatically upon expiry.
          </p>
        </div>
      </div>

      {/* Hall of Champions (All-Time Leaderboard) */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <Crown className="w-4 h-4 text-amber-400" />
            Arena Hall of Champions
          </h3>
          <span className="text-xs text-slate-400">All-time top verified placement scores</span>
        </div>

        <div className="space-y-2">
          {topGlobalResults.length > 0 ? (
            topGlobalResults.slice(0, 5).map((champ, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-850 flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-3">
                  <span className="w-6 text-center font-black text-amber-400">#{idx + 1}</span>
                  <div>
                    <span className="font-bold text-white block">{champ.playerName}</span>
                    <span className="text-[10px] text-slate-500">Room: {champ.roomCode}</span>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-right">
                  <div>
                    <span className="font-mono font-extrabold text-indigo-300 block">{champ.totalScore} pts</span>
                    <span className="text-[10px] text-emerald-400 font-bold">{champ.accuracyPct}% accuracy</span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="py-8 text-center text-xs text-slate-500">
              No previous matches recorded yet. Host a new room to start competing!
            </div>
          )}
        </div>
      </div>

      {/* Modal: Create Room */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5 animate-in zoom-in-95">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-indigo-400" />
                Host New Aptitude Arena Room
              </h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {statusError && (
              <div className="p-3 rounded-xl bg-rose-950/50 border border-rose-800 text-rose-300 text-xs">
                {statusError}
              </div>
            )}

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Aptitude Category
                </label>
                <select
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white font-medium"
                >
                  <option value="Quantitative Aptitude">Quantitative Aptitude</option>
                  <option value="Logical Reasoning">Logical Reasoning</option>
                  <option value="Verbal Ability">Verbal Ability</option>
                  <option value="Data Interpretation">Data Interpretation</option>
                  <option value="Number Series">Number Series</option>
                  <option value="Percentages">Percentages</option>
                  <option value="Probability">Probability</option>
                  <option value="Time and Work">Time and Work</option>
                  <option value="Speed, Time and Distance">Speed, Time and Distance</option>
                </select>
              </div>

              <div className="p-3 rounded-xl bg-indigo-950/40 border border-indigo-800/60 text-[11px] text-slate-300 space-y-1">
                <p className="font-bold text-indigo-300">Room Specifications:</p>
                <p>• 10-Minute Waiting Lobby with Real QR Code</p>
                <p>• 10 Questions · 50 Total Possible Marks (+5 per correct answer)</p>
                <p>• Capacity: Up to 50 concurrent verified candidates</p>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="flex-1 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateRoom}
                className="flex-1 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs shadow-lg shadow-indigo-600/30"
              >
                Create Room
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Join Room */}
      {showJoinModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5 animate-in zoom-in-95">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-400" />
                Join Existing Arena Room
              </h3>
              <button onClick={() => setShowJoinModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {statusError && (
              <div className="p-3 rounded-xl bg-rose-950/50 border border-rose-800 text-rose-300 text-xs">
                {statusError}
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="font-bold text-slate-400 uppercase tracking-wider block mb-1 text-xs">
                  6-Character Room Code
                </label>
                <input
                  type="text"
                  maxLength={8}
                  placeholder="e.g. APT824"
                  value={joinCodeInput}
                  onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
                  className="w-full py-3 px-4 bg-slate-950 border border-slate-800 rounded-xl text-center font-mono text-lg font-black text-indigo-300 uppercase tracking-widest placeholder-slate-600"
                />
              </div>

              <p className="text-[11px] text-slate-400 text-center">
                Requires authenticated candidate account. Your verified display name will be used on the live leaderboard.
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowJoinModal(false)}
                className="flex-1 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isJoining || !joinCodeInput.trim()}
                onClick={handleJoinRoom}
                className="flex-1 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs shadow-lg shadow-indigo-600/30 disabled:opacity-50"
              >
                {isJoining ? 'Joining...' : 'Enter Lobby'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AptitudeArenaPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-slate-400 text-xs">
          Loading Live Aptitude Arena...
        </div>
      }
    >
      <ArenaMainContent />
    </Suspense>
  );
}
