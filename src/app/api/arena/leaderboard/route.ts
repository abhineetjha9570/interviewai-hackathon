import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

// GET /api/arena/leaderboard: Fetches recent multiplayer results and personal best
export async function GET() {
  try {
    const user = await getCurrentUser();
    const userId = user ? user.id : null;

    // Fetch top global results
    const topResults = await prisma.aptitudeGameResult.findMany({
      orderBy: { totalScore: 'desc' },
      take: 10,
    });

    // Fetch personal games if user is logged in
    let personalBest = null;
    let recentGames: any[] = [];

    if (userId) {
      personalBest = await prisma.aptitudeGameResult.findFirst({
        where: { userId },
        orderBy: { totalScore: 'desc' },
      });

      recentGames = await prisma.aptitudeGameResult.findMany({
        where: { userId },
        orderBy: { completedAt: 'desc' },
        take: 5,
      });
    }

    return NextResponse.json({
      topResults,
      personalBest,
      recentGames,
    });
  } catch (err: any) {
    console.error('Failed to get arena leaderboard:', err);
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
