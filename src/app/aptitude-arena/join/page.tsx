'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Trophy,
  Users,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Lock,
  LogIn,
  KeyRound,
  Flame,
} from 'lucide-react';

function JoinContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [roomCode, setRoomCode] = useState('');
  const [currentUser, setCurrentUser] = useState<{ id: string; name: string; email: string } | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const roomFromUrl = searchParams.get('room');
    if (roomFromUrl) {
      setRoomCode(roomFromUrl.toUpperCase().trim());
    }

    // Verify current authenticated session
    async function checkAuth() {
      try {
        setAuthLoading(true);
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          if (data.user) {
            setCurrentUser(data.user);
          }
        }
      } catch (err) {
        console.warn('Auth check error:', err);
      } finally {
        setAuthLoading(false);
      }
    }
    checkAuth();
  }, [searchParams]);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanCode = roomCode.toUpperCase().trim();
    if (!cleanCode) {
      setErrorMessage('Please enter the 6-character room code.');
      return;
    }

    if (!currentUser) {
      setErrorMessage('Authentication required. Please sign in with Google or your candidate account.');
      return;
    }

    setJoining(true);
    try {
      const res = await fetch('/api/arena/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomCode: cleanCode }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to join room.');
      }

      // Navigate into the arena lobby with verified playerId
      router.push(`/dashboard/aptitude-arena?room=${cleanCode}&playerId=${data.playerId}`);
    } catch (err: any) {
      setErrorMessage(err.message || 'Unable to join the room. Please check the code.');
    } finally {
      setJoining(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-center items-center p-6 relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[30rem] h-[30rem] bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl relative z-10 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-600/30 mb-2">
            <Trophy className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white">Live Aptitude Arena</h1>
          <p className="text-xs text-slate-400">
            Real-Time Multiplayer Placement Competition · 5 Marks / Question
          </p>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="p-3.5 rounded-2xl bg-rose-950/50 border border-rose-800 text-rose-300 text-xs flex items-center gap-2.5 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Auth Check State */}
        {authLoading ? (
          <div className="py-8 text-center text-xs text-slate-400 space-y-2">
            <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p>Verifying candidate credentials...</p>
          </div>
        ) : !currentUser ? (
          /* Unauthenticated State: Require Google / Account Login */
          <div className="space-y-4 pt-2">
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2 text-center">
              <Lock className="w-6 h-6 text-indigo-400 mx-auto" />
              <h3 className="text-sm font-bold text-white">Google Authentication Required</h3>
              <p className="text-xs text-slate-400">
                To preserve verified scores, deterministic leaderboards, and competition fairness, all participants must authenticate.
              </p>
            </div>

            {/* Google Sign In Button */}
            <a
              href={`/api/auth/google?redirect=${encodeURIComponent(`/aptitude-arena/join?room=${roomCode}`)}`}
              className="w-full py-3.5 px-4 rounded-2xl bg-white hover:bg-slate-100 text-slate-900 font-extrabold text-xs flex items-center justify-center gap-2.5 shadow-xl transition-all"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Continue with Google</span>
            </a>

            {/* Quick Demo Sign-In for Fast Mobile Testing */}
            <button
              type="button"
              onClick={async () => {
                setAuthLoading(true);
                try {
                  const res = await fetch('/api/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: 'abhineet@interviewai.com', password: 'password123' }),
                  });
                  if (res.ok) {
                    const data = await res.json();
                    if (data.user) {
                      setCurrentUser(data.user);
                    }
                  }
                } catch (_) {}
                finally {
                  setAuthLoading(false);
                }
              }}
              className="w-full py-3 px-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all flex items-center justify-center gap-2 border border-slate-700/60"
            >
              <span>Instant Candidate Sign-In (Demo Testing)</span>
            </button>

            {/* Standard Login Option */}
            <div className="text-center text-xs text-slate-400">
              Already have an account?{' '}
              <Link
                href={`/login?redirect=${encodeURIComponent(`/aptitude-arena/join?room=${roomCode}`)}`}
                className="text-indigo-400 font-bold hover:underline"
              >
                Sign In with Email
              </Link>
            </div>
          </div>
        ) : (
          /* Authenticated State: Room Code Entry & Confirmation */
          <form onSubmit={handleJoin} className="space-y-4 pt-1">
            {/* Authenticated Candidate Badge */}
            <div className="p-3.5 rounded-2xl bg-indigo-950/40 border border-indigo-800/60 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white font-black flex items-center justify-center text-sm shadow">
                  {currentUser.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-white">{currentUser.name}</span>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  </div>
                  <span className="text-[11px] text-slate-400">{currentUser.email}</span>
                </div>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Verified
              </span>
            </div>

            {/* Room Code Input */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-indigo-400" />
                <span>6-Character Room Code</span>
              </label>
              <input
                type="text"
                maxLength={8}
                required
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                placeholder="e.g. APT824"
                className="w-full py-3.5 px-4 bg-slate-950 border border-slate-800 rounded-2xl text-center font-mono text-xl font-black text-indigo-300 tracking-widest placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 uppercase"
              />
            </div>

            {/* Join Action Button */}
            <button
              type="submit"
              disabled={joining || !roomCode.trim()}
              className="w-full py-3.5 px-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-sm shadow-xl shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              <span>{joining ? 'Connecting to Room...' : 'Join Competition Lobby'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* Security & Rules Footer */}
        <div className="pt-4 border-t border-slate-800/80 text-center space-y-2">
          <div className="flex items-center justify-center gap-4 text-[11px] text-slate-400">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
              10-Min Lobby
            </span>
            <span className="flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              +5 Marks / Question
            </span>
            <span className="flex items-center gap-1">
              <Flame className="w-3.5 h-3.5 text-amber-400" />
              Live Top 50
            </span>
          </div>
          <Link href="/dashboard" className="text-[11px] text-slate-500 hover:text-slate-300 block">
            Return to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function ArenaJoinPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white text-xs">
          Loading Arena Join...
        </div>
      }
    >
      <JoinContent />
    </Suspense>
  );
}
