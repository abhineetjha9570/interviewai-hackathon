import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const {
      company = 'Google',
      role = 'Software Engineer',
      experienceLevel = 'Fresher',
      mockType = 'Full Mock',
      durationMinutes = 45,
    } = await req.json();
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const mock = await prisma.mockInterview.create({
      data: {
        userId: user.id,
        company,
        role,
        experienceLevel,
        mockType,
        durationMinutes,
        currentRound: 1,
        status: 'IN_PROGRESS',
        overallScore: 0,
        hrScore: 0,
        technicalScore: 0,
        codingScore: 0,
        managerialScore: 0,
      },
    });

    // Create 4 mock rounds
    await prisma.mockRound.createMany({
      data: [
        { mockInterviewId: mock.id, roundIndex: 1, roundType: 'HR', score: 0, status: 'IN_PROGRESS' },
        { mockInterviewId: mock.id, roundIndex: 2, roundType: 'Coding', score: 0, status: 'PENDING' },
        { mockInterviewId: mock.id, roundIndex: 3, roundType: 'Technical', score: 0, status: 'PENDING' },
        { mockInterviewId: mock.id, roundIndex: 4, roundType: 'Managerial', score: 0, status: 'PENDING' },
      ],
    });

    return NextResponse.json({ success: true, mockInterview: mock });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const {
      id,
      overallScore,
      hrScore,
      technicalScore,
      codingScore,
      managerialScore,
      feedback,
      radarMetrics,
      status = 'COMPLETED',
      rounds = [],
    } = body;

    if (!id) {
      return NextResponse.json({ error: 'Mock interview ID required' }, { status: 400 });
    }

    const updated = await prisma.mockInterview.update({
      where: { id },
      data: {
        overallScore: overallScore !== undefined ? overallScore : undefined,
        hrScore: hrScore !== undefined ? hrScore : undefined,
        technicalScore: technicalScore !== undefined ? technicalScore : undefined,
        codingScore: codingScore !== undefined ? codingScore : undefined,
        managerialScore: managerialScore !== undefined ? managerialScore : undefined,
        feedback: feedback || undefined,
        radarMetrics: radarMetrics ? JSON.stringify(radarMetrics) : undefined,
        status,
      },
    });

    // Update rounds if provided
    if (Array.isArray(rounds) && rounds.length > 0) {
      for (const r of rounds) {
        if (r.id) {
          await prisma.mockRound.update({
            where: { id: r.id },
            data: {
              score: r.score !== undefined ? r.score : undefined,
              feedback: r.feedback || undefined,
              status: r.status || 'COMPLETED',
            },
          });
        }
      }
    }

    return NextResponse.json({ success: true, mockInterview: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (id) {
      const mock = await prisma.mockInterview.findUnique({
        where: { id },
        include: { rounds: true },
      });
      return NextResponse.json({ mockInterview: mock });
    }

    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ mockInterviews: [] });
    }

    const list = await prisma.mockInterview.findMany({
      where: { userId: user.id },
      include: { rounds: true },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ mockInterviews: list });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
