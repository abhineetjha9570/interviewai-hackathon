import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { generateInterviewerTurn } from '@/lib/ai-interviewer';

export async function POST(req: Request) {
  try {
    const { interviewId, roundNumber, candidateMessage } = await req.json();

    if (!interviewId || !roundNumber || !candidateMessage) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    const user = await getCurrentUser();
    const interview = await prisma.avatarInterview.findUnique({
      where: { id: interviewId },
      include: {
        messages: {
          orderBy: { timestamp: 'asc' },
        },
      },
    });

    if (!interview) {
      return NextResponse.json({ error: 'Interview not found' }, { status: 404 });
    }

    // Save candidate message
    await prisma.avatarMessage.create({
      data: {
        avatarInterviewId: interviewId,
        roundNumber,
        sender: 'USER',
        message: candidateMessage,
      },
    });

    // Generate AI response
    const aiTurn = generateInterviewerTurn(
      {
        candidateName: user?.name || 'Candidate',
        role: interview.role,
        experienceLevel: interview.experienceLevel,
        company: interview.company,
        roundNumber,
        conversationHistory: [
          ...interview.messages.map(m => ({
            sender: m.sender as 'AI' | 'USER' | 'SYSTEM',
            message: m.message,
          })),
          { sender: 'USER', message: candidateMessage },
        ],
      },
      candidateMessage
    );

    // Save AI response
    await prisma.avatarMessage.create({
      data: {
        avatarInterviewId: interviewId,
        roundNumber,
        sender: 'AI',
        message: aiTurn.nextQuestion,
      },
    });

    // Update round scores
    if (aiTurn.scoreUpdate) {
      const updateData: any = {};
      if (roundNumber === 1) updateData.hrScore = aiTurn.scoreUpdate.communication;
      if (roundNumber === 3) {
        updateData.technicalScore = aiTurn.scoreUpdate.technicalAccuracy || 80;
        updateData.managerialScore = aiTurn.scoreUpdate.answerStructure;
      }
      if (roundNumber === 4) updateData.negotiationScore = aiTurn.scoreUpdate.communication;

      await prisma.avatarInterview.update({
        where: { id: interviewId },
        data: updateData,
      });
    }

    return NextResponse.json({
      success: true,
      aiResponse: aiTurn.nextQuestion,
      persona: aiTurn.interviewerPersonaName,
      isRoundComplete: aiTurn.isRoundComplete,
      scoreUpdate: aiTurn.scoreUpdate,
      feedbackTip: aiTurn.feedbackTip,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
