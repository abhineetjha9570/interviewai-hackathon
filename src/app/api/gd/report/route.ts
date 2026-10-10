import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { generateGDEvidenceReport, type GDTranscriptItem } from '@/lib/gd-orchestrator';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    const body = await req.json().catch(() => ({}));

    const sessionId = (body.sessionId || `GD_${Date.now()}`).trim();
    const userName = (body.userName || user?.name || 'Candidate').trim();
    const topic = (body.topic || 'Group Discussion Topic').trim();
    const durationMinutes = parseInt(body.durationMinutes) || 10;
    const mode = body.mode === 'MULTIPLAYER' ? 'MULTIPLAYER' : 'AI_PRACTICE';
    const transcript: GDTranscriptItem[] = Array.isArray(body.transcript) ? body.transcript : [];

    // Strictly generate report from real transcript evidence
    const report = generateGDEvidenceReport(userName, topic, durationMinutes, transcript);

    // Persist to Prisma SQLite
    try {
      await prisma.gDSessionReport.upsert({
        where: { sessionId },
        create: {
          sessionId,
          userId: user?.id || null,
          userName,
          mode,
          topic,
          durationMinutes,
          speakingTimeSec: report.speakingTimeSec,
          speakingRatioPct: report.speakingRatioPct,
          participationScore: report.participationScore,
          ideaQualityScore: report.ideaQualityScore,
          topicRelevanceScore: report.topicRelevanceScore,
          collaborationScore: report.collaborationScore,
          argumentScore: report.argumentScore,
          overallScore: report.overallScore,
          summary: report.summary,
          strengths: JSON.stringify(report.strengths),
          improvements: JSON.stringify(report.improvements),
          nextSteps: JSON.stringify(report.nextSteps),
          evidenceData: JSON.stringify(report.evidenceData),
          insufficientEvidence: report.insufficientEvidence,
        },
        update: {
          speakingTimeSec: report.speakingTimeSec,
          speakingRatioPct: report.speakingRatioPct,
          overallScore: report.overallScore,
          summary: report.summary,
          strengths: JSON.stringify(report.strengths),
          improvements: JSON.stringify(report.improvements),
        },
      });
    } catch (dbErr) {
      console.warn('GDSessionReport DB upsert warning:', dbErr);
    }

    return NextResponse.json({
      success: true,
      report,
    });
  } catch (error: any) {
    console.error('Error creating GD report:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to create report' },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get('sessionId')?.trim();

    if (sessionId) {
      const dbReport = await prisma.gDSessionReport.findUnique({
        where: { sessionId },
      });

      if (!dbReport) {
        return NextResponse.json({ error: 'Report not found' }, { status: 404 });
      }

      return NextResponse.json({
        success: true,
        report: {
          ...dbReport,
          strengths: JSON.parse(dbReport.strengths || '[]'),
          improvements: JSON.parse(dbReport.improvements || '[]'),
          nextSteps: JSON.parse(dbReport.nextSteps || '[]'),
          evidenceData: JSON.parse(dbReport.evidenceData || '[]'),
        },
      });
    }

    // Retrieve user's previous GD reports list
    const reports = await prisma.gDSessionReport.findMany({
      where: user?.id ? { userId: user.id } : {},
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    const parsedReports = reports.map((r) => ({
      ...r,
      strengths: JSON.parse(r.strengths || '[]'),
      improvements: JSON.parse(r.improvements || '[]'),
      nextSteps: JSON.parse(r.nextSteps || '[]'),
      evidenceData: JSON.parse(r.evidenceData || '[]'),
    }));

    return NextResponse.json({ success: true, reports: parsedReports });
  } catch (error: any) {
    console.error('Error fetching GD reports:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch reports' },
      { status: 500 }
    );
  }
}
