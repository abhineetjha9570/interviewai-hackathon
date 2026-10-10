'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import {
  X,
  Clock,
  Award,
  BookOpen,
  FolderGit2,
  ShieldCheck,
  CheckCircle2,
  Play,
  RotateCcw,
  GitBranch,
  ChevronRight,
  Code2,
  ExternalLink,
  Target,
  Lock,
} from 'lucide-react';
import { MilestoneData } from './RoadmapGraph';

interface MilestoneDetailsDrawerProps {
  milestone: MilestoneData | null;
  onClose: () => void;
  onUpdateStatus: (milestoneId: string, status: 'AVAILABLE' | 'IN_PROGRESS' | 'COMPLETED') => Promise<void>;
  isUpdating?: boolean;
  stepNumber?: number;
  totalSteps?: number;
  milestoneMap?: Map<string, MilestoneData>;
}

export default function MilestoneDetailsDrawer({
  milestone,
  onClose,
  onUpdateStatus,
  isUpdating = false,
  stepNumber,
  totalSteps,
  milestoneMap,
}: MilestoneDetailsDrawerProps) {
  if (!milestone) return null;

  // Parse objectives
  const parsedObjectives = useMemo(() => {
    try {
      return typeof milestone.learningObjectives === 'string'
        ? JSON.parse(milestone.learningObjectives)
        : milestone.learningObjectives || [];
    } catch {
      return [];
    }
  }, [milestone.learningObjectives]);

  // Parse resources
  const parsedResources = useMemo(() => {
    try {
      return typeof milestone.relevantResources === 'string'
        ? JSON.parse(milestone.relevantResources)
        : milestone.relevantResources || [];
    } catch {
      return [];
    }
  }, [milestone.relevantResources]);

  // Parse foundational knowledge
  const parsedKnowledge = useMemo(() => {
    try {
      return typeof milestone.requiredKnowledge === 'string'
        ? JSON.parse(milestone.requiredKnowledge)
        : milestone.requiredKnowledge || [];
    } catch {
      return [];
    }
  }, [milestone.requiredKnowledge]);

  // Parse prerequisites with completion status
  const prerequisites = useMemo(() => {
    try {
      const keys: string[] =
        typeof milestone.prerequisiteKeys === 'string'
          ? JSON.parse(milestone.prerequisiteKeys)
          : milestone.prerequisiteKeys || [];

      return keys.map((key) => {
        const target = milestoneMap?.get(key);
        return {
          key,
          title: target?.title || key,
          isCompleted: target?.status === 'COMPLETED',
        };
      });
    } catch {
      return [];
    }
  }, [milestone.prerequisiteKeys, milestoneMap]);

  // Practice URL helper
  const getPracticeUrl = (): string => {
    if (milestone.relatedModuleUrl) return milestone.relatedModuleUrl;
    const title = milestone.title.toLowerCase();
    if (
      title.includes('dsa') ||
      title.includes('array') ||
      title.includes('tree') ||
      title.includes('graph') ||
      title.includes('algorithm')
    ) {
      return `/practice?category=DSA&topic=${encodeURIComponent(milestone.title)}`;
    }
    if (
      title.includes('aptitude') ||
      title.includes('quant') ||
      title.includes('logical') ||
      title.includes('reasoning')
    ) {
      return `/practice?category=Aptitude&topic=${encodeURIComponent(milestone.title)}`;
    }
    if (title.includes('hr') || title.includes('behavior') || title.includes('leadership')) {
      return `/practice?category=HR&topic=${encodeURIComponent(milestone.title)}`;
    }
    return `/practice?category=Technical&topic=${encodeURIComponent(milestone.title)}`;
  };

  const isCompleted = milestone.status === 'COMPLETED';
  const isInProgress = milestone.status === 'IN_PROGRESS';
  const isAvailable = milestone.status === 'AVAILABLE';
  const isLocked = milestone.status === 'LOCKED';

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Slide-over panel */}
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-lg bg-white border-l border-slate-200 shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
          {/* Header */}
          <div className="p-6 border-b border-slate-200 flex items-start justify-between gap-4 bg-slate-50/60">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                {stepNumber && (
                  <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-md bg-slate-200 text-slate-700">
                    Step {stepNumber} {totalSteps ? `of ${totalSteps}` : ''}
                  </span>
                )}
                <span
                  className={`text-xs px-2.5 py-0.5 rounded-full font-bold border ${
                    isCompleted
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : isInProgress
                      ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                      : isAvailable
                      ? 'bg-slate-100 text-slate-700 border-slate-200'
                      : 'bg-slate-50 text-slate-400 border-slate-200'
                  }`}
                >
                  {isCompleted
                    ? 'Completed'
                    : isInProgress
                    ? 'In Progress'
                    : isAvailable
                    ? 'Ready to Start'
                    : 'Locked'}
                </span>
              </div>
              <h3 className="text-xl font-extrabold text-slate-900 leading-snug">
                {milestone.title}
              </h3>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Scrollable Content Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Description */}
            <div className="space-y-1.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                What You Need to Learn
              </h4>
              <p className="text-sm text-slate-700 leading-relaxed">
                {milestone.description}
              </p>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-0.5">
                <span className="text-[11px] text-slate-500 font-medium block">
                  Estimated Study
                </span>
                <span className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-indigo-600" />
                  ~{milestone.estimatedHours} Hours
                </span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-0.5">
                <span className="text-[11px] text-slate-500 font-medium block">
                  Relevance
                </span>
                <span className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-amber-500" />
                  {milestone.importance} Topic
                </span>
              </div>
            </div>

            {/* Prerequisites */}
            {prerequisites.length > 0 && (
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <GitBranch className="w-3.5 h-3.5 text-indigo-600" />
                  Prerequisites
                </h4>
                <div className="space-y-1.5">
                  {prerequisites.map((p) => (
                    <div
                      key={p.key}
                      className="flex items-center justify-between text-xs p-2 rounded-lg bg-white border border-slate-200 shadow-sm"
                    >
                      <span className="text-slate-800 font-medium">{p.title}</span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                          p.isCompleted
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {p.isCompleted ? 'Completed' : 'Required'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Learning Objectives */}
            {parsedObjectives.length > 0 && (
              <div className="space-y-2.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
                  Core Learning Objectives
                </h4>
                <ul className="space-y-2">
                  {parsedObjectives.map((obj: string, i: number) => (
                    <li
                      key={i}
                      className="text-xs text-slate-700 flex items-start gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200"
                    >
                      <ChevronRight className="w-3.5 h-3.5 text-indigo-600 shrink-0 mt-0.5" />
                      <span>{obj}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Foundational Knowledge */}
            {parsedKnowledge.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Helpful Prior Knowledge
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {parsedKnowledge.map((kn: string, i: number) => (
                    <span
                      key={i}
                      className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 border border-slate-200 font-medium"
                    >
                      {kn}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Practical Project Idea */}
            {milestone.projectIdea && (
              <div className="p-4 rounded-xl bg-indigo-50/50 border border-indigo-100 space-y-1">
                <h4 className="text-xs font-bold text-indigo-900 flex items-center gap-1.5">
                  <FolderGit2 className="w-3.5 h-3.5 text-indigo-600" />
                  Recommended Project Activity
                </h4>
                <p className="text-xs text-slate-700 leading-relaxed">
                  {milestone.projectIdea}
                </p>
              </div>
            )}

            {/* Independent Self-Study Resources */}
            {parsedResources.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Recommended Independent Study Materials
                </h4>
                <ul className="space-y-1.5 text-xs text-slate-600">
                  {parsedResources.map((res: string, i: number) => (
                    <li key={i} className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-600" />
                      <span>{res}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Completion Criteria */}
            {milestone.completionCriteria && (
              <div className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-100 space-y-1">
                <h4 className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  Completion Criteria
                </h4>
                <p className="text-xs text-slate-700 leading-relaxed">
                  {milestone.completionCriteria}
                </p>
              </div>
            )}

            {/* Optional Companion Link */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block font-mono">
                Optional Companion
              </span>
              <p className="text-xs text-slate-500">
                You can follow this milestone completely independently. You can also practice questions inside InterviewAI:
              </p>
              <Link
                href={getPracticeUrl()}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-700 pt-0.5"
              >
                <span>Launch Optional Practice Session</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Action Footer */}
          <div className="p-5 border-t border-slate-200 bg-slate-50/60 flex items-center gap-2.5">
            {!isCompleted ? (
              <button
                type="button"
                disabled={isUpdating || isLocked}
                onClick={async () => {
                  await onUpdateStatus(milestone.id, 'COMPLETED');
                }}
                className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Mark as Completed</span>
              </button>
            ) : (
              <button
                type="button"
                disabled={isUpdating}
                onClick={async () => {
                  await onUpdateStatus(milestone.id, 'AVAILABLE');
                }}
                className="flex-1 py-2.5 px-4 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 font-bold text-xs transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                <RotateCcw className="w-4 h-4 text-slate-500" />
                <span>Reset to Incomplete</span>
              </button>
            )}

            {isAvailable && (
              <button
                type="button"
                disabled={isUpdating}
                onClick={async () => {
                  await onUpdateStatus(milestone.id, 'IN_PROGRESS');
                }}
                className="flex-1 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>Set In Progress</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
