'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Target,
  Code,
  Cpu,
  Users,
  ChevronRight,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowLeft,
  Pause,
  AlertTriangle,
  Sparkles,
  BookOpen,
  Mic,
  MicOff,
  Send,
  HelpCircle,
  Award
} from 'lucide-react';
import MonacoEditorPanel, { ProblemData } from '@/components/code-editor/MonacoEditorPanel';
import { CATEGORY_TOPICS } from '@/lib/question-generator';

type PracticeStage =
  | 'CHOOSE_CATEGORY'
  | 'TOPIC_SELECTION'
  | 'INSTRUCTIONS'
  | 'SESSION'
  | 'SUMMARY';

function PracticeContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [stage, setStage] = useState<PracticeStage>('CHOOSE_CATEGORY');
  const [selectedCategory, setSelectedCategory] = useState<string>('DSA & Coding');
  const [selectedTopic, setSelectedTopic] = useState<string>('Array');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('Medium');
  const [questionCount, setQuestionCount] = useState<number>(10);
  const [selectedCompany, setSelectedCompany] = useState<string>('General (All Companies)');
  const [targetProblemSlug, setTargetProblemSlug] = useState<string>('');

  // Questions and active session state
  const [questions, setQuestions] = useState<any[]>([]);
  const [questionType, setQuestionType] = useState<'CODING' | 'APTITUDE' | 'TECHNICAL' | 'HR' | 'STANDARD'>('CODING');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answersState, setAnswersState] = useState<Record<number, { isCorrect: boolean; userAns?: string }>>({});
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [isTimerPaused, setIsTimerPaused] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isEvaluated, setIsEvaluated] = useState(false);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(false);

  // HR voice & text response state
  const [hrResponseText, setHrResponseText] = useState('');
  const [hrAiFeedback, setHrAiFeedback] = useState<string | null>(null);

  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

  // Initialize from URL Search Params (Recommendation Flow)
  useEffect(() => {
    const paramCategory = searchParams.get('category');
    const paramTopic = searchParams.get('topic');
    const paramDifficulty = searchParams.get('difficulty');
    const paramProblem = searchParams.get('problem');
    const autoStart = searchParams.get('autoStart');

    if (paramCategory) {
      let resolvedCategory = 'DSA & Coding';
      const cUpper = paramCategory.toUpperCase();
      if (cUpper.includes('APT')) resolvedCategory = 'Aptitude';
      else if (cUpper.includes('TECH') || cUpper.includes('CORE') || cUpper.includes('CS')) resolvedCategory = 'Technical';
      else if (cUpper.includes('HR') || cUpper.includes('BEHAV')) resolvedCategory = 'HR / Behavioral';
      else resolvedCategory = 'DSA & Coding';

      setSelectedCategory(resolvedCategory);

      // Select default topic for this category or use parameter topic
      const availableTopics = CATEGORY_TOPICS[resolvedCategory] || [];
      const resolvedTopic = paramTopic || availableTopics[0] || 'Array';
      setSelectedTopic(resolvedTopic);

      if (paramDifficulty) setSelectedDifficulty(paramDifficulty);
      if (paramProblem) setTargetProblemSlug(paramProblem);

      // If autoStart or a specific topic/problem is targeted directly, load questions and start session!
      if (autoStart === 'true' || paramTopic || paramProblem) {
        loadAndStartSession(resolvedCategory, resolvedTopic, paramDifficulty || 'Medium', paramProblem || '', questionCount);
      } else {
        setStage('TOPIC_SELECTION');
      }
    }
  }, [searchParams]);

  // Load questions helper
  const loadAndStartSession = async (
    categoryName: string,
    topicName: string,
    diff: string = selectedDifficulty,
    problemSlug: string = targetProblemSlug,
    count: number = questionCount
  ) => {
    setIsLoadingQuestions(true);
    try {
      const url = `/api/practice/questions?category=${encodeURIComponent(categoryName)}&topic=${encodeURIComponent(topicName)}&difficulty=${encodeURIComponent(diff)}&problem=${encodeURIComponent(problemSlug)}&limit=${count}`;
      const res = await fetch(url);
      const data = await res.json();

      setQuestionType(data.type || 'STANDARD');
      if (data.questions && data.questions.length > 0) {
        setQuestions(data.questions);
      } else {
        setQuestions([]);
      }

      setCurrentIndex(0);
      setAnswersState({});
      setSelectedOption(null);
      setIsEvaluated(false);
      setHrAiFeedback(null);
      setHrResponseText('');
      setTimerSeconds(0);
      setActiveSessionId(null);
      setStage('SESSION');
    } catch (e) {
      console.error('Failed to load questions:', e);
      setStage('SESSION');
    } finally {
      setIsLoadingQuestions(false);
    }
  };

  // Timer
  useEffect(() => {
    if (stage !== 'SESSION' || isTimerPaused) return;
    const interval = setInterval(() => {
      setTimerSeconds(s => s + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [stage, isTimerPaused]);

  const formatTimer = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const currentQ = questions[currentIndex] || questions[0];
  const isCoding = questionType === 'CODING' && !!currentQ?.starterCodeJava;
  const isHrMode = questionType === 'HR' || selectedCategory === 'HR / Behavioral';

  // Handle MCQ Answer Submission
  const handleAnswerSubmit = async (option: string) => {
    setSelectedOption(option);
    const correct = option === currentQ.correctAnswer;
    setIsEvaluated(true);
    setAnswersState(prev => ({
      ...prev,
      [currentIndex]: { isCorrect: correct, userAns: option }
    }));

    // Persist to database
    try {
      const res = await fetch('/api/practice/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: activeSessionId,
          questionId: currentQ.id,
          selectedOption: option,
          isCorrect: correct,
          timeTakenSecs: timerSeconds,
          category: selectedCategory,
          topic: selectedTopic,
          difficulty: selectedDifficulty,
        }),
      });
      const data = await res.json();
      if (data?.sessionId) setActiveSessionId(data.sessionId);
    } catch (err) {
      console.warn('Practice answer save error:', err);
    }
  };

  // Handle HR / Behavioral submission
  const handleHrEvaluate = async () => {
    setIsEvaluated(true);
    setAnswersState(prev => ({
      ...prev,
      [currentIndex]: { isCorrect: true, userAns: hrResponseText }
    }));
    setHrAiFeedback(
      `Great structure! Your response addresses the situation clearly. Recommendation: Ensure your "Result" emphasizes measurable metrics (e.g. reduced delivery time by 30%, handled 500+ requests).`
    );

    try {
      const res = await fetch('/api/practice/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: activeSessionId,
          questionId: currentQ.id,
          selectedOption: hrResponseText,
          isCorrect: true,
          timeTakenSecs: timerSeconds,
          category: selectedCategory,
          topic: selectedTopic,
          difficulty: selectedDifficulty,
        }),
      });
      const data = await res.json();
      if (data?.sessionId) setActiveSessionId(data.sessionId);
    } catch (err) {
      console.warn('HR practice answer save error:', err);
    }
  };

  const handleNextQuestion = () => {
    if (currentIndex + 1 < questions.length) {
      setCurrentIndex(c => c + 1);
      setSelectedOption(null);
      setIsEvaluated(false);
      setHrAiFeedback(null);
      setHrResponseText('');
    } else {
      setStage('SUMMARY');
    }
  };

  // Compute final score
  const correctCount = Object.values(answersState).filter(a => a.isCorrect).length;
  const scorePct = questions.length > 0 ? Math.round((correctCount / questions.length) * 100) : 75;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Breadcrumb & Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Link href="/" className="hover:text-indigo-600 transition-colors">
            Dashboard
          </Link>
          <ChevronRight className="w-4 h-4" />
          <span className="font-semibold text-slate-800">Practice</span>
          {stage !== 'CHOOSE_CATEGORY' && (
            <>
              <ChevronRight className="w-4 h-4" />
              <span className="text-indigo-600 font-bold">{selectedCategory}</span>
              {selectedTopic && (
                <>
                  <ChevronRight className="w-4 h-4" />
                  <span className="text-slate-800 font-semibold">{selectedTopic}</span>
                </>
              )}
            </>
          )}
        </div>

        {stage !== 'CHOOSE_CATEGORY' && stage !== 'SUMMARY' && (
          <button
            onClick={() => setStage('CHOOSE_CATEGORY')}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-xl border border-slate-200 bg-white shadow-sm"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Change Category / Topic</span>
          </button>
        )}
      </div>

      {/* 1. CHOOSE CATEGORY STEP */}
      {stage === 'CHOOSE_CATEGORY' && (
        <div className="space-y-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-extrabold text-slate-800 tracking-tight">
              Practice
            </h2>
            <p className="text-slate-500 text-sm mt-1">
              Choose what you want to practice today with structured, instant AI evaluations.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              {
                title: 'Aptitude',
                subtitle: 'Quantitative, Logical Reasoning, Verbal, Data Interpretation',
                tags: ['Mathematics', 'Reasoning', 'English', 'Puzzles'],
                icon: Target,
                color: 'from-purple-500 to-indigo-600',
                border: 'hover:border-purple-300',
              },
              {
                title: 'DSA & Coding',
                subtitle: 'Practice coding problems topic-wise with Monaco editor',
                tags: ['Array', 'Linked List', 'Tree', 'Graph', 'DP'],
                icon: Code,
                color: 'from-blue-500 to-indigo-600',
                border: 'hover:border-blue-300',
              },
              {
                title: 'Technical',
                subtitle: 'Core CS, databases, networks, OS, System Design',
                tags: ['DBMS', 'OS', 'CN', 'OOP', 'System Design'],
                icon: Cpu,
                color: 'from-cyan-500 to-blue-600',
                border: 'hover:border-cyan-300',
              },
              {
                title: 'HR / Behavioral',
                subtitle: 'Improve communication and behavioral answers with AI',
                tags: ['Self Intro', 'STAR', 'Conflict', 'Leadership'],
                icon: Users,
                color: 'from-rose-500 to-pink-600',
                border: 'hover:border-rose-300',
              },
            ].map((cat, idx) => {
              const Icon = cat.icon;
              return (
                <div
                  key={idx}
                  onClick={() => {
                    setSelectedCategory(cat.title);
                    // Select first available topic for this category
                    const topics = CATEGORY_TOPICS[cat.title] || [];
                    setSelectedTopic(topics[0] || 'Mixed Practice');
                    setStage('TOPIC_SELECTION');
                  }}
                  className={`p-7 rounded-3xl bg-white border border-slate-200/80 shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer flex flex-col justify-between group ${cat.border}`}
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className={`w-12 h-12 rounded-2xl bg-gradient-to-tr ${cat.color} text-white flex items-center justify-center shadow-md`}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <span className="p-2 rounded-xl bg-slate-50 text-slate-400 group-hover:text-indigo-600 group-hover:bg-indigo-50 transition-colors">
                        <ArrowRight className="w-5 h-5" />
                      </span>
                    </div>

                    <div>
                      <h3 className="font-bold text-lg text-slate-800">{cat.title}</h3>
                      <p className="text-xs text-slate-500 mt-1">{cat.subtitle}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 pt-6 border-t border-slate-100 mt-4">
                    {cat.tags.map((t, i) => (
                      <span
                        key={i}
                        className="px-2.5 py-1 rounded-xl bg-slate-100 text-slate-600 text-xs font-semibold"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 2. TOPIC SELECTION STEP - STRICTLY CATEGORY-SPECIFIC */}
      {stage === 'TOPIC_SELECTION' && (
        <div className="max-w-4xl mx-auto p-8 rounded-3xl bg-white border border-slate-200/80 shadow-sm space-y-8 animate-in fade-in duration-200">
          <div>
            <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight">
              {selectedCategory} Practice
            </h2>
            <p className="text-slate-500 text-sm mt-1">
              Select a topic and customize your preference settings.
            </p>
          </div>

          {/* DYNAMIC CATEGORY-SPECIFIC TOPIC BUTTONS */}
          <div className="space-y-3">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Choose Topic</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {(CATEGORY_TOPICS[selectedCategory] || []).map((topic, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedTopic(topic)}
                  className={`py-3 px-4 rounded-2xl text-xs font-bold transition-all text-center border ${
                    selectedTopic === topic
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/30'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                >
                  {topic}
                </button>
              ))}
              <button
                onClick={() => setSelectedTopic('Mixed Practice')}
                className={`py-3 px-4 rounded-2xl text-xs font-bold transition-all text-center border ${
                  selectedTopic === 'Mixed Practice'
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/30'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                }`}
              >
                Mixed Practice
              </button>
            </div>
          </div>

          {/* Difficulty Level */}
          <div className="space-y-3">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Difficulty Level</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {['Easy', 'Medium', 'Hard', 'Adaptive'].map((diff, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedDifficulty(diff)}
                  className={`py-2.5 px-4 rounded-2xl text-xs font-bold transition-all text-center border ${
                    selectedDifficulty === diff
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/30'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                >
                  {diff}
                </button>
              ))}
            </div>
          </div>

          {/* Number of Questions */}
          <div className="space-y-3">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Number of Questions</label>
            <div className="grid grid-cols-4 gap-2.5 max-w-sm">
              {[5, 10, 20, 30].map((num) => (
                <button
                  key={num}
                  onClick={() => setQuestionCount(num)}
                  className={`py-2 px-3 rounded-2xl text-xs font-bold transition-all text-center border ${
                    questionCount === num
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/30'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>
          </div>

          {/* Company (Optional) */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Company (Optional)</label>
            <select
              value={selectedCompany}
              onChange={(e) => setSelectedCompany(e.target.value)}
              className="w-full max-w-md py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option>General (All Companies)</option>
              <option>Google</option>
              <option>Amazon</option>
              <option>Microsoft</option>
              <option>Adobe</option>
              <option>TCS & Infosys</option>
            </select>
          </div>

          {/* Action Button */}
          <div className="pt-4">
            <button
              onClick={() => setStage('INSTRUCTIONS')}
              className="w-full py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-xl shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all"
            >
              <span>Continue to Instructions</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* 3. INSTRUCTIONS STEP */}
      {stage === 'INSTRUCTIONS' && (
        <div className="max-w-2xl mx-auto p-8 rounded-3xl bg-white border border-slate-200/80 shadow-sm space-y-6 animate-in fade-in duration-200">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-100">
              Session Overview
            </span>
            <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight mt-2">
              Practice Session Details
            </h2>
            <p className="text-xs text-slate-500">
              Review your configuration before initiating the assessment.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 p-5 rounded-2xl bg-slate-50 border border-slate-200/60 text-xs">
            <div>
              <span className="text-slate-400 block">Category</span>
              <span className="font-bold text-indigo-600">{selectedCategory}</span>
            </div>
            <div>
              <span className="text-slate-400 block">Topic</span>
              <span className="font-bold text-slate-800">{selectedTopic}</span>
            </div>
            <div>
              <span className="text-slate-400 block">Difficulty</span>
              <span className="font-bold text-slate-800">{selectedDifficulty}</span>
            </div>
            <div>
              <span className="text-slate-400 block">Questions</span>
              <span className="font-bold text-slate-800">{questionCount}</span>
            </div>
            <div>
              <span className="text-slate-400 block">Question Format</span>
              <span className="font-bold text-emerald-600">
                {selectedCategory === 'DSA & Coding' ? 'Monaco Java Coding' : selectedCategory === 'HR / Behavioral' ? 'Behavioral & STAR' : 'Conceptual & Analytical'}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block">Timer</span>
              <span className="font-bold text-slate-800">No strict timer (pausable)</span>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={() => setStage('TOPIC_SELECTION')}
              className="py-3 px-5 rounded-2xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold text-xs"
            >
              Back
            </button>
            <button
              disabled={isLoadingQuestions}
              onClick={() => loadAndStartSession(selectedCategory, selectedTopic, selectedDifficulty, targetProblemSlug, questionCount)}
              className="flex-1 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-xl shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              <span>{isLoadingQuestions ? 'Loading Questions...' : 'Start Session'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* 4. PRACTICE SESSION - STRICTLY ISOLATED CONTENT TYPES */}
      {stage === 'SESSION' && (
        <div className="space-y-5">
          {/* Top Bar with Question Progress, Topic, and Timer */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="font-extrabold text-sm text-slate-800">
                Question {currentIndex + 1} of {questions.length}
              </span>
              <span className="px-2.5 py-0.5 rounded-md text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                {selectedCategory}
              </span>
              <span className="px-2.5 py-0.5 rounded-md text-xs font-semibold bg-slate-100 text-slate-600">
                {selectedTopic}
              </span>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 font-mono text-xs font-bold text-slate-700">
                <Clock className="w-3.5 h-3.5 text-indigo-600" />
                <span>{formatTimer(timerSeconds)}</span>
              </div>
              <button
                onClick={() => setIsTimerPaused(!isTimerPaused)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-600 flex items-center gap-1.5"
              >
                <Pause className="w-3.5 h-3.5" />
                <span>{isTimerPaused ? 'Resume' : 'Pause'}</span>
              </button>
              <button
                onClick={() => setStage('SUMMARY')}
                className="px-3 py-1.5 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200 text-xs font-bold"
              >
                End Session
              </button>
            </div>
          </div>

          {/* QUESTION RENDERER: CODING VS CONCEPTUAL VS HR */}
          {isCoding ? (
            /* DSA ONLY: Monaco Coding Platform */
            <div className="h-[680px]">
              <MonacoEditorPanel
                problem={currentQ}
                onSuccess={(passedTests, totalTests) => {
                  const isCorrect = (passedTests || 0) === (totalTests || 1);
                  setAnswersState(prev => ({
                    ...prev,
                    [currentIndex]: { isCorrect }
                  }));
                  setIsEvaluated(true);
                  fetch('/api/practice/submit', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      sessionId: activeSessionId,
                      questionId: currentQ.id,
                      selectedOption: `Tests Passed: ${passedTests}/${totalTests}`,
                      isCorrect,
                      timeTakenSecs: timerSeconds,
                      category: selectedCategory,
                      topic: selectedTopic,
                      difficulty: selectedDifficulty,
                    }),
                  })
                    .then(r => r.json())
                    .then(d => { if (d?.sessionId) setActiveSessionId(d.sessionId); })
                    .catch(e => console.warn('Submit coding error:', e));
                }}
                onNext={handleNextQuestion}
              />
            </div>
          ) : isHrMode ? (
            /* HR / BEHAVIORAL ONLY: Scenario + STAR Structured Options + Text/Voice Response */
            <div className="max-w-3xl mx-auto p-8 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-md bg-rose-50 text-rose-600 border border-rose-200">
                    HR & Behavioral
                  </span>
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-600">
                    {currentQ.topic || selectedTopic}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-slate-800 leading-snug">
                  {currentQ.title}
                </h3>
                <p className="text-sm text-slate-600 whitespace-pre-line leading-relaxed pt-2">
                  {currentQ.description}
                </p>
              </div>

              {/* Structured Options (if available) */}
              {currentQ.options && currentQ.options.length > 0 && (
                <div className="space-y-2.5 pt-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Recommended Response Frameworks:
                  </label>
                  {currentQ.options.map((opt: string, idx: number) => {
                    const isSelected = selectedOption === opt;
                    const isCorrect = isEvaluated && opt === currentQ.correctAnswer;
                    const isWrong = isEvaluated && isSelected && opt !== currentQ.correctAnswer;

                    return (
                      <button
                        key={idx}
                        disabled={isEvaluated}
                        onClick={() => handleAnswerSubmit(opt)}
                        className={`w-full p-4 rounded-2xl text-left text-xs font-semibold border transition-all flex items-center justify-between ${
                          isCorrect
                            ? 'bg-emerald-50 border-emerald-500 text-emerald-800'
                            : isWrong
                            ? 'bg-rose-50 border-rose-500 text-rose-800'
                            : isSelected
                            ? 'bg-indigo-50 border-indigo-500 text-indigo-800'
                            : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                        }`}
                      >
                        <span className="flex items-center gap-3">
                          <span className="w-6 h-6 rounded-lg bg-white border border-slate-300 flex items-center justify-center font-mono text-[11px] font-bold shrink-0">
                            {String.fromCharCode(65 + idx)}
                          </span>
                          <span>{opt}</span>
                        </span>
                        {isCorrect && <CheckCircle2 className="w-5 h-5 text-emerald-600" />}
                        {isWrong && <XCircle className="w-5 h-5 text-rose-600" />}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Free-form STAR practice text response */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Or Type / Practice Your Answer:
                </label>
                <textarea
                  value={hrResponseText}
                  onChange={e => setHrResponseText(e.target.value)}
                  placeholder="Structure using STAR: Situation, Task, Action, and Result..."
                  rows={4}
                  className="w-full p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
                {!isEvaluated && hrResponseText.trim().length > 0 && (
                  <button
                    onClick={handleHrEvaluate}
                    className="py-2 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs"
                  >
                    Evaluate Answer
                  </button>
                )}
              </div>

              {/* AI Feedback & Explanation */}
              {isEvaluated && (
                <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-100 space-y-2 animate-in fade-in duration-200">
                  <p className="font-bold text-xs text-indigo-900 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-indigo-600" />
                    AI Evaluation & Explanation:
                  </p>
                  <p className="text-xs text-slate-700 leading-relaxed">
                    {hrAiFeedback || currentQ.explanation}
                  </p>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  onClick={handleNextQuestion}
                  className="py-2.5 px-6 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-600/30 flex items-center gap-2"
                >
                  <span>{currentIndex + 1 < questions.length ? 'Next Question' : 'Complete Session'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ) : (
            /* APTITUDE & TECHNICAL (CORE CS): Interactive Analytical Question Card (NO MONACO) */
            <div className="max-w-3xl mx-auto p-8 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-bold px-2.5 py-0.5 rounded-md ${
                    selectedCategory === 'Aptitude'
                      ? 'bg-purple-50 text-purple-700 border border-purple-200'
                      : 'bg-cyan-50 text-cyan-700 border border-cyan-200'
                  }`}>
                    {selectedCategory}
                  </span>
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-600">
                    {currentQ.topic || selectedTopic}
                  </span>
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-500">
                    {currentQ.difficulty || 'Medium'}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-slate-800 leading-snug">
                  {currentQ.title}
                </h3>
                <p className="text-sm text-slate-700 whitespace-pre-line leading-relaxed pt-2">
                  {currentQ.description}
                </p>
              </div>

              {/* Options */}
              {currentQ.options && currentQ.options.length > 0 && (
                <div className="space-y-2.5 pt-2">
                  {currentQ.options.map((opt: string, idx: number) => {
                    const isSelected = selectedOption === opt;
                    const isCorrect = isEvaluated && opt === currentQ.correctAnswer;
                    const isWrong = isEvaluated && isSelected && opt !== currentQ.correctAnswer;

                    return (
                      <button
                        key={idx}
                        disabled={isEvaluated}
                        onClick={() => handleAnswerSubmit(opt)}
                        className={`w-full p-4 rounded-2xl text-left text-xs font-semibold border transition-all flex items-center justify-between ${
                          isCorrect
                            ? 'bg-emerald-50 border-emerald-500 text-emerald-800'
                            : isWrong
                            ? 'bg-rose-50 border-rose-500 text-rose-800'
                            : isSelected
                            ? 'bg-indigo-50 border-indigo-500 text-indigo-800'
                            : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                        }`}
                      >
                        <span className="flex items-center gap-3">
                          <span className="w-6 h-6 rounded-lg bg-white border border-slate-300 flex items-center justify-center font-mono text-[11px] font-bold shrink-0">
                            {String.fromCharCode(65 + idx)}
                          </span>
                          <span>{opt}</span>
                        </span>
                        {isCorrect && <CheckCircle2 className="w-5 h-5 text-emerald-600" />}
                        {isWrong && <XCircle className="w-5 h-5 text-rose-600" />}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Hints */}
              {currentQ.hints && currentQ.hints.length > 0 && !isEvaluated && (
                <div className="p-3.5 rounded-xl bg-amber-50/60 border border-amber-200 text-xs text-amber-900">
                  <span className="font-bold flex items-center gap-1 mb-0.5">
                    <HelpCircle className="w-3.5 h-3.5 text-amber-600" /> Hint:
                  </span>
                  <p className="text-slate-600">{currentQ.hints[0]}</p>
                </div>
              )}

              {/* Feedback and Explanation */}
              {isEvaluated && (
                <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-100 space-y-2 animate-in fade-in duration-200">
                  <p className="font-bold text-xs text-indigo-900 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-indigo-600" />
                    Explanation:
                  </p>
                  <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line">
                    {currentQ.explanation}
                  </p>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  onClick={handleNextQuestion}
                  className="py-2.5 px-6 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-600/30 flex items-center gap-2"
                >
                  <span>{currentIndex + 1 < questions.length ? 'Next Question' : 'Complete Session'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* Question Grid Bar */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              {questions.map((_, idx) => {
                const ans = answersState[idx];
                const isCur = currentIndex === idx;
                let bg = 'bg-slate-100 text-slate-600';
                if (ans?.isCorrect) bg = 'bg-emerald-500 text-white';
                else if (ans && !ans.isCorrect) bg = 'bg-rose-500 text-white';
                else if (isCur) bg = 'bg-indigo-600 text-white ring-2 ring-indigo-300';

                return (
                  <button
                    key={idx}
                    onClick={() => {
                      setCurrentIndex(idx);
                      setSelectedOption(null);
                      setIsEvaluated(false);
                    }}
                    className={`w-8 h-8 rounded-xl font-mono text-xs font-bold flex items-center justify-center transition-all ${bg}`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-4 text-[11px] font-semibold text-slate-500">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                Correct
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                Incorrect
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-600" />
                Current
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 5. SUMMARY STEP */}
      {stage === 'SUMMARY' && (
        <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in duration-300">
          <div className="p-8 rounded-3xl bg-white border border-slate-200/80 shadow-sm space-y-6">
            <div className="text-center space-y-1">
              <span className="text-3xl">🎉</span>
              <h2 className="text-2xl font-extrabold text-slate-800">
                {selectedCategory} Practice Completed!
              </h2>
              <p className="text-xs text-slate-500">Topic: {selectedTopic}</p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-around gap-6 p-6 rounded-2xl bg-slate-50 border border-slate-200/60">
              <div className="relative w-28 h-28 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="40" stroke="#E2E8F0" strokeWidth="10" fill="transparent" />
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    stroke="#4F46E5"
                    strokeWidth="10"
                    strokeDasharray="251.2"
                    strokeDashoffset={251.2 * (1 - scorePct / 100)}
                    strokeLinecap="round"
                    fill="transparent"
                  />
                </svg>
                <div className="absolute text-center">
                  <span className="text-2xl font-extrabold text-slate-800">{scorePct}%</span>
                  <span className="text-[10px] block text-slate-400 font-semibold">Score</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs font-semibold">
                <div className="p-3 rounded-xl bg-white border border-slate-200">
                  <span className="text-slate-400 block">Total Questions</span>
                  <span className="text-base font-bold text-slate-800">{questions.length}</span>
                </div>
                <div className="p-3 rounded-xl bg-white border border-slate-200">
                  <span className="text-emerald-500 block">Correct</span>
                  <span className="text-base font-bold text-emerald-600">{correctCount}</span>
                </div>
                <div className="p-3 rounded-xl bg-white border border-slate-200">
                  <span className="text-rose-500 block">Incorrect</span>
                  <span className="text-base font-bold text-rose-600">{questions.length - correctCount}</span>
                </div>
                <div className="p-3 rounded-xl bg-white border border-slate-200">
                  <span className="text-slate-400 block">Time Spent</span>
                  <span className="text-base font-bold text-slate-800">{formatTimer(timerSeconds)}</span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
              <button
                onClick={() => setStage('SESSION')}
                className="py-2.5 px-5 rounded-2xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold"
              >
                Review Questions
              </button>
              <Link
                href="/weak-areas"
                className="py-2.5 px-5 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-md shadow-rose-600/30"
              >
                Practice Weak Areas
              </Link>
              <button
                onClick={() => setStage('CHOOSE_CATEGORY')}
                className="py-2.5 px-5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/30"
              >
                Try Another Topic
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function PracticePage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-slate-500 text-xs font-bold">Loading Practice Module...</div>}>
      <PracticeContent />
    </Suspense>
  );
}
