'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  FileText,
  Upload,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Download,
  Share2,
  ChevronRight,
  ArrowRight,
  FileCheck,
  FileCode,
  Layout,
  RefreshCw,
  Plus
} from 'lucide-react';
import { AtsAnalysisResult } from '@/lib/ats-scanner';

type ResumeStep = 'UPLOAD' | 'PROCESSING' | 'REPORT';

const sampleResumes = [
  {
    role: 'Software Engineer',
    name: 'Abhineet_Resume.pdf',
    text: `Abhineet Jha\nNoida, India | +91 9876543210 | abhineet@interviewai.com\n\nEDUCATION\nB.Tech in Computer Science Engineering (Data Science) | NIET, Greater Noida (2024 - 2028) | CGPA: 7.48\n\nSKILLS\nLanguages: Java, Python, C++, JavaScript\nWeb: HTML, CSS, React, Node.js\nDatabase: SQL, MySQL\nCore: DSA, OOP, DBMS, Computer Networks\n\nPROJECTS\n1. University Management System (Python, Tkinter)\n- Developed desktop application to manage student, faculty, and admin modules.\n2. Netflix Clone (HTML, CSS, JavaScript)\n- Built responsive web application with UI similar to Netflix.`,
  },
  {
    role: 'Backend Developer',
    name: 'Backend_Resume.pdf',
    text: `Candidate\nBackend Specialist | +91 9999999999 | backend@interviewai.com\n\nSKILLS\nJava, Spring Boot, MySQL, PostgreSQL, Redis, REST APIs, Microservices, Docker, Git, CI/CD, Problem Solving\n\nEXPERIENCE\nBackend Intern at TechCorp\n- Designed REST APIs handling 5,000+ requests per minute.\n- Optimized SQL queries and database indexes reducing latency by 40%.`,
  },
  {
    role: 'Frontend Developer',
    name: 'Frontend_Resume.pdf',
    text: `Candidate\nFrontend Engineer | frontend@interviewai.com\n\nSKILLS\nJavaScript, TypeScript, React, Next.js, Tailwind CSS, Redux, HTML5, CSS3, Webpack, Responsive Design\n\nPROJECTS\nE-Commerce Dashboard\n- Built full-featured admin dashboard with real-time analytics charts and state management.`,
  },
  {
    role: 'Data Analyst',
    name: 'DataAnalyst_Resume.pdf',
    text: `Candidate\nData Analyst | data@interviewai.com\n\nSKILLS\nPython, SQL, Pandas, NumPy, Tableau, Power BI, Excel, Statistics, Machine Learning, Data Visualization`,
  },
];

export default function ResumeAtsPage() {
  const [step, setStep] = useState<ResumeStep>('REPORT'); // default report to match dashboard
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'PREVIEW' | 'KEYWORDS' | 'OPTIMIZED' | 'DETAILS'>('OVERVIEW');
  const [previewSubTab, setPreviewSubTab] = useState<'ORIGINAL' | 'HIGHLIGHTED'>('HIGHLIGHTED');
  const [resumeText, setResumeText] = useState(sampleResumes[0].text);
  const [fileName, setFileName] = useState('Abhineet_Resume.pdf');
  const [selectedTemplate, setSelectedTemplate] = useState('ATS Friendly');
  const [analysis, setAnalysis] = useState<AtsAnalysisResult | null>(null);

  // Load initial analysis from server
  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch('/api/resume/analyze');
        const json = await res.json();
        if (json.analysis) {
          setAnalysis(json.analysis);
        }
      } catch (e) {
        console.error(e);
      }
    }
    loadData();
  }, []);

  const handleProcessResume = async (text: string, fName: string) => {
    setResumeText(text);
    setFileName(fName);
    setStep('PROCESSING');

    try {
      const res = await fetch('/api/resume/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rawText: text, fileName: fName }),
      });
      const data = await res.json();
      setTimeout(() => {
        setAnalysis(data.analysis);
        setStep('REPORT');
        setActiveTab('OVERVIEW');
      }, 1500);
    } catch (e) {
      setTimeout(() => {
        setStep('REPORT');
      }, 1500);
    }
  };

  const currentAnalysis = analysis || {
    atsScore: 78,
    formatScore: 85,
    keywordScore: 70,
    skillsScore: 80,
    experienceScore: 75,
    achievementsScore: 60,
    parsingSuccess: 100,
    foundKeywords: ['Java', 'Python', 'C++', 'JavaScript', 'HTML', 'CSS', 'SQL', 'DSA', 'OOP', 'DBMS'],
    missingKeywords: ['System Design', 'Database Management', 'Problem Solving', 'Team Collaboration', 'Leadership', 'Cloud (AWS / Azure)'],
    relevantKeywordsCount: 40,
    suggestions: [
      'Add relevant system design experience (even as a project architectural diagram).',
      'Mention specific database technologies (e.g. MySQL, PostgreSQL, Redis).',
      'Highlight problem-solving in projects with quantifiable metrics.',
      'Add teamwork or collaboration experience from hackathons or internships.',
      'Include leadership roles (e.g. team lead, event coordinator).'
    ],
    strengths: ['Clear education section', 'Good project details', 'Relevant technical skills'],
    areasToImprove: ['Add more quantifiable achievements', 'Include missing keywords', 'Improve format and structure'],
    optimizedResumeText: sampleResumes[0].text,
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header & Breadcrumb */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Link href="/" className="hover:text-indigo-600 transition-colors">
            Dashboard
          </Link>
          <ChevronRight className="w-4 h-4" />
          <span className="font-semibold text-slate-800">Resume & ATS</span>
          {step === 'REPORT' && (
            <>
              <ChevronRight className="w-4 h-4" />
              <span className="text-emerald-600 font-bold">Analysis Report</span>
            </>
          )}
        </div>

        {step === 'REPORT' && (
          <button
            onClick={() => setStep('UPLOAD')}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 px-3.5 py-1.5 rounded-xl border border-slate-200 bg-white shadow-sm"
          >
            <Upload className="w-3.5 h-3.5 text-emerald-600" />
            <span>Upload New Resume</span>
          </button>
        )}
      </div>

      {/* 1. UPLOAD STEP */}
      {step === 'UPLOAD' && (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-200">
          <div>
            <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight">
              Resume & ATS Analysis
            </h2>
            <p className="text-slate-500 text-sm mt-1">
              Upload your resume and get instant AI-powered feedback to make it job-ready.
            </p>
          </div>

          {/* Drag & Drop Upload Card */}
          <div className="p-10 rounded-3xl bg-white border-2 border-dashed border-indigo-200 hover:border-indigo-400 text-center space-y-4 transition-all group cursor-pointer shadow-sm">
            <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto group-hover:scale-105 transition-transform shadow-inner">
              <Upload className="w-8 h-8" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-base">Drag & drop your resume here</h3>
              <p className="text-xs text-slate-400 mt-1">Supported formats: PDF, DOC, DOCX (Max 5MB)</p>
            </div>
            <button
              onClick={() => handleProcessResume(sampleResumes[0].text, 'Abhineet_Resume.pdf')}
              className="py-2.5 px-6 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-600/30"
            >
              Choose File
            </button>
          </div>

          {/* Or Use a Sample Resume */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Or Use a Sample Resume Template
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {sampleResumes.map((sample, idx) => (
                <div
                  key={idx}
                  onClick={() => handleProcessResume(sample.text, sample.name)}
                  className="p-5 rounded-2xl bg-white border border-slate-200/80 hover:border-indigo-400 hover:shadow-md transition-all cursor-pointer space-y-2 group"
                >
                  <div className="p-3 rounded-xl bg-slate-50 group-hover:bg-indigo-50 text-slate-600 group-hover:text-indigo-600 flex items-center justify-center transition-colors">
                    <FileText className="w-6 h-6" />
                  </div>
                  <p className="font-bold text-xs text-slate-800 text-center">{sample.role}</p>
                  <p className="text-[10px] text-slate-400 text-center truncate">{sample.name}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 2. PROCESSING ANIMATION STEP */}
      {step === 'PROCESSING' && (
        <div className="max-w-md mx-auto p-10 rounded-3xl bg-white border border-slate-200 text-center space-y-6 animate-in fade-in duration-200">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto shadow-inner">
            <Sparkles className="w-8 h-8 animate-spin" />
          </div>
          <div>
            <h3 className="font-extrabold text-xl text-slate-800">Analyzing Your Resume...</h3>
            <p className="text-xs text-slate-500 mt-1">Our AI is checking for ATS compatibility, skills, keywords, and metrics.</p>
          </div>
          <div className="space-y-2.5 text-xs text-left p-4 rounded-2xl bg-slate-50 border border-slate-200 font-medium">
            <p className="text-emerald-600 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" /> Extracting resume content
            </p>
            <p className="text-emerald-600 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" /> Analyzing ATS formatting
            </p>
            <p className="text-emerald-600 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" /> Checking missing keywords
            </p>
            <p className="text-indigo-600 flex items-center gap-2 animate-pulse">
              <Sparkles className="w-4 h-4" /> Generating AI suggestions
            </p>
          </div>
        </div>
      )}

      {/* 3. REPORT VIEW (Matches Screenshots 5 & 8) */}
      {step === 'REPORT' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Sub Navigation Tabs Bar */}
          <div className="p-2 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-1">
              {[
                { id: 'OVERVIEW', label: 'Overview' },
                { id: 'PREVIEW', label: 'Resume Preview' },
                { id: 'KEYWORDS', label: 'Missing Keywords' },
                { id: 'OPTIMIZED', label: 'AI Optimized Resume' },
                { id: 'DETAILS', label: 'ATS Details' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    activeTab === tab.id
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 pr-2">
              <button className="py-1.5 px-3 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold flex items-center gap-1.5">
                <Download className="w-3.5 h-3.5" />
                <span>Download Report</span>
              </button>
              <button className="py-1.5 px-3 rounded-xl bg-emerald-600 text-white hover:bg-emerald-500 text-xs font-bold shadow-md shadow-emerald-600/30 flex items-center gap-1.5">
                <Share2 className="w-3.5 h-3.5" />
                <span>Share</span>
              </button>
            </div>
          </div>

          {/* TAB 1: OVERVIEW */}
          {activeTab === 'OVERVIEW' && (
            <div className="space-y-6">
              {/* Top Score & Breakdown Card */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 p-8 rounded-3xl bg-white border border-slate-200 shadow-sm items-center">
                <div className="md:col-span-4 flex flex-col items-center justify-center p-6 rounded-2xl bg-slate-50 border border-slate-200">
                  <div className="relative w-36 h-36 flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="40" stroke="#E2E8F0" strokeWidth="10" fill="transparent" />
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        stroke="#10B981"
                        strokeWidth="10"
                        strokeDasharray="251.2"
                        strokeDashoffset={251.2 * (1 - currentAnalysis.atsScore / 100)}
                        strokeLinecap="round"
                        fill="transparent"
                      />
                    </svg>
                    <div className="absolute text-center">
                      <span className="text-3xl font-extrabold text-slate-800">{currentAnalysis.atsScore}</span>
                      <span className="text-[11px] block text-slate-400 font-semibold">/100</span>
                    </div>
                  </div>
                  <span className="mt-3 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Good Match
                  </span>
                  <p className="text-[11px] text-slate-500 text-center mt-2">
                    Your resume is good, but can be improved to match top industry standards.
                  </p>
                </div>

                {/* Score Breakdown Bars */}
                <div className="md:col-span-8 space-y-3.5">
                  <h4 className="font-bold text-sm text-slate-800">ATS Score Breakdown</h4>
                  {[
                    { label: 'Format & Structure', score: currentAnalysis.formatScore, color: 'bg-emerald-500' },
                    { label: 'Keywords Match', score: currentAnalysis.keywordScore, color: 'bg-indigo-500' },
                    { label: 'Skills Match', score: currentAnalysis.skillsScore, color: 'bg-blue-500' },
                    { label: 'Experience & Projects', score: currentAnalysis.experienceScore, color: 'bg-cyan-500' },
                    { label: 'Achievements & Metrics', score: currentAnalysis.achievementsScore, color: 'bg-amber-500' },
                  ].map((item, idx) => (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-slate-600">{item.label}</span>
                        <span className="text-slate-800 font-bold">{item.score}%</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                        <div className={`h-full rounded-full ${item.color}`} style={{ width: `${item.score}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Strengths & Areas to Improve Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-6 rounded-3xl bg-emerald-50/50 border border-emerald-100 space-y-3">
                  <h4 className="font-bold text-sm text-emerald-900 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Resume Strengths</span>
                  </h4>
                  <ul className="text-xs text-slate-700 space-y-2 list-disc list-inside">
                    {currentAnalysis.strengths.map((str, i) => (
                      <li key={i}>{str}</li>
                    ))}
                  </ul>
                </div>

                <div className="p-6 rounded-3xl bg-rose-50/50 border border-rose-100 space-y-3">
                  <h4 className="font-bold text-sm text-rose-900 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                    <span>Areas to Improve</span>
                  </h4>
                  <ul className="text-xs text-slate-700 space-y-2 list-disc list-inside">
                    {currentAnalysis.areasToImprove.map((area, i) => (
                      <li key={i}>{area}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: RESUME PREVIEW + HIGHLIGHTS */}
          {activeTab === 'PREVIEW' && (
            <div className="p-8 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex gap-2">
                  <button
                    onClick={() => setPreviewSubTab('ORIGINAL')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold ${
                      previewSubTab === 'ORIGINAL' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:bg-slate-100'
                    }`}
                  >
                    Original Resume
                  </button>
                  <button
                    onClick={() => setPreviewSubTab('HIGHLIGHTED')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold ${
                      previewSubTab === 'HIGHLIGHTED' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-100'
                    }`}
                  >
                    AI Highlighted Version
                  </button>
                </div>
                <div className="flex items-center gap-3 text-xs font-semibold">
                  <span className="flex items-center gap-1.5 text-emerald-700">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Found Keyword
                  </span>
                  <span className="flex items-center gap-1.5 text-rose-700">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Missing Keyword
                  </span>
                </div>
              </div>

              {/* Resume Document Viewer */}
              <div className="p-8 rounded-2xl bg-slate-50 border border-slate-200 font-mono text-xs text-slate-800 leading-relaxed whitespace-pre-wrap max-w-3xl mx-auto shadow-inner">
                {previewSubTab === 'ORIGINAL' ? (
                  resumeText
                ) : (
                  <div>
                    <h3 className="font-bold text-base text-slate-900">Abhineet Jha</h3>
                    <p className="text-slate-500 text-[11px] mb-4">abhineet@interviewai.com | +91 9876543210 | Noida, India</p>

                    <h4 className="font-bold text-xs uppercase text-slate-700 border-b pb-1 mb-2">Education</h4>
                    <p className="mb-4">B.Tech in Computer Science Engineering (Data Science) | NIET, Greater Noida (2024 - 2028) | CGPA: 7.48</p>

                    <h4 className="font-bold text-xs uppercase text-slate-700 border-b pb-1 mb-2">Skills</h4>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {currentAnalysis.foundKeywords.map((kw, i) => (
                        <span key={i} className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold border border-emerald-300">
                          {kw}
                        </span>
                      ))}
                      {currentAnalysis.missingKeywords.slice(0, 4).map((kw, i) => (
                        <span key={i} className="px-2 py-0.5 rounded bg-rose-100 text-rose-800 font-bold border border-rose-300">
                          {kw} (Missing)
                        </span>
                      ))}
                    </div>

                    <h4 className="font-bold text-xs uppercase text-slate-700 border-b pb-1 mb-2">Projects</h4>
                    <p className="font-bold">1. Placement Prep & Evaluation Portal (Java, Spring Boot)</p>
                    <p className="pl-4 mb-2">• Implemented automated code runner executing Java test cases in sub-second latency.</p>
                    <p className="font-bold">2. University Management System (Python, OOP)</p>
                    <p className="pl-4">• Developed desktop administrative solution with database integration.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: MISSING KEYWORDS */}
          {activeTab === 'KEYWORDS' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-8 rounded-3xl bg-white border border-slate-200 shadow-sm">
              <div className="space-y-4">
                <h4 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-500" />
                  <span>Missing Keywords</span>
                </h4>
                <p className="text-xs text-slate-500">
                  These important keywords are absent from your resume based on current software engineering requirements.
                </p>
                <div className="space-y-2">
                  {currentAnalysis.missingKeywords.map((kw, i) => (
                    <div key={i} className="p-3 rounded-xl bg-rose-50/70 border border-rose-200/60 flex items-center justify-between text-xs font-semibold text-rose-800">
                      <span>{kw}</span>
                      <span className="text-[10px] uppercase font-bold text-rose-600 bg-white px-2 py-0.5 rounded border border-rose-200">
                        High Priority
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-600" />
                  <span>Actionable Suggestions</span>
                </h4>
                <div className="space-y-2.5 text-xs text-slate-700">
                  {currentAnalysis.suggestions.map((sug, i) => (
                    <div key={i} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-start gap-3">
                      <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center shrink-0 text-[11px]">
                        {i + 1}
                      </span>
                      <p className="leading-relaxed">{sug}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: AI OPTIMIZED RESUME */}
          {activeTab === 'OPTIMIZED' && (
            <div className="p-8 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-100 pb-5">
                <div>
                  <h3 className="font-bold text-lg text-slate-800">AI-Optimized Resume</h3>
                  <p className="text-xs text-slate-500">Download your revised resume with quantifiable metrics and ATS-ready formatting.</p>
                </div>
                <div className="flex items-center gap-2">
                  {['ATS Friendly', 'Modern', 'Professional', 'Minimal'].map((tpl) => (
                    <button
                      key={tpl}
                      onClick={() => setSelectedTemplate(tpl)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                        selectedTemplate === tpl ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-slate-50 text-slate-600 border-slate-200'
                      }`}
                    >
                      {tpl}
                    </button>
                  ))}
                </div>
              </div>

              {/* Formatted Output Viewer */}
              <div className="p-8 rounded-2xl bg-white border-2 border-slate-200 font-sans text-xs text-slate-800 leading-relaxed max-w-3xl mx-auto shadow-md space-y-4">
                <div className="text-center border-b pb-4">
                  <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">ABHINEET JHA</h2>
                  <p className="text-[11px] text-slate-500 mt-0.5">Noida, India | +91 9876543210 | abhineet@interviewai.com | LinkedIn | GitHub</p>
                </div>

                <div>
                  <h3 className="font-bold text-xs uppercase text-slate-900 border-b pb-1 mb-2">Professional Summary</h3>
                  <p className="text-slate-700">
                    Aspiring Software Engineer with deep foundations in Java, Data Structures, and Distributed Backend Architecture. Solved 350+ algorithmic challenges and built high-concurrency applications.
                  </p>
                </div>

                <div>
                  <h3 className="font-bold text-xs uppercase text-slate-900 border-b pb-1 mb-2">Technical Skills</h3>
                  <p><strong>Languages:</strong> Java, Python, C++, JavaScript, SQL</p>
                  <p><strong>Frameworks & Tools:</strong> React, Spring Boot, REST APIs, Git, Docker, MySQL, Redis</p>
                  <p><strong>Core Fundamentals:</strong> DSA, OOP, DBMS Normalization, Operating Systems, System Design</p>
                </div>

                <div>
                  <h3 className="font-bold text-xs uppercase text-slate-900 border-b pb-1 mb-2">Key Engineering Projects</h3>
                  <p className="font-bold text-slate-900">Placement Prep & Code Execution Engine | Java, React, Docker</p>
                  <p className="pl-3 text-slate-700">• Designed sandboxed Java execution environment reducing test latency by 45%.</p>
                  <p className="pl-3 text-slate-700">• Integrated real-time WebSockets and proctoring anti-cheat telemetry.</p>
                </div>
              </div>

              <div className="flex justify-center gap-3 pt-3">
                <button className="py-3 px-6 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-600/30 flex items-center gap-2">
                  <Download className="w-4 h-4" />
                  <span>Download Optimized Resume (PDF)</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 5: ATS DETAILS */}
          {activeTab === 'DETAILS' && (
            <div className="p-8 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-6">
              <h3 className="font-bold text-lg text-slate-800">ATS Engine Diagnostic Details</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-slate-400 block">File Format</span>
                  <span className="font-bold text-slate-800">PDF (Native Text)</span>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-slate-400 block">Parsing Success</span>
                  <span className="font-bold text-emerald-600">100% (No OCR needed)</span>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-slate-400 block">Keywords Found</span>
                  <span className="font-bold text-indigo-600">28 Keywords</span>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-slate-400 block">Industry Average</span>
                  <span className="font-bold text-slate-800">65 / 100</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
