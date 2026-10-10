import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

// POST /api/career-roadmap/revise
// Revises roadmap schedule/duration while strictly preserving completed milestones
export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    let userId = user?.id;
    if (!userId) {
      const defaultUser = await prisma.user.findFirst();
      userId = defaultUser?.id || 'demo-user';
    }

    const body = await req.json();
    const { roadmapId, newDurationWeeks, newWeeklyHours } = body;

    if (!roadmapId || !newDurationWeeks || !newWeeklyHours) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    const roadmap = await prisma.careerRoadmap.findFirst({
      where: { id: roadmapId, userId },
      include: {
        phases: {
          include: {
            milestones: true,
          },
        },
      },
    });

    if (!roadmap) {
      return NextResponse.json({ error: 'Roadmap not found or unauthorized' }, { status: 404 });
    }

    const totalHours = newDurationWeeks * newWeeklyHours;
    const newTargetDuration = `${newDurationWeeks} Weeks (${totalHours} Total Study Hours)`;

    // Update remaining incomplete milestones' estimated hours proportionally
    const allMilestones = roadmap.phases.flatMap((p) => p.milestones);
    const incompleteMilestones = allMilestones.filter((m) => m.status !== 'COMPLETED');

    if (incompleteMilestones.length > 0) {
      // Re-allocate remaining study hours across incomplete milestones
      const avgHoursPerMilestone = Math.max(4, Math.round(newWeeklyHours * 1.5));
      for (const m of incompleteMilestones) {
        await prisma.roadmapMilestone.update({
          where: { id: m.id },
          data: { estimatedHours: avgHoursPerMilestone },
        });
      }
    }

    await prisma.careerRoadmap.update({
      where: { id: roadmapId },
      data: {
        targetDuration: newTargetDuration,
        weeklyHours: newWeeklyHours,
      },
    });

    const updatedRoadmap = await prisma.careerRoadmap.findUnique({
      where: { id: roadmapId },
      include: {
        phases: {
          orderBy: { orderIndex: 'asc' },
          include: {
            milestones: {
              orderBy: { orderIndex: 'asc' },
            },
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      roadmap: updatedRoadmap,
    });
  } catch (err: any) {
    console.error('Failed to revise roadmap:', err);
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
