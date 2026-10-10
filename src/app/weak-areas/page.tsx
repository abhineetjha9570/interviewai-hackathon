'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  ArrowRight,
  Target,
  ChevronRight,
  TrendingUp,
  Sparkles,
  BookOpen,
  Award
} from 'lucide-react';

export default function WeakAreasPage() {
  const [weakAreas, setWeakAreas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadWeakAreas() {
      try {
        const res = await fetch('/api/weak-areas');
        const json = await res.json();
        if (json.weakAreas) {
          setWeakAreas(json.weakAreas);
        }
      } catch (err) {
        console.error('Failed to load weak areas:', err);
      } finally {
        setLoading(false);
      }
    }
    loadWeakAreas();
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      <div>
        <h2 className="text-2xl md:text-3xl font-extrabold text-slate-800 tracking-tight">
          Weak Areas Detection & Remediation
        </h2>
        <p className="text-slate-500 text-sm mt-1">
          Automatically detected diagnostic gaps based on failed coding test-cases and low topic accuracy in practice assessments.
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-pulse">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-64 rounded-3xl bg-slate-200" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {weakAreas.map((area, idx) => (
            <div
              key={idx}
              className="p-7 rounded-3xl bg-white border border-slate-200/80 shadow-sm flex flex-col justify-between space-y-4 hover:shadow-md transition-shadow"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600">
                    {area.category}
                  </span>
                  <span
                    className={`text-xs font-extrabold px-3 py-1 rounded-full uppercase tracking-wider ${
                      area.priority === 'HIGH'
                        ? 'bg-rose-100 text-rose-700 border border-rose-200'
                        : area.priority === 'MEDIUM'
                        ? 'bg-amber-100 text-amber-700 border border-amber-200'
                        : 'bg-blue-100 text-blue-700 border border-blue-200'
                    }`}
                  >
                    {area.priority} Priority
                  </span>
                </div>

                <div>
                  <h3 className="font-extrabold text-lg text-slate-800">{area.topic}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-sm font-bold text-rose-600">{area.accuracy}%</span>
                    <span className="text-xs text-slate-400">Current Accuracy / Pass Rate</span>
                  </div>
                </div>

                <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      area.priority === 'HIGH' ? 'bg-rose-500' : 'bg-amber-500'
                    }`}
                    style={{ width: `${Math.max(area.accuracy, 10)}%` }}
                  />
                </div>

                <p className="text-xs text-slate-600 leading-relaxed pt-1">
                  {area.reason}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs font-medium text-slate-400">
                  Recommended: <strong>{area.questionsRecommended} problems</strong>
                </span>
                <Link
                  href={area.practiceUrl}
                  className="inline-flex items-center gap-1.5 py-2 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-600/30 transition-all"
                >
                  <span>Practice Questions</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
