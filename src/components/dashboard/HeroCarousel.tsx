'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  ChevronLeft,
  ChevronRight,
  Sparkles,
  ArrowRight,
  Code,
  Terminal,
  Brain,
  Video,
  FileCheck2,
  Cpu,
  Layers,
  Award,
  Play
} from 'lucide-react';

interface Slide {
  id: number;
  tag: string;
  tagColor: string;
  headline: string;
  subheadline: string;
  features: string[];
  primaryCtaText: string;
  primaryCtaLink: string;
  secondaryCtaText?: string;
  secondaryCtaLink?: string;
  gradient: string;
  accentBg: string;
  type: 'PRACTICE' | 'MOCK' | 'AVATAR';
}

const slides: Slide[] = [
  {
    id: 1,
    tag: 'INTELLIGENT PRACTICE ENGINE',
    tagColor: 'text-indigo-300 bg-indigo-900/60 border-indigo-500/30',
    headline: 'Practice Today. Get Hired Tomorrow.',
    subheadline: 'Topic-wise curated problems with instant feedback, Monaco editor, and live execution.',
    features: ['Aptitude', 'DSA & Coding', 'Technical', 'HR / Behavioral'],
    primaryCtaText: 'Start Practice',
    primaryCtaLink: '/practice',
    secondaryCtaText: 'Explore Practice',
    secondaryCtaLink: '/practice',
    gradient: 'from-slate-900 via-indigo-950 to-slate-900',
    accentBg: 'from-indigo-600/30 to-purple-600/30',
    type: 'PRACTICE',
  },
  {
    id: 2,
    tag: 'SIMULATED INTERVIEWS',
    tagColor: 'text-blue-300 bg-blue-900/60 border-blue-500/30',
    headline: 'Test Yourself Like a Real Interview.',
    subheadline: 'Timed company-specific rounds with live proctoring, voice input, and in-depth scorecards.',
    features: ['Full Mock', 'Technical Mock', 'Coding Mock', 'HR Mock'],
    primaryCtaText: 'Start Mock Interview',
    primaryCtaLink: '/mock-interview',
    secondaryCtaText: 'View Instructions',
    secondaryCtaLink: '/mock-interview',
    gradient: 'from-slate-900 via-blue-950 to-slate-900',
    accentBg: 'from-blue-600/30 to-cyan-600/30',
    type: 'MOCK',
  },
  {
    id: 3,
    tag: 'FULL 100-MIN EXPERIENCE',
    tagColor: 'text-rose-300 bg-rose-900/60 border-rose-500/30',
    headline: 'Experience a Real AI Interview.',
    subheadline: 'Multi-round conversational AI simulation featuring lifelike speech, coding, and salary negotiation.',
    features: ['HR / Behavioral', 'Coding + DSA', 'Managerial + Core CS', 'Negotiation + HR'],
    primaryCtaText: 'Start AI Interview',
    primaryCtaLink: '/ai-avatar',
    secondaryCtaText: 'Explore Persona',
    secondaryCtaLink: '/ai-avatar',
    gradient: 'from-slate-900 via-purple-950 to-rose-950',
    accentBg: 'from-rose-600/30 to-purple-600/30',
    type: 'AVATAR',
  },
];

export default function HeroCarousel() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const touchStartX = useRef<number | null>(null);

  const SLIDE_DURATION = 4500; // 4.5 seconds per slide (moderately faster, smooth transition)
  const INTERVAL_STEP = 50;

  useEffect(() => {
    if (isPaused) return;

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          setCurrentSlide((s) => (s + 1) % slides.length);
          return 0;
        }
        return prev + (INTERVAL_STEP / SLIDE_DURATION) * 100;
      });
    }, INTERVAL_STEP);

    return () => clearInterval(timer);
  }, [isPaused, currentSlide]);

  const goToSlide = (idx: number) => {
    setCurrentSlide(idx);
    setProgress(0);
  };

  const nextSlide = () => {
    setCurrentSlide((s) => (s + 1) % slides.length);
    setProgress(0);
  };

  const prevSlide = () => {
    setCurrentSlide((s) => (s - 1 + slides.length) % slides.length);
    setProgress(0);
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') nextSlide();
      if (e.key === 'ArrowLeft') prevSlide();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const slide = slides[currentSlide];

  return (
    <div
      className="relative w-full rounded-3xl overflow-hidden shadow-2xl border border-slate-800 bg-[#0B1120] text-white select-none transition-all"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={(e) => {
        touchStartX.current = e.touches[0].clientX;
      }}
      onTouchEnd={(e) => {
        if (touchStartX.current === null) return;
        const diff = touchStartX.current - e.changedTouches[0].clientX;
        if (diff > 50) nextSlide();
        if (diff < -50) prevSlide();
        touchStartX.current = null;
      }}
    >
      {/* Dynamic Background Glow */}
      <div
        className={`absolute inset-0 bg-gradient-to-r ${slide.gradient} opacity-95 transition-all duration-700`}
      />
      <div
        className={`absolute -top-32 -right-32 w-96 h-96 rounded-full bg-gradient-to-br ${slide.accentBg} blur-3xl opacity-50 transition-all duration-1000`}
      />

      {/* Main Slide Content Grid */}
      <div className="relative z-10 px-8 py-10 md:px-12 md:py-12 flex flex-col lg:flex-row items-center justify-between gap-8 min-h-[360px]">
        {/* Left Side: Headlines, Tags, CTAs */}
        <div className="flex-1 max-w-xl space-y-5 animate-in fade-in slide-in-from-left-4 duration-500 key={slide.id}">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-bold tracking-wider uppercase border shadow-sm backdrop-blur-md ${slide.tagColor}">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{slide.tag}</span>
          </div>

          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white leading-tight">
            {slide.headline}
          </h2>

          <p className="text-slate-300 text-sm md:text-base leading-relaxed font-normal">
            {slide.subheadline}
          </p>

          {/* Feature Badges */}
          <div className="flex flex-wrap gap-2.5 pt-1">
            {slide.features.map((feat, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 text-xs font-semibold text-slate-200 shadow-sm backdrop-blur-sm"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                {feat}
              </span>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-4 pt-3">
            <Link
              href={slide.primaryCtaLink}
              className={`inline-flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-bold text-white shadow-xl transition-all duration-200 active:scale-95 ${
                slide.type === 'AVATAR'
                  ? 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/30'
                  : slide.type === 'MOCK'
                  ? 'bg-blue-600 hover:bg-blue-500 shadow-blue-600/30'
                  : 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/30'
              }`}
            >
              <span>{slide.primaryCtaText}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            {slide.secondaryCtaText && (
              <Link
                href={slide.secondaryCtaLink || '#'}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl text-sm font-semibold text-slate-300 hover:text-white bg-slate-800/60 hover:bg-slate-700/60 border border-slate-700/60 transition-all backdrop-blur-sm"
              >
                <span>{slide.secondaryCtaText}</span>
              </Link>
            )}
          </div>
        </div>

        {/* Right Side: Animated Feature Visual Graphic */}
        <div className="w-full lg:w-96 flex items-center justify-center relative">
          {slide.type === 'PRACTICE' && (
            <div className="w-full p-5 rounded-2xl bg-slate-900/90 border border-slate-700/70 shadow-2xl backdrop-blur-md space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-rose-500" />
                  <div className="w-3 h-3 rounded-full bg-amber-500" />
                  <div className="w-3 h-3 rounded-full bg-emerald-500" />
                  <span className="text-[11px] font-mono text-slate-400 ml-2">Solution.java</span>
                </div>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400">
                  Accepted
                </span>
              </div>
              <div className="space-y-1.5 font-mono text-xs text-slate-300">
                <p className="text-purple-400">class Solution {'{'}</p>
                <p className="pl-4 text-blue-400">
                  public int[] <span className="text-yellow-300">twoSum</span>(int[] nums, int target) {'{'}
                </p>
                <p className="pl-8 text-slate-400">// HashMap complement O(n) lookup</p>
                <p className="pl-8 text-emerald-400">Map&lt;Integer, Integer&gt; map = new HashMap&lt;&gt;();</p>
                <p className="pl-4 text-blue-400">{'}'}</p>
                <p className="text-purple-400">{'}'}</p>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-[11px] text-slate-400">
                <span>Runtime: <strong className="text-white">1 ms</strong> (Beats 99.4%)</span>
                <span>Memory: <strong className="text-white">42.2 MB</strong></span>
              </div>
            </div>
          )}

          {slide.type === 'MOCK' && (
            <div className="w-full p-5 rounded-2xl bg-slate-900/90 border border-slate-700/70 shadow-2xl backdrop-blur-md space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-blue-400" />
                  <span className="text-xs font-bold text-white">Full Mock Simulation</span>
                </div>
                <span className="text-[11px] font-mono text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/50">
                  Timer: 44:12
                </span>
              </div>
              <div className="space-y-2">
                {[
                  { label: 'HR Round', score: '82%', status: 'Done', color: 'text-emerald-400' },
                  { label: 'Coding Assessment', score: '74%', status: 'In Progress', color: 'text-blue-400' },
                  { label: 'System Design & OS', score: '76%', status: 'Upcoming', color: 'text-slate-400' },
                  { label: 'Managerial Round', score: '81%', status: 'Upcoming', color: 'text-slate-400' },
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 rounded-xl bg-slate-800/50 text-xs">
                    <span className="font-medium text-slate-200">{item.label}</span>
                    <span className={`font-bold ${item.color}`}>{item.score}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {slide.type === 'AVATAR' && (
            <div className="w-full p-5 rounded-2xl bg-slate-900/90 border border-slate-700/70 shadow-2xl backdrop-blur-md flex flex-col items-center text-center space-y-3">
              <div className="relative">
                <div className="w-24 h-24 rounded-full overflow-hidden ring-4 ring-rose-500/30 shadow-xl">
                  <img
                    src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=240"
                    alt="AI Interviewer"
                    className="w-full h-full object-cover"
                  />
                </div>
                <span className="absolute bottom-0 right-0 w-5 h-5 rounded-full bg-emerald-500 border-2 border-slate-900 shadow-md" />
              </div>
              <div>
                <p className="text-sm font-bold text-white">Sarah · AI Technical Lead</p>
                <p className="text-xs text-rose-300 font-medium">100-Minute Comprehensive Interview</p>
              </div>
              <div className="w-full py-2 px-3 rounded-xl bg-slate-800/70 border border-slate-700/50 text-xs text-slate-300 flex items-center justify-center gap-2">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                <span>Interviewer Speaking... (Audio Lip-Sync Ready)</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Slide Navigation Controls & Progress */}
      <div className="relative z-10 px-8 py-3 bg-slate-950/70 border-t border-slate-800/60 flex items-center justify-between">
        {/* Slide Indicators Dots */}
        <div className="flex items-center gap-2">
          {slides.map((s, idx) => (
            <button
              key={s.id}
              onClick={() => goToSlide(idx)}
              className={`h-2 rounded-full transition-all duration-300 ${
                currentSlide === idx ? 'w-8 bg-indigo-500' : 'w-2 bg-slate-700 hover:bg-slate-600'
              }`}
              title={`Go to slide ${idx + 1}`}
            />
          ))}
          <span className="text-[11px] text-slate-400 ml-2 font-medium">
            {currentSlide + 1} / {slides.length}
          </span>
        </div>

        {/* Prev / Next Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={prevSlide}
            className="w-8 h-8 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-colors"
            title="Previous Slide"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={nextSlide}
            className="w-8 h-8 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-colors"
            title="Next Slide"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Auto-Rotation Progress Bar */}
      <div className="w-full h-1 bg-slate-800">
        <div
          className="h-full bg-indigo-500 transition-all duration-75 ease-linear"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
