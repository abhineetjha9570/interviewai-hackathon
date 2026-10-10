'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import {
  Play,
  Send,
  RotateCcw,
  Lightbulb,
  CheckCircle2,
  XCircle,
  AlertOctagon,
  Clock,
  Cpu,
  ChevronRight,
  Maximize2,
  Terminal,
  HelpCircle,
  Code2
} from 'lucide-react';

// Dynamic import for Monaco to prevent SSR issues
const Editor = dynamic(() => import('@monaco-editor/react'), { ssr: false });

export interface ProblemData {
  id: string;
  title: string;
  slug: string;
  difficulty: string;
  tags: string[];
  description: string;
  examples: Array<{
    input: string;
    output: string;
    explanation?: string;
  }>;
  constraints: string[];
  hints: string[];
  explanation?: string;
  starterCodeJava: string;
  solutionJava?: string;
}

interface MonacoEditorPanelProps {
  problem: ProblemData;
  onSuccess?: (passedTests?: number, totalTests?: number) => void;
  onNext?: () => void;
  isInterviewMode?: boolean;
}

export default function MonacoEditorPanel({
  problem,
  onSuccess,
  onNext,
  isInterviewMode = false,
}: MonacoEditorPanelProps) {
  const [code, setCode] = useState(problem.starterCodeJava);
  const [language, setLanguage] = useState<'java' | 'python'>('java');
  const [isRunning, setIsRunning] = useState(false);
  const [activeTab, setActiveTab] = useState<'PROBLEM' | 'SOLUTION' | 'HINTS'>('PROBLEM');
  const [selectedTestCaseIndex, setSelectedTestCaseIndex] = useState(0);
  const [activeBottomTab, setActiveBottomTab] = useState<'TESTCASES' | 'CONSOLE'>('TESTCASES');
  const [showHintIndex, setShowHintIndex] = useState(-1);

  // Sync editor when problem changes
  React.useEffect(() => {
    setCode(problem.starterCodeJava || '');
    setExecResult(null);
  }, [problem]);

  // Execution result state
  const [execResult, setExecResult] = useState<{
    status: 'ACCEPTED' | 'WRONG_ANSWER' | 'COMPILATION_ERROR' | 'RUNTIME_ERROR' | 'TIME_LIMIT_EXCEEDED' | null;
    passedTestCases: number;
    totalTestCases: number;
    runtimeMs: number;
    memoryKb: number;
    output: string;
    errorMessage?: string;
    testCaseResults: Array<{
      input: string;
      expected: string;
      actual: string;
      passed: boolean;
      hidden?: boolean;
    }>;
  } | null>(null);

  // Execute Code using Backend API
  const handleRunCode = async (isSubmit: boolean = false) => {
    setIsRunning(true);
    setActiveBottomTab('CONSOLE');

    try {
      const res = await fetch('/api/code/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          problemSlug: problem.slug,
          language,
        }),
      });

      const data = await res.json();
      setExecResult(data);

      if (isSubmit && onSuccess) {
        onSuccess(data.passedTestCases || 0, data.totalTestCases || 1);
      }
    } catch (err: any) {
      setExecResult({
        status: 'RUNTIME_ERROR',
        passedTestCases: 0,
        totalTestCases: 0,
        runtimeMs: 0,
        memoryKb: 0,
        output: '',
        errorMessage: err.message || 'Execution failed',
        testCaseResults: [],
      });
    } finally {
      setIsRunning(false);
    }
  };

  const handleReset = () => {
    setCode(problem.starterCodeJava);
    setExecResult(null);
  };

  const getDifficultyBadge = (diff: string) => {
    switch (diff) {
      case 'Easy':
        return 'text-emerald-400 bg-emerald-950/60 border-emerald-800/60';
      case 'Medium':
        return 'text-amber-400 bg-amber-950/60 border-amber-800/60';
      case 'Hard':
        return 'text-rose-400 bg-rose-950/60 border-rose-800/60';
      default:
        return 'text-indigo-400 bg-indigo-950/60 border-indigo-800/60';
    }
  };

  return (
    <div className="flex flex-col lg:flex-row h-full w-full bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
      {/* LEFT PANEL: Problem Statement & Explanations */}
      <div className="w-full lg:w-1/2 flex flex-col border-b lg:border-b-0 lg:border-r border-slate-800 bg-[#0B1120] text-slate-200 overflow-hidden">
        {/* Left Tabs Bar */}
        <div className="h-12 border-b border-slate-800 px-4 flex items-center justify-between bg-slate-950/70">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('PROBLEM')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'PROBLEM' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              Description
            </button>
            {!isInterviewMode ? (
              <>
                <button
                  onClick={() => setActiveTab('SOLUTION')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    activeTab === 'SOLUTION' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Solution Approach
                </button>
                <button
                  onClick={() => setActiveTab('HINTS')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    activeTab === 'HINTS' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Hints ({problem.hints.length})
                </button>
              </>
            ) : (
              <span className="text-[10px] font-bold text-amber-400 bg-amber-950/50 px-2.5 py-0.5 rounded-lg border border-amber-800/40">
                🔒 Proctored Mode: Hints & Solutions Locked
              </span>
            )}
          </div>
        </div>

        {/* Left Scrollable Content */}
        <div
          onContextMenu={(e) => isInterviewMode && e.preventDefault()}
          onCopy={(e) => isInterviewMode && e.preventDefault()}
          className={`flex-1 p-6 overflow-y-auto space-y-5 text-sm ${isInterviewMode ? 'select-none pointer-events-auto' : ''}`}
        >
          {activeTab === 'PROBLEM' && (
            <>
              <div>
                <h3 className="text-xl font-bold text-white mb-2">{problem.title}</h3>
                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-0.5 rounded-md text-xs font-bold border ${getDifficultyBadge(problem.difficulty)}`}>
                    {problem.difficulty}
                  </span>
                  {problem.tags.map((tag, i) => (
                    <span key={i} className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 text-xs font-medium border border-slate-700">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              <div className="text-slate-300 whitespace-pre-line leading-relaxed">
                {problem.description}
              </div>

              {/* Examples */}
              <div className="space-y-3">
                <h4 className="font-bold text-white text-xs uppercase tracking-wider text-slate-400">Examples</h4>
                {problem.examples.map((ex, idx) => (
                  <div key={idx} className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1.5 text-xs font-mono">
                    <p className="text-slate-400 font-semibold">Example {idx + 1}:</p>
                    <p><strong className="text-indigo-400 font-normal">Input:</strong> <span className="text-slate-200">{ex.input}</span></p>
                    <p><strong className="text-emerald-400 font-normal">Output:</strong> <span className="text-slate-200">{ex.output}</span></p>
                    {ex.explanation && (
                      <p className="text-slate-400 font-sans text-xs pt-1"><strong className="text-slate-300">Explanation:</strong> {ex.explanation}</p>
                    )}
                  </div>
                ))}
              </div>

              {/* Constraints */}
              <div className="space-y-2">
                <h4 className="font-bold text-white text-xs uppercase tracking-wider text-slate-400">Constraints</h4>
                <ul className="list-disc list-inside text-xs font-mono text-slate-400 space-y-1 pl-1">
                  {problem.constraints.map((c, i) => (
                    <li key={i}>{c}</li>
                  ))}
                </ul>
              </div>
            </>
          )}

          {activeTab === 'SOLUTION' && (
            <div className="space-y-4">
              <h3 className="font-bold text-base text-white">Optimal Approach & Complexity Analysis</h3>
              <p className="text-slate-300 leading-relaxed text-xs">
                {problem.explanation || 'Detailed algorithmic solution analysis.'}
              </p>
              {problem.solutionJava && (
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-slate-300 overflow-x-auto">
                  <pre>{problem.solutionJava}</pre>
                </div>
              )}
            </div>
          )}

          {activeTab === 'HINTS' && (
            <div className="space-y-3">
              <h3 className="font-bold text-base text-white">Problem Hints</h3>
              {problem.hints.map((hint, idx) => (
                <div key={idx} className="p-4 rounded-xl bg-slate-900 border border-slate-800">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-xs text-indigo-400">Hint {idx + 1}</span>
                    <button
                      onClick={() => setShowHintIndex(showHintIndex === idx ? -1 : idx)}
                      className="text-xs text-slate-400 hover:text-white underline"
                    >
                      {showHintIndex === idx ? 'Hide' : 'Reveal'}
                    </button>
                  </div>
                  {showHintIndex === idx ? (
                    <p className="text-xs text-slate-300">{hint}</p>
                  ) : (
                    <p className="text-xs text-slate-600 italic">Click reveal to view hint</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* RIGHT PANEL: Professional Monaco Editor & Execution Console */}
      <div className="w-full lg:w-1/2 flex flex-col bg-slate-950 text-slate-100 overflow-hidden">
        {/* Editor Controls Bar */}
        <div className="h-12 border-b border-slate-800 px-4 flex items-center justify-between bg-slate-950">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-xs text-indigo-400 font-mono font-bold">
              <Code2 className="w-3.5 h-3.5" />
              <span>Java 24</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleReset}
              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
              title="Reset Code"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleRunCode(false)}
              disabled={isRunning}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-all disabled:opacity-50"
            >
              <Play className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400" />
              <span>{isRunning ? 'Compiling...' : 'Run Code'}</span>
            </button>
            <button
              onClick={() => handleRunCode(true)}
              disabled={isRunning}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-md shadow-indigo-600/30 disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Submit</span>
            </button>
          </div>
        </div>

        {/* Monaco Editor Canvas */}
        <div className="flex-1 min-h-[340px] relative">
          <Editor
            height="100%"
            language="java"
            theme="vs-dark"
            value={code}
            onChange={(val) => setCode(val || '')}
            options={{
              minimap: { enabled: false },
              fontSize: 13,
              scrollBeyondLastLine: false,
              automaticLayout: true,
              tabSize: 4,
              wordWrap: 'on',
              lineNumbers: 'on',
              folding: true,
              bracketPairColorization: { enabled: true },
              contextmenu: !isInterviewMode,
            }}
          />
        </div>

        {/* BOTTOM: Test Results & Execution Console */}
        <div className="h-64 border-t border-slate-800 bg-[#0B1120] flex flex-col">
          {/* Console Header Tabs */}
          <div className="h-9 border-b border-slate-800 px-4 flex items-center justify-between bg-slate-950/80">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setActiveBottomTab('TESTCASES')}
                className={`text-xs font-semibold flex items-center gap-1.5 ${
                  activeBottomTab === 'TESTCASES' ? 'text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" />
                <span>Test Cases</span>
              </button>
              <button
                onClick={() => setActiveBottomTab('CONSOLE')}
                className={`text-xs font-semibold flex items-center gap-1.5 ${
                  activeBottomTab === 'CONSOLE' ? 'text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Terminal className="w-3.5 h-3.5 text-indigo-400" />
                <span>Console Output</span>
              </button>
            </div>

            {execResult && (
              <div className="flex items-center gap-3 text-xs font-mono">
                <span
                  className={`font-bold ${
                    execResult.status === 'ACCEPTED'
                      ? 'text-emerald-400'
                      : execResult.status === 'COMPILATION_ERROR'
                      ? 'text-rose-400'
                      : 'text-amber-400'
                  }`}
                >
                  {execResult.status === 'ACCEPTED'
                    ? `Passed (${execResult.passedTestCases}/${execResult.totalTestCases})`
                    : execResult.status}
                </span>
                <span className="text-slate-500">·</span>
                <span className="text-slate-400 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {execResult.runtimeMs} ms
                </span>
              </div>
            )}
          </div>

          {/* Console Body */}
          <div className="flex-1 p-4 overflow-y-auto font-mono text-xs space-y-3">
            {execResult ? (
              <>
                {execResult.errorMessage && (
                  <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-800/60 text-rose-300 whitespace-pre-wrap">
                    <p className="font-bold flex items-center gap-1.5 mb-1">
                      <AlertOctagon className="w-4 h-4 text-rose-400" />
                      Execution Error:
                    </p>
                    {execResult.errorMessage}
                  </div>
                )}

                {/* Test case tabs & results */}
                {execResult.testCaseResults && execResult.testCaseResults.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      {execResult.testCaseResults.map((tc, idx) => (
                        <button
                          key={idx}
                          onClick={() => setSelectedTestCaseIndex(idx)}
                          className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                            selectedTestCaseIndex === idx
                              ? 'bg-slate-800 text-white border border-slate-700'
                              : 'text-slate-400 hover:bg-slate-900'
                          }`}
                        >
                          {tc.passed ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <XCircle className="w-3.5 h-3.5 text-rose-400" />
                          )}
                          <span>Case {idx + 1}</span>
                        </button>
                      ))}
                    </div>

                    {execResult.testCaseResults[selectedTestCaseIndex] && (
                      <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                        <div>
                          <p className="text-slate-500 text-[11px]">Input:</p>
                          <p className="text-slate-200">{execResult.testCaseResults[selectedTestCaseIndex].input}</p>
                        </div>
                        <div>
                          <p className="text-slate-500 text-[11px]">Expected Output:</p>
                          <p className="text-emerald-400">{execResult.testCaseResults[selectedTestCaseIndex].expected}</p>
                        </div>
                        <div>
                          <p className="text-slate-500 text-[11px]">Your Output:</p>
                          <p className={execResult.testCaseResults[selectedTestCaseIndex].passed ? 'text-emerald-400' : 'text-rose-400'}>
                            {execResult.testCaseResults[selectedTestCaseIndex].actual}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-1">
                <Play className="w-5 h-5 text-slate-600 mb-1" />
                <p>Click "Run Code" to compile and execute against test cases</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
