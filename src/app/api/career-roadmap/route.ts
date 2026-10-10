import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import {
  RoadmapInput,
  validateRoadmapInput,
  generateIndustryFrameworkRoadmap,
  generateAiPersonalizedRoadmap,
  updateMilestonePrerequisites,
  calculateRoadmapProgress,
} from '@/lib/roadmap-generator';

// GET /api/career-roadmap: Fetch authenticated user's active roadmap & profile context
export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    let userId = user?.id;
    if (!userId) {
      const defaultUser = await prisma.user.findFirst();
      userId = defaultUser?.id || 'demo-user';
    }

    const [roadmap, profile, resume, practiceSessions] = await Promise.all([
      prisma.careerRoadmap.findFirst({
        where: { userId, status: 'ACTIVE' },
        include: {
          phases: {
            orderBy: { orderIndex: 'asc' },
            include: {
              milestones: {
                orderBy: { orderIndex: 'asc' },
              },
            },
          },
          milestones: true,
        },
        orderBy: { updatedAt: 'desc' },
      }),
      prisma.profile.findFirst({
        where: { userId },
      }),
      prisma.resume.findFirst({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.practiceSession.findMany({
        where: { userId },
        take: 5,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    // Parse skills from profile and resume
    let parsedSkills: string[] = ['Java', 'Python', 'DSA', 'SQL'];
    if (profile?.skills) {
      try {
        parsedSkills = JSON.parse(profile.skills);
      } catch {}
    } else if (resume?.parsedSkills) {
      try {
        parsedSkills = JSON.parse(resume.parsedSkills);
      } catch {}
    }

    const profileContext = {
      targetRole: profile?.targetRole || 'Software Engineer',
      experienceLevel: profile?.experience || 'Fresher',
      technicalSkills: parsedSkills,
      degreeOrBranch: 'Computer Science & Engineering',
      graduationYear: '2026',
      preferredDomain: 'Full Stack & Cloud',
      weakAreas: practiceSessions.filter(s => s.score < 70).map(s => s.topic),
      isAiKeyConfigured: !!(process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY),
    };

    return NextResponse.json({
      roadmap: roadmap || null,
      profileContext,
    });
  } catch (err: any) {
    console.error('Failed to get career roadmap:', err);
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}

// POST /api/career-roadmap: Generate and persist a new Career Roadmap
export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    let userId = user?.id;
    if (!userId) {
      const defaultUser = await prisma.user.findFirst();
      userId = defaultUser?.id || 'demo-user';
    }

    const body: RoadmapInput & { mode?: 'AI' | 'FRAMEWORK' } = await req.json();

    const validation = validateRoadmapInput(body);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    let generatedRoadmap;

    if (body.mode === 'AI') {
      try {
        generatedRoadmap = await generateAiPersonalizedRoadmap(body);
      } catch (aiErr: any) {
        if (aiErr.message === 'SERVER_AI_CONFIG_MISSING' || aiErr.missingEnv) {
          return NextResponse.json(
            {
              error: 'Server AI Configuration Missing: The administrator has not configured GEMINI_API_KEY or OPENAI_API_KEY in the server environment (.env). Normal users cannot provide API keys.',
              code: 'SERVER_AI_CONFIG_MISSING',
              missingEnv: ['GEMINI_API_KEY', 'OPENAI_API_KEY'],
              recommendation: 'Use the Verified Industry Standard Curriculum Framework for immediate, structured roadmap generation.',
            },
            { status: 400 }
          );
        }
        return NextResponse.json(
          { error: `AI Generation failed: ${aiErr.message}. You can retry or choose the Verified Industry Curriculum Framework.` },
          { status: 500 }
        );
      }
    } else {
      // High-grade verified industry framework (deterministic, zero credits consumed)
      generatedRoadmap = generateIndustryFrameworkRoadmap(body);
    }

    // Persist to database in a transaction
    // First, archive previous active roadmaps for this user
    await prisma.careerRoadmap.updateMany({
      where: { userId, status: 'ACTIVE' },
      data: { status: 'ARCHIVED' },
    });

    const newRoadmap = await prisma.careerRoadmap.create({
      data: {
        userId,
        title: generatedRoadmap.title,
        targetRole: generatedRoadmap.targetRole,
        targetDuration: generatedRoadmap.targetDuration,
        weeklyHours: generatedRoadmap.weeklyHours,
        currentLevel: generatedRoadmap.currentLevel,
        learningPace: generatedRoadmap.learningPace,
        profileSummary: JSON.stringify(generatedRoadmap.profileSummary),
        assumptions: JSON.stringify(generatedRoadmap.assumptions),
        completionCriteria: generatedRoadmap.completionCriteria,
        recommendedNextAction: generatedRoadmap.recommendedNextAction,
        status: 'ACTIVE',
        progressPct: 0,
      },
    });

    // Create phases & milestones
    for (const phase of generatedRoadmap.phases) {
      const dbPhase = await prisma.roadmapPhase.create({
        data: {
          roadmapId: newRoadmap.id,
          orderIndex: phase.orderIndex,
          title: phase.title,
          description: phase.description,
          estimatedWeeks: phase.estimatedWeeks,
        },
      });

      for (let i = 0; i < phase.milestones.length; i++) {
        const m = phase.milestones[i];
        await prisma.roadmapMilestone.create({
          data: {
            roadmapId: newRoadmap.id,
            phaseId: dbPhase.id,
            orderIndex: i + 1,
            milestoneKey: m.milestoneKey,
            title: m.title,
            description: m.description,
            importance: m.importance,
            requiredKnowledge: JSON.stringify(m.requiredKnowledge),
            estimatedHours: m.estimatedHours,
            learningObjectives: JSON.stringify(m.learningObjectives),
            projectIdea: m.projectIdea,
            completionCriteria: m.completionCriteria,
            relevantResources: JSON.stringify(m.relevantResources),
            relatedModuleType: m.relatedModuleType,
            relatedModuleUrl: m.relatedModuleUrl,
            prerequisiteKeys: JSON.stringify(m.prerequisiteKeys || []),
            status: m.status,
          },
        });
      }
    }

    // Return the full saved roadmap
    const completeRoadmap = await prisma.careerRoadmap.findUnique({
      where: { id: newRoadmap.id },
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
      roadmap: completeRoadmap,
      isAiGenerated: generatedRoadmap.isAiGenerated,
      generatorNotice: generatedRoadmap.generatorNotice,
    });
  } catch (err: any) {
    console.error('Failed to create career roadmap:', err);
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}

// DELETE /api/career-roadmap: Delete active roadmap
export async function DELETE(req: Request) {
  try {
    const user = await getCurrentUser();
    const userId = user ? user.id : 'demo-user';

    const { searchParams } = new URL(req.url);
    const roadmapId = searchParams.get('id');

    if (roadmapId) {
      await prisma.careerRoadmap.deleteMany({
        where: { id: roadmapId, userId },
      });
    } else {
      await prisma.careerRoadmap.deleteMany({
        where: { userId, status: 'ACTIVE' },
      });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
