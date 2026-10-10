import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

// PATCH /api/career-roadmap/milestone
// Updates milestone status and recalculates downstream unlocks & progress
export async function PATCH(req: Request) {
  try {
    const user = await getCurrentUser();
    let userId = user?.id;
    if (!userId) {
      const defaultUser = await prisma.user.findFirst();
      userId = defaultUser?.id || 'demo-user';
    }

    const body = await req.json();
    const { roadmapId, milestoneId, status } = body;

    if (!roadmapId || !milestoneId || !status) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    // Verify roadmap ownership
    const roadmap = await prisma.careerRoadmap.findFirst({
      where: { id: roadmapId, userId },
      include: { milestones: true },
    });

    if (!roadmap) {
      return NextResponse.json({ error: 'Roadmap not found or unauthorized' }, { status: 404 });
    }

    // Update the target milestone
    const targetMilestone = roadmap.milestones.find((m) => m.id === milestoneId || m.milestoneKey === milestoneId);
    if (!targetMilestone) {
      return NextResponse.json({ error: 'Milestone not found' }, { status: 404 });
    }

    await prisma.roadmapMilestone.update({
      where: { id: targetMilestone.id },
      data: {
        status,
        completedAt: status === 'COMPLETED' ? new Date() : null,
      },
    });

    // Re-fetch all milestones for the roadmap to recalculate downstream unlocks
    const allMilestones = await prisma.roadmapMilestone.findMany({
      where: { roadmapId },
      orderBy: { orderIndex: 'asc' },
    });

    const completedKeys = new Set<string>();
    allMilestones.forEach((m) => {
      const currentStatus = m.id === targetMilestone.id ? status : m.status;
      if (currentStatus === 'COMPLETED') {
        completedKeys.add(m.milestoneKey);
      }
    });

    // Unlock dependent milestones whose prerequisites are met
    for (const m of allMilestones) {
      if (m.id === targetMilestone.id && status === 'COMPLETED') continue;

      let prereqList: string[] = [];
      try {
        prereqList = JSON.parse(m.prerequisiteKeys || '[]');
      } catch (_) {}

      const allPrereqsMet = prereqList.every((pKey) => completedKeys.has(pKey));

      if (m.status === 'LOCKED' && allPrereqsMet) {
        await prisma.roadmapMilestone.update({
          where: { id: m.id },
          data: { status: 'AVAILABLE' },
        });
      } else if (m.status !== 'COMPLETED' && !allPrereqsMet) {
        await prisma.roadmapMilestone.update({
          where: { id: m.id },
          data: { status: 'LOCKED' },
        });
      }
    }

    // Recalculate progress
    const totalCount = allMilestones.length;
    const completedCount = completedKeys.size;
    const progressPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

    // Identify next recommended milestone
    const nextMilestone = allMilestones.find(
      (m) => (m.id === targetMilestone.id ? status : m.status) !== 'COMPLETED' &&
             (m.status === 'AVAILABLE' || m.status === 'IN_PROGRESS')
    );

    const recommendedNextAction = nextMilestone
      ? `Up next: "${nextMilestone.title}". Focus on ${nextMilestone.description.slice(0, 70)}...`
      : 'All milestones completed! You are fully prepared for enterprise technical interviews.';

    await prisma.careerRoadmap.update({
      where: { id: roadmapId },
      data: {
        progressPct,
        recommendedNextAction,
      },
    });

    // Fetch refreshed complete roadmap
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
    console.error('Failed to update milestone:', err);
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
