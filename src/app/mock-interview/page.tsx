'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  FileQuestion,
  Sparkles,
  ArrowRight,
  Clock,
  Mic,
  MicOff,
  Video,
  Award,
  ChevronRight,
  ShieldAlert,
  Play,
  RotateCcw,
  CheckCircle2,
  TrendingUp,
  Download,
  Share2,
  Eye,
  Smartphone,
  Users,
  Copy,
  Volume2,
  ShieldCheck,
  AlertTriangle,
  Maximize2
} from 'lucide-react';
import AvatarVisualizer, { AvatarState } from '@/components/avatar/AvatarVisualizer';
import MonacoEditorPanel from '@/components/code-editor/MonacoEditorPanel';
import SecureProctoringSuite from '@/components/proctoring/SecureProctoringSuite';
import PreInterviewSecurityGate from '@/components/proctoring/PreInterviewSecurityGate';
import { speakQuestion, stopSpeech, LiveSpeechRecognizer } from '@/lib/speech-service';

type MockStage = 'CONFIG' | 'INSTRUCTIONS' | 'SECURITY_GATE' | 'IN_PROGRESS' | 'COMPLETED' | 'REPORT';

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

export default function MockInterviewPage() {
  const [stage, setStage] = useState<MockStage>('CONFIG');
  const [selectedCompany, setSelectedCompany] = useState('Google');
  const [selectedRole, setSelectedRole] = useState('Software Engineer');
  const [experienceLevel, setExperienceLevel] = useState('Fresher');
  const [mockType, setMockType] = useState('Full Mock');
  const [duration, setDuration] = useState(45);
  const [proctorStream, setProctorStream] = useState<MediaStream | null>(null);

  // Active interview state
  const [currentRoundIndex, setCurrentRoundIndex] = useState(0); // 0: HR, 1: Coding, 2: Technical, 3: Managerial
  const [timerSeconds, setTimerSeconds] = useState(45 * 60);
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [avatarState, setAvatarState] = useState<AvatarState>('IDLE');
  const [avatarSpeechText, setAvatarSpeechText] = useState('');

  // Dynamic Round Scores (Recalculated dynamically per Round)
  const [roundScores, setRoundScores] = useState({
    hr: 82,
    coding: 80,
    technical: 78,
    managerial: 80,
  });

  // Speech recognizer reference
  const recognizerRef = React.useRef<LiveSpeechRecognizer | null>(null);

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

  const rounds = [
    {
      name: 'HR Round',
      type: 'AVATAR',
      question: "Hi Abhineet! Let's start with a brief introduction. Tell me about yourself.",
      persona: 'Sarah',
    },
    {
      name: 'Coding Round',
      type: 'CODING',
      problem: {
        id: 'mock-p1',
        title: 'Two Sum',
        slug: 'two-sum',
        difficulty: 'Medium',
        tags: ['Array', 'Hash Map'],
        description: 'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.\n\nYou may assume that each input would have exactly one solution.',
        examples: [
          { input: 'nums = [2,7,11,15], target = 9', output: '[0,1]' },
          { input: 'nums = [3,2,4], target = 6', output: '[1,2]' }
        ],
        constraints: ['2 <= nums.length <= 10^4', '-10^9 <= target <= 10^9'],
        hints: ['Use a HashMap to lookup target - nums[i] in O(1) time.'],
        starterCodeJava: `import java.util.*;\n\nclass Solution {\n    public int[] twoSum(int[] nums, int target) {\n        // Write your code here\n        \n        return new int[]{};\n    }\n}`,
      },
    },
    {
      name: 'Technical Round',
      type: 'AVATAR',
      question: 'What is normalization in DBMS? Can you explain different normal forms (1NF, 2NF, 3NF) with practical examples?',
      persona: 'David',
    },
    {
      name: 'Managerial Round',
      type: 'AVATAR',
      question: 'Suppose your team member is not completing their assigned task and the production release deadline is tomorrow. How would you handle this situation?',
      persona: 'Sarah',
    },
  ];

  // Initialize Speech Recognizer and handle cleanup
  useEffect(() => {
    recognizerRef.current = new LiveSpeechRecognizer(
      (liveText) => {
        setTranscript(liveText);
      },
      (err) => {
        console.warn('Speech recognition status:', err);
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

  // Countdown timer
  useEffect(() => {
    if (stage !== 'IN_PROGRESS') return;
    const interval = setInterval(() => {
      setTimerSeconds((prev) => {
        if (prev <= 1) {
          stopSpeech();
          setStage('COMPLETED');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [stage]);

  const formatTimer = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const handlePlayCurrentQuestion = () => {
    const cur = rounds[currentRoundIndex];
    if (cur?.question) {
      speakQuestion(
        cur.question,
        cur.persona === 'David' ? 'male' : 'female',
        () => setAvatarState('SPEAKING'),
        () => setAvatarState('IDLE')
      );
    }
  };

  const handleStartInterview = () => {
    setStage('IN_PROGRESS');
    setCurrentRoundIndex(0);
    setTimerSeconds(duration * 60);
    setAvatarSpeechText(rounds[0].question);
    setTranscript('');
    speakQuestion(
      rounds[0].question,
      'female',
      () => setAvatarState('SPEAKING'),
      () => setAvatarState('IDLE')
    );
  };

  const handleNextRound = () => {
    // Immediately stop audio & recognition
    stopSpeech();
    recognizerRef.current?.stop();
    setIsRecording(false);

    // Recalculate score for the submitted round
    if (currentRoundIndex === 0) {
      const score = evaluateTextAnswer(transcript, ['experience', 'project', 'software', 'skills', 'background', 'engineer', 'learning', 'team', 'college']);
      setRoundScores(prev => ({ ...prev, hr: score }));
    } else if (currentRoundIndex === 2) {
      const score = evaluateTextAnswer(transcript, ['normalization', '1nf', '2nf', '3nf', 'redundancy', 'dependency', 'table', 'key', 'database', 'candidate']);
      setRoundScores(prev => ({ ...prev, technical: score }));
    } else if (currentRoundIndex === 3) {
      const score = evaluateTextAnswer(transcript, ['deadline', 'priority', 'communicate', 'team', 'manager', 'blocker', 'collaborate', 'deliver', 'quality']);
      setRoundScores(prev => ({ ...prev, managerial: score }));
    }

    setTranscript('');

    if (currentRoundIndex + 1 < rounds.length) {
      const nextIdx = currentRoundIndex + 1;
      setCurrentRoundIndex(nextIdx);
      const nextRound = rounds[nextIdx];
      if (nextRound.type === 'AVATAR') {
        setAvatarSpeechText(nextRound.question || '');
        speakQuestion(
          nextRound.question || '',
          nextRound.persona === 'David' ? 'male' : 'female',
          () => setAvatarState('SPEAKING'),
          () => setAvatarState('IDLE')
        );
      } else {
        setAvatarSpeechText('');
        setAvatarState('IDLE');
      }
    } else {
      setStage('COMPLETED');
    }
  };

  // Toggle voice recording using Web Speech API
  const toggleRecording = () => {
    if (isRecording) {
      recognizerRef.current?.stop();
      setIsRecording(false);
      setAvatarState('IDLE');
    } else {
      // Stop interviewer speaking before user talks
      stopSpeech();
      const started = recognizerRef.current?.start(transcript);
      setIsRecording(true);
      setAvatarState('LISTENING');
      if (!started) {
        console.info('Live speech recognition not active in this environment; manual text entry available.');
      }
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Real-time Enterprise Anti-Cheat & Proctoring Engine */}
      {stage === 'IN_PROGRESS' && (
        <SecureProctoringSuite
          interviewId="mock-session-1"
          isActive={true}
          initialStream={proctorStream}
          showCameraHUD={true}
          onStatsUpdate={(stats) => setProctoringStats(stats)}
          onSessionTerminated={() => setStage('COMPLETED')}
        />
      )}

      {/* Breadcrumb Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Link href="/" className="hover:text-indigo-600 transition-colors">
            Dashboard
          </Link>
          <ChevronRight className="w-4 h-4" />
          <span className="font-semibold text-slate-800">Mock Interview</span>
        </div>
      </div>

      {/* 1. CONFIGURATION STEP */}
      {stage === 'CONFIG' && (
        <div className="max-w-4xl mx-auto p-8 rounded-3xl bg-white border border-slate-200/80 shadow-sm space-y-8">
          <div>
            <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight">
              Create a Mock Interview
            </h2>
            <p className="text-slate-500 text-sm mt-1">
              Customize your simulated interview based on your upcoming target company and goals.
            </p>
          </div>

          {/* Company Selection */}
          <div className="space-y-3">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Select Company (Optional)</label>
            <div className="flex flex-wrap gap-2.5">
              {['General', 'Google', 'Microsoft', 'Amazon', 'Adobe', '+ More'].map((comp, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedCompany(comp)}
                  className={`py-2 px-4 rounded-xl text-xs font-bold border transition-all ${
                    selectedCompany === comp
                      ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-600/30'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                >
                  {comp}
                </button>
              ))}
            </div>
          </div>

          {/* Select Role & Experience */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Select Role</label>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="w-full py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-700"
              >
                <option>Software Engineer</option>
                <option>Backend Developer</option>
                <option>Frontend Developer</option>
                <option>Full Stack Engineer</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Experience Level</label>
              <div className="grid grid-cols-4 gap-2">
                {['Fresher', '0 - 1 Year', '1 - 3 Years', '3+ Years'].map((exp, i) => (
                  <button
                    key={i}
                    onClick={() => setExperienceLevel(exp)}
                    className={`py-2 px-2 rounded-xl text-[11px] font-bold border text-center transition-all ${
                      experienceLevel === exp
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-slate-50 text-slate-600 border-slate-200'
                    }`}
                  >
                    {exp}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Mock Type */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Mock Type</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {['Full Mock', 'Technical Mock', 'Coding Mock', 'HR Mock'].map((type, i) => (
                <button
                  key={i}
                  onClick={() => setMockType(type)}
                  className={`py-2.5 px-3 rounded-2xl text-xs font-bold border transition-all ${
                    mockType === type
                      ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-600/30'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Duration */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Duration</label>
            <div className="flex gap-3">
              {[30, 45, 60].map((mins) => (
                <button
                  key={mins}
                  onClick={() => setDuration(mins)}
                  className={`py-2 px-5 rounded-2xl text-xs font-bold border transition-all ${
                    duration === mins
                      ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                      : 'bg-slate-50 text-slate-700 border-slate-200'
                  }`}
                >
                  {mins} Min
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={() => setStage('INSTRUCTIONS')}
            className="w-full py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-xl shadow-blue-600/30 flex items-center justify-center gap-2 transition-all"
          >
            <span>Start Mock Interview</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 2. INSTRUCTIONS STEP */}
      {stage === 'INSTRUCTIONS' && (
        <div className="max-w-2xl mx-auto p-8 rounded-3xl bg-white border border-slate-200/80 shadow-sm space-y-6">
          <div>
            <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight">
              Mock Interview Instructions
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              This is a timed mock interview designed to replicate a real corporate hiring experience.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
            <p className="font-bold text-slate-800">Interview Details</p>
            <div className="grid grid-cols-2 gap-2 text-slate-600">
              <p>Company: <strong className="text-slate-800">{selectedCompany}</strong></p>
              <p>Role: <strong className="text-slate-800">{selectedRole}</strong></p>
              <p>Type: <strong className="text-slate-800">{mockType}</strong></p>
              <p>Duration: <strong className="text-slate-800">{duration} Minutes</strong></p>
              <p className="col-span-2">Rounds: HR → Coding → Technical → Managerial</p>
            </div>
          </div>

          <div className="space-y-2 text-xs text-slate-600">
            <p className="font-bold text-slate-800">Important Guidelines</p>
            <ul className="list-disc list-inside space-y-1">
              <li>No hints or solution explanations are available during the session.</li>
              <li>Answer naturally using your microphone or keyboard fallback.</li>
              <li>Camera and microphone will be used for proctoring integrity.</li>
              <li>Do not switch browser tabs or exit fullscreen mode.</li>
              <li>You will receive an extensive diagnostic feedback report upon completion.</li>
            </ul>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={() => setStage('CONFIG')}
              className="py-3 px-5 rounded-2xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold text-xs"
            >
              Back
            </button>
            <button
              onClick={() => setStage('SECURITY_GATE')}
              className="flex-1 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-xl shadow-blue-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Proceed to Mandatory Security Verification</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* 2.5 MANDATORY PRE-INTERVIEW SECURITY GATE */}
      {stage === 'SECURITY_GATE' && (
        <PreInterviewSecurityGate
          sessionTitle="Mock Interview"
          company={selectedCompany}
          role={selectedRole}
          onSecurityPassed={(stream) => {
            setProctorStream(stream);
            setStage('IN_PROGRESS');
            setTimerSeconds(duration * 60);
          }}
          onCancel={() => setStage('INSTRUCTIONS')}
        />
      )}

      {/* 3. IN PROGRESS STEP (MULTIPLE ROUNDS) */}
      {stage === 'IN_PROGRESS' && (
        <div className="space-y-6">
          {/* Top Bar with Rounds Pipeline and Timer */}
          <div className="p-4 rounded-3xl bg-white border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              {rounds.map((r, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold ${
                      currentRoundIndex === i
                        ? 'bg-blue-600 text-white shadow-md'
                        : currentRoundIndex > i
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-slate-100 text-slate-400'
                    }`}
                  >
                    <span>Round {i + 1}</span>
                    <span className="hidden sm:inline">· {r.name}</span>
                  </div>
                  {i < rounds.length - 1 && <ChevronRight className="w-4 h-4 text-slate-300" />}
                </div>
              ))}
            </div>

            <div className="flex items-center gap-4">
              <div className="px-3 py-1.5 rounded-xl bg-slate-100 font-mono text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-blue-600" />
                <span>{formatTimer(timerSeconds)}</span>
              </div>
              <button
                onClick={() => setStage('COMPLETED')}
                className="px-3.5 py-1.5 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200 text-xs font-bold"
              >
                End Interview
              </button>
            </div>
          </div>

          {/* Current Round Content */}
          {rounds[currentRoundIndex].type === 'CODING' ? (
            /* Coding Round with Monaco Editor */
            <div className="h-[680px]">
              <MonacoEditorPanel
                problem={rounds[currentRoundIndex].problem as any}
                onSuccess={(passedTests, totalTests) => {
                  const score = Math.round(((passedTests || 0) / Math.max(1, totalTests || 1)) * 100);
                  setRoundScores(prev => ({ ...prev, coding: score }));
                  handleNextRound();
                }}
                onNext={handleNextRound}
                isInterviewMode={true}
              />
            </div>
          ) : (
            /* Conversational Avatar Round (HR, Technical, Managerial) */
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center max-w-5xl mx-auto p-8 rounded-3xl bg-white border border-slate-200 shadow-sm">
              <div className="lg:col-span-5 flex justify-center">
                <AvatarVisualizer
                  state={avatarState}
                  personaName={rounds[currentRoundIndex].persona}
                  currentSpeechText={avatarSpeechText}
                  onSpeechEnd={() => setAvatarState('IDLE')}
                />
              </div>

              <div className="lg:col-span-7 space-y-6">
                {/* AI Dialogue Box */}
                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse" />
                      <span className="text-xs font-bold text-slate-800">
                        AI Interviewer ({rounds[currentRoundIndex].persona})
                      </span>
                    </div>
                    {/* Replay Question Button */}
                    <button
                      onClick={handlePlayCurrentQuestion}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold border border-blue-200 shadow-sm transition-colors cursor-pointer"
                      title="Replay spoken question"
                    >
                      <Volume2 className="w-3.5 h-3.5 text-blue-600" />
                      <span>Replay Question</span>
                    </button>
                  </div>
                  <p className="text-sm font-semibold text-slate-800 leading-relaxed">
                    {rounds[currentRoundIndex].question}
                  </p>
                </div>

                {/* Candidate Speech Visualizer & Input Controls */}
                <div className="p-5 rounded-2xl bg-indigo-50/50 border border-indigo-100 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-indigo-700">
                      {isRecording ? 'Listening to your response...' : 'Your Answer (Voice / Text)'}
                    </span>
                    <button
                      onClick={toggleRecording}
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

                  {/* Transcript Area */}
                  <textarea
                    value={transcript}
                    onChange={(e) => setTranscript(e.target.value)}
                    placeholder="Click 'Start Speaking' or type your response here..."
                    rows={4}
                    className="w-full p-3 rounded-xl bg-white border border-slate-200 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />

                  <div className="flex justify-end gap-3">
                    <button
                      onClick={handleNextRound}
                      className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-600/30 flex items-center gap-1.5"
                    >
                      <span>Submit & Next Round</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 4. COMPLETED SCREEN */}
      {stage === 'COMPLETED' && (() => {
        const overallScore = Math.round(
          roundScores.hr * 0.15 +
          roundScores.coding * 0.50 +
          roundScores.technical * 0.25 +
          roundScores.managerial * 0.10
        );

        return (
          <div className="max-w-3xl mx-auto p-8 rounded-3xl bg-white border border-slate-200/80 shadow-sm space-y-8 animate-in fade-in duration-300">
            <div className="text-center space-y-1">
              <span className="text-3xl">🎯</span>
              <h2 className="text-2xl font-extrabold text-slate-800">Mock Interview Completed!</h2>
              <p className="text-xs text-slate-500">Here's your overall performance summary based on round weights.</p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-around gap-6 p-6 rounded-2xl bg-slate-50 border border-slate-200">
              <div className="relative w-32 h-32 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="40" stroke="#E2E8F0" strokeWidth="10" fill="transparent" />
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    stroke="#2563EB"
                    strokeWidth="10"
                    strokeDasharray="251.2"
                    strokeDashoffset={251.2 * (1 - overallScore / 100)}
                    strokeLinecap="round"
                    fill="transparent"
                  />
                </svg>
                <div className="absolute text-center">
                  <span className="text-2xl font-extrabold text-slate-800">{overallScore}</span>
                  <span className="text-[10px] block text-slate-400 font-semibold">/100</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs w-full max-w-sm">
                <div className="p-3 rounded-xl bg-white border border-slate-200 flex flex-col">
                  <span className="text-slate-400 text-[10px]">HR Round (15%)</span>
                  <span className="font-bold text-slate-800 text-sm mt-0.5">{roundScores.hr}/100</span>
                </div>
                <div className="p-3 rounded-xl bg-white border border-slate-200 flex flex-col">
                  <span className="text-slate-400 text-[10px]">Coding Round (50%)</span>
                  <span className="font-bold text-slate-800 text-sm mt-0.5">{roundScores.coding}/100</span>
                </div>
                <div className="p-3 rounded-xl bg-white border border-slate-200 flex flex-col">
                  <span className="text-slate-400 text-[10px]">Technical Round (25%)</span>
                  <span className="font-bold text-slate-800 text-sm mt-0.5">{roundScores.technical}/100</span>
                </div>
                <div className="p-3 rounded-xl bg-white border border-slate-200 flex flex-col">
                  <span className="text-slate-400 text-[10px]">Managerial Round (10%)</span>
                  <span className="font-bold text-slate-800 text-sm mt-0.5">{roundScores.managerial}/100</span>
                </div>
              </div>
            </div>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => setStage('REPORT')}
              className="py-3 px-6 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-600/30"
            >
              View Detailed Report
            </button>
            <button
              onClick={() => setStage('CONFIG')}
              className="py-3 px-5 rounded-2xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold"
            >
              Retake Mock
            </button>
          </div>
        </div>
      );
    })()}

      {/* 5. DETAILED REPORT & RECOMMENDATIONS */}
      {stage === 'REPORT' && (
        <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-200">
          <div className="p-8 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="font-bold text-xl text-slate-800">Detailed Feedback Report</h3>
                <p className="text-xs text-slate-500 mt-0.5">Comprehensive diagnostic evaluation</p>
              </div>
              <div className="flex gap-2">
                <button className="py-2 px-3 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold flex items-center gap-1.5">
                  <Download className="w-3.5 h-3.5" />
                  <span>Download PDF</span>
                </button>
              </div>
            </div>

            {/* Dynamic Round Score Breakdown */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <div className="text-center">
                <span className="text-[10px] text-slate-400 font-semibold block uppercase">HR Round (15%)</span>
                <span className="text-lg font-extrabold text-slate-800">{roundScores.hr}/100</span>
              </div>
              <div className="text-center">
                <span className="text-[10px] text-slate-400 font-semibold block uppercase">Coding (50%)</span>
                <span className="text-lg font-extrabold text-slate-800">{roundScores.coding}/100</span>
              </div>
              <div className="text-center">
                <span className="text-[10px] text-slate-400 font-semibold block uppercase">Technical (25%)</span>
                <span className="text-lg font-extrabold text-slate-800">{roundScores.technical}/100</span>
              </div>
              <div className="text-center">
                <span className="text-[10px] text-slate-400 font-semibold block uppercase">Managerial (10%)</span>
                <span className="text-lg font-extrabold text-slate-800">{roundScores.managerial}/100</span>
              </div>
            </div>

            {/* Strengths & Weaknesses Breakdown */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="p-5 rounded-2xl bg-emerald-50/50 border border-emerald-100 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Strengths</span>
                </h4>
                <ul className="text-xs text-slate-700 space-y-2 list-disc list-inside">
                  <li>Strong verbal communication and clear articulation in HR.</li>
                  <li>Clear problem-solving approach explained prior to coding.</li>
                  <li>Good understanding of core DBMS normalization principles.</li>
                </ul>
              </div>

              <div className="p-5 rounded-2xl bg-rose-50/50 border border-rose-100 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-rose-800 flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-rose-600" />
                  <span>Areas to Improve</span>
                </h4>
                <ul className="text-xs text-slate-700 space-y-2 list-disc list-inside">
                  <li>Optimize space complexity for array complement searches.</li>
                  <li>Deepen explanation of indexing and B+ Tree mechanisms.</li>
                  <li>Structure behavioral answers strictly using STAR format.</li>
                </ul>
              </div>
            </div>

            {/* Anti-Cheat & Proctoring Integrity Evaluation Report */}
            <div className="p-6 rounded-2xl bg-slate-900 text-white border border-slate-800 space-y-5 shadow-lg">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-xl ${
                    proctoringStats.riskLevel === 'LOW'
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                      : proctoringStats.riskLevel === 'MEDIUM'
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                      : 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                  }`}>
                    {proctoringStats.riskLevel === 'LOW' ? (
                      <ShieldCheck className="w-6 h-6" />
                    ) : (
                      <AlertTriangle className="w-6 h-6" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-extrabold text-base text-white">Interview Integrity & Anti-Cheat Diagnostic</h4>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        proctoringStats.riskLevel === 'LOW'
                          ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                          : proctoringStats.riskLevel === 'MEDIUM'
                          ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                          : 'bg-rose-500/20 text-rose-400 border-rose-500/40'
                      }`}>
                        {proctoringStats.riskLevel} RISK
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Multi-signal biometric, browser telemetry, and audio environment analysis.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-center">
                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Integrity Score</span>
                    <span className={`text-2xl font-black ${
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

              {/* Telemetry Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-800/70 border border-slate-700/60">
                  <div className="flex items-center justify-between text-slate-400 mb-1">
                    <span className="text-[11px]">Tab Switches</span>
                    <span className="text-[10px] font-mono text-indigo-400">TABS</span>
                  </div>
                  <span className={`text-base font-bold ${proctoringStats.tabSwitches > 0 ? 'text-amber-400' : 'text-slate-200'}`}>
                    {proctoringStats.tabSwitches} times
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-800/70 border border-slate-700/60">
                  <div className="flex items-center justify-between text-slate-400 mb-1">
                    <span className="text-[11px]">Fullscreen Exits</span>
                    <Maximize2 className="w-3.5 h-3.5 text-indigo-400" />
                  </div>
                  <span className={`text-base font-bold ${proctoringStats.fullscreenExits > 0 ? 'text-rose-400' : 'text-slate-200'}`}>
                    {proctoringStats.fullscreenExits} times
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-800/70 border border-slate-700/60">
                  <div className="flex items-center justify-between text-slate-400 mb-1">
                    <span className="text-[11px]">Face Missing</span>
                    <Eye className="w-3.5 h-3.5 text-indigo-400" />
                  </div>
                  <span className={`text-base font-bold ${proctoringStats.faceMissingCount > 0 ? 'text-amber-400' : 'text-slate-200'}`}>
                    {proctoringStats.faceMissingCount} times
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-800/70 border border-slate-700/60">
                  <div className="flex items-center justify-between text-slate-400 mb-1">
                    <span className="text-[11px]">Multiple Faces</span>
                    <Users className="w-3.5 h-3.5 text-indigo-400" />
                  </div>
                  <span className={`text-base font-bold ${proctoringStats.multipleFacesCount > 0 ? 'text-rose-400' : 'text-slate-200'}`}>
                    {proctoringStats.multipleFacesCount} detected
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-800/70 border border-slate-700/60">
                  <div className="flex items-center justify-between text-slate-400 mb-1">
                    <span className="text-[11px]">Suspicious Gaze / Away</span>
                    <Eye className="w-3.5 h-3.5 text-indigo-400" />
                  </div>
                  <span className={`text-base font-bold ${proctoringStats.lookingAwayCount > 0 ? 'text-amber-400' : 'text-slate-200'}`}>
                    {proctoringStats.lookingAwayCount} times
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-800/70 border border-slate-700/60">
                  <div className="flex items-center justify-between text-slate-400 mb-1">
                    <span className="text-[11px]">Looking Down / Phone</span>
                    <Smartphone className="w-3.5 h-3.5 text-indigo-400" />
                  </div>
                  <span className={`text-base font-bold ${proctoringStats.phoneDetectedCount > 0 ? 'text-rose-400' : 'text-slate-200'}`}>
                    {proctoringStats.phoneDetectedCount} flagged
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-800/70 border border-slate-700/60">
                  <div className="flex items-center justify-between text-slate-400 mb-1">
                    <span className="text-[11px]">Copy / Paste Intercepts</span>
                    <Copy className="w-3.5 h-3.5 text-indigo-400" />
                  </div>
                  <span className={`text-base font-bold ${proctoringStats.copyAttempts + proctoringStats.pasteAttempts > 0 ? 'text-amber-400' : 'text-slate-200'}`}>
                    {proctoringStats.copyAttempts + proctoringStats.pasteAttempts} attempts
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-800/70 border border-slate-700/60">
                  <div className="flex items-center justify-between text-slate-400 mb-1">
                    <span className="text-[11px]">Secondary Audio</span>
                    <Volume2 className="w-3.5 h-3.5 text-indigo-400" />
                  </div>
                  <span className={`text-base font-bold ${proctoringStats.secondaryAudioCount > 0 ? 'text-amber-400' : 'text-slate-200'}`}>
                    {proctoringStats.secondaryAudioCount} events
                  </span>
                </div>
              </div>

              {/* Timestamped Audit Logs if any */}
              {proctoringStats.events.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-slate-800">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                    Recorded Incident Log ({proctoringStats.events.length})
                  </span>
                  <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1">
                    {proctoringStats.events.map((evt: any) => (
                      <div key={evt.id} className="p-2 rounded-xl bg-slate-800/50 border border-slate-700/40 text-[11px] flex items-center justify-between">
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
                * Note: Candidate is never disqualified automatically based on a single anomalous event. Overall score reflects weighted composite risk across all browser and biometric layers.
              </p>
            </div>

            {/* Action Recommendations */}
            <div className="p-6 rounded-2xl bg-indigo-50/60 border border-indigo-100 space-y-4">
              <h4 className="font-bold text-sm text-indigo-950">Recommended Next Steps</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Link
                  href="/practice?topic=Dynamic%20Programming&category=DSA"
                  className="p-3 rounded-xl bg-white border border-indigo-100 hover:shadow-md transition-all text-xs block"
                >
                  <p className="font-bold text-slate-800">Practice Weak Areas</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">Dynamic Programming 10 problems</p>
                </Link>
                <Link
                  href="/practice?topic=System%20Design&category=TECHNICAL"
                  className="p-3 rounded-xl bg-white border border-indigo-100 hover:shadow-md transition-all text-xs block"
                >
                  <p className="font-bold text-slate-800">System Design Basics</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">Scalability and caching patterns</p>
                </Link>
                <Link
                  href="/ai-avatar"
                  className="p-3 rounded-xl bg-rose-600 text-white hover:bg-rose-500 transition-all text-xs block"
                >
                  <p className="font-bold">Try AI Avatar Interview</p>
                  <p className="text-[11px] text-rose-100 mt-0.5">Take the full 100-minute session</p>
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
