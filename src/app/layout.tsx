import type { Metadata } from 'next';
import './globals.css';
import AppShell from '@/components/layout/AppShell';

export const metadata: Metadata = {
  title: 'InterviewAI - AI-Powered Placement Preparation & Interview Platform',
  description: 'Production-ready AI placement prep platform combining DSA, Mock Interviews, 100-min AI Avatar simulation, and Resume ATS scoring.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-900 antialiased">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
