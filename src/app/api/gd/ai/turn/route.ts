import { NextResponse } from 'next/server';
import {
  orchestrateNextAITurn,
  generateModeratorOpening,
  generateModeratorAnnouncement,
  type GDContext,
  type GDTranscriptItem,
} from '@/lib/gd-orchestrator';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));

    const topic = (body.topic || '').trim();
    if (!topic) {
      return NextResponse.json({ error: 'Topic is required.' }, { status: 400 });
    }

    const durationMinutes = parseInt(body.durationMinutes) || 10;
    const language = body.language || 'English';
    const difficulty = body.difficulty || 'Intermediate';
    const action = body.action || 'NEXT_TURN'; // 'OPENING' | 'NEXT_TURN' | 'CLOSING'
    const history: GDTranscriptItem[] = Array.isArray(body.history) ? body.history : [];
    const candidateUtterance = (body.candidateUtterance || '').trim();
    const totalElapsedSec = parseInt(body.totalElapsedSec) || 0;

    if (action === 'OPENING') {
      const opening = generateModeratorOpening(topic, durationMinutes, undefined, language);
      return NextResponse.json({ success: true, turn: opening });
    }

    if (action === 'CLOSING') {
      const closing = generateModeratorAnnouncement('CLOSING_SUMMARY', topic, history);
      return NextResponse.json({ success: true, turn: closing });
    }

    // Contextual AI Turn Orchestration
    const context: GDContext = {
      topic,
      durationMinutes,
      language,
      difficulty,
      hasModerator: true,
      history,
      humanSpeakingSec: history
        .filter((h) => h.speakerRole === 'HUMAN')
        .reduce((sum, h) => sum + (h.durationSec || 0), 0),
      totalElapsedSec,
    };

    const nextTurn = orchestrateNextAITurn(context, candidateUtterance);

    return NextResponse.json({
      success: true,
      turn: nextTurn,
    });
  } catch (error: any) {
    console.error('Error generating AI GD turn:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to generate AI turn' },
      { status: 500 }
    );
  }
}
