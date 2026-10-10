'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Briefcase,
  GraduationCap,
  Code2,
  FileText,
  Upload,
  Check,
  Plus,
  X,
  Target,
  Layers,
  FileCheck
} from 'lucide-react';

export default function OnboardingPage() {
  const router = useRouter();

  // 7-step wizard state
  const [currentStep, setCurrentStep] = useState(1);

  // Step 1: Prep Goal
  const [goal, setGoal] = useState('Campus Placement');

  // Step 2: Experience Level
  const [experience, setExperience] = useState('Fresher');

  // Step 3: Primary Career Role
  const [targetRole, setTargetRole] = useState('Software Engineer');

  // Step 4: Skills
  const defaultSkills = [
    'Java', 'Python', 'C++', 'DSA', 'SQL',
    'React', 'Node.js', 'Spring Boot', 'OOP', 'DBMS', 'Operating Systems', 'System Design'
  ];
  const [selectedSkills, setSelectedSkills] = useState<string[]>(['Java', 'Python', 'DSA', 'SQL']);
  const [customSkillInput, setCustomSkillInput] = useState('');

  // Step 5: Optional Resume
  const [resumeFileName, setResumeFileName] = useState<string | null>(null);

  // Step 6: Optional Job Description
  const [jobDescription, setJobDescription] = useState('');

  // Loading & error
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleSkill = (skill: string) => {
    if (selectedSkills.includes(skill)) {
      setSelectedSkills(selectedSkills.filter((s) => s !== skill));
    } else {
      setSelectedSkills([...selectedSkills, skill]);
    }
  };

  const addCustomSkill = () => {
    if (customSkillInput.trim() && !selectedSkills.includes(customSkillInput.trim())) {
      setSelectedSkills([...selectedSkills, customSkillInput.trim()]);
      setCustomSkillInput('');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setResumeFileName(file.name);
    }
  };

  const handleCompleteSetup = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          goal,
          experience,
          targetRole,
          skills: selectedSkills,
          resumeName: resumeFileName || 'Uploaded_Resume.pdf',
          jobDescription: jobDescription.trim() || null,
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Failed to complete onboarding');
      }

      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Error occurred while saving profile');
      setLoading(false);
    }
  };

  const nextStep = () => {
    if (currentStep < 7) {
      setCurrentStep((prev) => prev + 1);
    } else {
      handleCompleteSetup();
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-indigo-500 selection:text-white">
      {/* Top Header */}
      <header className="px-8 py-6 border-b border-slate-800/80 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
            <Sparkles className="w-4 h-4" />
          </div>
          <span className="font-extrabold text-lg text-white">
            Interview<span className="text-indigo-400">AI</span>
          </span>
        </Link>

        {/* Step Indicator */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-400">Step {currentStep} of 7</span>
          <div className="flex gap-1.5">
            {[1, 2, 3, 4, 5, 6, 7].map((num) => (
              <div
                key={num}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  num === currentStep
                    ? 'w-6 bg-indigo-500'
                    : num < currentStep
                    ? 'w-3 bg-emerald-500'
                    : 'w-2 bg-slate-800'
                }`}
              />
            ))}
          </div>
        </div>
      </header>

      {/* Main Form Center */}
      <main className="flex-1 max-w-2xl w-full mx-auto p-6 md:p-8 flex flex-col justify-center">
        <div className="space-y-8 animate-in fade-in duration-200">
          {error && (
            <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold">
              {error}
            </div>
          )}

          {/* STEP 1: Preparation Goal */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">Step 1 of 7</span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white">What is your primary preparation goal?</h2>
                <p className="text-slate-400 text-sm">
                  We'll customize your practice difficulty, aptitude sets, and mock tracks accordingly.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  {
                    title: 'Campus Placement',
                    desc: 'On-campus recruitment drives for tier-1 & tier-2 service and product companies.',
                  },
                  {
                    title: 'Off-Campus Placement',
                    desc: 'Direct applications, referrals, and competitive hiring assessments.',
                  },
                  {
                    title: 'Both Campus & Off-Campus',
                    desc: 'Comprehensive preparation spanning college drives and direct job openings.',
                  },
                  {
                    title: 'General Interview Prep',
                    desc: 'Sharpening DSA, system design, technical fundamentals, and behavioral STAR answers.',
                  },
                ].map((item) => (
                  <button
                    key={item.title}
                    type="button"
                    onClick={() => setGoal(item.title)}
                    className={`p-5 rounded-2xl border text-left transition-all ${
                      goal === item.title
                        ? 'bg-indigo-950/60 border-indigo-500 ring-2 ring-indigo-500/30'
                        : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-base text-white">{item.title}</span>
                      {goal === item.title && <CheckCircle2 className="w-5 h-5 text-indigo-400 shrink-0" />}
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">{item.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP 2: Experience Level */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">Step 2 of 7</span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white">What is your experience level?</h2>
                <p className="text-slate-400 text-sm">
                  Calibrates the depth of coding problems and system design questions.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { level: 'Fresher', label: 'College Student / New Graduate', desc: '0 years experience. Focus on DSA, Core CS, Aptitude, and basic projects.' },
                  { level: '0–1 years', label: 'Early Career', desc: 'Junior engineer with internship or entry-level experience.' },
                  { level: '1–3 years', label: 'Associate Engineer', desc: 'Working professional looking to switch to high-growth tech firms.' },
                  { level: '3+ years', label: 'Mid / Senior Engineer', desc: 'Deep technical, architectural, and leadership requirements.' },
                ].map((item) => (
                  <button
                    key={item.level}
                    type="button"
                    onClick={() => setExperience(item.level)}
                    className={`p-5 rounded-2xl border text-left transition-all ${
                      experience === item.level
                        ? 'bg-indigo-950/60 border-indigo-500 ring-2 ring-indigo-500/30'
                        : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-base text-white">{item.level}</span>
                      {experience === item.level && <CheckCircle2 className="w-5 h-5 text-indigo-400 shrink-0" />}
                    </div>
                    <p className="text-xs font-medium text-indigo-300 mb-1">{item.label}</p>
                    <p className="text-xs text-slate-400 leading-relaxed">{item.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP 3: Primary Career Role */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">Step 3 of 7</span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white">Select your primary career role</h2>
                <p className="text-slate-400 text-sm">
                  You can still prepare for other roles at any time in individual interview sessions.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  'Software Engineer',
                  'Backend Developer',
                  'Frontend Developer',
                  'Full Stack Developer',
                  'Data Analyst',
                  'Data Scientist',
                  'DevOps & Cloud Engineer',
                  'Quality Assurance / SDET',
                ].map((role) => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => setTargetRole(role)}
                    className={`p-4 rounded-2xl border text-left font-bold text-sm transition-all flex items-center justify-between ${
                      targetRole === role
                        ? 'bg-indigo-950/60 border-indigo-500 text-white'
                        : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <span>{role}</span>
                    {targetRole === role && <Check className="w-4 h-4 text-indigo-400" />}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP 4: Skills and Technologies */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">Step 4 of 7</span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white">Select your skills & technologies</h2>
                <p className="text-slate-400 text-sm">
                  Select key languages and tools you know. You can also add custom skills.
                </p>
              </div>

              {/* Skills Tags */}
              <div className="flex flex-wrap gap-2.5">
                {defaultSkills.map((sk) => {
                  const isSelected = selectedSkills.includes(sk);
                  return (
                    <button
                      key={sk}
                      type="button"
                      onClick={() => toggleSkill(sk)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                        isSelected
                          ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                          : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {sk}
                    </button>
                  );
                })}
              </div>

              {/* Add Custom Skill */}
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Add another skill (e.g. Docker, GraphQL, Kubernetes)..."
                  value={customSkillInput}
                  onChange={(e) => setCustomSkillInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomSkill())}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
                <button
                  type="button"
                  onClick={addCustomSkill}
                  className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-white text-xs font-bold transition-all flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add</span>
                </button>
              </div>

              {selectedSkills.length > 0 && (
                <div className="p-4 rounded-2xl bg-slate-900/40 border border-slate-800/80">
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Selected Skills ({selectedSkills.length})
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {selectedSkills.map((s) => (
                      <span
                        key={s}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-500/10 text-indigo-300 text-xs font-semibold"
                      >
                        {s}
                        <X className="w-3 h-3 cursor-pointer hover:text-white" onClick={() => toggleSkill(s)} />
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 5: Optional Resume Upload */}
          {currentStep === 5 && (
            <div className="space-y-6">
              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">Step 5 of 7 · Optional</span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white">Upload your resume (Optional)</h2>
                <p className="text-slate-400 text-sm">
                  Upload PDF or DOCX to auto-populate your ATS gap analysis. You can also skip this step and upload later.
                </p>
              </div>

              <div className="border-2 border-dashed border-slate-800 hover:border-indigo-500/50 rounded-3xl p-8 text-center transition-all bg-slate-900/40 relative">
                <input
                  type="file"
                  accept=".pdf,.docx,.txt"
                  onChange={handleFileUpload}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />
                <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mx-auto mb-4">
                  <Upload className="w-7 h-7" />
                </div>
                {resumeFileName ? (
                  <div className="space-y-1">
                    <p className="font-bold text-emerald-400 text-sm flex items-center justify-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" />
                      {resumeFileName}
                    </p>
                    <p className="text-xs text-slate-400">Click or drag another file to replace</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <p className="font-bold text-white text-sm">Drag and drop your resume file here</p>
                    <p className="text-xs text-slate-500">Supports PDF, DOCX (Max 10MB)</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 6: Optional Job Description */}
          {currentStep === 6 && (
            <div className="space-y-6">
              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">Step 6 of 7 · Optional</span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white">Paste a target job description (Optional)</h2>
                <p className="text-slate-400 text-sm">
                  If you are currently preparing for a specific job post, paste the description here for tailored questions.
                </p>
              </div>

              <textarea
                rows={6}
                placeholder="Paste job description or requirements (e.g. 'Looking for a Software Engineer with proficiency in Java, Spring Boot, distributed microservices, and MySQL...')"
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                className="w-full p-4 rounded-2xl bg-slate-950 border border-slate-800 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-indigo-500 leading-relaxed resize-none"
              />
            </div>
          )}

          {/* STEP 7: Complete Setup */}
          {currentStep === 7 && (
            <div className="space-y-6">
              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">Step 7 of 7</span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white">Review & Complete Setup</h2>
                <p className="text-slate-400 text-sm">
                  Your personalized candidate profile will be configured and saved to your workspace.
                </p>
              </div>

              <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4 text-xs">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <span className="text-slate-400">Preparation Goal:</span>
                  <span className="font-bold text-white">{goal}</span>
                </div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <span className="text-slate-400">Experience Level:</span>
                  <span className="font-bold text-white">{experience}</span>
                </div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <span className="text-slate-400">Target Career Role:</span>
                  <span className="font-bold text-indigo-400">{targetRole}</span>
                </div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <span className="text-slate-400">Primary Skills:</span>
                  <span className="font-bold text-white">{selectedSkills.slice(0, 5).join(', ')}{selectedSkills.length > 5 ? ` +${selectedSkills.length - 5} more` : ''}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Resume Attached:</span>
                  <span className="font-bold text-emerald-400">{resumeFileName ? resumeFileName : 'None (Can upload anytime)'}</span>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Controls */}
          <div className="flex items-center justify-between pt-6 border-t border-slate-800/80">
            {currentStep > 1 ? (
              <button
                type="button"
                onClick={prevStep}
                className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 font-bold text-xs flex items-center gap-1.5 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
            ) : (
              <div />
            )}

            <button
              type="button"
              disabled={loading}
              onClick={nextStep}
              className="px-7 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition-all hover:scale-105 disabled:opacity-50"
            >
              <span>{loading ? 'Finalizing Profile...' : currentStep === 7 ? 'Complete Setup & Launch Dashboard' : 'Continue'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </main>

      {/* Footer info */}
      <footer className="px-8 py-4 border-t border-slate-800/80 text-center text-xs text-slate-500">
        You can prepare for any company (Google, Amazon, TCS, etc.) during individual Practice and Mock sessions without modifying your profile.
      </footer>
    </div>
  );
}
