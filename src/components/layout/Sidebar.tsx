'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  Target,
  FileQuestion,
  Video,
  FileText,
  BarChart2,
  AlertTriangle,
  Compass,
  User,
  CreditCard,
  Settings,
  Sparkles,
  ArrowRight,
  Crown,
  ChevronLeft,
  ChevronRight,
  X,
  Map,
  Trophy,
  Users
} from 'lucide-react';

const navItems = [
  { name: 'Dashboard', href: '/dashboard', icon: Home },
  { name: 'Practice', href: '/practice', icon: Target },
  { name: 'Career Roadmap', href: '/dashboard/career-roadmap', icon: Map },
  { name: 'Aptitude Arena', href: '/dashboard/aptitude-arena', icon: Trophy },
  { name: 'GD Arena', href: '/dashboard/gd-arena', icon: Users },
  { name: 'Mock Interview', href: '/mock-interview', icon: FileQuestion },
  { name: 'AI Avatar', href: '/ai-avatar', icon: Video },
  { name: 'Resume & ATS', href: '/resume-ats', icon: FileText },
  { name: 'Progress & Analytics', href: '/analytics', icon: BarChart2 },
  { name: 'Weak Areas', href: '/weak-areas', icon: AlertTriangle },
  { name: 'Recommended Path', href: '/recommended-path', icon: Compass },
];

const secondaryNav = [
  { name: 'Profile', href: '/profile', icon: User },
  { name: 'Subscription', href: '/subscription', icon: CreditCard },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const isDashboard = pathname === '/dashboard';

  // State for hover-to-expand, touch toggle, and mobile drawer
  const [isHovered, setIsHovered] = useState(false);
  const [isTouchExpanded, setIsTouchExpanded] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const leaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-collapse when navigating between routes (except on Dashboard)
  useEffect(() => {
    setIsHovered(false);
    setIsTouchExpanded(false);
    setIsMobileOpen(false);
    if (leaveTimerRef.current) {
      clearTimeout(leaveTimerRef.current);
      leaveTimerRef.current = null;
    }
  }, [pathname]);

  // Listen for mobile header menu toggle event
  useEffect(() => {
    const handleMobileToggle = () => setIsMobileOpen((prev) => !prev);
    window.addEventListener('toggle-mobile-sidebar', handleMobileToggle);
    return () => window.removeEventListener('toggle-mobile-sidebar', handleMobileToggle);
  }, []);

  // Smooth hover handlers with 180ms debounce on leave to prevent flicker / accidental collapse
  const handleMouseEnter = () => {
    if (leaveTimerRef.current) {
      clearTimeout(leaveTimerRef.current);
      leaveTimerRef.current = null;
    }
    if (!isDashboard) {
      setIsHovered(true);
    }
  };

  const handleMouseLeave = () => {
    if (isDashboard) return;
    leaveTimerRef.current = setTimeout(() => {
      setIsHovered(false);
    }, 180);
  };

  // Toggle for touch devices and accessibility button
  const handleToggleTouch = () => {
    if (!isDashboard) {
      setIsTouchExpanded((prev) => !prev);
    }
  };

  // On Dashboard: permanently expanded by default.
  // On other pages: collapsed to w-20 by default, expands on hover / touch / mobile.
  const isExpanded = isDashboard || isHovered || isTouchExpanded || isMobileOpen;

  return (
    <>
      {/* 1. LAYOUT SPACER (Preserves page margin without layout jumps or content reflow) */}
      <div
        className={`shrink-0 hidden md:block transition-[width] duration-300 ease-in-out ${
          isDashboard ? 'w-64' : 'w-20'
        }`}
        aria-hidden="true"
      />

      {/* 2. MOBILE BACKDROP OVERLAY */}
      {isMobileOpen && (
        <div
          onClick={() => setIsMobileOpen(false)}
          className="fixed inset-0 bg-slate-950/70 z-40 md:hidden backdrop-blur-sm transition-opacity duration-200"
          aria-hidden="true"
        />
      )}

      {/* 3. INTERACTIVE SLIDING DRAWER SIDEBAR */}
      <aside
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className={`fixed top-0 left-0 bottom-0 z-40 bg-[#0F172A] text-slate-300 flex flex-col border-r border-slate-800/80 transition-[width,box-shadow,transform] duration-300 ease-in-out select-none ${
          isExpanded
            ? 'w-64 shadow-2xl shadow-black/60'
            : 'w-20 shadow-lg shadow-black/20'
        } ${isMobileOpen ? 'translate-x-0' : 'max-md:-translate-x-full md:translate-x-0'}`}
      >
        {/* Brand Header */}
        <div className="h-16 px-4 flex items-center justify-between border-b border-slate-800/70 relative">
          <Link
            href="/dashboard"
            onClick={() => {
              setIsMobileOpen(false);
              setIsTouchExpanded(false);
            }}
            className={`flex items-center gap-3 overflow-hidden group ${
              isExpanded ? 'w-full' : 'w-full justify-center'
            }`}
            title="InterviewAI Home"
          >
            {/* Sparkles Logo Box */}
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30 shrink-0 group-hover:scale-105 transition-transform">
              <Sparkles className="w-5 h-5 text-white" />
            </div>

            {/* Brand Title & Subtitle (Visible in expanded state) */}
            <div
              className={`transition-all duration-200 overflow-hidden ${
                isExpanded ? 'opacity-100 max-w-[160px]' : 'opacity-0 max-w-0 pointer-events-none'
              }`}
            >
              <h1 className="font-bold text-base text-white tracking-tight flex items-center whitespace-nowrap">
                Interview<span className="text-indigo-400">AI</span>
              </h1>
              <p className="text-[10px] text-slate-400 font-medium whitespace-nowrap">
                Practice · Prepare · Get Hired
              </p>
            </div>
          </Link>

          {/* Mobile Close Button */}
          {isMobileOpen && (
            <button
              onClick={() => setIsMobileOpen(false)}
              className="md:hidden p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
          )}

          {/* Desktop/Touch Toggle Pill (When expanded on non-dashboard page) */}
          {!isDashboard && isExpanded && !isMobileOpen && (
            <button
              onClick={handleToggleTouch}
              className="hidden md:flex p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Toggle collapse"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Primary Navigation Links */}
        <div className="flex-1 px-3 py-4 space-y-1 overflow-y-auto overflow-x-hidden scrollbar-none">
          <div className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <div key={item.href} className="relative group">
                  <Link
                    href={item.href}
                    onClick={() => {
                      if (!isDashboard) {
                        setIsHovered(false);
                        setIsTouchExpanded(false);
                        setIsMobileOpen(false);
                      }
                    }}
                    className={`flex items-center transition-all duration-150 relative ${
                      isExpanded
                        ? 'gap-3.5 px-3.5 py-2.5 rounded-xl text-sm font-medium w-full'
                        : 'justify-center w-11 h-11 mx-auto rounded-xl'
                    } ${
                      isActive
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 font-semibold'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                    }`}
                  >
                    <Icon
                      className={`shrink-0 transition-colors ${
                        isExpanded ? 'w-4 h-4' : 'w-5 h-5'
                      } ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'}`}
                    />

                    {/* Nav Label */}
                    <span
                      className={`truncate transition-all duration-200 ${
                        isExpanded
                          ? 'opacity-100 max-w-[150px]'
                          : 'opacity-0 max-w-0 overflow-hidden pointer-events-none'
                      }`}
                    >
                      {item.name}
                    </span>
                  </Link>

                  {/* Floating Tooltip in Collapsed Mode */}
                  {!isExpanded && (
                    <span className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700/90 text-white text-xs font-semibold whitespace-nowrap shadow-2xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-50">
                      {item.name}
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Section Divider */}
          <div className="py-2">
            <div className="h-px bg-slate-800/80 mx-2" />
          </div>

          {/* Secondary Navigation Links */}
          <div className="space-y-1">
            {secondaryNav.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <div key={item.href} className="relative group">
                  <Link
                    href={item.href}
                    onClick={() => {
                      if (!isDashboard) {
                        setIsHovered(false);
                        setIsTouchExpanded(false);
                        setIsMobileOpen(false);
                      }
                    }}
                    className={`flex items-center transition-all duration-150 relative ${
                      isExpanded
                        ? 'gap-3.5 px-3.5 py-2.5 rounded-xl text-sm font-medium w-full'
                        : 'justify-center w-11 h-11 mx-auto rounded-xl'
                    } ${
                      isActive
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 font-semibold'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                    }`}
                  >
                    <Icon
                      className={`shrink-0 transition-colors ${
                        isExpanded ? 'w-4 h-4' : 'w-5 h-5'
                      } ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'}`}
                    />

                    {/* Nav Label */}
                    <span
                      className={`truncate transition-all duration-200 ${
                        isExpanded
                          ? 'opacity-100 max-w-[150px]'
                          : 'opacity-0 max-w-0 overflow-hidden pointer-events-none'
                      }`}
                    >
                      {item.name}
                    </span>
                  </Link>

                  {/* Floating Tooltip in Collapsed Mode */}
                  {!isExpanded && (
                    <span className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700/90 text-white text-xs font-semibold whitespace-nowrap shadow-2xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-50">
                      {item.name}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer: Upgrade to Pro Card / Collapsed Crown Button */}
        <div className="p-3 border-t border-slate-800/80">
          {isExpanded ? (
            <div className="p-3.5 rounded-2xl bg-gradient-to-b from-slate-800/90 to-slate-900 border border-slate-700/60 shadow-lg relative overflow-hidden group transition-all">
              <div className="absolute -top-8 -right-8 w-24 h-24 bg-indigo-500/10 rounded-full blur-xl group-hover:bg-indigo-500/20 transition-all" />
              <div className="flex items-center gap-2 mb-1.5">
                <div className="p-1 rounded-lg bg-amber-400/20 text-amber-300">
                  <Crown className="w-3.5 h-3.5" />
                </div>
                <span className="font-semibold text-white text-xs">Upgrade to Pro</span>
              </div>
              <p className="text-[11px] text-slate-400 mb-2.5 leading-relaxed line-clamp-2">
                Unlock full AI mocks, unlimited DSA runs, and ATS reports.
              </p>
              <Link
                href="/subscription"
                onClick={() => {
                  if (!isDashboard) {
                    setIsHovered(false);
                    setIsTouchExpanded(false);
                    setIsMobileOpen(false);
                  }
                }}
                className="w-full inline-flex items-center justify-center gap-1.5 py-1.5 px-3 bg-white text-slate-900 hover:bg-slate-100 rounded-xl text-[11px] font-bold transition-all shadow-sm"
              >
                <span>View Plans</span>
                <ArrowRight className="w-3 h-3 text-slate-700" />
              </Link>
            </div>
          ) : (
            <div className="relative group flex justify-center">
              <Link
                href="/subscription"
                onClick={() => {
                  if (!isDashboard) {
                    setIsHovered(false);
                    setIsTouchExpanded(false);
                    setIsMobileOpen(false);
                  }
                }}
                className="w-11 h-11 rounded-xl bg-amber-400/15 hover:bg-amber-400/25 text-amber-300 flex items-center justify-center transition-colors border border-amber-400/20"
                aria-label="Upgrade to Pro"
              >
                <Crown className="w-5 h-5" />
              </Link>
              <span className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-amber-300 text-xs font-semibold whitespace-nowrap shadow-2xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-50">
                Upgrade to Pro
              </span>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
