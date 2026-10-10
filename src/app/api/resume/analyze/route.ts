import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { analyzeResumeText } from '@/lib/ats-scanner';

export async function POST(req: Request) {
  try {
    const { rawText, jobDescription, fileName = 'Uploaded_Resume.pdf' } = await req.json();

    if (!rawText || rawText.trim().length === 0) {
      return NextResponse.json({ error: 'Resume text is required' }, { status: 400 });
    }

    const analysis = analyzeResumeText(rawText, jobDescription);
    const user = await getCurrentUser();

    if (user) {
      await prisma.resume.create({
        data: {
          userId: user.id,
          fileName,
          rawText,
          atsScore: analysis.atsScore,
          formatScore: analysis.formatScore,
          keywordScore: analysis.keywordScore,
          skillsScore: analysis.skillsScore,
          experienceScore: analysis.experienceScore,
          achievementsScore: analysis.achievementsScore,
          parsedSkills: JSON.stringify(analysis.foundKeywords),
          missingKeywords: JSON.stringify(analysis.missingKeywords),
          suggestions: JSON.stringify(analysis.suggestions),
        },
      });

      // Update profile resume name
      await prisma.profile.update({
        where: { userId: user.id },
        data: { resumeName: fileName },
      });
    }

    return NextResponse.json({
      success: true,
      analysis,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      // return default sample
      const analysis = analyzeResumeText('Java, Python, C++, SQL, DBMS, DSA, OOP, React');
      return NextResponse.json({ resume: null, analysis });
    }

    const latest = await prisma.resume.findFirst({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    });

    if (latest) {
      const analysis = analyzeResumeText(latest.rawText);
      return NextResponse.json({ resume: latest, analysis });
    }

    return NextResponse.json({ resume: null });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
