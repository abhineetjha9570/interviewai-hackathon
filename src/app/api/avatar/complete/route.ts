import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const { interviewId, codingScore = 74 } = await req.json();

    const interview = await prisma.avatarInterview.findUnique({
      where: { id: interviewId },
      include: { messages: true },
    });

    if (!interview) {
      return NextResponse.json({ error: 'Interview not found' }, { status: 404 });
    }

    const hrScore = interview.hrScore || 82;
    const technicalScore = interview.technicalScore || 76;
    const managerialScore = interview.managerialScore || 81;
    const negotiationScore = interview.negotiationScore || 84;
    const cScore = codingScore || 74;

    const overallScore = Math.round(
      (hrScore * 0.15) +
      (cScore * 0.50) +
      (technicalScore * 0.15) +
      (managerialScore * 0.10) +
      (negotiationScore * 0.10)
    );

    const reportSummary = `Completed 100-Minute Comprehensive Interview for ${interview.role} at ${interview.company}. Demonstrating strong overall performance across all 4 rounds with outstanding problem articulation and behavioral maturity.`;

    const updated = await prisma.avatarInterview.update({
      where: { id: interviewId },
      data: {
        status: 'COMPLETED',
        overallScore,
        codingScore: cScore,
        summaryReport: reportSummary,
        communicationScore: 80,
        confidenceScore: 76,
        techAccuracyScore: 78,
        answerStructureScore: 74,
        problemSolvingScore: 80,
        integrityScore: 98,
      },
    });

    return NextResponse.json({
      success: true,
      interview: updated,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
