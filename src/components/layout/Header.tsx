'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, Bell, ChevronDown, User, LogOut, Settings as SettingsIcon, Menu } from 'lucide-react';

interface HeaderProps {
  userName?: string;
  userRole?: string;
}

export default function Header({
  userName: initialName = 'Abhineet',
  userRole: initialRole = 'Fresher · Software Engineer',
}: HeaderProps) {
  const router = useRouter();
  const [userName, setUserName] = useState(initialName);
  const [userRole, setUserRole] = useState(initialRole);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  useEffect(() => {
    async function loadUser() {
      try {
        const res = await fetch('/api/auth/me');
        const data = await res.json();
        if (data?.user) {
          if (data.user.name) setUserName(data.user.name);
          if (data.user.role) setUserRole(data.user.role);
        }
      } catch (_) {}
    }
    loadUser();
  }, []);

  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);

  // Search catalog spanning all topics, modules, languages, and companies
  const searchCatalog = [
    { title: 'Arrays & Two Sum', category: 'DSA & Coding', url: '/practice?category=DSA&topic=Array&problem=two-sum&autoStart=true', tags: ['array', 'two sum', 'dsa', 'coding', 'hashmap'] },
    { title: 'Climbing Stairs (Dynamic Programming)', category: 'DSA & Coding', url: '/practice?category=DSA&topic=Dynamic%20Programming&problem=climbing-stairs&autoStart=true', tags: ['dp', 'dynamic programming', 'stairs', 'fibonacci'] },
    { title: 'Tree & Graph Algorithms', category: 'DSA & Coding', url: '/practice?category=DSA&topic=Tree&autoStart=true', tags: ['tree', 'graph', 'bfs', 'dfs', 'binary tree'] },
    { title: 'Linked Lists & Stack', category: 'DSA & Coding', url: '/practice?category=DSA&topic=Linked%20List&autoStart=true', tags: ['linked list', 'stack', 'queue'] },
    { title: 'Quantitative Aptitude (Time, Speed, Work)', category: 'Aptitude', url: '/practice?category=Aptitude&topic=Quantitative%20Aptitude&autoStart=true', tags: ['aptitude', 'quant', 'math', 'time and work', 'speed'] },
    { title: 'Logical Reasoning & Puzzles', category: 'Aptitude', url: '/practice?category=Aptitude&topic=Logical%20Reasoning&autoStart=true', tags: ['logical', 'reasoning', 'puzzles'] },
    { title: 'DBMS & SQL Practice', category: 'Technical CS', url: '/practice?category=Technical&topic=DBMS%20%26%20SQL&autoStart=true', tags: ['dbms', 'sql', 'database', 'queries', 'normalization'] },
    { title: 'Operating Systems (Processes & Memory)', category: 'Technical CS', url: '/practice?category=Technical&topic=Operating%20Systems&autoStart=true', tags: ['operating systems', 'os', 'deadlock', 'threads', 'paging'] },
    { title: 'Computer Networks (OSI & TCP/IP)', category: 'Technical CS', url: '/practice?category=Technical&topic=Computer%20Networks&autoStart=true', tags: ['computer networks', 'networking', 'tcp', 'http', 'osi'] },
    { title: 'HR Behavioral Interview (STAR Method)', category: 'HR & Behavioral', url: '/practice?category=HR&topic=Behavioral%20(STAR%20Method)&autoStart=true', tags: ['hr', 'behavioral', 'star', 'introduction', 'soft skills'] },
    { title: 'Mock Interview (Timed Assessment)', category: 'Assessments', url: '/mock-interview', tags: ['mock interview', 'test', 'assessment', 'proctored'] },
    { title: '100-Minute AI Avatar Simulation', category: 'AI Simulation', url: '/ai-avatar', tags: ['ai avatar', 'simulation', '100 min', 'sarah', 'david', 'avatar'] },
    { title: 'Resume ATS & JD Comparison', category: 'Tools', url: '/resume-ats', tags: ['resume', 'ats', 'cv', 'job description', 'keywords'] },
    { title: 'Progress & Diagnostic Analytics', category: 'Analytics', url: '/analytics', tags: ['analytics', 'progress', 'accuracy', 'scores', 'readiness'] },
    { title: 'Weak Areas Detection', category: 'Analytics', url: '/weak-areas', tags: ['weak areas', 'weakness', 'gaps', 'remedy'] },
    { title: 'Recommended Learning Path', category: 'Roadmap', url: '/recommended-path', tags: ['recommended', 'path', 'roadmap', 'schedule'] },
    { title: 'Google SDE Prep Track', category: 'Companies', url: '/mock-interview', tags: ['google', 'sde', 'faang', 'big tech'] },
    { title: 'Amazon Technical Assessment Track', category: 'Companies', url: '/mock-interview', tags: ['amazon', 'aws', 'leadership principles'] },
    { title: 'TCS / Infosys Placement Drive Track', category: 'Companies', url: '/practice?category=Aptitude', tags: ['tcs', 'infosys', 'wipro', 'cognizant', 'campus'] },
    { title: 'Monaco Code Runner (Java / Python / JS)', category: 'Coding', url: '/practice?category=DSA', tags: ['java', 'python', 'javascript', 'monaco', 'sandbox'] },
    { title: 'AI Career Roadmap Generator', category: 'Roadmap & Career', url: '/dashboard/career-roadmap', tags: ['career roadmap', 'roadmap', 'ai roadmap', 'career plan', 'goals', 'milestones'] },
    { title: 'Live Aptitude Arena (50-Player Real-Time)', category: 'Multiplayer Arena', url: '/dashboard/aptitude-arena', tags: ['arena', 'aptitude arena', 'multiplayer', 'live', 'speed', 'compete', 'leaderboard'] },
    { title: 'Account Settings & Preferences', category: 'Settings', url: '/settings', tags: ['settings', 'preferences', 'password', 'proctoring'] },
    { title: 'Subscription & Entitlement Plans', category: 'Subscription', url: '/subscription', tags: ['subscription', 'pro', 'plans', 'pricing'] },
  ];

  const filteredResults = searchQuery.trim()
    ? searchCatalog.filter((item) => {
        const q = searchQuery.toLowerCase().trim();
        return (
          item.title.toLowerCase().includes(q) ||
          item.category.toLowerCase().includes(q) ||
          item.tags.some((t) => t.toLowerCase().includes(q))
        );
      }).slice(0, 7)
    : [];

  const handleSelectResult = (url: string) => {
    setShowSearchResults(false);
    setSearchQuery('');
    router.push(url);
  };

  const notifications = [
    { id: 1, title: 'AI Interview Report Ready', desc: 'Your 100-minute evaluation report is compiled.', time: '10m ago' },
    { id: 2, title: 'Daily Streak Maintained', desc: '12 days in a row! Keep up the momentum.', time: '2h ago' },
    { id: 3, title: 'Resume ATS Updated', desc: 'Keyword match improved to 78/100.', time: '1d ago' },
  ];

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200/80 px-4 md:px-8 flex items-center justify-between sticky top-0 z-20 shadow-[0_1px_3px_0_rgba(0,0,0,0.02)]">
      {/* Left: Mobile Toggle + Search Bar */}
      <div className="flex items-center gap-2 max-w-md w-full mr-4 relative">
        <button
          onClick={() => window.dispatchEvent(new CustomEvent('toggle-mobile-sidebar'))}
          className="md:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors shrink-0"
          aria-label="Open navigation menu"
          title="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Global Search Bar */}
        <div className="relative w-full max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search for topics, companies, or skills (e.g. DSA, Java, SQL, Google)..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setShowSearchResults(true);
            }}
            onFocus={() => setShowSearchResults(true)}
            onBlur={() => setTimeout(() => setShowSearchResults(false), 200)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') setShowSearchResults(false);
              if (e.key === 'Enter' && filteredResults.length > 0) {
                handleSelectResult(filteredResults[0].url);
              }
            }}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
          />

          {/* Floating Search Results Dropdown */}
          {showSearchResults && searchQuery.trim().length > 0 && (
            <div className="absolute left-0 right-0 top-full mt-2 bg-white rounded-2xl shadow-2xl border border-slate-200 p-2 z-50 animate-in fade-in slide-in-from-top-1 duration-150 max-h-80 overflow-y-auto">
              <div className="px-3 py-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between border-b border-slate-100">
                <span>Matching Results ({filteredResults.length})</span>
                <span className="text-[10px] text-slate-400">Press Enter to select</span>
              </div>

              {filteredResults.length > 0 ? (
                <div className="space-y-1 mt-1">
                  {filteredResults.map((res, idx) => (
                    <button
                      key={idx}
                      onMouseDown={() => handleSelectResult(res.url)}
                      className="w-full text-left p-2.5 rounded-xl hover:bg-slate-50 transition-colors flex items-center justify-between group"
                    >
                      <div className="min-w-0 pr-2">
                        <p className="text-xs font-bold text-slate-800 group-hover:text-indigo-600 transition-colors truncate">
                          {res.title}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-0.5">{res.category}</p>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 shrink-0">
                        Jump to
                      </span>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="p-4 text-center text-xs text-slate-500">
                  No matching topics found for "{searchQuery}". Try "DSA", "Java", "SQL", or "Mock".
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-5">
        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="w-10 h-10 rounded-xl hover:bg-slate-100 flex items-center justify-center text-slate-600 transition-colors relative"
            title="Notifications"
          >
            <Bell className="w-5 h-5 text-slate-600" />
            <span className="absolute top-2 right-2 w-4 h-4 bg-red-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center border-2 border-white shadow-sm">
              3
            </span>
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-200/80 p-3 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="flex items-center justify-between px-3 py-2 border-b border-slate-100">
                <span className="font-semibold text-sm text-slate-800">Notifications</span>
                <span className="text-[11px] text-indigo-600 font-medium">Mark all read</span>
              </div>
              <div className="space-y-1 mt-2">
                {notifications.map((n) => (
                  <div key={n.id} className="p-2.5 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer">
                    <p className="text-xs font-semibold text-slate-800">{n.title}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">{n.desc}</p>
                    <span className="text-[10px] text-slate-400 mt-1 block">{n.time}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* User Chip */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-3 p-1.5 pl-2 pr-3 rounded-xl hover:bg-slate-100 transition-colors"
          >
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 text-white font-semibold flex items-center justify-center text-sm shadow-sm ring-2 ring-indigo-500/20 overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=120"
                alt="Abhineet"
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
              <span className="text-xs font-bold">AJ</span>
            </div>
            <div className="text-left hidden sm:block">
              <p className="text-sm font-bold text-slate-800 leading-tight">{userName}</p>
              <p className="text-[11px] text-slate-500 leading-tight">{userRole}</p>
            </div>
            <ChevronDown className="w-4 h-4 text-slate-400 ml-1" />
          </button>

          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-200/80 p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="px-3 py-2 border-b border-slate-100 mb-1">
                <p className="text-sm font-bold text-slate-800">{userName}</p>
                <p className="text-xs text-slate-500 truncate">{userRole}</p>
              </div>
              <Link
                href="/profile"
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-700 hover:bg-slate-50"
                onClick={() => setShowUserMenu(false)}
              >
                <User className="w-4 h-4 text-slate-400" />
                <span>My Profile</span>
              </Link>
              <Link
                href="/settings"
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-700 hover:bg-slate-50"
                onClick={() => setShowUserMenu(false)}
              >
                <SettingsIcon className="w-4 h-4 text-slate-400" />
                <span>Account Settings</span>
              </Link>
              <div className="h-px bg-slate-100 my-1" />
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-red-600 hover:bg-red-50 text-left"
              >
                <LogOut className="w-4 h-4 text-red-500" />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
