'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  User,
  Mail,
  Briefcase,
  Target,
  FileText,
  Save,
  CheckCircle2,
  Sparkles,
  Plus,
  Trash2
} from 'lucide-react';

export default function ProfilePage() {
  const [profile, setProfile] = useState({
    name: 'Abhineet Jha',
    email: 'abhineet@interviewai.com',
    targetRole: 'Software Engineer',
    goal: 'Campus Placement',
    experience: 'Fresher',
    bio: 'Computer Science undergraduate passionate about high-performance software engineering, algorithms, and backend systems.',
    skills: ['Java', 'Python', 'DSA', 'SQL', 'React', 'Spring Boot'],
  });
  const [newSkill, setNewSkill] = useState('');
  const [loading, setLoading] = useState(true);
  const [isSaved, setIsSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    async function loadProfile() {
      try {
        const res = await fetch('/api/profile');
        if (res.ok) {
          const data = await res.json();
          if (data.user && data.profile) {
            let parsedSkills = ['Java', 'Python', 'DSA', 'SQL'];
            try {
              if (data.profile.skills) {
                parsedSkills = typeof data.profile.skills === 'string' ? JSON.parse(data.profile.skills) : data.profile.skills;
              }
            } catch (_) {}

            setProfile({
              name: data.user.name || 'Abhineet Jha',
              email: data.user.email || 'abhineet@interviewai.com',
              targetRole: data.profile.targetRole || 'Software Engineer',
              goal: data.profile.goal || 'Campus Placement',
              experience: data.profile.experience || 'Fresher',
              bio: data.profile.bio || '',
              skills: Array.isArray(parsedSkills) ? parsedSkills : ['Java', 'Python', 'DSA', 'SQL'],
            });
            return;
          }
        }
        // Fallback to localStorage if unauthenticated or offline
        if (typeof window !== 'undefined') {
          const savedLocal = localStorage.getItem('interviewai_profile');
          if (savedLocal) {
            try {
              const parsed = JSON.parse(savedLocal);
              setProfile(prev => ({ ...prev, ...parsed }));
            } catch (_) {}
          }
        }
      } catch (err) {
        console.error('Failed to load profile:', err);
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, []);

  const addSkill = () => {
    if (newSkill.trim() && !profile.skills.includes(newSkill.trim())) {
      setProfile(p => ({ ...p, skills: [...p.skills, newSkill.trim()] }));
      setNewSkill('');
    }
  };

  const removeSkill = (skill: string) => {
    setProfile(p => ({ ...p, skills: p.skills.filter(s => s !== skill) }));
  };

  const handleSave = async () => {
    setSaveError(null);
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('interviewai_profile', JSON.stringify(profile));
      }
      await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: profile.name,
          targetRole: profile.targetRole,
          goal: profile.goal,
          experience: profile.experience,
          bio: profile.bio,
          skills: profile.skills,
        }),
      });

      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
    } catch (err: any) {
      // Profile is saved locally in state and localStorage
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-200">
      <div>
        <h2 className="text-2xl md:text-3xl font-extrabold text-slate-800 tracking-tight">
          Candidate Profile
        </h2>
        <p className="text-slate-500 text-sm mt-1">
          Manage your credentials, career aspirations, and skills used to personalize interview questions.
        </p>
      </div>

      <div className="p-8 rounded-3xl bg-white border border-slate-200/80 shadow-sm space-y-6">
        <div className="flex items-center gap-5 border-b border-slate-100 pb-6">
          <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 text-white font-extrabold text-2xl flex items-center justify-center shadow-lg ring-4 ring-indigo-50">
            AJ
          </div>
          <div>
            <h3 className="font-extrabold text-xl text-slate-800">{profile.name}</h3>
            <p className="text-xs text-slate-500">{profile.targetRole} · {profile.experience}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
          <div className="space-y-1.5">
            <label className="font-bold uppercase tracking-wider text-slate-500">Full Name</label>
            <input
              type="text"
              value={profile.name}
              onChange={e => setProfile({ ...profile, name: e.target.value })}
              className="w-full p-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-800 font-semibold"
            />
          </div>

          <div className="space-y-1.5">
            <label className="font-bold uppercase tracking-wider text-slate-500">Email Address</label>
            <input
              type="email"
              disabled
              value={profile.email}
              className="w-full p-3 rounded-2xl bg-slate-100 border border-slate-200 text-slate-500 font-semibold cursor-not-allowed"
            />
          </div>

          <div className="space-y-1.5">
            <label className="font-bold uppercase tracking-wider text-slate-500">Target Role</label>
            <input
              type="text"
              value={profile.targetRole}
              onChange={e => setProfile({ ...profile, targetRole: e.target.value })}
              className="w-full p-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-800 font-semibold"
            />
          </div>

          <div className="space-y-1.5">
            <label className="font-bold uppercase tracking-wider text-slate-500">Preparation Goal</label>
            <select
              value={profile.goal}
              onChange={e => setProfile({ ...profile, goal: e.target.value })}
              className="w-full p-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-800 font-semibold"
            >
              <option>Campus Placement</option>
              <option>Off-Campus SDE Drive</option>
              <option>Internship Conversion</option>
              <option>Experienced Lateral Shift</option>
            </select>
          </div>

          <div className="sm:col-span-2 space-y-1.5">
            <label className="font-bold uppercase tracking-wider text-slate-500">Candidate Bio</label>
            <textarea
              value={profile.bio}
              onChange={e => setProfile({ ...profile, bio: e.target.value })}
              rows={3}
              className="w-full p-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-800 font-semibold"
            />
          </div>
        </div>

        {/* Skills Management */}
        <div className="space-y-3 pt-2">
          <label className="font-bold uppercase tracking-wider text-slate-500 text-xs">Technical Skills</label>
          <div className="flex flex-wrap gap-2">
            {profile.skills.map((skill) => (
              <span
                key={skill}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 border border-indigo-200 text-xs font-bold text-indigo-700"
              >
                <span>{skill}</span>
                <button
                  onClick={() => removeSkill(skill)}
                  className="hover:text-red-600 transition-colors"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>

          <div className="flex gap-2 max-w-sm pt-1">
            <input
              type="text"
              value={newSkill}
              onChange={e => setNewSkill(e.target.value)}
              placeholder="Add skill (e.g. Docker, Redis)..."
              className="flex-1 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700"
            />
            <button
              onClick={addSkill}
              className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold"
            >
              Add
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between pt-6 border-t border-slate-100">
          <span className="text-xs text-emerald-600 font-bold flex items-center gap-1">
            {isSaved && <><CheckCircle2 className="w-4 h-4" /> Profile updated successfully!</>}
          </span>
          <button
            onClick={handleSave}
            className="py-2.5 px-6 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-600/30 flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            <span>Save Profile</span>
          </button>
        </div>
      </div>
    </div>
  );
}
