import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const {
      company = 'Google',
      role = 'Software Engineer',
      experienceLevel = 'Fresher',
      interviewerPersona = 'Sarah',
      durationMinutes = 100,
    } = await req.json();

    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const avatarInterview = await prisma.avatarInterview.create({
      data: {
        userId: user.id,
        company,
        role,
        experienceLevel,
        interviewerPersona,
        durationMinutes: 100, // Exact 100 minutes
        currentRound: 1,
        status: 'IN_PROGRESS',
        overallScore: 0,
        hrScore: 0,
        codingScore: 0,
        technicalScore: 0,
        managerialScore: 0,
        negotiationScore: 0,
      },
    });

    // Record initial greeting
    await prisma.avatarMessage.create({
      data: {
        avatarInterviewId: avatarInterview.id,
        roundNumber: 1,
        sender: 'AI',
        message: `Hi ${user.name}! Welcome to your 100-minute AI Avatar Interview for the ${role} position at ${company}. Let's begin Round 1: HR & Behavioral. Could you tell me about yourself and your journey in software engineering?`,
      },
    });

    return NextResponse.json({
      success: true,
      interviewId: avatarInterview.id,
      initialMessage: `Hi ${user.name}! Welcome to your 100-minute AI Avatar Interview for the ${role} position at ${company}. Let's begin Round 1: HR & Behavioral. Could you tell me about yourself and your journey in software engineering?`,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
