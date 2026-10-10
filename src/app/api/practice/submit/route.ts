import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const {
      questionId,
      selectedOption,
      isCorrect,
      timeTakenSecs = 0,
      category = 'DSA',
      topic = 'General',
      difficulty = 'Medium',
      sessionId = null,
    } = await req.json();

    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ success: true, isCorrect });
    }

    // 1. Find or create an active practice session for this user
    let activeSession = null;
    if (sessionId) {
      activeSession = await prisma.practiceSession.findUnique({
        where: { id: sessionId },
      });
    }

    if (!activeSession) {
      activeSession = await prisma.practiceSession.findFirst({
        where: {
          userId: user.id,
          category,
          status: 'IN_PROGRESS',
        },
        orderBy: { createdAt: 'desc' },
      });
    }

    if (!activeSession) {
      activeSession = await prisma.practiceSession.create({
        data: {
          userId: user.id,
          category,
          topic,
          difficulty,
          totalQuestions: 10,
          completedQuestions: 1,
          correctQuestions: isCorrect ? 1 : 0,
          score: isCorrect ? 10 : 0,
          status: 'IN_PROGRESS',
        },
      });
    } else {
      activeSession = await prisma.practiceSession.update({
        where: { id: activeSession.id },
        data: {
          completedQuestions: { increment: 1 },
          correctQuestions: { increment: isCorrect ? 1 : 0 },
          timeSpentSeconds: { increment: timeTakenSecs },
          score: { increment: isCorrect ? 10 : 0 },
        },
      });
    }

    // 2. Save individual PracticeAnswer record
    await prisma.practiceAnswer.create({
      data: {
        sessionId: activeSession.id,
        questionId: questionId || 'q-' + Date.now(),
        selectedOption: selectedOption || null,
        isCorrect: !!isCorrect,
        timeTakenSecs: timeTakenSecs || 0,
      },
    });

    // 3. Update category score in Profile
    const catUpper = (category || '').toUpperCase();
    const updateData: any = {};
    if (catUpper.includes('APT')) {
      updateData.aptitudeScore = isCorrect ? { increment: 1 } : undefined;
    } else if (catUpper.includes('HR') || catUpper.includes('BEHAV')) {
      updateData.hrScore = isCorrect ? { increment: 1 } : undefined;
    } else if (catUpper.includes('TECH') || catUpper.includes('CORE')) {
      updateData.technicalScore = isCorrect ? { increment: 1 } : undefined;
    } else {
      updateData.dsaScore = isCorrect ? { increment: 1 } : undefined;
    }

    await prisma.profile.update({
      where: { userId: user.id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      isCorrect,
      sessionId: activeSession.id,
      completedQuestions: activeSession.completedQuestions,
      correctQuestions: activeSession.correctQuestions,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
