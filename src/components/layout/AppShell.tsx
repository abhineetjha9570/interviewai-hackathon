'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Pages that render standalone without in-app Sidebar and candidate Header
  const isPublicOrStandalone =
    pathname === '/' ||
    pathname.startsWith('/login') ||
    pathname.startsWith('/signup') ||
    pathname.startsWith('/register') ||
    pathname.startsWith('/forgot-password') ||
    pathname.startsWith('/onboarding');

  if (isPublicOrStandalone) {
    return <div className="min-h-screen w-full flex flex-col bg-slate-900 text-slate-100">{children}</div>;
  }

  return (
    <div className="min-h-screen w-full flex bg-[#F8FAFC] text-slate-900 antialiased">
      {/* Collapsible In-App Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen overflow-x-hidden">
        <Header />
        <main className="flex-1 p-6 md:p-8 max-w-7xl mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
