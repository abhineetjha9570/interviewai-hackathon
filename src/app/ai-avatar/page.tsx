'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  Video,
  Sparkles,
  ArrowRight,
  Clock,
  Mic,
  MicOff,
  Camera,
  CheckCircle2,
  AlertTriangle,
  Play,
  RotateCcw,
  Send,
  Download,
  Share2,
  ChevronRight,
  Volume2,
  Award,
  Layers,
  Code2,
  Briefcase,
  HelpCircle,
  FileCheck2,
  Loader2,
  ShieldCheck,
  ShieldAlert,
  Smartphone,
  Users,
  Copy,
  Eye,
  Maximize2
} from 'lucide-react';
import AvatarVisualizer, { AvatarState, personas } from '@/components/avatar/AvatarVisualizer';
import MonacoEditorPanel, { ProblemData } from '@/components/code-editor/MonacoEditorPanel';
import SecureProctoringSuite from '@/components/proctoring/SecureProctoringSuite';
import PreInterviewSecurityGate from '@/components/proctoring/PreInterviewSecurityGate';
import { speakQuestion, stopSpeech, LiveSpeechRecognizer } from '@/lib/speech-service';

type SimulationStep =
  | 'CONFIG'
  | 'INSTRUCTIONS'
  | 'PRE_CHECK'
  | 'ROUND_1_HR'
  | 'TRANSITION_1_2'
  | 'ROUND_2_CODING'
  | 'TRANSITION_2_3'
  | 'ROUND_3_MANAGERIAL'
  | 'TRANSITION_3_4'
  | 'ROUND_4_NEGOTIATION'
  | 'COMPLETED_GENERATING'
  | 'REPORT';

function evaluateTextAnswer(text: string, keywords: string[]): number {
  if (!text || text.trim().length === 0) return 40;
  const words = text.trim().split(/\s+/).length;
  let score = 55;
  if (words >= 35) score += 20;
  else if (words >= 15) score += 12;
  else if (words >= 5) score += 5;

  const lower = text.toLowerCase();
  let matches = 0;
  keywords.forEach(kw => {
    if (lower.includes(kw.toLowerCase())) matches++;
  });
  score += Math.min(25, matches * 5);
  return Math.min(98, Math.max(35, score));
}

export default function AiAvatarPage() {
  const [step, setStep] = useState<SimulationStep>('CONFIG');
  const [targetCompany, setTargetCompany] = useState('Google');
  const [targetRole, setTargetRole] = useState('Software Engineer');
  const [experienceLevel, setExperienceLevel] = useState('Fresher');
  const [selectedPersona, setSelectedPersona] = useState('Sarah');
  const [jobDescription, setJobDescription] = useState('');
  const [interviewId, setInterviewId] = useState<string | null>(null);
  const [proctorStream, setProctorStream] = useState<MediaStream | null>(null);

  // Dynamic Round Scores
  const [roundScores, setRoundScores] = useState({
    hr: 82,
    coding: 78,
    technical: 76,
    negotiation: 84,
  });

  const overallScore = Math.round(
    roundScores.hr * 0.15 +
    roundScores.coding * 0.50 +
    roundScores.technical * 0.25 +
    roundScores.negotiation * 0.10
  );

  const recognizerRef = useRef<LiveSpeechRecognizer | null>(null);

  // Comprehensive Anti-Cheat & Proctoring telemetry stats
  const [proctoringStats, setProctoringStats] = useState({
    integrityScore: 100,
    riskLevel: 'LOW' as 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL',
    totalEvents: 0,
    tabSwitches: 0,
    windowBlurs: 0,
    fullscreenExits: 0,
    faceMissingCount: 0,
    multipleFacesCount: 0,
    lookingAwayCount: 0,
    phoneDetectedCount: 0,
    copyAttempts: 0,
    pasteAttempts: 0,
    secondaryAudioCount: 0,
    events: [] as any[],
  });

  // Pre-check state
  const [cameraChecked, setCameraChecked] = useState(false);
  const [micChecked, setMicChecked] = useState(false);
  const [aiReadyChecked, setAiReadyChecked] = useState(false);

  // Timers:
  // Round 1: 15 mins (900s)
  // Round 2: 50 mins (3000s)
  // Round 3: 25 mins (1500s)
  // Round 4: 10 mins (600s)
  const [round1Seconds, setRound1Seconds] = useState(15 * 60);
  const [round2Seconds, setRound2Seconds] = useState(50 * 60);
  const [round3Seconds, setRound3Seconds] = useState(25 * 60);
  const [round4Seconds, setRound4Seconds] = useState(10 * 60);

  // Active Dialogue State
  const [candidateInput, setCandidateInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [avatarState, setAvatarState] = useState<AvatarState>('IDLE');
  const [currentSpeechText, setCurrentSpeechText] = useState('');
  const [conversationList, setConversationList] = useState<Array<{ sender: 'AI' | 'USER'; text: string }>>([]);
  const [responseMode, setResponseMode] = useState<'SPEAK' | 'TYPE'>('SPEAK');

  // Report generation progress
  const [reportProgress, setReportProgress] = useState(0);

  // Coding Round 2 Problem (Clean starter template with empty stub)
  const round2Problem: ProblemData = {
    id: 'avatar-p1',
    title: 'Two Sum',
    slug: 'two-sum',
    difficulty: 'Medium',
    tags: ['Array', 'Hash Map'],
    description: 'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.\n\nYou may assume that each input would have exactly one solution, and you may not use the same element twice.\n\nFirst, can you explain your approach before coding, then submit your optimal solution below.',
    examples: [
      { input: 'nums = [2,7,11,15], target = 9', output: '[0,1]', explanation: 'Because nums[0] + nums[1] == 9, we return [0, 1].' },
      { input: 'nums = [3,2,4], target = 6', output: '[1,2]', explanation: 'nums[1] + nums[2] == 6.' }
    ],
    constraints: ['2 <= nums.length <= 10^4', '-10^9 <= nums[i] <= 10^9', 'Only one valid answer exists.'],
    hints: ['Can you use a HashMap to achieve an O(N) single-pass lookup?'],
    explanation: 'We iterate through nums while mapping complements (target - nums[i]) to their indices.',
    starterCodeJava: `import java.util.*;\n\nclass Solution {\n    public int[] twoSum(int[] nums, int target) {\n        // Write your code here\n        \n        return new int[]{};\n    }\n}`,
  };

  const formatTimer = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // Live Speech Recognizer & speech stop on unmount
  useEffect(() => {
    recognizerRef.current = new LiveSpeechRecognizer(
      (liveText) => {
        setCandidateInput(liveText);
      },
      (err) => {
        console.warn('Speech recognition notice:', err);
        setIsRecording(false);
      },
      () => {
        setIsRecording(false);
      }
    );

    return () => {
      stopSpeech();
      recognizerRef.current?.stop();
    };
  }, []);

  // Timer countdown hooks per active round
  useEffect(() => {
    let interval: any;
    if (step === 'ROUND_1_HR') {
      interval = setInterval(() => setRound1Seconds(s => (s > 0 ? s - 1 : 0)), 1000);
    } else if (step === 'ROUND_2_CODING') {
      interval = setInterval(() => setRound2Seconds(s => (s > 0 ? s - 1 : 0)), 1000);
    } else if (step === 'ROUND_3_MANAGERIAL') {
      interval = setInterval(() => setRound3Seconds(s => (s > 0 ? s - 1 : 0)), 1000);
    } else if (step === 'ROUND_4_NEGOTIATION') {
      interval = setInterval(() => setRound4Seconds(s => (s > 0 ? s - 1 : 0)), 1000);
    }
    return () => clearInterval(interval);
  }, [step]);

  // Handle Starting Pre-Check
  const handleStartPreCheck = async () => {
    setStep('PRE_CHECK');
    setTimeout(() => setCameraChecked(true), 600);
    setTimeout(() => setMicChecked(true), 1200);
    setTimeout(() => setAiReadyChecked(true), 1800);

    try {
      const res = await fetch('/api/avatar/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company: targetCompany,
          role: targetRole,
          experienceLevel,
          interviewerPersona: selectedPersona,
          durationMinutes: 100,
        }),
      });
      const data = await res.json();
      if (data.interviewId) {
        setInterviewId(data.interviewId);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Start Round 1
  const startRound1 = () => {
    setStep('ROUND_1_HR');
    const greeting = `Hi Abhineet! Welcome to your 100-minute AI Avatar interview for the ${targetRole} position at ${targetCompany}. Let's begin with a brief introduction. Could you tell me about yourself and your journey in software engineering?`;
    setCurrentSpeechText(greeting);
    setCandidateInput('');
    setConversationList([{ sender: 'AI', text: greeting }]);
    speakQuestion(
      greeting,
      'female',
      () => setAvatarState('SPEAKING'),
      () => setAvatarState('IDLE')
    );
  };

  const handleReplaySpeech = (personaGender: 'female' | 'male' = 'female') => {
    if (currentSpeechText) {
      speakQuestion(
        currentSpeechText,
        personaGender,
        () => setAvatarState('SPEAKING'),
        () => setAvatarState('IDLE')
      );
    }
  };

  // Turn submission helper for conversational rounds (R1, R3, R4)
  const submitMessage = async (roundNum: number, overrideMsg?: string) => {
    const msg = overrideMsg || candidateInput;
    if (!msg.trim()) return;

    // Immediately stop ongoing audio & speech recognition
    stopSpeech();
    recognizerRef.current?.stop();
    setIsRecording(false);

    setConversationList(prev => [...prev, { sender: 'USER', text: msg }]);
    setCandidateInput('');
    setAvatarState('THINKING');

    // Dynamic scoring based on candidate input
    if (roundNum === 1) {
      const score = evaluateTextAnswer(msg, ['software', 'experience', 'projects', 'algorithms', 'engineering', 'backend', 'learning']);
      setRoundScores(prev => ({ ...prev, hr: score }));
    } else if (roundNum === 3) {
      const score = evaluateTextAnswer(msg, ['normalization', 'denormalization', 'database', 'performance', 'indexing', 'read', 'write', 'joins']);
      setRoundScores(prev => ({ ...prev, technical: score }));
    } else if (roundNum === 4) {
      const score = evaluateTextAnswer(msg, ['market', 'benchmark', 'skills', 'expectations', 'value', 'compensation', 'package', 'growth']);
      setRoundScores(prev => ({ ...prev, negotiation: score }));
    }

    try {
      const res = await fetch('/api/avatar/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          interviewId,
          roundNumber: roundNum,
          candidateMessage: msg,
        }),
      });
      const data = await res.json();

      setTimeout(() => {
        setConversationList(prev => [...prev, { sender: 'AI', text: data.aiResponse }]);
        setCurrentSpeechText(data.aiResponse);
        const personaGender = roundNum === 3 ? 'male' : 'female';
        speakQuestion(
          data.aiResponse,
          personaGender,
          () => setAvatarState('SPEAKING'),
          () => setAvatarState('IDLE')
        );

        if (data.isRoundComplete) {
          if (roundNum === 1) setTimeout(() => { stopSpeech(); setStep('TRANSITION_1_2'); }, 2500);
          if (roundNum === 3) setTimeout(() => { stopSpeech(); setStep('TRANSITION_3_4'); }, 2500);
          if (roundNum === 4) setTimeout(() => { stopSpeech(); finishInterview(); }, 2500);
        }
      }, 1000);
    } catch (e) {
      console.error(e);
      setAvatarState('IDLE');
    }
  };

  // Complete Interview & Generate Report
  const finishInterview = () => {
    stopSpeech();
    recognizerRef.current?.stop();
    setIsRecording(false);
    setStep('COMPLETED_GENERATING');
    let p = 0;
    const interval = setInterval(() => {
      p += 15;
      if (p >= 100) {
        clearInterval(interval);
        setReportProgress(100);
        setTimeout(() => setStep('REPORT'), 800);
      } else {
        setReportProgress(p);
      }
    }, 300);
  };

  // Web Speech API Voice Recording with live streaming
  const toggleRecording = (roundNum: number) => {
    if (isRecording) {
      recognizerRef.current?.stop();
      setIsRecording(false);
      setAvatarState('IDLE');
    } else {
      stopSpeech();
      const started = recognizerRef.current?.start(candidateInput);
      setIsRecording(true);
      setAvatarState('LISTENING');
      if (!started) {
        console.info('Speech recognition inactive; manual typing available.');
      }
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Real-Time Enterprise Anti-Cheat & Proctoring Engine (Active during all 4 rounds) */}
      {[
        'ROUND_1_HR',
        'ROUND_2_CODING',
        'ROUND_3_MANAGERIAL',
        'ROUND_4_NEGOTIATION',
      ].includes(step) && (
        <SecureProctoringSuite
          interviewId={interviewId || 'ai-session'}
          isActive={true}
          initialStream={proctorStream}
          showCameraHUD={true}
          onStatsUpdate={(stats) => setProctoringStats(stats)}
          onSessionTerminated={() => setStep('REPORT')}
        />
      )}

      {/* Top Header & Breadcrumb */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Link href="/" className="hover:text-indigo-600 transition-colors">
            Dashboard
          </Link>
          <ChevronRight className="w-4 h-4" />
          <span className="font-semibold text-slate-800">AI Avatar Interview</span>
          <span className="ml-2 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-600 border border-rose-200">
            100 Minutes (4 Rounds)
          </span>
        </div>
      </div>

      {/* 1. CONFIGURATION STEP */}
      {step === 'CONFIG' && (
        <div className="max-w-4xl mx-auto p-8 rounded-3xl bg-white border border-slate-200/80 shadow-sm space-y-8">
          <div>
            <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight">
              AI Avatar Interview Configuration
            </h2>
            <p className="text-slate-500 text-sm mt-1">
              Customize your multi-round AI placement simulation based on target company, role, and interviewer persona.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Target Company</label>
              <div className="flex flex-wrap gap-2">
                {['General', 'Google', 'Amazon', 'Microsoft', 'Adobe', 'Other'].map((comp) => (
                  <button
                    key={comp}
                    onClick={() => setTargetCompany(comp)}
                    className={`py-2 px-3.5 rounded-xl text-xs font-bold border transition-all ${
                      targetCompany === comp
                        ? 'bg-rose-600 text-white border-rose-600 shadow-md shadow-rose-600/30'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                    }`}
                  >
                    {comp}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Target Role</label>
              <select
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                className="w-full py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-700"
              >
                <option>Software Engineer</option>
                <option>Backend Developer</option>
                <option>Full Stack Developer</option>
                <option>Systems Architect</option>
              </select>
            </div>
          </div>

          {/* Interview Duration Banner (Strict 100 Minutes per spec) */}
          <div className="p-5 rounded-2xl bg-rose-50/60 border border-rose-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-rose-600 text-white">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-rose-950">100-Minute Comprehensive Interview</h4>
                <p className="text-xs text-rose-700">Exact 4 Rounds: HR (15m) → Coding (50m) → Managerial & Core CS (25m) → Negotiation (10m)</p>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-white text-rose-700 border border-rose-200 shadow-sm">
              Recommended
            </span>
          </div>

          {/* AI Interviewer Persona Selector */}
          <div className="space-y-3">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Select AI Interviewer Persona</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {personas.map((p) => (
                <div
                  key={p.name}
                  onClick={() => setSelectedPersona(p.name)}
                  className={`p-4 rounded-2xl border text-center cursor-pointer transition-all ${
                    selectedPersona === p.name
                      ? 'bg-rose-50/60 border-rose-500 shadow-md ring-2 ring-rose-500/20'
                      : 'bg-slate-50 hover:bg-slate-100 border-slate-200'
                  }`}
                >
                  <div className="w-16 h-16 rounded-full overflow-hidden mx-auto mb-2 border-2 border-white shadow-md">
                    <img src={p.avatarUrl} alt={p.name} className="w-full h-full object-cover" />
                  </div>
                  <p className="text-xs font-bold text-slate-800">{p.name}</p>
                  <p className="text-[10px] text-slate-500 line-clamp-1">{p.role}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Job Description (Optional) */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Job Description Context (Optional)</label>
            <textarea
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste the target job description to customize interview topics..."
              rows={3}
              className="w-full p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
            />
          </div>

          <button
            onClick={() => setStep('INSTRUCTIONS')}
            className="w-full py-3.5 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-sm shadow-xl shadow-rose-600/30 flex items-center justify-center gap-2 transition-all"
          >
            <span>Proceed to Instructions</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 2. INSTRUCTIONS STEP */}
      {step === 'INSTRUCTIONS' && (
        <div className="max-w-2xl mx-auto p-8 rounded-3xl bg-white border border-slate-200/80 shadow-sm space-y-6">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-rose-600 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-100">
              Session Rules
            </span>
            <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight mt-2">
              Interview Instructions
            </h2>
            <p className="text-xs text-slate-500">
              Please read the round breakdown and proctoring rules carefully.
            </p>
          </div>

          {/* Exactly 4 Rounds Breakdown */}
          <div className="space-y-2 text-xs">
            <p className="font-bold text-slate-800 uppercase tracking-wider">Interview Rounds (100 Minutes Total)</p>
            <div className="space-y-2">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex justify-between items-center">
                <div>
                  <span className="font-bold text-slate-800">Round 1: HR & Behavioral</span>
                  <p className="text-[11px] text-slate-500">Introduction, resume project probing, STAR questions</p>
                </div>
                <span className="font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded">15 Minutes (Avatar: YES)</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex justify-between items-center">
                <div>
                  <span className="font-bold text-slate-800">Round 2: Coding & DSA</span>
                  <p className="text-[11px] text-slate-500">Monaco Editor LeetCode problem, live execution & test cases</p>
                </div>
                <span className="font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">50 Minutes (Avatar: NO)</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex justify-between items-center">
                <div>
                  <span className="font-bold text-slate-800">Round 3: Technical + System Design + Managerial</span>
                  <p className="text-[11px] text-slate-500">DBMS normal forms, OS, distributed systems, team conflict</p>
                </div>
                <span className="font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded">25 Minutes (Avatar: YES)</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex justify-between items-center">
                <div>
                  <span className="font-bold text-slate-800">Round 4: Negotiation & HR</span>
                  <p className="text-[11px] text-slate-500">Salary package negotiation, compensation, career goals</p>
                </div>
                <span className="font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded">10 Minutes (Avatar: YES)</span>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200 text-xs text-amber-900 space-y-1">
            <p className="font-bold flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              Proctoring Enabled:
            </p>
            <p className="text-slate-600">
              Do not switch tabs or exit fullscreen. The AI tracks integrity score and terminates after repeated violations.
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={() => setStep('CONFIG')}
              className="py-3 px-5 rounded-2xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold text-xs"
            >
              Back
            </button>
            <button
              onClick={handleStartPreCheck}
              className="flex-1 py-3.5 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-sm shadow-xl shadow-rose-600/30 flex items-center justify-center gap-2 transition-all"
            >
              <span>Pre-Interview Check</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* 3. MANDATORY PRE-INTERVIEW BIOMETRIC & SECURITY GATE */}
      {step === 'PRE_CHECK' && (
        <PreInterviewSecurityGate
          sessionTitle="100-Minute AI Avatar Simulation"
          company={targetCompany}
          role={targetRole}
          onSecurityPassed={(stream) => {
            setProctorStream(stream);
            startRound1();
          }}
          onCancel={() => setStep('INSTRUCTIONS')}
        />
      )}

      {/* 4. ROUND 1: HR / BEHAVIORAL (15 MINUTES - AVATAR = YES) */}
      {step === 'ROUND_1_HR' && (
        <div className="space-y-5 animate-in fade-in duration-200">
          {/* Top Bar with Round Indicator & 15-Minute Countdown */}
          <div className="p-4 rounded-3xl bg-white border border-slate-200 shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-xl text-xs font-bold bg-rose-600 text-white shadow-sm">
                Round 1 of 4: HR / Behavioral
              </span>
              <span className="text-xs text-slate-500 hidden sm:inline">15 Minutes Allocation</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="px-3 py-1.5 rounded-xl bg-slate-100 font-mono text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-rose-600" />
                <span>{formatTimer(round1Seconds)}</span>
              </div>
              <button
                onClick={() => setStep('TRANSITION_1_2')}
                className="px-3 py-1.5 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200 text-xs font-bold"
              >
                End Round
              </button>
            </div>
          </div>

          {/* Conversational Screen */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center max-w-5xl mx-auto p-8 rounded-3xl bg-white border border-slate-200 shadow-sm">
            <div className="lg:col-span-5 flex justify-center">
              <AvatarVisualizer
                state={avatarState}
                personaName={selectedPersona}
                currentSpeechText={currentSpeechText}
                onSpeechEnd={() => setAvatarState('IDLE')}
              />
            </div>

            <div className="lg:col-span-7 space-y-6">
              {/* Dialogue Transcript */}
              <div className="max-h-60 overflow-y-auto space-y-3 p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <span className="text-xs font-bold text-slate-700">Interview Dialogue</span>
                  <button
                    onClick={() => handleReplaySpeech('female')}
                    className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold border border-rose-200 transition-colors cursor-pointer"
                    title="Replay Sarah's spoken question"
                  >
                    <Volume2 className="w-3.5 h-3.5 text-rose-600" />
                    <span>Replay Question</span>
                  </button>
                </div>
                {conversationList.map((msg, i) => (
                  <div
                    key={i}
                    className={`p-3 rounded-2xl text-xs leading-relaxed ${
                      msg.sender === 'AI'
                        ? 'bg-white border border-slate-200 text-slate-800'
                        : 'bg-rose-600 text-white ml-6 shadow-sm'
                    }`}
                  >
                    <span className="font-bold block text-[10px] mb-1 opacity-80">
                      {msg.sender === 'AI' ? `AI Interviewer (${selectedPersona})` : 'You'}
                    </span>
                    {msg.text}
                  </div>
                ))}
              </div>

              {/* Input Response Controls */}
              <div className="p-5 rounded-2xl bg-rose-50/40 border border-rose-100 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-rose-800">
                    {isRecording ? 'Listening...' : 'Your Answer (Speak or Type)'}
                  </span>
                  <button
                    onClick={() => toggleRecording(1)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                      isRecording
                        ? 'bg-rose-600 text-white animate-pulse shadow-md shadow-rose-600/30'
                        : 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    }`}
                  >
                    {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                    <span>{isRecording ? 'Stop Recording' : 'Start Speaking'}</span>
                  </button>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={candidateInput}
                    onChange={(e) => setCandidateInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && submitMessage(1)}
                    placeholder="Type your response or use voice input..."
                    className="flex-1 p-3 rounded-xl bg-white border border-slate-200 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                  />
                  <button
                    onClick={() => submitMessage(1)}
                    className="p-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white shadow-md"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. TRANSITION ROUND 1 -> ROUND 2 */}
      {step === 'TRANSITION_1_2' && (
        <div className="max-w-md mx-auto p-8 rounded-3xl bg-white border border-slate-200 text-center space-y-5 animate-in fade-in duration-200">
          <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-md">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <div>
            <h3 className="font-extrabold text-xl text-slate-800">Round 1 Completed!</h3>
            <p className="text-xs text-slate-500 mt-1">HR & Behavioral Score: <strong className="text-emerald-600 font-bold">{roundScores.hr}/100</strong></p>
          </div>
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600 text-left">
            <p className="font-bold text-slate-800 mb-1">Up Next: Round 2 — Coding & DSA</p>
            <p>• 50 Minutes duration</p>
            <p>• <strong>NO AVATAR</strong> (Assessment format per spec)</p>
            <p>• Real Java code compiler & automated test cases</p>
          </div>
          <button
            onClick={() => {
              stopSpeech();
              setStep('ROUND_2_CODING');
            }}
            className="w-full py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-xl shadow-indigo-600/30 flex items-center justify-center gap-2"
          >
            <span>Begin Round 2 (Coding & DSA)</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 6. ROUND 2: CODING & DSA (50 MINUTES - AVATAR = NO!) */}
      {step === 'ROUND_2_CODING' && (
        <div className="space-y-5 animate-in fade-in duration-200">
          <div className="p-4 rounded-3xl bg-white border border-slate-200 shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 rounded-xl text-xs font-bold bg-indigo-600 text-white shadow-sm">
                Round 2 of 4: Coding & DSA
              </span>
              <span className="text-xs text-slate-500 hidden sm:inline">Avatar Inactive (Exam Mode)</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="px-3 py-1.5 rounded-xl bg-slate-100 font-mono text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-indigo-600" />
                <span>{formatTimer(round2Seconds)}</span>
              </div>
              <button
                onClick={() => setStep('TRANSITION_2_3')}
                className="px-3 py-1.5 rounded-xl bg-indigo-50 text-indigo-600 hover:bg-indigo-100 border border-indigo-200 text-xs font-bold"
              >
                Submit Round
              </button>
            </div>
          </div>

          {/* Monaco Coding Platform */}
          <div className="h-[680px]">
            <MonacoEditorPanel
              problem={round2Problem}
              onSuccess={(passed, total) => {
                const score = Math.round(((passed || 0) / Math.max(1, total || 1)) * 100);
                setRoundScores(prev => ({ ...prev, coding: score }));
                setTimeout(() => setStep('TRANSITION_2_3'), 1500);
              }}
              onNext={() => setStep('TRANSITION_2_3')}
              isInterviewMode={true}
            />
          </div>
        </div>
      )}

      {/* 7. TRANSITION ROUND 2 -> ROUND 3 */}
      {step === 'TRANSITION_2_3' && (
        <div className="max-w-md mx-auto p-8 rounded-3xl bg-white border border-slate-200 text-center space-y-5 animate-in fade-in duration-200">
          <div className="w-16 h-16 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center mx-auto shadow-md">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <div>
            <h3 className="font-extrabold text-xl text-slate-800">Round 2 Completed!</h3>
            <p className="text-xs text-slate-500 mt-1">Coding & DSA Score: <strong className="text-indigo-600 font-bold">{roundScores.coding}/100</strong></p>
          </div>
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600 text-left">
            <p className="font-bold text-slate-800 mb-1">Up Next: Round 3 — Managerial & Systems</p>
            <p>• 25 Minutes duration</p>
            <p>• <strong>Avatar Reconnects (David)</strong></p>
            <p>• DBMS, Operating Systems, System Design, and Leadership</p>
          </div>
          <button
            onClick={() => {
              setStep('ROUND_3_MANAGERIAL');
              const q = "Welcome to Round 3, Abhineet. I'm David, Senior Engineering Manager. Let's discuss core systems: What is normalization in DBMS, and in what practical scenarios would you deliberately choose to denormalize your database?";
              setCurrentSpeechText(q);
              setCandidateInput('');
              setConversationList([{ sender: 'AI', text: q }]);
              speakQuestion(q, 'male', () => setAvatarState('SPEAKING'), () => setAvatarState('IDLE'));
            }}
            className="w-full py-3.5 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-sm shadow-xl shadow-rose-600/30 flex items-center justify-center gap-2"
          >
            <span>Begin Round 3 (Managerial & Core CS)</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 8. ROUND 3: MANAGERIAL + CORE CS + SYSTEM DESIGN (25 MINUTES - AVATAR = YES) */}
      {step === 'ROUND_3_MANAGERIAL' && (
        <div className="space-y-5 animate-in fade-in duration-200">
          <div className="p-4 rounded-3xl bg-white border border-slate-200 shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-xl text-xs font-bold bg-rose-600 text-white shadow-sm">
                Round 3 of 4: Managerial & Core CS
              </span>
              <span className="text-xs text-slate-500 hidden sm:inline">25 Minutes Allocation</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="px-3 py-1.5 rounded-xl bg-slate-100 font-mono text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-rose-600" />
                <span>{formatTimer(round3Seconds)}</span>
              </div>
              <button
                onClick={() => setStep('TRANSITION_3_4')}
                className="px-3 py-1.5 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200 text-xs font-bold"
              >
                End Round
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center max-w-5xl mx-auto p-8 rounded-3xl bg-white border border-slate-200 shadow-sm">
            <div className="lg:col-span-5 flex justify-center">
              <AvatarVisualizer
                state={avatarState}
                personaName="David"
                currentSpeechText={currentSpeechText}
                onSpeechEnd={() => setAvatarState('IDLE')}
              />
            </div>

            <div className="lg:col-span-7 space-y-6">
              <div className="max-h-60 overflow-y-auto space-y-3 p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <span className="text-xs font-bold text-slate-700">Interview Dialogue (David)</span>
                  <button
                    onClick={() => handleReplaySpeech('male')}
                    className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold border border-blue-200 transition-colors cursor-pointer"
                    title="Replay David's question"
                  >
                    <Volume2 className="w-3.5 h-3.5 text-blue-600" />
                    <span>Replay Question</span>
                  </button>
                </div>
                {conversationList.map((msg, i) => (
                  <div
                    key={i}
                    className={`p-3 rounded-2xl text-xs leading-relaxed ${
                      msg.sender === 'AI'
                        ? 'bg-white border border-slate-200 text-slate-800'
                        : 'bg-rose-600 text-white ml-6 shadow-sm'
                    }`}
                  >
                    <span className="font-bold block text-[10px] mb-1 opacity-80">
                      {msg.sender === 'AI' ? 'David (Engineering Director)' : 'You'}
                    </span>
                    {msg.text}
                  </div>
                ))}
              </div>

              <div className="p-5 rounded-2xl bg-rose-50/40 border border-rose-100 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-rose-800">
                    Your Response
                  </span>
                  <button
                    onClick={() => toggleRecording(3)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                      isRecording
                        ? 'bg-rose-600 text-white animate-pulse'
                        : 'bg-indigo-600 text-white'
                    }`}
                  >
                    {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                    <span>{isRecording ? 'Stop Recording' : 'Speak'}</span>
                  </button>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={candidateInput}
                    onChange={(e) => setCandidateInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && submitMessage(3)}
                    placeholder="Type technical reasoning or system architecture..."
                    className="flex-1 p-3 rounded-xl bg-white border border-slate-200 text-xs text-slate-700"
                  />
                  <button
                    onClick={() => submitMessage(3)}
                    className="p-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white shadow-md"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 9. TRANSITION ROUND 3 -> ROUND 4 */}
      {step === 'TRANSITION_3_4' && (
        <div className="max-w-md mx-auto p-8 rounded-3xl bg-white border border-slate-200 text-center space-y-5 animate-in fade-in duration-200">
          <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-md">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <div>
            <h3 className="font-extrabold text-xl text-slate-800">Round 3 Completed!</h3>
            <p className="text-xs text-slate-500 mt-1">Technical & Systems Score: <strong className="text-emerald-600 font-bold">{roundScores.technical}/100</strong></p>
          </div>
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600 text-left">
            <p className="font-bold text-slate-800 mb-1">Final Round: Negotiation & HR</p>
            <p>• 10 Minutes duration</p>
            <p>• Salary compensation negotiation & counter-offers</p>
            <p>• Joining timeline and long-term trajectory</p>
          </div>
          <button
            onClick={() => {
              setStep('ROUND_4_NEGOTIATION');
              const q = "Congratulations on making it to the final round, Abhineet. In this round, we discuss compensation expectations and joining logistics. What are your salary package expectations for this role?";
              setCurrentSpeechText(q);
              setCandidateInput('');
              setConversationList([{ sender: 'AI', text: q }]);
              speakQuestion(q, 'female', () => setAvatarState('SPEAKING'), () => setAvatarState('IDLE'));
            }}
            className="w-full py-3.5 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-sm shadow-xl shadow-rose-600/30 flex items-center justify-center gap-2"
          >
            <span>Begin Final Round (Negotiation & HR)</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 10. ROUND 4: NEGOTIATION + HR (10 MINUTES - AVATAR = YES) */}
      {step === 'ROUND_4_NEGOTIATION' && (
        <div className="space-y-5 animate-in fade-in duration-200">
          <div className="p-4 rounded-3xl bg-white border border-slate-200 shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-xl text-xs font-bold bg-rose-600 text-white shadow-sm">
                Round 4 of 4: Negotiation & HR
              </span>
              <span className="text-xs text-slate-500 hidden sm:inline">10 Minutes Allocation</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="px-3 py-1.5 rounded-xl bg-slate-100 font-mono text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-rose-600" />
                <span>{formatTimer(round4Seconds)}</span>
              </div>
              <button
                onClick={finishInterview}
                className="px-3 py-1.5 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200 text-xs font-bold"
              >
                Complete Interview
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center max-w-5xl mx-auto p-8 rounded-3xl bg-white border border-slate-200 shadow-sm">
            <div className="lg:col-span-5 flex justify-center">
              <AvatarVisualizer
                state={avatarState}
                personaName="Sarah"
                currentSpeechText={currentSpeechText}
                onSpeechEnd={() => setAvatarState('IDLE')}
              />
            </div>

            <div className="lg:col-span-7 space-y-6">
              <div className="max-h-60 overflow-y-auto space-y-3 p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <span className="text-xs font-bold text-slate-700">Interview Dialogue (Sarah)</span>
                  <button
                    onClick={() => handleReplaySpeech('female')}
                    className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold border border-rose-200 transition-colors cursor-pointer"
                    title="Replay Sarah's question"
                  >
                    <Volume2 className="w-3.5 h-3.5 text-rose-600" />
                    <span>Replay Question</span>
                  </button>
                </div>
                {conversationList.map((msg, i) => (
                  <div
                    key={i}
                    className={`p-3 rounded-2xl text-xs leading-relaxed ${
                      msg.sender === 'AI'
                        ? 'bg-white border border-slate-200 text-slate-800'
                        : 'bg-rose-600 text-white ml-6 shadow-sm'
                    }`}
                  >
                    <span className="font-bold block text-[10px] mb-1 opacity-80">
                      {msg.sender === 'AI' ? 'Sarah (Head of Talent)' : 'You'}
                    </span>
                    {msg.text}
                  </div>
                ))}
              </div>

              <div className="p-5 rounded-2xl bg-rose-50/40 border border-rose-100 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-rose-800">
                    Negotiation Counter
                  </span>
                  <button
                    onClick={() => toggleRecording(4)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                      isRecording
                        ? 'bg-rose-600 text-white animate-pulse'
                        : 'bg-indigo-600 text-white'
                    }`}
                  >
                    {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                    <span>{isRecording ? 'Stop' : 'Speak'}</span>
                  </button>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={candidateInput}
                    onChange={(e) => setCandidateInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && submitMessage(4)}
                    placeholder="E.g. I expect 12 LPA based on market benchmarks..."
                    className="flex-1 p-3 rounded-xl bg-white border border-slate-200 text-xs text-slate-700"
                  />
                  <button
                    onClick={() => submitMessage(4)}
                    className="p-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white shadow-md"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 11. REPORT GENERATING PROGRESS ANIMATION */}
      {step === 'COMPLETED_GENERATING' && (
        <div className="max-w-md mx-auto p-12 rounded-3xl bg-white border border-slate-200 text-center space-y-6 animate-in fade-in duration-300">
          <div className="text-4xl animate-bounce">🎉</div>
          <div>
            <h3 className="font-extrabold text-2xl text-slate-800">Interview Completed!</h3>
            <p className="text-xs text-slate-500 mt-1">
              You have successfully completed the 100-minute AI interview. Your detailed report is being compiled.
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs font-bold text-slate-600">
              <span>Generating Report...</span>
              <span>{reportProgress}%</span>
            </div>
            <div className="w-full h-2.5 rounded-full bg-slate-100 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-rose-500 to-indigo-600 transition-all duration-300"
                style={{ width: `${reportProgress}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* 12. COMPREHENSIVE 100-MINUTE EVALUATION REPORT */}
      {step === 'REPORT' && (
        <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-300">
            {/* Header Summary Card */}
            <div className="p-8 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-100 pb-5">
                <div>
                  <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight">Interview Report</h2>
                  <p className="text-xs text-slate-500 mt-0.5">100-Minute Comprehensive Multi-Round Diagnostic</p>
                </div>
                <div className="flex gap-2">
                  <button className="py-2.5 px-4 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold flex items-center gap-1.5">
                    <Download className="w-3.5 h-3.5" />
                    <span>Download PDF</span>
                  </button>
                  <button className="py-2.5 px-4 rounded-xl bg-rose-600 text-white hover:bg-rose-500 text-xs font-bold shadow-md shadow-rose-600/30 flex items-center gap-1.5">
                    <Share2 className="w-3.5 h-3.5" />
                    <span>Share Report</span>
                  </button>
                </div>
              </div>

              {/* Score Gauges & Round-wise breakdown */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
                <div className="md:col-span-4 flex flex-col items-center justify-center p-6 rounded-2xl bg-slate-50 border border-slate-200">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Overall Score</span>
                  <div className="relative w-36 h-36 flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="40" stroke="#E2E8F0" strokeWidth="10" fill="transparent" />
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        stroke="#EF4444"
                        strokeWidth="10"
                        strokeDasharray="251.2"
                        strokeDashoffset={251.2 * (1 - overallScore / 100)}
                        strokeLinecap="round"
                        fill="transparent"
                      />
                    </svg>
                    <div className="absolute text-center">
                      <span className="text-3xl font-extrabold text-slate-800">{overallScore}</span>
                      <span className="text-[11px] block text-slate-400 font-semibold">/100</span>
                    </div>
                  </div>
                  <span className="mt-3 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Good Performance
                  </span>
                </div>

                {/* Round-wise Breakdown */}
                <div className="md:col-span-8 space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Round-wise Scores</h4>
                  {[
                    { label: 'HR / Behavioral (15m) — 15% Weight', score: roundScores.hr, color: 'bg-emerald-500' },
                    { label: 'Coding & DSA (50m) — 50% Weight', score: roundScores.coding, color: 'bg-indigo-500' },
                    { label: 'Technical & System Design (25m) — 25% Weight', score: roundScores.technical, color: 'bg-blue-500' },
                    { label: 'Negotiation & HR (10m) — 10% Weight', score: roundScores.negotiation, color: 'bg-rose-500' },
                  ].map((item, idx) => (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-slate-700">{item.label}</span>
                        <span className="text-slate-900 font-bold">{item.score}/100</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${item.color}`}
                          style={{ width: `${item.score}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            {/* Core Competencies Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-slate-100 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
                <span className="text-slate-400 block">Communication</span>
                <span className="text-base font-extrabold text-slate-800">80%</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
                <span className="text-slate-400 block">Confidence</span>
                <span className="text-base font-extrabold text-slate-800">76%</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
                <span className="text-slate-400 block">Technical Depth</span>
                <span className="text-base font-extrabold text-slate-800">78%</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
                <span className="text-slate-400 block">Integrity Score</span>
                <span className={`text-base font-extrabold ${
                  proctoringStats.integrityScore >= 90
                    ? 'text-emerald-600'
                    : proctoringStats.integrityScore >= 75
                    ? 'text-amber-600'
                    : 'text-rose-600'
                }`}>
                  {proctoringStats.integrityScore}/100
                </span>
              </div>
            </div>
          </div>

          {/* Enterprise Anti-Cheat & Proctoring Diagnostic Card */}
          <div className="p-8 rounded-3xl bg-slate-900 text-white border border-slate-800 shadow-xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-2xl ${
                  proctoringStats.riskLevel === 'LOW'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                    : proctoringStats.riskLevel === 'MEDIUM'
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                    : 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                }`}>
                  {proctoringStats.riskLevel === 'LOW' ? (
                    <ShieldCheck className="w-7 h-7" />
                  ) : (
                    <ShieldAlert className="w-7 h-7" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-extrabold text-lg text-white">Interview Proctoring & Integrity Diagnostic</h3>
                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                      proctoringStats.riskLevel === 'LOW'
                        ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                        : proctoringStats.riskLevel === 'MEDIUM'
                        ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                        : 'bg-rose-500/20 text-rose-400 border-rose-500/40'
                    }`}>
                      {proctoringStats.riskLevel} RISK LEVEL
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Continuous multi-sensor monitoring: Computer vision facial tracking, gaze & phone heuristics, Web Audio ambient detection, browser focus & clipboard isolation.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 self-start sm:self-center">
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Integrity Index</span>
                  <span className={`text-3xl font-black ${
                    proctoringStats.integrityScore >= 90
                      ? 'text-emerald-400'
                      : proctoringStats.integrityScore >= 75
                      ? 'text-amber-400'
                      : 'text-rose-400'
                  }`}>
                    {proctoringStats.integrityScore}
                    <span className="text-xs text-slate-500 font-semibold"> / 100</span>
                  </span>
                </div>
              </div>
            </div>

            {/* 8-Point Anti-Cheat Telemetry Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/60 space-y-1">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-[11px] font-medium">Tab Switches</span>
                  <span className="text-[10px] font-mono text-indigo-400">TABS</span>
                </div>
                <span className={`text-base font-bold ${proctoringStats.tabSwitches > 0 ? 'text-amber-400' : 'text-slate-100'}`}>
                  {proctoringStats.tabSwitches} times
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/60 space-y-1">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-[11px] font-medium">Fullscreen Exits</span>
                  <Maximize2 className="w-3.5 h-3.5 text-indigo-400" />
                </div>
                <span className={`text-base font-bold ${proctoringStats.fullscreenExits > 0 ? 'text-rose-400' : 'text-slate-100'}`}>
                  {proctoringStats.fullscreenExits} times
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/60 space-y-1">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-[11px] font-medium">Face Missing</span>
                  <Eye className="w-3.5 h-3.5 text-indigo-400" />
                </div>
                <span className={`text-base font-bold ${proctoringStats.faceMissingCount > 0 ? 'text-amber-400' : 'text-slate-100'}`}>
                  {proctoringStats.faceMissingCount} times
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/60 space-y-1">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-[11px] font-medium">Multiple Faces</span>
                  <Users className="w-3.5 h-3.5 text-indigo-400" />
                </div>
                <span className={`text-base font-bold ${proctoringStats.multipleFacesCount > 0 ? 'text-rose-400' : 'text-slate-100'}`}>
                  {proctoringStats.multipleFacesCount} detected
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/60 space-y-1">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-[11px] font-medium">Suspicious Gaze / Away</span>
                  <Eye className="w-3.5 h-3.5 text-indigo-400" />
                </div>
                <span className={`text-base font-bold ${proctoringStats.lookingAwayCount > 0 ? 'text-amber-400' : 'text-slate-100'}`}>
                  {proctoringStats.lookingAwayCount} times
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/60 space-y-1">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-[11px] font-medium">Phone / Downward Gaze</span>
                  <Smartphone className="w-3.5 h-3.5 text-indigo-400" />
                </div>
                <span className={`text-base font-bold ${proctoringStats.phoneDetectedCount > 0 ? 'text-rose-400' : 'text-slate-100'}`}>
                  {proctoringStats.phoneDetectedCount} flagged
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/60 space-y-1">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-[11px] font-medium">Copy / Paste Intercepts</span>
                  <Copy className="w-3.5 h-3.5 text-indigo-400" />
                </div>
                <span className={`text-base font-bold ${proctoringStats.copyAttempts + proctoringStats.pasteAttempts > 0 ? 'text-amber-400' : 'text-slate-100'}`}>
                  {proctoringStats.copyAttempts + proctoringStats.pasteAttempts} attempts
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/60 space-y-1">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-[11px] font-medium">Secondary Voices / Noise</span>
                  <Volume2 className="w-3.5 h-3.5 text-indigo-400" />
                </div>
                <span className={`text-base font-bold ${proctoringStats.secondaryAudioCount > 0 ? 'text-amber-400' : 'text-slate-100'}`}>
                  {proctoringStats.secondaryAudioCount} events
                </span>
              </div>
            </div>

            {/* Timestamped Audit Logs if any */}
            {proctoringStats.events.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                  Real-Time Security Event Audit Trail ({proctoringStats.events.length} incidents logged)
                </span>
                <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                  {proctoringStats.events.map((evt: any) => (
                    <div key={evt.id} className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/50 text-[11px] flex items-center justify-between">
                      <div className="space-y-0.5">
                        <span className="font-semibold text-rose-300">{evt.label}</span>
                        <p className="text-slate-400 text-[10px]">{evt.details}</p>
                      </div>
                      <div className="text-right flex flex-col items-end shrink-0 pl-3">
                        <span className="font-mono text-[10px] text-slate-400">{evt.timestamp}</span>
                        <span className="text-[10px] text-rose-400 font-bold">-{evt.penalty} pts</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <p className="text-[11px] text-slate-400 italic">
              * Note: Candidate integrity evaluation employs a calibrated multi-factor risk assessment model to safeguard against false positives while firmly detecting sustained or repeated non-compliant actions.
            </p>
          </div>

          {/* Action Recommendations */}
          <div className="p-8 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-bold text-lg text-slate-800">Personalized Next Steps</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Link
                href="/practice?topic=Dynamic%20Programming&category=DSA"
                className="p-4 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-all block group"
              >
                <p className="font-bold text-sm text-slate-800 group-hover:text-rose-600">Practice Dynamic Programming</p>
                <p className="text-xs text-slate-500 mt-1">Strengthen state transition models</p>
              </Link>
              <Link
                href="/practice?topic=System%20Design&category=TECHNICAL"
                className="p-4 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-all block group"
              >
                <p className="font-bold text-sm text-slate-800 group-hover:text-rose-600">System Design Basics</p>
                <p className="text-xs text-slate-500 mt-1">Learn distributed cache & sharding patterns</p>
              </Link>
              <Link
                href="/practice?topic=Behavioral&category=HR"
                className="p-4 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-all block group"
              >
                <p className="font-bold text-sm text-slate-800 group-hover:text-rose-600">Improve STAR Communication</p>
                <p className="text-xs text-slate-500 mt-1">Structure answers with quantifiable metrics</p>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
