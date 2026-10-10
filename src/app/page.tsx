'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Code2,
  Video,
  FileText,
  BarChart2,
  CheckCircle2,
  Zap,
  Target,
  ChevronDown,
  HelpCircle,
  Play,
  Users,
  Award,
  Lock,
  ChevronRight,
  UserCheck
} from 'lucide-react';

export default function LandingPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch('/api/auth/me');
        const data = await res.json();
        if (data?.user) {
          setUser(data.user);
        }
      } catch (err) {
        console.error('Auth check error:', err);
      } finally {
        setLoading(false);
      }
    }
    checkAuth();
  }, []);

  const handleGetStarted = () => {
    if (!user) {
      router.push('/signup');
    } else if (!user.profile?.onboardingCompleted) {
      router.push('/onboarding');
    } else {
      router.push('/dashboard');
    }
  };

  const faqs = [
    {
      q: 'How is InterviewAI different from standard practice platforms?',
      a: 'Unlike static question lists, InterviewAI combines actual sandbox code execution across Java, Python, and JavaScript with our realistic 100-minute 4-round AI simulation (HR, Coding, Technical/CS, and Negotiation) and strict proctoring verification.',
    },
    {
      q: 'Are the coding execution results real or simulated?',
      a: 'Every coding submission executes in real sandboxed environments with actual compilers and runtimes. Test cases, memory footprints, and execution runtimes reflect real execution evidence.',
    },
    {
      q: 'How does the 100-minute AI Avatar interview simulation work?',
      a: 'The simulation follows a strict 4-round structure: Round 1 (HR/Behavioral, 15m), Round 2 (DSA/Coding with Monaco, 50m), Round 3 (Core CS & Managerial, 25m), and Round 4 (Negotiation & Closing, 10m). You receive comprehensive round-by-round diagnostic reports.',
    },
    {
      q: 'Can I prepare for different target companies?',
      a: 'Yes! InterviewAI never forces you to lock your entire profile to one company. You choose your target company (e.g. Google, Amazon, Microsoft, TCS) and role dynamically per Practice or Mock session.',
    },
    {
      q: 'How does the ATS Resume Analyzer score my resume?',
      a: 'The ATS engine extracts structured sections (skills, experience, projects, education) and compares them against target role criteria and job descriptions, identifying keyword gaps without inventing false claims.',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-indigo-500 selection:text-white">
      {/* 1. Header Navigation */}
      <header className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25 group-hover:scale-105 transition-transform">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="font-extrabold text-xl tracking-tight text-white">
              Interview<span className="text-indigo-400">AI</span>
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-300">
            <a href="#features" className="hover:text-indigo-400 transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-indigo-400 transition-colors">How It Works</a>
            <a href="#simulation" className="hover:text-indigo-400 transition-colors">100-Min Simulation</a>
            <a href="#pricing" className="hover:text-indigo-400 transition-colors">Pricing</a>
            <a href="#faq" className="hover:text-indigo-400 transition-colors">FAQ</a>
          </nav>

          <div className="flex items-center gap-4">
            {!loading && user ? (
              <Link
                href={user.profile?.onboardingCompleted ? '/dashboard' : '/onboarding'}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-lg shadow-indigo-600/30 transition-all hover:scale-105"
              >
                <span>{user.profile?.onboardingCompleted ? 'Go to Dashboard' : 'Complete Setup'}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="px-4 py-2 rounded-xl text-slate-300 hover:text-white font-bold text-sm hover:bg-slate-900 transition-all"
                >
                  Sign In
                </Link>
                <button
                  onClick={handleGetStarted}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-sm shadow-lg shadow-indigo-600/30 transition-all hover:scale-105"
                >
                  <span>Get Started</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* 2. Hero Section */}
      <section className="relative pt-20 pb-28 px-6 overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-tr from-indigo-600/20 via-purple-600/15 to-pink-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-5xl mx-auto text-center space-y-8 relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold tracking-wide uppercase">
            <Sparkles className="w-3.5 h-3.5" />
            Next-Gen Placement Preparation Platform
          </div>

          <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight leading-[1.1]">
            Master Tech Interviews with <br />
            <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Realistic AI Simulations
            </span>
          </h1>

          <p className="max-w-2xl mx-auto text-slate-400 text-base sm:text-lg leading-relaxed">
            Real sandboxed code execution, 100-minute multi-round AI interviewer simulations, genuine ATS resume scoring, and proctoring diagnostics built for college placements and tier-1 tech careers.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <button
              onClick={handleGetStarted}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-extrabold text-base shadow-xl shadow-indigo-600/30 transition-all hover:scale-105"
            >
              <span>Start Free Assessment</span>
              <ArrowRight className="w-5 h-5" />
            </button>
            <Link
              href="/login"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 font-bold text-base transition-all"
            >
              <span>Explore Demo Workspace</span>
            </Link>
          </div>

          {/* Quick Metrics Banner */}
          <div className="pt-12 grid grid-cols-2 sm:grid-cols-4 gap-6 max-w-4xl mx-auto text-left border-t border-slate-800/80">
            <div>
              <p className="text-2xl sm:text-3xl font-extrabold text-white">100 Min</p>
              <p className="text-xs text-slate-400 font-medium mt-1">4-Round AI Simulation</p>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-extrabold text-indigo-400">3 Langs</p>
              <p className="text-xs text-slate-400 font-medium mt-1">Java, Python & JS Runner</p>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-extrabold text-purple-400">100% Real</p>
              <p className="text-xs text-slate-400 font-medium mt-1">Live Sandbox Execution</p>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-extrabold text-emerald-400">ATS 90+</p>
              <p className="text-xs text-slate-400 font-medium mt-1">Resume Gap Detection</p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Core Features Section */}
      <section id="features" className="py-24 px-6 bg-slate-900/60 border-y border-slate-800/80">
        <div className="max-w-7xl mx-auto space-y-16">
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-widest text-indigo-400">Production Capabilities</h2>
            <h3 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              An End-to-End Suite for Serious Interview Candidates
            </h3>
            <p className="text-slate-400 text-sm sm:text-base">
              Every tool is engineered for genuine diagnostic accuracy — from category-locked practice sets to full interview proctoring.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="p-8 rounded-3xl bg-slate-950 border border-slate-800/80 hover:border-indigo-500/50 transition-all space-y-4 group">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Code2 className="w-6 h-6" />
              </div>
              <h4 className="text-xl font-bold text-white">Monaco Code Runner Sandbox</h4>
              <p className="text-slate-400 text-sm leading-relaxed">
                Execute code live in Java, Python, and JavaScript. Evaluates actual test cases, runtime latency, memory footprints, and compilation errors.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-8 rounded-3xl bg-slate-950 border border-slate-800/80 hover:border-purple-500/50 transition-all space-y-4 group">
              <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Video className="w-6 h-6" />
              </div>
              <h4 className="text-xl font-bold text-white">100-Minute AI Avatar Simulation</h4>
              <p className="text-slate-400 text-sm leading-relaxed">
                Experience the exact 4-round hiring bar: HR (15m), Coding (50m), Technical/CS (25m), and Negotiation (10m) with AI evaluation.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-8 rounded-3xl bg-slate-950 border border-slate-800/80 hover:border-pink-500/50 transition-all space-y-4 group">
              <div className="w-12 h-12 rounded-2xl bg-pink-500/10 text-pink-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h4 className="text-xl font-bold text-white">Full Anti-Cheat Proctoring Suite</h4>
              <p className="text-slate-400 text-sm leading-relaxed">
                Multi-layer verification: Pre-check camera/mic streams, tab-switch logging, fullscreen enforcement, and timestamped integrity audits.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="p-8 rounded-3xl bg-slate-950 border border-slate-800/80 hover:border-emerald-500/50 transition-all space-y-4 group">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <FileText className="w-6 h-6" />
              </div>
              <h4 className="text-xl font-bold text-white">ATS Resume & JD Matcher</h4>
              <p className="text-slate-400 text-sm leading-relaxed">
                Deep section-wise parsing for contact, education, skills, and projects. Compares your resume against targeted job descriptions.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="p-8 rounded-3xl bg-slate-950 border border-slate-800/80 hover:border-amber-500/50 transition-all space-y-4 group">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Target className="w-6 h-6" />
              </div>
              <h4 className="text-xl font-bold text-white">Category-Locked Practice</h4>
              <p className="text-slate-400 text-sm leading-relaxed">
                Never mix Aptitude and Coding. Practice dedicated topics in Quantitative Aptitude, Technical CS (OS, DBMS, Networks), DSA, and HR.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="p-8 rounded-3xl bg-slate-950 border border-slate-800/80 hover:border-cyan-500/50 transition-all space-y-4 group">
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <BarChart2 className="w-6 h-6" />
              </div>
              <h4 className="text-xl font-bold text-white">Diagnostic Weak Areas & Path</h4>
              <p className="text-slate-400 text-sm leading-relaxed">
                Automatically identifies failed coding tests and low-accuracy topics, recommending tailored next steps with one-click practice links.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. How It Works Section */}
      <section id="how-it-works" className="py-24 px-6">
        <div className="max-w-7xl mx-auto space-y-16">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-widest text-indigo-400">Structured Methodology</h2>
            <h3 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              From Setup to Dream Job Offer in 4 Steps
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative">
            {[
              {
                step: '01',
                title: '7-Step Onboarding',
                desc: 'Select your prep goal, experience level, target role, and technical skills without locking to a single company.',
              },
              {
                step: '02',
                title: 'Targeted Practice',
                desc: 'Solve categorized questions with instant explanations or code in Monaco with genuine sandbox verification.',
              },
              {
                step: '03',
                title: 'Mock & AI Avatar',
                desc: 'Undergo proctored timed assessments and the 100-minute multi-round AI interview simulation.',
              },
              {
                step: '04',
                title: 'Diagnostic Reports',
                desc: 'Receive round-wise scores, integrity reports, weak area insights, and tailored recommendations.',
              },
            ].map((st, idx) => (
              <div key={idx} className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800/80 space-y-3 relative">
                <span className="text-3xl font-black text-indigo-500/40">{st.step}</span>
                <h4 className="text-lg font-bold text-white">{st.title}</h4>
                <p className="text-slate-400 text-xs leading-relaxed">{st.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. 100-Minute AI Simulation Focus */}
      <section id="simulation" className="py-24 px-6 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 border-t border-slate-800/80">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center space-y-3">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20">
              The Gold Standard
            </span>
            <h3 className="text-3xl sm:text-4xl font-extrabold text-white">
              The Fixed 100-Minute Four-Round Architecture
            </h3>
            <p className="text-slate-400 text-sm max-w-xl mx-auto">
              Simulating every stage of a competitive campus and off-campus engineering drive.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-6 rounded-3xl bg-slate-950 border border-slate-800 space-y-3">
              <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Round 1 · 15 Mins</span>
              <h4 className="font-bold text-white text-base">HR & Behavioral</h4>
              <p className="text-slate-400 text-xs">Self-intro, situational STAR judgment, teamwork, and communication with conversational AI avatar.</p>
              <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Avatar Active</span>
            </div>

            <div className="p-6 rounded-3xl bg-slate-950 border border-slate-800 space-y-3">
              <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Round 2 · 50 Mins</span>
              <h4 className="font-bold text-white text-base">Coding & DSA</h4>
              <p className="text-slate-400 text-xs">Algorithmic problems, Monaco editor, sandbox execution, real test cases under strict countdown.</p>
              <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-400">Distraction-Free</span>
            </div>

            <div className="p-6 rounded-3xl bg-slate-950 border border-slate-800 space-y-3">
              <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Round 3 · 25 Mins</span>
              <h4 className="font-bold text-white text-base">Technical & Core CS</h4>
              <p className="text-slate-400 text-xs">DBMS, Operating Systems, Computer Networks, System Design basics, and algorithmic reasoning.</p>
              <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Avatar Active</span>
            </div>

            <div className="p-6 rounded-3xl bg-slate-950 border border-slate-800 space-y-3">
              <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Round 4 · 10 Mins</span>
              <h4 className="font-bold text-white text-base">Negotiation & HR</h4>
              <p className="text-slate-400 text-xs">Salary expectations, joining timelines, cultural alignment, and executive closing questions.</p>
              <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Avatar Active</span>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Pricing Section */}
      <section id="pricing" className="py-24 px-6 border-t border-slate-800/80">
        <div className="max-w-6xl mx-auto space-y-16">
          <div className="text-center space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-widest text-indigo-400">Transparent Plans</h2>
            <h3 className="text-3xl sm:text-4xl font-extrabold text-white">Invest in Your Career</h3>
            <p className="text-slate-400 text-sm">Choose the tier that matches your interview preparation timeline.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Free Plan */}
            <div className="p-8 rounded-3xl bg-slate-900/60 border border-slate-800 flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <h4 className="text-xl font-bold text-white">Free Foundation</h4>
                <p className="text-3xl font-extrabold text-white">₹0</p>
                <p className="text-slate-400 text-xs">For students beginning placements</p>
                <div className="space-y-2 text-xs text-slate-300 pt-4 border-t border-slate-800">
                  <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> 50 Practice questions</div>
                  <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> 1 Mock interview per month</div>
                  <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Basic ATS resume score check</div>
                </div>
              </div>
              <button
                onClick={handleGetStarted}
                className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-colors"
              >
                Get Started Free
              </button>
            </div>

            {/* Pro Plan */}
            <div className="p-8 rounded-3xl bg-gradient-to-b from-indigo-950/80 to-slate-900 border-2 border-indigo-500 shadow-2xl shadow-indigo-500/20 flex flex-col justify-between space-y-6 relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-indigo-600 text-white text-[10px] font-extrabold uppercase tracking-wide">
                Most Popular
              </div>
              <div className="space-y-4">
                <h4 className="text-xl font-bold text-white">Placement Pro</h4>
                <div className="flex items-baseline gap-1">
                  <p className="text-3xl font-extrabold text-white">₹799</p>
                  <span className="text-slate-400 text-xs">/month</span>
                </div>
                <p className="text-slate-400 text-xs">Complete interview mastery track</p>
                <div className="space-y-2 text-xs text-slate-300 pt-4 border-t border-indigo-900/60">
                  <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-indigo-400" /> Unlimited practice & Monaco runner</div>
                  <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-indigo-400" /> 15 Full mock interviews</div>
                  <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-indigo-400" /> 10 Full 100-Minute AI Avatar sessions</div>
                  <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-indigo-400" /> Full ATS resume rewrite & gap analysis</div>
                  <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-indigo-400" /> Anti-cheat proctoring verification badge</div>
                </div>
              </div>
              <button
                onClick={handleGetStarted}
                className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition-all"
              >
                Upgrade to Pro
              </button>
            </div>

            {/* Premium Plan */}
            <div className="p-8 rounded-3xl bg-slate-900/60 border border-slate-800 flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <h4 className="text-xl font-bold text-white">Enterprise Tier</h4>
                <div className="flex items-baseline gap-1">
                  <p className="text-3xl font-extrabold text-white">₹1499</p>
                  <span className="text-slate-400 text-xs">/month</span>
                </div>
                <p className="text-slate-400 text-xs">For high-tier off-campus candidates</p>
                <div className="space-y-2 text-xs text-slate-300 pt-4 border-t border-slate-800">
                  <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Unlimited AI Avatar interviews</div>
                  <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Priority execution queue</div>
                  <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> 1-on-1 career consultation call</div>
                  <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> 24/7 Priority support</div>
                </div>
              </div>
              <button
                onClick={handleGetStarted}
                className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-colors"
              >
                Join Enterprise
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 7. FAQ Section */}
      <section id="faq" className="py-24 px-6 bg-slate-900/40 border-t border-slate-800/80">
        <div className="max-w-4xl mx-auto space-y-12">
          <div className="text-center space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-widest text-indigo-400">Questions Answered</h2>
            <h3 className="text-3xl font-extrabold text-white">Frequently Asked Questions</h3>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={idx}
                  className="rounded-2xl bg-slate-900 border border-slate-800/80 overflow-hidden transition-all"
                >
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="w-full p-5 text-left font-bold text-sm text-slate-200 flex items-center justify-between gap-4"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-5 text-xs text-slate-400 leading-relaxed border-t border-slate-800/60 pt-3">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 8. Footer */}
      <footer className="py-12 px-6 border-t border-slate-800 bg-slate-950 text-slate-500 text-xs">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold">
              <Sparkles className="w-4 h-4" />
            </div>
            <span className="font-bold text-slate-300">InterviewAI</span>
            <span className="text-slate-600">·</span>
            <span>Practice Today. Get Hired Tomorrow.</span>
          </div>

          <div className="flex items-center gap-6">
            <Link href="/login" className="hover:text-slate-300 transition-colors">Sign In</Link>
            <Link href="/signup" className="hover:text-slate-300 transition-colors">Create Account</Link>
            <Link href="/privacy" className="hover:text-slate-300 transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-slate-300 transition-colors">Terms of Service</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
