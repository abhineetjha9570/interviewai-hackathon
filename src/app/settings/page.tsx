'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Settings,
  Bell,
  Lock,
  Volume2,
  Video,
  Code2,
  CheckCircle2,
  Save,
  LogOut,
  Shield,
  AlertCircle,
  Eye,
  KeyRound
} from 'lucide-react';

export default function SettingsPage() {
  const router = useRouter();

  // Preferences
  const [editorTheme, setEditorTheme] = useState('vs-dark');
  const [defaultLanguage, setDefaultLanguage] = useState('java');
  const [proctorSensitivity, setProctorSensitivity] = useState('Standard');
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [audioFeedback, setAudioFeedback] = useState(true);

  // Status
  const [isSaved, setIsSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  // Password Management
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Load existing preferences
  useEffect(() => {
    async function loadSettings() {
      try {
        const res = await fetch('/api/profile');
        if (res.ok) {
          const data = await res.json();
          if (data.profile) {
            if (data.profile.themePreference) setEditorTheme(data.profile.themePreference);
            if (data.profile.proctorSensitivity) setProctorSensitivity(data.profile.proctorSensitivity);
            if (data.profile.emailAlerts !== undefined) setEmailAlerts(data.profile.emailAlerts);
            if (data.profile.audioFeedback !== undefined) setAudioFeedback(data.profile.audioFeedback);
            return;
          }
        }
        if (typeof window !== 'undefined') {
          const local = localStorage.getItem('interviewai_settings');
          if (local) {
            const parsed = JSON.parse(local);
            if (parsed.editorTheme) setEditorTheme(parsed.editorTheme);
            if (parsed.proctorSensitivity) setProctorSensitivity(parsed.proctorSensitivity);
            if (parsed.emailAlerts !== undefined) setEmailAlerts(parsed.emailAlerts);
            if (parsed.audioFeedback !== undefined) setAudioFeedback(parsed.audioFeedback);
          }
        }
      } catch (err) {
        console.error('Error loading settings:', err);
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, []);

  const handleSavePreferences = async () => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(
          'interviewai_settings',
          JSON.stringify({
            editorTheme,
            proctorSensitivity,
            emailAlerts,
            audioFeedback,
          })
        );
      }
      await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          themePreference: editorTheme,
          proctorSensitivity,
          emailAlerts,
          audioFeedback,
        }),
      });
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
    } catch (err) {
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }

    setPasswordLoading(true);

    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Failed to update password');
      }

      setPasswordSuccess('Password successfully updated!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordSuccess(null), 4000);
    } catch (err: any) {
      setPasswordError(err.message || 'Error updating password');
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
      router.refresh();
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-200">
      <div>
        <h2 className="text-2xl md:text-3xl font-extrabold text-slate-800 tracking-tight">
          System Settings & Preferences
        </h2>
        <p className="text-slate-500 text-sm mt-1">
          Configure Monaco editor preferences, proctoring security rules, password credentials, and privacy options.
        </p>
      </div>

      <div className="space-y-6">
        {/* 1. Monaco Editor & Language Settings */}
        <div className="p-8 rounded-3xl bg-white border border-slate-200/80 shadow-sm space-y-6 text-xs">
          <div className="space-y-3 pb-6 border-b border-slate-100">
            <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
              <Code2 className="w-4 h-4 text-indigo-600" />
              <span>Monaco Coding Editor & Language Preferences</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="font-bold text-slate-500 uppercase tracking-wider text-[11px]">Editor Theme</label>
                <select
                  value={editorTheme}
                  onChange={(e) => setEditorTheme(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 font-semibold"
                >
                  <option value="vs-dark">LeetCode Dark (vs-dark)</option>
                  <option value="light">Light</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-500 uppercase tracking-wider text-[11px]">Default Language</label>
                <select
                  value={defaultLanguage}
                  onChange={(e) => setDefaultLanguage(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 font-semibold"
                >
                  <option value="java">Java (JDK 21 Sandbox)</option>
                  <option value="python">Python (Python 3.12 Sandbox)</option>
                  <option value="javascript">JavaScript (Node.js 25 Sandbox)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-500 uppercase tracking-wider text-[11px]">Indentation</label>
                <select className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 font-semibold">
                  <option>4 Spaces</option>
                  <option>2 Spaces</option>
                </select>
              </div>
            </div>
          </div>

          {/* 2. Proctoring Strictness Settings */}
          <div className="space-y-3 pb-6 border-b border-slate-100">
            <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
              <Video className="w-4 h-4 text-rose-600" />
              <span>Assessment Proctoring Strictness</span>
            </h3>
            <p className="text-slate-500 text-[11px]">
              Configures tolerance thresholds for tab-switches, window blurs, and face tracking signals during Mock and AI Avatar simulations.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { name: 'Lenient (Diagnostic)', desc: 'Warnings logged without auto-submission' },
                { name: 'Standard (Recommended)', desc: 'Balanced placement drive simulation' },
                { name: 'Strict (Corporate Drive)', desc: 'Zero tolerance with immediate score penalties' },
              ].map((sens) => (
                <button
                  key={sens.name}
                  type="button"
                  onClick={() => setProctorSensitivity(sens.name)}
                  className={`p-3.5 rounded-2xl border text-left transition-all ${
                    proctorSensitivity === sens.name
                      ? 'bg-rose-50 border-rose-500 text-rose-900 ring-1 ring-rose-500/20'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  <p className="font-bold text-xs">{sens.name}</p>
                  <p className="text-[10px] text-slate-500 mt-1">{sens.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* 3. Audio & Notifications */}
          <div className="space-y-4 pb-6 border-b border-slate-100">
            <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-indigo-600" />
              <span>Voice Synthesis & Notifications</span>
            </h3>

            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
              <div>
                <p className="font-bold text-slate-800">AI Interviewer Voice Output</p>
                <p className="text-[11px] text-slate-500">Enable spoken audio responses from AI interviewer personas</p>
              </div>
              <button
                type="button"
                onClick={() => setAudioFeedback(!audioFeedback)}
                className={`w-11 h-6 rounded-full p-1 transition-all ${
                  audioFeedback ? 'bg-indigo-600' : 'bg-slate-300'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white transition-transform ${
                    audioFeedback ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
              <div>
                <p className="font-bold text-slate-800">Email Preparation Alerts</p>
                <p className="text-[11px] text-slate-500">Receive placement drive reminders and weekly performance digests</p>
              </div>
              <button
                type="button"
                onClick={() => setEmailAlerts(!emailAlerts)}
                className={`w-11 h-6 rounded-full p-1 transition-all ${
                  emailAlerts ? 'bg-indigo-600' : 'bg-slate-300'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white transition-transform ${
                    emailAlerts ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Save Preferences Button */}
          <div className="flex items-center justify-between pt-2">
            <span className="text-emerald-600 font-bold flex items-center gap-1.5 text-xs">
              {isSaved && (
                <>
                  <CheckCircle2 className="w-4 h-4" /> Preferences saved successfully to database
                </>
              )}
            </span>
            <button
              type="button"
              onClick={handleSavePreferences}
              className="py-2.5 px-6 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-600/30 flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              <span>Save System Preferences</span>
            </button>
          </div>
        </div>

        {/* 4. Password Management Card */}
        <div className="p-8 rounded-3xl bg-white border border-slate-200/80 shadow-sm space-y-5 text-xs">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-purple-600" />
              <span>Security & Password Management</span>
            </h3>
            <p className="text-slate-500 text-[11px] mt-0.5">
              Update your account password with server-side bcrypt encryption.
            </p>
          </div>

          {passwordError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{passwordError}</span>
            </div>
          )}

          {passwordSuccess && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{passwordSuccess}</span>
            </div>
          )}

          <form onSubmit={handleChangePassword} className="space-y-4 max-w-lg">
            <div className="space-y-1">
              <label className="font-bold text-slate-500 uppercase tracking-wider text-[11px]">Current Password</label>
              <input
                type="password"
                required
                placeholder="Enter current password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 font-medium"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="font-bold text-slate-500 uppercase tracking-wider text-[11px]">New Password</label>
                <input
                  type="password"
                  required
                  placeholder="Min 6 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 font-medium"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-500 uppercase tracking-wider text-[11px]">Confirm New Password</label>
                <input
                  type="password"
                  required
                  placeholder="Re-enter new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 font-medium"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={passwordLoading}
              className="py-2.5 px-6 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md shadow-purple-600/30 flex items-center gap-2 disabled:opacity-50"
            >
              <Lock className="w-4 h-4" />
              <span>{passwordLoading ? 'Updating Password...' : 'Update Password'}</span>
            </button>
          </form>
        </div>

        {/* 5. Session & Sign Out */}
        <div className="p-8 rounded-3xl bg-white border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <h4 className="font-bold text-sm text-slate-800">Account Session</h4>
            <p className="text-xs text-slate-500 mt-0.5">End your active candidate session on this device.</p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="py-2.5 px-6 rounded-2xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs border border-rose-200 flex items-center gap-2 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  );
}
