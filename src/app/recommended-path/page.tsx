'use client';

import React from 'react';
import Link from 'next/link';
import {
  Compass,
  CheckCircle2,
  Circle,
  ArrowRight,
  Target,
  Sparkles,
  BookOpen,
  Award,
  Clock,
  Code2,
  Cpu,
  Users
} from 'lucide-react';

export default function RecommendedPathPage() {
  const steps = [
    {
      step: 1,
      title: 'Arrays & Hashing — Two Sum',
      category: 'DSA & Coding',
      description: 'Master optimal O(N) HashMap complement lookup and two-pointer array techniques with Monaco editor.',
      status: 'IN_PROGRESS',
      actionText: 'Start Two Sum Practice',
      actionUrl: '/practice?category=DSA&topic=Array&problem=two-sum&autoStart=true',
      estTime: '30 Mins',
      icon: Code2,
      badgeColor: 'text-indigo-600 bg-indigo-50 border-indigo-200',
    },
    {
      step: 2,
      title: 'Practice Dynamic Programming',
      category: 'DSA Foundations',
      description: 'Solve state-transition problems starting with Climbing Stairs (Fibonacci recurrence model).',
      status: 'UPCOMING',
      actionText: 'Start DP Practice',
      actionUrl: '/practice?category=DSA&topic=Dynamic%20Programming&problem=climbing-stairs&autoStart=true',
      estTime: '45 Mins',
      icon: Target,
      badgeColor: 'text-rose-600 bg-rose-50 border-rose-200',
    },
    {
      step: 3,
      title: 'Revise System Design Basics',
      category: 'Technical Architecture',
      description: 'Study distributed caching (Redis), database sharding, CAP theorem, and sub-10ms latency patterns.',
      status: 'UPCOMING',
      actionText: 'Revise System Design',
      actionUrl: '/practice?category=Technical&topic=System%20Design%20Basics&autoStart=true',
      estTime: '1.5 Hours',
      icon: Cpu,
      badgeColor: 'text-blue-600 bg-blue-50 border-blue-200',
    },
    {
      step: 4,
      title: 'Practice DBMS Normalization & Indexing',
      category: 'Core CS Fundamentals',
      description: 'Deep dive into 1NF, 2NF, 3NF, BCNF, B+ Tree index structures, and ACID transaction isolation.',
      status: 'UPCOMING',
      actionText: 'Practice DBMS Questions',
      actionUrl: '/practice?category=Technical&topic=DBMS%20%26%20SQL&autoStart=true',
      estTime: '1 Hour',
      icon: BookOpen,
      badgeColor: 'text-cyan-600 bg-cyan-50 border-cyan-200',
    },
    {
      step: 5,
      title: 'Master Quantitative Aptitude (Time & Work)',
      category: 'Aptitude Placement Track',
      description: 'Solve aptitude calculations on relative speeds, compound interest, and work efficiencies.',
      status: 'UPCOMING',
      actionText: 'Start Aptitude Practice',
      actionUrl: '/practice?category=Aptitude&topic=Quantitative%20Aptitude&autoStart=true',
      estTime: '45 Mins',
      icon: Sparkles,
      badgeColor: 'text-purple-600 bg-purple-50 border-purple-200',
    },
    {
      step: 6,
      title: 'Improve Behavioral Communication (STAR Method)',
      category: 'HR & Behavioral',
      description: 'Refine self-introductions and answers to conflict/leadership scenarios with quantifiable metrics.',
      status: 'UPCOMING',
      actionText: 'Practice HR Questions',
      actionUrl: '/practice?category=HR&topic=Behavioral%20(STAR%20Method)&autoStart=true',
      estTime: '30 Mins',
      icon: Users,
      badgeColor: 'text-amber-600 bg-amber-50 border-amber-200',
    },
    {
      step: 7,
      title: 'Take Technical Mock Interview',
      category: 'Simulated Assessment',
      description: 'Test your algorithmic and DBMS foundations in a 45-minute timed interview with proctoring.',
      status: 'UPCOMING',
      actionText: 'Start Technical Mock',
      actionUrl: '/mock-interview',
      estTime: '45 Mins',
      icon: Award,
      badgeColor: 'text-emerald-600 bg-emerald-50 border-emerald-200',
    },
    {
      step: 8,
      title: 'Take 100-Minute AI Avatar Interview',
      category: 'Final Placement Simulation',
      description: 'Experience all 4 rounds (HR, Coding, Managerial, Negotiation) with conversational AI evaluation.',
      status: 'UPCOMING',
      actionText: 'Start 100-Min Interview',
      actionUrl: '/ai-avatar',
      estTime: '100 Mins',
      icon: Award,
      badgeColor: 'text-rose-600 bg-rose-50 border-rose-200',
    },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      <div>
        <h2 className="text-2xl md:text-3xl font-extrabold text-slate-800 tracking-tight">
          Recommended Learning Path
        </h2>
        <p className="text-slate-500 text-sm mt-1">
          A personalized step-by-step roadmap tailored to your target Software Engineer role. Selecting any recommendation directly opens its specific question set.
        </p>
      </div>

      <div className="max-w-4xl space-y-4">
        {steps.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.step}
              className={`p-6 rounded-3xl bg-white border transition-all ${
                item.status === 'IN_PROGRESS'
                  ? 'border-indigo-400 shadow-md ring-2 ring-indigo-500/10'
                  : 'border-slate-200/80 shadow-sm'
              }`}
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div
                    className={`w-10 h-10 rounded-2xl flex items-center justify-center font-extrabold text-sm shrink-0 ${
                      item.status === 'IN_PROGRESS'
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {item.step}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${item.badgeColor}`}>
                        {item.category}
                      </span>
                      <span className="text-slate-300">·</span>
                      <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {item.estTime}
                      </span>
                    </div>
                    <h3 className="font-extrabold text-base text-slate-800 mt-1">{item.title}</h3>
                    <p className="text-xs text-slate-500 mt-1 max-w-xl leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </div>

                <div className="sm:shrink-0 w-full sm:w-auto">
                  <Link
                    href={item.actionUrl}
                    className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 py-2.5 px-5 rounded-2xl text-xs font-bold transition-all ${
                      item.status === 'IN_PROGRESS'
                        ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    <span>{item.actionText}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
