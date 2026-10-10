'use client';

import React, { useState, useMemo } from 'react';
import {
  CheckCircle2,
  Lock,
  Play,
  Clock,
  Sparkles,
  ArrowDown,
  ArrowRight,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Award,
  BookOpen,
  Target,
  ArrowLeft,
} from 'lucide-react';

export interface MilestoneData {
  id: string;
  milestoneKey: string;
  phaseId?: string | null;
  orderIndex: number;
  title: string;
  description: string;
  importance: string;
  requiredKnowledge: string;
  estimatedHours: number;
  learningObjectives: string;
  projectIdea?: string | null;
  completionCriteria?: string | null;
  relevantResources?: string | null;
  relatedModuleType?: string | null;
  relatedModuleUrl?: string | null;
  prerequisiteKeys: string;
  status: 'LOCKED' | 'AVAILABLE' | 'IN_PROGRESS' | 'COMPLETED';
  completedAt?: string | null;
}

export interface PhaseData {
  id: string;
  orderIndex: number;
  title: string;
  description: string;
  estimatedWeeks: number;
  milestones: MilestoneData[];
}

interface RoadmapGraphProps {
  targetRole?: string;
  phases: PhaseData[];
  onUpdateMilestoneStatus?: (milestoneId: string, status: 'AVAILABLE' | 'IN_PROGRESS' | 'COMPLETED') => Promise<void>;
  isUpdating?: boolean;
  onSelectMilestone?: (milestone: MilestoneData) => void;
  onSwitchToPlan?: () => void;
}

export default function RoadmapGraph({
  targetRole = 'Software Engineer',
  phases,
  onSelectMilestone,
  onSwitchToPlan,
}: RoadmapGraphProps) {
  const [zoomLevel, setZoomLevel] = useState<number>(1);

  const resetZoom = () => setZoomLevel(1);
  const zoomIn = () => setZoomLevel((z) => Math.min(1.25, Number((z + 0.15).toFixed(2))));
  const zoomOut = () => setZoomLevel((z) => Math.max(0.75, Number((z - 0.15).toFixed(2))));

  // Calculate sequential step numbers
  const { globalStepMap, totalMilestonesCount } = useMemo(() => {
    const stepMap = new Map<string, number>();
    let step = 1;
    phases.forEach((p) => {
      p.milestones.forEach((m) => {
        stepMap.set(m.id, step++);
      });
    });
    return { globalStepMap: stepMap, totalMilestonesCount: step - 1 };
  }, [phases]);

  // Find next recommended milestone
  const nextRecommendedId = useMemo(() => {
    const allM = phases.flatMap((p) => p.milestones);
    const inProg = allM.find((m) => m.status === 'IN_PROGRESS');
    const avail = allM.find((m) => m.status === 'AVAILABLE');
    return (inProg || avail)?.id || null;
  }, [phases]);

  return (
    <div className="space-y-4">
      {/* Top Graph Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-white border border-slate-200 shadow-sm text-xs">
        <div className="flex items-center gap-3">
          {onSwitchToPlan && (
            <button
              type="button"
              onClick={onSwitchToPlan}
              className="py-1.5 px-3 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold flex items-center gap-1.5 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Preparation Plan</span>
            </button>
          )}

          {/* Clean Legend */}
          <div className="hidden md:flex items-center gap-2 text-[11px] text-slate-600">
            <span className="font-bold text-slate-400 uppercase text-[10px] mr-1">Legend:</span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Done
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" /> In Progress
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-500" /> Next Step
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400" /> Ready
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-50 text-slate-400 border border-slate-200 font-medium">
              <Lock className="w-2.5 h-2.5 text-slate-400" /> Locked
            </span>
          </div>
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl border border-slate-200">
          <button
            type="button"
            onClick={zoomOut}
            disabled={zoomLevel <= 0.75}
            className="p-1 rounded-lg text-slate-500 hover:text-slate-900 disabled:opacity-30 transition-colors"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={resetZoom}
            className="px-2 py-0.5 text-[11px] font-mono text-slate-600 hover:text-slate-900"
            title="Reset Zoom"
          >
            {Math.round(zoomLevel * 100)}%
          </button>
          <button
            type="button"
            onClick={zoomIn}
            disabled={zoomLevel >= 1.25}
            className="p-1 rounded-lg text-slate-500 hover:text-slate-900 disabled:opacity-30 transition-colors"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 2D Tree Flowchart Canvas */}
      <div className="p-6 md:p-8 rounded-3xl bg-slate-50/80 border border-slate-200/90 overflow-x-auto min-h-[500px]">
        <div
          className="max-w-2xl mx-auto space-y-6 transition-transform duration-200 origin-top"
          style={{ transform: zoomLevel !== 1 ? `scale(${zoomLevel})` : undefined }}
        >
          {/* ROOT NODE: TARGET CAREER */}
          <div className="max-w-md mx-auto p-4 rounded-2xl bg-white border border-slate-200 shadow-sm text-center space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block font-mono">
              TARGET CAREER
            </span>
            <h3 className="text-base font-extrabold text-slate-800">
              {targetRole}
            </h3>
            <p className="text-xs text-slate-500">
              {phases.length} Phases · {totalMilestonesCount} Step-by-Step Milestones
            </p>
          </div>

          {/* ARROW: TARGET CAREER -> PHASE 1 */}
          <div className="flex flex-col items-center select-none">
            <div className="w-0.5 h-6 bg-slate-300" />
            <div className="w-6 h-6 rounded-full bg-white border border-slate-300 flex items-center justify-center text-slate-500 shadow-sm">
              <ArrowDown className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* SEQUENTIAL PHASES & TOPIC NODES */}
          {phases.map((phase, pIdx) => {
            const completedCount = phase.milestones.filter((m) => m.status === 'COMPLETED').length;
            const isPhaseComplete = completedCount === phase.milestones.length && phase.milestones.length > 0;
            const isPhaseActive =
              !isPhaseComplete && phase.milestones.some((m) => m.status === 'IN_PROGRESS' || m.status === 'AVAILABLE');

            return (
              <div key={phase.id} className="space-y-4">
                {/* Phase Main Node */}
                <div
                  className={`p-4 rounded-2xl border transition-all shadow-sm ${
                    isPhaseComplete
                      ? 'bg-emerald-50/40 border-emerald-200'
                      : isPhaseActive
                      ? 'bg-white border-indigo-300 ring-2 ring-indigo-50'
                      : 'bg-white border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="w-6 h-6 rounded-lg bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center shrink-0">
                        {pIdx + 1}
                      </span>
                      <div className="min-w-0">
                        <h4 className="text-sm font-bold text-slate-800 truncate">
                          {phase.title}
                        </h4>
                        <p className="text-xs text-slate-500 truncate">
                          ~{phase.estimatedWeeks} Weeks · {phase.description}
                        </p>
                      </div>
                    </div>

                    <span className="text-[11px] font-semibold text-slate-500 shrink-0">
                      {completedCount}/{phase.milestones.length} Done
                    </span>
                  </div>

                  {/* Child Milestone Topic Cards Inside Phase */}
                  <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {phase.milestones.map((m) => {
                      const isCompleted = m.status === 'COMPLETED';
                      const isInProgress = m.status === 'IN_PROGRESS';
                      const isNext = m.id === nextRecommendedId;
                      const isLocked = m.status === 'LOCKED';
                      const stepNum = globalStepMap.get(m.id) || m.orderIndex;

                      return (
                        <div
                          key={m.id}
                          onClick={() => onSelectMilestone && onSelectMilestone(m)}
                          className={`p-3 rounded-xl border text-left cursor-pointer transition-all hover:shadow-sm ${
                            isCompleted
                              ? 'bg-white border-emerald-300 hover:border-emerald-400'
                              : isInProgress
                              ? 'bg-white border-indigo-400 hover:border-indigo-500 ring-1 ring-indigo-100'
                              : isNext
                              ? 'bg-white border-purple-400 hover:border-purple-500 ring-1 ring-purple-100'
                              : isLocked
                              ? 'bg-slate-50/60 border-slate-200 opacity-60'
                              : 'bg-white border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <span className="text-[10px] font-mono font-bold text-slate-400">
                              #{stepNum}
                            </span>
                            <span
                              className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${
                                isCompleted
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : isInProgress
                                  ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                                  : isNext
                                  ? 'bg-purple-50 text-purple-700 border-purple-200'
                                  : isLocked
                                  ? 'bg-slate-100 text-slate-400 border-slate-200'
                                  : 'bg-slate-100 text-slate-600 border-slate-200'
                              }`}
                            >
                              {isCompleted
                                ? 'Done'
                                : isInProgress
                                ? 'Active'
                                : isNext
                                ? 'Next'
                                : isLocked
                                ? 'Locked'
                                : 'Ready'}
                            </span>
                          </div>

                          <p className="text-xs font-bold text-slate-800 line-clamp-1">
                            {m.title}
                          </p>
                          <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                            ~{m.estimatedHours}h · {m.description}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* ARROW BETWEEN PHASES */}
                {pIdx < phases.length - 1 && (
                  <div className="flex flex-col items-center select-none py-1">
                    <div className="w-0.5 h-5 bg-slate-300" />
                    <div className="w-5 h-5 rounded-full bg-white border border-slate-300 flex items-center justify-center text-slate-400 shadow-sm">
                      <ArrowDown className="w-3 h-3" />
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {/* ARROW TO CAREER GOAL */}
          <div className="flex flex-col items-center select-none py-1">
            <div className="w-0.5 h-6 bg-slate-300" />
            <div className="w-6 h-6 rounded-full bg-white border border-emerald-300 flex items-center justify-center text-emerald-600 shadow-sm">
              <ArrowDown className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* CAREER GOAL ACHIEVED NODE */}
          <div className="max-w-md mx-auto p-4 rounded-2xl bg-emerald-50/50 border border-emerald-200 shadow-sm text-center space-y-1">
            <div className="inline-flex p-1.5 rounded-xl bg-emerald-100 text-emerald-700 mb-1">
              <Award className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block font-mono">
              CAREER GOAL
            </span>
            <h4 className="text-base font-extrabold text-slate-900">
              Placement & Industry Ready
            </h4>
            <p className="text-xs text-slate-600">
              Complete preparation pathway fulfilled for {targetRole}.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
