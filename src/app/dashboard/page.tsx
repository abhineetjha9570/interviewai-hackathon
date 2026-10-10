'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  ArrowRight,
  Flame,
  Check,
  TrendingUp,
  FileText,
  Calendar,
  AlertTriangle,
  ChevronRight,
  Plus,
  Edit2,
  CheckCircle2,
  Clock,
  Target,
  FileQuestion,
  Video,
  Map,
  Trophy,
  Users
} from 'lucide-react';
import HeroCarousel from '@/components/dashboard/HeroCarousel';

export default function DashboardPage() {
  const [data, setData] = useState<any>(null);
  const [careerRoadmap, setCareerRoadmap] = useState<any>(null);
  const [arenaStats, setArenaStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
      try {
        const res = await fetch('/api/dashboard');
        const json = await res.json();
        setData(json);
      } catch (err) {
        console.error('Failed to load dashboard:', err);
      } finally {
        setLoading(false);
      }

      // Load saved roadmap if available
      try {
        const rRes = await fetch('/api/career-roadmap');
        const rJson = await rRes.json();
        if (rJson.roadmap) setCareerRoadmap(rJson.roadmap);
      } catch (_) {}

      // Load arena stats if available
      try {
        const aRes = await fetch('/api/arena/leaderboard');
        const aJson = await aRes.json();
        setArenaStats(aJson);
      } catch (_) {}
    }
    loadDashboard();
  }, []);

  const progress = data?.profile || {
    overallPrepPct: 72,
    aptitudeScore: 78,
    dsaScore: 65,
    technicalScore: 70,
    hrScore: 80,
    streakDays: 12,
  };

  const daysOfWeek = [
    { day: 'Mon', checked: true },
    { day: 'Tue', checked: true },
    { day: 'Wed', checked: true },
    { day: 'Thu', checked: true },
    { day: 'Fri', checked: true },
    { day: 'Sat', checked: true },
    { day: 'Sun', checked: false },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* 1. Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-50 via-indigo-50/60 to-purple-50 p-6 md:p-8 border border-indigo-100/80 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-1.5 z-10">
          <h2 className="text-2xl md:text-3xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
            <span>Welcome back, {data?.user?.name || 'Candidate'}!</span>
            <span>👋</span>
          </h2>
          <p className="text-slate-500 text-sm md:text-base font-normal">
            Targeting {data?.profile?.targetRole || 'Software Engineer'} · {data?.profile?.goal || 'Placement Preparation'} · Keep practicing to achieve dream offers.
          </p>
        </div>

        {/* Mountain illustration & tagline badge */}
        <div className="flex items-center gap-4 z-10 shrink-0">
          <div className="px-4 py-2 rounded-2xl bg-white/90 border border-indigo-100 shadow-sm backdrop-blur-md">
            <span className="text-xs font-bold text-indigo-700 italic">Practice Today. Get Hired Tomorrow.</span>
          </div>
        </div>

        {/* Decorative background gradients */}
        <div className="absolute right-0 top-0 bottom-0 w-80 bg-gradient-to-l from-indigo-200/30 to-transparent pointer-events-none" />
      </div>

      {/* 2. PREMIUM HERO CAROUSEL (Netflix/Streaming Style) */}
      <HeroCarousel />

      {/* 3. Main Dashboard Grid (Matches Screenshot 1) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Columns */}
        <div className="lg:col-span-2 space-y-8">
          {/* Your Progress Card */}
          <div className="p-6 md:p-7 rounded-3xl bg-white border border-slate-200/80 shadow-sm space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-800 text-lg">Your Progress</h3>
              <Link
                href="/analytics"
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 group"
              >
                <span>View Detailed Analytics</span>
                <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-8">
              {/* Circular Gauge */}
              <div className="relative w-36 h-36 shrink-0 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    stroke="#F1F5F9"
                    strokeWidth="10"
                    fill="transparent"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    stroke="#3B82F6"
                    strokeWidth="10"
                    strokeDasharray="251.2"
                    strokeDashoffset={251.2 * (1 - progress.overallPrepPct / 100)}
                    strokeLinecap="round"
                    fill="transparent"
                  />
                </svg>
                <div className="absolute flex flex-col items-center">
                  <span className="text-3xl font-extrabold text-slate-800">{progress.overallPrepPct}%</span>
                  <span className="text-[11px] font-semibold text-slate-400">Overall Preparation</span>
                </div>
              </div>

              {/* Progress Bars */}
              <div className="flex-1 w-full space-y-3.5">
                {[
                  { label: 'Aptitude', pct: progress.aptitudeScore, color: 'bg-blue-500' },
                  { label: 'DSA & Coding', pct: progress.dsaScore, color: 'bg-emerald-500' },
                  { label: 'Technical', pct: progress.technicalScore, color: 'bg-indigo-500' },
                  { label: 'HR / Behavioral', pct: progress.hrScore, color: 'bg-amber-500' },
                ].map((item, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-slate-600">{item.label}</span>
                      <span className="text-slate-800 font-bold">{item.pct}%</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${item.color} transition-all duration-500`}
                        style={{ width: `${item.pct}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 3 Metric Cards Row (Streak, ATS, Weak Areas) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {/* Practice Streak */}
            <div className="p-5 rounded-3xl bg-amber-50/50 border border-amber-200/60 shadow-sm space-y-3 flex flex-col justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-amber-100 text-amber-600">
                  <Flame className="w-5 h-5 fill-amber-500 text-amber-500" />
                </div>
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-amber-700">Practice Streak</h4>
                  <p className="text-xl font-extrabold text-slate-800">12 Days</p>
                </div>
              </div>
              <p className="text-xs text-slate-500">Keep it up! You're doing great.</p>
              <div className="flex items-center justify-between pt-1">
                {daysOfWeek.map((d, i) => (
                  <div key={i} className="flex flex-col items-center gap-1">
                    <span className="text-[10px] text-slate-400">{d.day}</span>
                    <div
                      className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                        d.checked
                          ? 'bg-emerald-500 text-white'
                          : 'bg-slate-200 text-slate-400'
                      }`}
                    >
                      {d.checked ? <Check className="w-3 h-3 stroke-[3]" /> : '+'}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Resume & ATS */}
            <div className="p-5 rounded-3xl bg-emerald-50/50 border border-emerald-200/60 shadow-sm space-y-3 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <div className="p-2 rounded-xl bg-emerald-100 text-emerald-600">
                  <FileText className="w-5 h-5 text-emerald-600" />
                </div>
                <div className="w-12 h-12 rounded-full border-4 border-emerald-500 flex items-center justify-center font-bold text-sm text-slate-800 bg-white">
                  78<span className="text-[9px] text-slate-400">/100</span>
                </div>
              </div>
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-800">Resume & ATS</h4>
                <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">
                  Check your resume score and get AI suggestions for better shortlisting.
                </p>
              </div>
              <Link
                href="/resume-ats"
                className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
              >
                <span>View Report</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Weak Areas */}
            <div className="p-5 rounded-3xl bg-rose-50/50 border border-rose-200/60 shadow-sm space-y-3 flex flex-col justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-rose-100 text-rose-600">
                  <AlertTriangle className="w-5 h-5 text-rose-600" />
                </div>
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-rose-800">Weak Areas</h4>
                  <p className="text-xs text-slate-500">Need more focus based on mocks.</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { name: 'Dynamic Programming', url: '/practice?category=DSA&topic=Dynamic%20Programming&problem=climbing-stairs&autoStart=true' },
                  { name: 'System Design', url: '/practice?category=Technical&topic=System%20Design%20Basics&autoStart=true' },
                  { name: 'DBMS', url: '/practice?category=Technical&topic=DBMS%20%26%20SQL&autoStart=true' },
                  { name: 'Graph', url: '/practice?category=DSA&topic=Graph&problem=number-of-islands&autoStart=true' },
                ].map((item, i) => (
                  <Link
                    key={i}
                    href={item.url}
                    className="px-2 py-0.5 rounded-lg bg-rose-100/80 hover:bg-rose-200 text-rose-700 text-[11px] font-semibold transition-colors"
                  >
                    {item.name}
                  </Link>
                ))}
              </div>
              <Link
                href="/weak-areas"
                className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 bg-white hover:bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-bold transition-all"
              >
                <span>Start Practicing</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Feature Modules: AI Career Roadmap, Live Aptitude Arena & GD Arena */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* AI Career Roadmap Card */}
            <div className="p-6 rounded-3xl bg-gradient-to-br from-indigo-50/70 via-white to-purple-50/40 border border-indigo-100 shadow-sm space-y-4 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="p-2.5 rounded-2xl bg-indigo-600 text-white shadow-md shadow-indigo-600/20">
                    <Map className="w-5 h-5" />
                  </div>
                  {careerRoadmap ? (
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200">
                      {careerRoadmap.progressPct}% Active
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-100 text-indigo-700">
                      Visual Graph
                    </span>
                  )}
                </div>
                <h4 className="font-extrabold text-slate-800 text-base">AI Career Roadmap</h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Turn your dream role into an actionable career plan.
                </p>
              </div>

              {careerRoadmap ? (
                <div className="space-y-3 pt-1">
                  <div className="p-3 rounded-2xl bg-white border border-slate-200/80 space-y-1.5 text-xs">
                    <p className="font-bold text-slate-800 truncate">{careerRoadmap.targetRole}</p>
                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span>{careerRoadmap.milestones?.filter((m: any) => m.status === 'COMPLETED').length || 0} Finished</span>
                      <span>{careerRoadmap.targetDuration}</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
                      <div className="h-full bg-indigo-600 rounded-full" style={{ width: `${careerRoadmap.progressPct}%` }} />
                    </div>
                  </div>
                  <Link
                    href="/dashboard/career-roadmap"
                    className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-600/30 flex items-center justify-center gap-1.5 transition-all"
                  >
                    <span>Continue Roadmap</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              ) : (
                <div className="pt-2">
                  <Link
                    href="/dashboard/career-roadmap"
                    className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-600/30 flex items-center justify-center gap-1.5 transition-all"
                  >
                    <span>Create Roadmap</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              )}
            </div>

            {/* Live Aptitude Arena Card */}
            <div className="p-6 rounded-3xl bg-gradient-to-br from-amber-50/70 via-white to-orange-50/40 border border-amber-100 shadow-sm space-y-4 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="p-2.5 rounded-2xl bg-amber-500 text-white shadow-md shadow-amber-500/20">
                    <Trophy className="w-5 h-5" />
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-amber-100 text-amber-800 border border-amber-200">
                    50-Player Live
                  </span>
                </div>
                <h4 className="font-extrabold text-slate-800 text-base">Live Aptitude Arena</h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Compete live. Think fast. Climb the leaderboard.
                </p>
              </div>

              <div className="space-y-2 pt-1">
                {arenaStats?.personalBest && (
                  <div className="p-2.5 rounded-xl bg-white border border-slate-200/80 text-[11px] flex items-center justify-between">
                    <span className="text-slate-500 font-medium">Personal Best:</span>
                    <strong className="text-amber-700 font-mono">{arenaStats.personalBest.totalScore} pts (Rank #{arenaStats.personalBest.rank})</strong>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-2">
                  <Link
                    href="/dashboard/aptitude-arena"
                    className="py-2.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-white font-bold text-xs shadow-md shadow-amber-500/30 flex items-center justify-center gap-1 transition-all"
                  >
                    <span>Host Room</span>
                  </Link>
                  <Link
                    href="/dashboard/aptitude-arena"
                    className="py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md flex items-center justify-center gap-1 transition-all"
                  >
                    <span>Join Room</span>
                  </Link>
                </div>
              </div>
            </div>

            {/* GD Arena Card */}
            <div className="p-6 rounded-3xl bg-gradient-to-br from-purple-50/70 via-white to-indigo-50/40 border border-purple-100 shadow-sm space-y-4 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="p-2.5 rounded-2xl bg-purple-600 text-white shadow-md shadow-purple-600/20">
                    <Users className="w-5 h-5" />
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-purple-100 text-purple-800 border border-purple-200">
                    Voice GD
                  </span>
                </div>
                <h4 className="font-extrabold text-slate-800 text-base">GD Arena</h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Practice with real people or challenge 4 AI participants.
                </p>
              </div>

              <div className="space-y-2 pt-1">
                <div className="grid grid-cols-2 gap-2">
                  <Link
                    href="/dashboard/gd-arena"
                    className="py-2.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-600/30 flex items-center justify-center gap-1 transition-all"
                  >
                    <span>Multiplayer</span>
                  </Link>
                  <Link
                    href="/dashboard/gd-arena"
                    className="py-2.5 px-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md shadow-purple-600/30 flex items-center justify-center gap-1 transition-all"
                  >
                    <span>AI Practice</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Performance Analytics Preview */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-800 text-base">Performance Analytics</h3>
                <p className="text-xs text-slate-400">Track your improvement curve over time</p>
              </div>
              <Link
                href="/analytics"
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
              >
                <span>View Analytics</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Sparkline / Bar Graph Simulation */}
            <div className="h-40 w-full flex items-end justify-between gap-4 pt-6 px-4">
              {[
                { week: 'Week 1', score: 54, height: '54%' },
                { week: 'Week 2', score: 62, height: '62%' },
                { week: 'Week 3', score: 68, height: '68%' },
                { week: 'Week 4', score: 76, height: '76%' },
              ].map((w, idx) => (
                <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                  <span className="text-xs font-bold text-indigo-600">{w.score}%</span>
                  <div className="w-full max-w-[48px] rounded-xl bg-indigo-50 border border-indigo-100 flex items-end p-1 h-28">
                    <div
                      className="w-full rounded-lg bg-gradient-to-t from-indigo-600 to-purple-500 transition-all duration-500"
                      style={{ height: w.height }}
                    />
                  </div>
                  <span className="text-[11px] font-semibold text-slate-400">{w.week}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-800 text-base">Recent Activity</h3>
              <span className="text-xs text-slate-400">Past 7 days</span>
            </div>
            <div className="space-y-3">
              {[
                {
                  icon: Target,
                  color: 'text-indigo-600 bg-indigo-50',
                  title: 'DSA Practice: Arrays (10 Questions)',
                  score: '82%',
                  time: '2 hours ago',
                  badge: 'bg-emerald-50 text-emerald-700',
                },
                {
                  icon: FileQuestion,
                  color: 'text-blue-600 bg-blue-50',
                  title: 'Mock Interview: Amazon - Technical',
                  score: '76%',
                  time: '1 day ago',
                  badge: 'bg-blue-50 text-blue-700',
                },
                {
                  icon: Video,
                  color: 'text-rose-600 bg-rose-50',
                  title: 'AI Avatar Interview: Full 100-Min Interview',
                  score: '78%',
                  time: '3 days ago',
                  badge: 'bg-purple-50 text-purple-700',
                },
                {
                  icon: FileText,
                  color: 'text-emerald-600 bg-emerald-50',
                  title: 'Resume Analysis: ATS Score Check',
                  score: '78/100',
                  time: '4 days ago',
                  badge: 'bg-emerald-50 text-emerald-700',
                },
              ].map((act, i) => {
                const Icon = act.icon;
                return (
                  <div
                    key={i}
                    className="p-3.5 rounded-2xl bg-slate-50/70 hover:bg-slate-50 border border-slate-200/60 flex items-center justify-between gap-4 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-xl ${act.color}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-800">{act.title}</p>
                        <p className="text-[11px] text-slate-400">{act.time}</p>
                      </div>
                    </div>
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${act.badge}`}>
                      {act.score}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right 1 Column (Profile Overview, Upcoming Sessions, Recommendations) */}
        <div className="space-y-8">
          {/* Profile Overview Card */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-800 text-base">Profile Overview</h3>
              <Link href="/profile" className="text-xs text-indigo-600 hover:text-indigo-700 flex items-center gap-1 font-semibold">
                <Edit2 className="w-3 h-3" />
                <span>Edit</span>
              </Link>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Goal</span>
                <span className="font-bold text-slate-800">Campus Placement</span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Experience</span>
                <span className="font-bold text-slate-800">Fresher</span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Target Role</span>
                <span className="font-bold text-slate-800">Software Engineer</span>
              </div>

              {/* Skills Tags */}
              <div className="pt-2">
                <span className="text-slate-500 block mb-2 font-medium">Skills</span>
                <div className="flex flex-wrap gap-1.5">
                  {['Java', 'Python', 'DSA', 'SQL', '+3'].map((skill, i) => (
                    <span
                      key={i}
                      className="px-2.5 py-1 rounded-xl bg-slate-100 text-slate-700 font-semibold text-[11px]"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              {/* Resume File */}
              <div className="pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-200/60">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-indigo-600" />
                    <span className="font-semibold text-slate-700 truncate max-w-[140px]">
                      Abhineet_Resume.pdf
                    </span>
                  </div>
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                </div>
              </div>

              {/* Job Description */}
              <div className="flex items-center justify-between py-1.5">
                <span className="text-slate-500">Job Description</span>
                <button className="text-indigo-600 hover:text-indigo-700 font-bold flex items-center gap-1">
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add JD</span>
                </button>
              </div>
            </div>
          </div>

          {/* Upcoming Sessions Card */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-800 text-base">Upcoming Sessions</h3>
              <span className="text-xs font-semibold text-indigo-600 cursor-pointer">View All</span>
            </div>

            <div className="space-y-3">
              {[
                {
                  day: '15',
                  month: 'Dec',
                  title: 'Mock Interview',
                  desc: 'Google - SDE',
                  time: '10:00 AM',
                  typeColor: 'text-blue-600 bg-blue-50',
                },
                {
                  day: '17',
                  month: 'Dec',
                  title: 'AI Avatar Interview',
                  desc: 'Full 100 Minutes',
                  time: '02:00 PM',
                  typeColor: 'text-rose-600 bg-rose-50',
                },
                {
                  day: '20',
                  month: 'Dec',
                  title: 'Practice Session',
                  desc: 'Graphs & DP',
                  time: '06:00 PM',
                  typeColor: 'text-indigo-600 bg-indigo-50',
                },
              ].map((ses, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-2xl border border-slate-200/70 hover:border-slate-300 flex items-center justify-between gap-3 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-slate-100 flex flex-col items-center justify-center text-center shrink-0">
                      <span className="text-xs font-extrabold text-slate-800 leading-none">{ses.day}</span>
                      <span className="text-[10px] font-bold text-slate-400 uppercase leading-none mt-0.5">{ses.month}</span>
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-800">{ses.title}</h4>
                      <p className="text-[11px] text-slate-500">{ses.desc}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      {ses.time}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recommended For You Card */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-800 text-base">Recommended For You</h3>
              <Link href="/recommended-path" className="text-xs font-semibold text-indigo-600 hover:text-indigo-700">
                View All
              </Link>
            </div>

            <div className="space-y-3">
              {[
                {
                  title: 'Practice 10 Graph questions',
                  reason: 'Based on your recent mock performance',
                  href: '/practice?category=DSA&topic=Graph&problem=number-of-islands&autoStart=true',
                  color: 'border-l-4 border-l-rose-500',
                },
                {
                  title: 'Revise System Design Basics',
                  reason: 'Improve design concepts for better score',
                  href: '/practice?category=Technical&topic=System%20Design%20Basics&autoStart=true',
                  color: 'border-l-4 border-l-blue-500',
                },
                {
                  title: 'Improve Communication (STAR)',
                  reason: 'Practice STAR method for behavioral questions',
                  href: '/practice?category=HR&topic=Behavioral%20(STAR%20Method)&autoStart=true',
                  color: 'border-l-4 border-l-amber-500',
                },
              ].map((rec, i) => (
                <Link
                  key={i}
                  href={rec.href}
                  className={`block p-3.5 rounded-2xl bg-slate-50 hover:bg-slate-100/80 border border-slate-200/60 ${rec.color} transition-all group`}
                >
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">
                      {rec.title}
                    </p>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">{rec.reason}</p>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
