import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized. Please log in first.' }, { status: 401 });
    }

    const {
      goal = 'Campus Placement',
      experience = 'Fresher',
      targetRole = 'Software Engineer',
      skills = ['Java', 'Python', 'DSA', 'SQL'],
      resumeUrl = null,
      resumeName = null,
      jobDescription = null,
    } = await req.json();

    const formattedRole = `${experience} · ${targetRole}`;

    // Update user role
    await prisma.user.update({
      where: { id: user.id },
      data: { role: formattedRole },
    });

    // Upsert user profile
    const profile = await prisma.profile.upsert({
      where: { userId: user.id },
      update: {
        goal,
        experience,
        targetRole,
        skills: typeof skills === 'string' ? skills : JSON.stringify(skills),
        resumeUrl: resumeUrl || undefined,
        resumeName: resumeName || undefined,
        jobDescription: jobDescription || undefined,
        onboardingCompleted: true,
      },
      create: {
        userId: user.id,
        goal,
        experience,
        targetRole,
        skills: typeof skills === 'string' ? skills : JSON.stringify(skills),
        resumeUrl: resumeUrl || undefined,
        resumeName: resumeName || undefined,
        jobDescription: jobDescription || undefined,
        onboardingCompleted: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Onboarding completed successfully',
      profile,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const profile = await prisma.profile.findUnique({
      where: { userId: user.id },
    });

    return NextResponse.json({ profile });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
