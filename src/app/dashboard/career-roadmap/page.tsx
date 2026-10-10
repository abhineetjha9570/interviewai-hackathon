'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  ChevronRight,
  Sliders,
  Plus,
  Play,
  Check,
  CheckCircle2,
  Clock,
  Lock,
  BookOpen,
  Layers,
  ArrowDown,
  AlertTriangle,
  Trash2,
  RotateCcw,
  Award,
  ChevronDown,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import RoadmapGraph, { PhaseData, MilestoneData } from '@/components/roadmap/RoadmapGraph';
import MilestoneDetailsDrawer from '@/components/roadmap/MilestoneDetailsDrawer';

export default function CareerRoadmapPage() {
  const [roadmap, setRoadmap] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showWizard, setShowWizard] = useState(false);
  const [showReviseModal, setShowReviseModal] = useState(false);

  // Tab View Switcher: Preparation Plan (Default) vs Tree Graph
  const [activeTab, setActiveTab] = useState<'PLAN' | 'GRAPH'>('PLAN');

  // Slide-over Details Drawer state
  const [selectedMilestone, setSelectedMilestone] = useState<MilestoneData | null>(null);

  // Expandable phases accordion state
  const [expandedPhases, setExpandedPhases] = useState<Set<string>>(new Set());

  // Revision Modal State
  const [reviseWeeks, setReviseWeeks] = useState(12);
  const [reviseHours, setReviseHours] = useState(15);
  const [isRevising, setIsRevising] = useState(false);

  // Multi-Step Wizard State
  const [wizardStep, setWizardStep] = useState<1 | 2 | 3>(1);
  const [targetRole, setTargetRole] = useState('Software Engineer at Google');
  const [educationLevel, setEducationLevel] = useState('B.Tech / B.E.');
  const [degreeOrBranch, setDegreeOrBranch] = useState('Computer Science & Engineering');
  const [graduationYear, setGraduationYear] = useState('2026');
  const [programmingLanguages, setProgrammingLanguages] = useState(['Java', 'Python']);
  const [technicalSkills, setTechnicalSkills] = useState(['DSA', 'SQL', 'Git', 'OOP']);
  const [newSkillInput, setNewSkillInput] = useState('');
  const [experienceLevel, setExperienceLevel] = useState('Fresher');
  const [preferredDomain, setPreferredDomain] = useState('General Software Engineering');
  const [targetDurationWeeks, setTargetDurationWeeks] = useState(12);
  const [weeklyStudyHours, setWeeklyStudyHours] = useState(15);
  const [currentSkillLevel, setCurrentSkillLevel] = useState<'Beginner' | 'Intermediate' | 'Advanced'>('Intermediate');
  const [learningPace, setLearningPace] = useState<'Relaxed' | 'Moderate' | 'Intensive'>('Moderate');
  const [generationMode, setGenerationMode] = useState<'FRAMEWORK' | 'AI'>('FRAMEWORK');

  // Fetch active roadmap & profile context on mount
  useEffect(() => {
    async function fetchRoadmap() {
      try {
        setLoading(true);
        const res = await fetch('/api/career-roadmap');
        const data = await res.json();

        // Auto-fill wizard with candidate's actual profile context
        if (data.profileContext) {
          if (data.profileContext.targetRole) setTargetRole(data.profileContext.targetRole);
          if (data.profileContext.experienceLevel) setExperienceLevel(data.profileContext.experienceLevel);
          if (data.profileContext.technicalSkills && data.profileContext.technicalSkills.length > 0) {
            setTechnicalSkills(data.profileContext.technicalSkills);
          }
          if (data.profileContext.degreeOrBranch) setDegreeOrBranch(data.profileContext.degreeOrBranch);
          if (data.profileContext.graduationYear) setGraduationYear(data.profileContext.graduationYear);
          if (data.profileContext.preferredDomain) setPreferredDomain(data.profileContext.preferredDomain);
        }

        if (data.roadmap) {
          setRoadmap(data.roadmap);
          setShowWizard(false);

          // By default, expand the active phase (first phase with incomplete milestones)
          const activePhase = data.roadmap.phases?.find((p: any) =>
            p.milestones?.some((m: any) => m.status !== 'COMPLETED')
          );
          if (activePhase) {
            setExpandedPhases(new Set([activePhase.id]));
          } else if (data.roadmap.phases?.length > 0) {
            setExpandedPhases(new Set([data.roadmap.phases[0].id]));
          }
        } else {
          setShowWizard(true);
        }
      } catch (err: any) {
        console.error('Failed to load roadmap:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchRoadmap();
  }, []);

  // Map of all milestones and metrics
  const { allMilestones, totalMilestones, completedCount, totalStudyHours, progressPct, nextStep, milestoneMap } =
    useMemo(() => {
      const all: MilestoneData[] = roadmap?.phases?.flatMap((p: any) => p.milestones) || [];
      const completed = all.filter((m) => m.status === 'COMPLETED').length;
      const hours = all.reduce((acc, m) => acc + (m.estimatedHours || 10), 0);
      const pct = all.length > 0 ? Math.round((completed / all.length) * 100) : roadmap?.progressPct || 0;

      const inProg = all.find((m) => m.status === 'IN_PROGRESS');
      const nextAvail = all.find((m) => m.status === 'AVAILABLE');
      const next = inProg || nextAvail || null;

      const map = new Map<string, MilestoneData>();
      all.forEach((m) => map.set(m.milestoneKey, m));

      return {
        allMilestones: all,
        totalMilestones: all.length,
        completedCount: completed,
        totalStudyHours: hours,
        progressPct: pct,
        nextStep: next,
        milestoneMap: map,
      };
    }, [roadmap]);

  // Toggle single phase accordion
  const togglePhase = (phaseId: string) => {
    setExpandedPhases((prev) => {
      const next = new Set(prev);
      if (next.has(phaseId)) {
        next.delete(phaseId);
      } else {
        next.add(phaseId);
      }
      return next;
    });
  };

  const expandAllPhases = () => {
    if (!roadmap?.phases) return;
    setExpandedPhases(new Set(roadmap.phases.map((p: any) => p.id)));
  };

  const collapseAllPhases = () => {
    setExpandedPhases(new Set());
  };

  // Submit Wizard to generate new roadmap
  const handleGenerateRoadmap = async () => {
    setErrorMessage(null);
    setIsGenerating(true);

    try {
      const payload = {
        targetRole,
        educationLevel,
        degreeOrBranch,
        graduationYear,
        programmingLanguages,
        technicalSkills,
        experienceLevel,
        preferredDomain,
        targetDurationWeeks,
        weeklyStudyHours,
        currentSkillLevel,
        learningPace,
        mode: generationMode,
      };

      const res = await fetch('/api/career-roadmap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to generate career roadmap.');
      }

      setRoadmap(data.roadmap);
      setShowWizard(false);
      if (data.roadmap?.phases?.[0]?.id) {
        setExpandedPhases(new Set([data.roadmap.phases[0].id]));
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Generation failed. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Milestone Status Update Handler (Persisted to Database)
  const handleUpdateMilestoneStatus = async (
    milestoneId: string,
    status: 'AVAILABLE' | 'IN_PROGRESS' | 'COMPLETED'
  ) => {
    if (!roadmap) return;
    setIsUpdating(true);

    try {
      const res = await fetch('/api/career-roadmap/milestone', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roadmapId: roadmap.id,
          milestoneId,
          status,
        }),
      });

      const data = await res.json();
      if (data.success && data.roadmap) {
        setRoadmap(data.roadmap);
      }
    } catch (err) {
      console.error('Error updating milestone:', err);
    } finally {
      setIsUpdating(false);
    }
  };

  // Revise Roadmap Schedule
  const handleReviseRoadmap = async () => {
    if (!roadmap) return;
    setIsRevising(true);

    try {
      const res = await fetch('/api/career-roadmap/revise', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roadmapId: roadmap.id,
          newDurationWeeks: reviseWeeks,
          newWeeklyHours: reviseHours,
        }),
      });

      const data = await res.json();
      if (data.success && data.roadmap) {
        setRoadmap(data.roadmap);
        setShowReviseModal(false);
      }
    } catch (err) {
      console.error('Error revising roadmap:', err);
    } finally {
      setIsRevising(false);
    }
  };

  // Delete Roadmap
  const handleDeleteRoadmap = async () => {
    if (!confirm('Are you sure you want to delete this career roadmap?')) return;
    try {
      await fetch(`/api/career-roadmap?id=${roadmap.id}`, { method: 'DELETE' });
      setRoadmap(null);
      setShowWizard(true);
      setWizardStep(1);
    } catch (err) {
      console.error('Error deleting roadmap:', err);
    }
  };

  // Quick Role Suggestions for Step 1
  const roleSuggestions = [
    'Software Engineer at Google',
    'Backend Engineer at a Fintech Startup',
    'Full Stack Web Developer',
    'Data Scientist & ML Engineer',
    'Cybersecurity & AppSec Analyst',
    'Cloud Systems & DevOps Engineer',
  ];

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-20 bg-slate-100 rounded-2xl" />
        <div className="h-96 bg-slate-100 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* =========================================================================
          SECTION A — PAGE HEADER
         ========================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <Link href="/dashboard" className="hover:text-indigo-600 transition-colors">
              Dashboard
            </Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="font-semibold text-slate-700">Career Roadmap</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
            Career Roadmap
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Your personalized preparation plan, organized step by step.
          </p>
        </div>

        {roadmap && !showWizard && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setReviseWeeks(roadmap.weeklyHours ? 12 : 12);
                setReviseHours(roadmap.weeklyHours || 15);
                setShowReviseModal(true);
              }}
              className="py-2 px-3.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <Sliders className="w-3.5 h-3.5 text-slate-500" />
              <span>Revise Schedule</span>
            </button>
            <button
              onClick={() => {
                setShowWizard(true);
                setWizardStep(1);
              }}
              className="py-2 px-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-sm flex items-center gap-1.5 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Roadmap</span>
            </button>
          </div>
        )}
      </div>

      {roadmap && !showWizard ? (
        <div className="space-y-6">
          {/* =========================================================================
              SECTION B — COMPACT ROADMAP SUMMARY ROW
             ========================================================================= */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
            {/* Target Role */}
            <div className="col-span-2 md:col-span-2 p-4 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block font-mono">
                Target Role
              </span>
              <p className="text-base font-extrabold text-slate-900 truncate" title={roadmap.targetRole}>
                {roadmap.targetRole}
              </p>
              <p className="text-xs text-slate-500">
                {roadmap.targetDuration || '12 Weeks'} · {roadmap.weeklyHours || 15}h / week
              </p>
            </div>

            {/* Structure */}
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block font-mono">
                Structure
              </span>
              <p className="text-base font-extrabold text-slate-900">
                {roadmap.phases?.length || 0} Phases
              </p>
              <p className="text-xs text-slate-500">
                {totalMilestones} Milestones
              </p>
            </div>

            {/* Estimated Hours */}
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block font-mono">
                Estimated Study
              </span>
              <p className="text-base font-extrabold text-slate-900">
                ~{totalStudyHours} Hours
              </p>
              <p className="text-xs text-slate-500">
                Self-paced learning
              </p>
            </div>

            {/* Overall Progress */}
            <div className="col-span-2 md:col-span-1 p-4 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-1.5 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 font-mono">
                  Progress
                </span>
                <span className="text-sm font-extrabold text-indigo-600">
                  {progressPct}%
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full rounded-full bg-indigo-600 transition-all duration-300"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
              <span className="text-[11px] text-slate-400 block">
                {completedCount} of {totalMilestones} completed
              </span>
            </div>
          </div>

          {/* =========================================================================
              VIEW SWITCHER: SEGMENTED CONTROL TABS
             ========================================================================= */}
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div className="flex p-1 rounded-xl bg-slate-100 border border-slate-200 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setActiveTab('PLAN')}
                className={`py-1.5 px-4 rounded-lg flex items-center gap-2 transition-all ${
                  activeTab === 'PLAN'
                    ? 'bg-white text-slate-900 shadow-sm font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <BookOpen className="w-4 h-4 text-indigo-600" />
                <span>Preparation Plan</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('GRAPH')}
                className={`py-1.5 px-4 rounded-lg flex items-center gap-2 transition-all ${
                  activeTab === 'GRAPH'
                    ? 'bg-white text-slate-900 shadow-sm font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Layers className="w-4 h-4 text-indigo-600" />
                <span>Tree Graph</span>
              </button>
            </div>

            <div className="flex items-center gap-3">
              {activeTab === 'PLAN' && (
                <div className="flex items-center gap-2 text-xs">
                  <button
                    type="button"
                    onClick={expandAllPhases}
                    className="text-slate-500 hover:text-slate-900 font-medium"
                  >
                    Expand All
                  </button>
                  <span className="text-slate-300">·</span>
                  <button
                    type="button"
                    onClick={collapseAllPhases}
                    className="text-slate-500 hover:text-slate-900 font-medium"
                  >
                    Collapse
                  </button>
                </div>
              )}

              <button
                type="button"
                onClick={handleDeleteRoadmap}
                className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg transition-colors"
                title="Delete Roadmap"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* =========================================================================
              TAB 1: PREPARATION PLAN (DEFAULT VIEW)
             ========================================================================= */}
          {activeTab === 'PLAN' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              {/* SECTION D — YOUR NEXT STEP (COMPACT & FOCUSED) */}
              {nextStep && (
                <div className="p-5 rounded-2xl bg-indigo-50/70 border border-indigo-100 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-indigo-600 text-white font-mono">
                        Your Next Step
                      </span>
                      <span className="text-xs font-semibold text-slate-500">
                        ~{nextStep.estimatedHours} Hours · {nextStep.importance} Topic
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-slate-900">
                      {nextStep.title}
                    </h3>
                    <p className="text-xs text-slate-600 max-w-2xl line-clamp-1">
                      {nextStep.description}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => setSelectedMilestone(nextStep)}
                      className="py-2 px-3.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold border border-slate-200 shadow-sm transition-colors"
                    >
                      View Details
                    </button>

                    {nextStep.status === 'AVAILABLE' && (
                      <button
                        type="button"
                        disabled={isUpdating}
                        onClick={() => handleUpdateMilestoneStatus(nextStep.id, 'IN_PROGRESS')}
                        className="py-2 px-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm transition-colors disabled:opacity-50 flex items-center gap-1.5"
                      >
                        <Play className="w-3.5 h-3.5 fill-white" />
                        <span>Mark as In Progress</span>
                      </button>
                    )}

                    {nextStep.status === 'IN_PROGRESS' && (
                      <button
                        type="button"
                        disabled={isUpdating}
                        onClick={() => handleUpdateMilestoneStatus(nextStep.id, 'COMPLETED')}
                        className="py-2 px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition-colors disabled:opacity-50 flex items-center gap-1.5"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Mark as Completed</span>
                      </button>
                    )}

                    {nextStep.status === 'COMPLETED' && (
                      <button
                        type="button"
                        disabled={isUpdating}
                        onClick={() => handleUpdateMilestoneStatus(nextStep.id, 'AVAILABLE')}
                        className="py-2 px-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors disabled:opacity-50 flex items-center gap-1.5"
                      >
                        <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                        <span>Reset</span>
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* SECTION C — PREPARATION PATH (NUMBERED PHASES) */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-extrabold text-slate-900">
                    Your Preparation Path
                  </h2>
                  <span className="text-xs text-slate-400">
                    Follow the phases in order
                  </span>
                </div>

                <div className="space-y-3">
                  {roadmap.phases?.map((phase: any, pIdx: number) => {
                    const isExpanded = expandedPhases.has(phase.id);
                    const completedMilestones = phase.milestones?.filter((m: any) => m.status === 'COMPLETED').length || 0;
                    const isPhaseDone = completedMilestones === (phase.milestones?.length || 0) && phase.milestones?.length > 0;
                    const isCurrentPhase = !isPhaseDone && phase.milestones?.some((m: any) => m.status === 'IN_PROGRESS' || m.status === 'AVAILABLE');

                    const formattedPhaseNum = String(phase.orderIndex || pIdx + 1).padStart(2, '0');

                    return (
                      <div key={phase.id} className="space-y-2">
                        {/* Phase Header Card */}
                        <div
                          onClick={() => togglePhase(phase.id)}
                          className={`p-4 md:p-5 rounded-2xl border cursor-pointer select-none transition-all shadow-sm flex items-center justify-between gap-4 ${
                            isPhaseDone
                              ? 'bg-slate-50/60 border-emerald-200 hover:bg-slate-50'
                              : isCurrentPhase
                              ? 'bg-white border-indigo-400 ring-2 ring-indigo-50 shadow-md'
                              : 'bg-white border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <div className="flex items-center gap-3.5 min-w-0">
                            {/* Numbered Pill */}
                            <span
                              className={`w-9 h-9 rounded-xl font-bold font-mono text-xs flex items-center justify-center shrink-0 ${
                                isPhaseDone
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : isCurrentPhase
                                  ? 'bg-indigo-600 text-white shadow-sm'
                                  : 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              {isPhaseDone ? <Check className="w-4 h-4" /> : formattedPhaseNum}
                            </span>

                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <h3 className="text-sm md:text-base font-bold text-slate-900 truncate">
                                  {phase.title}
                                </h3>
                                {isCurrentPhase && (
                                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200">
                                    Current Phase
                                  </span>
                                )}
                                {isPhaseDone && (
                                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                                    Completed
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-slate-500 truncate mt-0.5">
                                ~{phase.estimatedWeeks} Weeks · {phase.description}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 shrink-0">
                            <span className="text-xs font-semibold text-slate-500 hidden sm:inline">
                              {completedMilestones} of {phase.milestones?.length || 0} Done
                            </span>
                            <div className="p-1 rounded-lg text-slate-400 hover:text-slate-600">
                              {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                            </div>
                          </div>
                        </div>

                        {/* Collapsible Milestones List */}
                        {isExpanded && (
                          <div className="pl-4 md:pl-6 space-y-2 pt-1 pb-2">
                            {phase.milestones?.map((m: any, mIdx: number) => {
                              const isMCompleted = m.status === 'COMPLETED';
                              const isMInProgress = m.status === 'IN_PROGRESS';
                              const isMLocked = m.status === 'LOCKED';
                              const isMAvailable = m.status === 'AVAILABLE';

                              return (
                                <div
                                  key={m.id}
                                  onClick={() => setSelectedMilestone(m)}
                                  className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                                    isMCompleted
                                      ? 'bg-slate-50 border-slate-200'
                                      : isMInProgress
                                      ? 'bg-indigo-50/40 border-indigo-200 shadow-sm'
                                      : isMLocked
                                      ? 'bg-slate-50/40 border-slate-200 opacity-60'
                                      : 'bg-white border-slate-200 hover:border-slate-300'
                                  }`}
                                >
                                  <div className="flex items-center gap-3 min-w-0">
                                    {/* Status Icon */}
                                    <div className="shrink-0">
                                      {isMCompleted && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                                      {isMInProgress && <Play className="w-4 h-4 fill-indigo-600 text-indigo-600" />}
                                      {isMAvailable && <div className="w-3.5 h-3.5 rounded-full border-2 border-slate-400" />}
                                      {isMLocked && <Lock className="w-3.5 h-3.5 text-slate-400" />}
                                    </div>

                                    <div className="min-w-0">
                                      <p className="text-xs md:text-sm font-semibold text-slate-800 truncate">
                                        {m.title}
                                      </p>
                                      <p className="text-[11px] text-slate-500 truncate">
                                        ~{m.estimatedHours} Hours · {m.description}
                                      </p>
                                    </div>
                                  </div>

                                  <div
                                    className="flex items-center gap-2 shrink-0"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <button
                                      type="button"
                                      onClick={() => setSelectedMilestone(m)}
                                      className="py-1 px-2.5 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                                    >
                                      Details
                                    </button>

                                    {!isMLocked && (
                                      <>
                                        {isMCompleted ? (
                                          <button
                                            type="button"
                                            disabled={isUpdating}
                                            onClick={() => handleUpdateMilestoneStatus(m.id, 'AVAILABLE')}
                                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                                            title="Reset to Incomplete"
                                          >
                                            <RotateCcw className="w-3.5 h-3.5" />
                                          </button>
                                        ) : (
                                          <button
                                            type="button"
                                            disabled={isUpdating}
                                            onClick={() => handleUpdateMilestoneStatus(m.id, 'COMPLETED')}
                                            className="py-1 px-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition-colors flex items-center gap-1"
                                          >
                                            <Check className="w-3 h-3" />
                                            <span>Done</span>
                                          </button>
                                        )}
                                      </>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {/* Clean Arrow Between Phases */}
                        {pIdx < (roadmap.phases?.length || 0) - 1 && (
                          <div className="flex justify-center py-0.5 select-none text-slate-400">
                            <ArrowDown className="w-3.5 h-3.5" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* =========================================================================
              TAB 2: TREE GRAPH VIEW (SEPARATE CLEAN FLOWCHART)
             ========================================================================= */}
          {activeTab === 'GRAPH' && (
            <div className="animate-in fade-in duration-150">
              <RoadmapGraph
                targetRole={roadmap.targetRole}
                phases={roadmap.phases || []}
                onSelectMilestone={setSelectedMilestone}
                onSwitchToPlan={() => setActiveTab('PLAN')}
              />
            </div>
          )}
        </div>
      ) : (
        /* =========================================================================
            VIEW 2: MULTI-STEP CREATION WIZARD
           ========================================================================= */
        <div className="max-w-2xl mx-auto p-8 rounded-3xl bg-white border border-slate-200/80 shadow-sm space-y-8 animate-in fade-in duration-200">
          {/* Stepper Navigation */}
          <div className="flex items-center justify-between pb-6 border-b border-slate-100">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center gap-2">
                <span
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                    wizardStep === step
                      ? 'bg-indigo-600 text-white ring-4 ring-indigo-50'
                      : wizardStep > step
                      ? 'bg-emerald-500 text-white'
                      : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {wizardStep > step ? <CheckCircle2 className="w-4 h-4" /> : step}
                </span>
                <span className="text-xs font-bold text-slate-700 hidden sm:inline">
                  {step === 1 ? 'Target Goal' : step === 2 ? 'Current Profile' : 'Study Schedule'}
                </span>
              </div>
            ))}
          </div>

          {errorMessage && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* STEP 1: TARGET GOAL */}
          {wizardStep === 1 && (
            <div className="space-y-5">
              <div className="space-y-1">
                <h3 className="text-lg font-extrabold text-slate-800">
                  Step 1: What is your target career role?
                </h3>
                <p className="text-xs text-slate-500">
                  Enter your target role or company. Our engine adapts data structures, systems, and interview goals accordingly.
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
                  Target Role & Company
                </label>
                <input
                  type="text"
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                  placeholder="e.g. Software Engineer at Google, Backend Engineer at Fintech..."
                  className="w-full p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="space-y-2">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Popular Role Pathways:
                </span>
                <div className="flex flex-wrap gap-2">
                  {roleSuggestions.map((sug) => (
                    <button
                      key={sug}
                      type="button"
                      onClick={() => setTargetRole(sug)}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-xs text-slate-600 font-medium transition-colors"
                    >
                      {sug}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  type="button"
                  onClick={() => setWizardStep(2)}
                  className="py-3 px-6 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-600/30 flex items-center gap-2"
                >
                  <span>Continue to Profile</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: CURRENT PROFILE */}
          {wizardStep === 2 && (
            <div className="space-y-5">
              <div className="space-y-1">
                <h3 className="text-lg font-extrabold text-slate-800">
                  Step 2: Your Current Technical Background
                </h3>
                <p className="text-xs text-slate-500">
                  Tailor prerequisite milestones to match your degree, familiar languages, and existing skills.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-600 uppercase tracking-wider">Degree / Branch</label>
                  <input
                    type="text"
                    value={degreeOrBranch}
                    onChange={(e) => setDegreeOrBranch(e.target.value)}
                    className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 font-semibold"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-600 uppercase tracking-wider">Graduation Year</label>
                  <input
                    type="text"
                    value={graduationYear}
                    onChange={(e) => setGraduationYear(e.target.value)}
                    className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 font-semibold"
                  />
                </div>
              </div>

              {/* Skills Tags */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
                  Key Technical Skills & Languages
                </label>
                <div className="flex flex-wrap gap-2">
                  {technicalSkills.map((sk) => (
                    <span
                      key={sk}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-indigo-50 border border-indigo-200 text-xs font-bold text-indigo-700"
                    >
                      <span>{sk}</span>
                      <button
                        type="button"
                        onClick={() => setTechnicalSkills(technicalSkills.filter((s) => s !== sk))}
                        className="hover:text-red-600"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2 max-w-sm">
                  <input
                    type="text"
                    value={newSkillInput}
                    onChange={(e) => setNewSkillInput(e.target.value)}
                    placeholder="Add skill (e.g. Docker, Redis)..."
                    className="flex-1 p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (newSkillInput.trim() && !technicalSkills.includes(newSkillInput.trim())) {
                        setTechnicalSkills([...technicalSkills, newSkillInput.trim()]);
                        setNewSkillInput('');
                      }
                    }}
                    className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-bold text-xs"
                  >
                    Add
                  </button>
                </div>
              </div>

              <div className="pt-4 flex justify-between">
                <button
                  type="button"
                  onClick={() => setWizardStep(1)}
                  className="py-2.5 px-5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => setWizardStep(3)}
                  className="py-3 px-6 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-600/30 flex items-center gap-2"
                >
                  <span>Continue to Schedule</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: TIME & AVAILABILITY */}
          {wizardStep === 3 && (
            <div className="space-y-6">
              <div className="space-y-1">
                <h3 className="text-lg font-extrabold text-slate-800">
                  Step 3: Timeline & Study Availability
                </h3>
                <p className="text-xs text-slate-500">
                  We balance milestone workloads so you never get overwhelmed.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs">
                <div className="space-y-2">
                  <label className="font-bold text-slate-600 uppercase tracking-wider">
                    Target Duration
                  </label>
                  <select
                    value={targetDurationWeeks}
                    onChange={(e) => setTargetDurationWeeks(Number(e.target.value))}
                    className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 font-semibold text-slate-800"
                  >
                    <option value={4}>4 Weeks (Crash Course)</option>
                    <option value={8}>8 Weeks (2 Months)</option>
                    <option value={12}>12 Weeks (3 Months - Recommended)</option>
                    <option value={16}>16 Weeks (4 Months)</option>
                    <option value={24}>24 Weeks (6 Months Comprehensive)</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="font-bold text-slate-600 uppercase tracking-wider">
                    Available Study Hours / Week
                  </label>
                  <select
                    value={weeklyStudyHours}
                    onChange={(e) => setWeeklyStudyHours(Number(e.target.value))}
                    className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 font-semibold text-slate-800"
                  >
                    <option value={8}>8 Hours / Week (Light)</option>
                    <option value={15}>15 Hours / Week (Balanced)</option>
                    <option value={25}>25 Hours / Week (Dedicated)</option>
                    <option value={35}>35+ Hours / Week (Bootcamp Intensity)</option>
                  </select>
                </div>
              </div>

              {/* Generation Mode Selector */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
                <span className="text-xs font-bold text-slate-800 block">
                  Roadmap Engine Mode
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <button
                    type="button"
                    onClick={() => setGenerationMode('FRAMEWORK')}
                    className={`p-3 rounded-xl text-left border transition-all ${
                      generationMode === 'FRAMEWORK'
                        ? 'bg-indigo-50 border-indigo-500 ring-2 ring-indigo-200 text-indigo-950 font-bold'
                        : 'bg-white border-slate-200 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span>Verified Industry Framework</span>
                      <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">Zero Credits</span>
                    </div>
                    <p className="text-[11px] font-normal text-slate-500">
                      Standardized curriculum designed by tier-1 engineering hiring managers.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setGenerationMode('AI')}
                    className={`p-3 rounded-xl text-left border transition-all ${
                      generationMode === 'AI'
                        ? 'bg-indigo-50 border-indigo-500 ring-2 ring-indigo-200 text-indigo-950 font-bold'
                        : 'bg-white border-slate-200 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span>Personalized AI Model</span>
                      <span className="px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-800 text-[10px] font-bold">AI Engine</span>
                    </div>
                    <p className="text-[11px] font-normal text-slate-500">
                      Generates a tailored syllabus based on your exact profile.
                    </p>
                  </button>
                </div>
              </div>

              <div className="pt-4 flex justify-between">
                <button
                  type="button"
                  onClick={() => setWizardStep(2)}
                  className="py-2.5 px-5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
                >
                  Back
                </button>
                <button
                  type="button"
                  disabled={isGenerating}
                  onClick={handleGenerateRoadmap}
                  className="py-3 px-6 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-600/30 flex items-center gap-2 disabled:opacity-50"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{isGenerating ? 'Generating Roadmap...' : 'Generate Career Roadmap'}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          REVISE SCHEDULE MODAL
         ========================================================================= */}
      {showReviseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl space-y-5">
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-slate-900">Revise Preparation Schedule</h3>
              <p className="text-xs text-slate-500">
                Adjust your timeline and weekly commitment. All completed milestones and notes remain preserved.
              </p>
            </div>

            <div className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700">Target Duration (Weeks)</label>
                <input
                  type="number"
                  min={4}
                  max={52}
                  value={reviseWeeks}
                  onChange={(e) => setReviseWeeks(Number(e.target.value))}
                  className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 font-bold text-slate-800"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-700">Weekly Study Hours</label>
                <input
                  type="number"
                  min={4}
                  max={80}
                  value={reviseHours}
                  onChange={(e) => setReviseHours(Number(e.target.value))}
                  className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 font-bold text-slate-800"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowReviseModal(false)}
                className="flex-1 py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isRevising}
                onClick={handleReviseRoadmap}
                className="flex-1 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm disabled:opacity-50"
              >
                {isRevising ? 'Saving...' : 'Update Schedule'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          SHARED SLIDE-OVER DETAILS DRAWER
         ========================================================================= */}
      <MilestoneDetailsDrawer
        milestone={selectedMilestone}
        onClose={() => setSelectedMilestone(null)}
        onUpdateStatus={handleUpdateMilestoneStatus}
        isUpdating={isUpdating}
        totalSteps={totalMilestones}
        milestoneMap={milestoneMap}
      />
    </div>
  );
}
