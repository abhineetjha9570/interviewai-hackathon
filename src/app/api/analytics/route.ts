import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({
        hasData: false,
        overallReadiness: 72,
        questionsSolved: 202,
        accuracy: 74,
        codingSuccessRate: 68,
        completedMocksCount: 3,
        avgMockScore: 77,
        completedAvatarCount: 2,
        avgAvatarScore: 81,
        streakDays: 12,
        topicPerformance: [
          { name: 'Array & Strings', accuracy: 84, count: 42, category: 'DSA' },
          { name: 'Linked List & Stacks', accuracy: 78, count: 28, category: 'DSA' },
          { name: 'Trees & Graphs', accuracy: 56, count: 34, category: 'DSA' },
          { name: 'Dynamic Programming', accuracy: 38, count: 26, category: 'DSA' },
          { name: 'DBMS & SQL', accuracy: 65, count: 30, category: 'TECHNICAL' },
          { name: 'Operating Systems', accuracy: 72, count: 24, category: 'TECHNICAL' },
          { name: 'HR & Behavioral', accuracy: 82, count: 18, category: 'HR' },
        ],
        recentActivity: [],
        completedMocks: [],
        completedAvatarMocks: [],
      });
    }

    // 1. Fetch user practice sessions and answers
    const practiceSessions = await prisma.practiceSession.findMany({
      where: { userId: user.id },
      include: { answers: true },
      orderBy: { createdAt: 'desc' },
    });

    // 2. Fetch coding submissions
    const codingSubmissions = await prisma.codingSubmission.findMany({
      where: { userId: user.id },
      include: { problem: true },
      orderBy: { createdAt: 'desc' },
    });

    // 3. Fetch completed Mock Interviews (exclude incomplete/in-progress)
    const completedMocks = await prisma.mockInterview.findMany({
      where: { userId: user.id, status: 'COMPLETED' },
      include: { rounds: true },
      orderBy: { createdAt: 'desc' },
    });

    // 4. Fetch completed AI Avatar Interviews (exclude incomplete/in-progress)
    const completedAvatarMocks = await prisma.avatarInterview.findMany({
      where: { userId: user.id, status: 'COMPLETED' },
      orderBy: { createdAt: 'desc' },
    });

    // 5. Fetch profile for streak & prep indicators
    const profile = await prisma.profile.findUnique({
      where: { userId: user.id },
    });

    // Compute metrics
    const totalPracticeSessions = practiceSessions.length;
    let totalQuestionsSolved = 0;
    let totalCorrectQuestions = 0;

    practiceSessions.forEach((s) => {
      totalQuestionsSolved += s.completedQuestions;
      totalCorrectQuestions += s.correctQuestions;
    });

    const accuracyPct =
      totalQuestionsSolved > 0
        ? Math.round((totalCorrectQuestions / totalQuestionsSolved) * 100)
        : profile?.aptitudeScore || 0;

    const totalCodingSubmissions = codingSubmissions.length;
    const acceptedCodingSubmissions = codingSubmissions.filter((c) => c.status === 'ACCEPTED').length;
    const codingSuccessRate =
      totalCodingSubmissions > 0
        ? Math.round((acceptedCodingSubmissions / totalCodingSubmissions) * 100)
        : profile?.dsaScore || 0;

    const avgMockScore =
      completedMocks.length > 0
        ? Math.round(completedMocks.reduce((acc, m) => acc + m.overallScore, 0) / completedMocks.length)
        : 0;

    const avgAvatarScore =
      completedAvatarMocks.length > 0
        ? Math.round(completedAvatarMocks.reduce((acc, a) => acc + a.overallScore, 0) / completedAvatarMocks.length)
        : 0;

    // Topic-wise performance aggregation
    const topicMap: Record<string, { total: number; correct: number; category: string }> = {};

    practiceSessions.forEach((s) => {
      const key = s.topic || s.category;
      if (!topicMap[key]) {
        topicMap[key] = { total: 0, correct: 0, category: s.category };
      }
      topicMap[key].total += s.completedQuestions;
      topicMap[key].correct += s.correctQuestions;
    });

    const topicPerformance = Object.entries(topicMap).map(([name, stat]) => ({
      name,
      category: stat.category,
      count: stat.total,
      accuracy: stat.total > 0 ? Math.round((stat.correct / stat.total) * 100) : 0,
    }));

    const hasData =
      totalQuestionsSolved > 0 ||
      totalCodingSubmissions > 0 ||
      completedMocks.length > 0 ||
      completedAvatarMocks.length > 0;

    // Overall readiness calculation
    let readiness = 0;
    if (hasData) {
      const components: number[] = [];
      if (totalQuestionsSolved > 0) components.push(accuracyPct);
      if (totalCodingSubmissions > 0) components.push(codingSuccessRate);
      if (completedMocks.length > 0) components.push(avgMockScore);
      if (completedAvatarMocks.length > 0) components.push(avgAvatarScore);

      readiness = Math.round(components.reduce((a, b) => a + b, 0) / components.length);
    } else {
      readiness = profile?.overallPrepPct || 0;
    }

    // Recent activity list
    const recentActivity = [
      ...practiceSessions.slice(0, 3).map((s) => ({
        id: s.id,
        type: `${s.category} Practice`,
        title: `${s.topic} (${s.completedQuestions} Questions)`,
        score: s.completedQuestions > 0 ? `${Math.round((s.correctQuestions / s.completedQuestions) * 100)}%` : '0%',
        createdAt: s.createdAt,
      })),
      ...completedMocks.slice(0, 2).map((m) => ({
        id: m.id,
        type: 'Mock Interview',
        title: `${m.company} - ${m.role}`,
        score: `${m.overallScore}%`,
        createdAt: m.createdAt,
      })),
      ...completedAvatarMocks.slice(0, 2).map((a) => ({
        id: a.id,
        type: 'AI Avatar Simulation',
        title: `${a.company} - 100 Min Evaluation`,
        score: `${a.overallScore}%`,
        createdAt: a.createdAt,
      })),
    ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json({
      hasData,
      overallReadiness: readiness,
      questionsSolved: totalQuestionsSolved,
      accuracy: accuracyPct,
      codingSuccessRate,
      completedMocksCount: completedMocks.length,
      avgMockScore,
      completedAvatarCount: completedAvatarMocks.length,
      avgAvatarScore,
      streakDays: profile?.streakDays || 0,
      topicPerformance,
      recentActivity,
      completedMocks,
      completedAvatarMocks,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
