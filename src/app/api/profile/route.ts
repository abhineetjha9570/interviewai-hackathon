import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({
        user: {
          id: 'demo-user',
          name: 'Abhineet Jha',
          email: 'abhineet@interviewai.com',
          role: 'CANDIDATE',
        },
        profile: {
          targetRole: 'Software Engineer',
          goal: 'Campus Placement',
          experience: 'Fresher',
          bio: 'Computer Science undergraduate passionate about high-performance software engineering, algorithms, and backend systems.',
          skills: JSON.stringify(['Java', 'Python', 'DSA', 'SQL', 'React', 'Spring Boot']),
          themePreference: 'vs-dark',
          proctorSensitivity: 'BALANCED',
          emailAlerts: true,
          audioFeedback: true,
        },
      });
    }

    const fullUser = await prisma.user.findUnique({
      where: { id: user.id },
      include: { profile: true },
    });

    if (!fullUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      user: {
        id: fullUser.id,
        name: fullUser.name,
        email: fullUser.email,
        role: fullUser.role,
      },
      profile: fullUser.profile,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: true, message: 'Profile updated in session' });
    }

    const body = await req.json();
    const {
      name,
      targetRole,
      goal,
      experience,
      bio,
      skills,
      jobDescription,
      themePreference,
      proctorSensitivity,
      emailAlerts,
      audioFeedback,
    } = body;

    // Update user table
    if (name) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          name,
          role: targetRole && experience ? `${experience} · ${targetRole}` : undefined,
        },
      });
    }

    // Update profile table
    const profile = await prisma.profile.upsert({
      where: { userId: user.id },
      update: {
        targetRole: targetRole || undefined,
        goal: goal || undefined,
        experience: experience || undefined,
        bio: bio !== undefined ? bio : undefined,
        skills: skills ? (typeof skills === 'string' ? skills : JSON.stringify(skills)) : undefined,
        jobDescription: jobDescription !== undefined ? jobDescription : undefined,
        themePreference: themePreference || undefined,
        proctorSensitivity: proctorSensitivity || undefined,
        emailAlerts: emailAlerts !== undefined ? emailAlerts : undefined,
        audioFeedback: audioFeedback !== undefined ? audioFeedback : undefined,
      },
      create: {
        userId: user.id,
        targetRole: targetRole || 'Software Engineer',
        goal: goal || 'Campus Placement',
        experience: experience || 'Fresher',
        bio: bio || '',
        skills: skills ? (typeof skills === 'string' ? skills : JSON.stringify(skills)) : JSON.stringify(['Java', 'Python', 'DSA']),
        jobDescription: jobDescription || null,
        themePreference: themePreference || 'vs-dark',
        proctorSensitivity: proctorSensitivity || 'Standard',
        emailAlerts: emailAlerts !== undefined ? emailAlerts : true,
        audioFeedback: audioFeedback !== undefined ? audioFeedback : true,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
      profile,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
