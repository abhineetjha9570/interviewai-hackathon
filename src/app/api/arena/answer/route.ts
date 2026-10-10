import { NextResponse } from 'next/server';
import { arenaGameManager } from '@/lib/arena-manager';

// POST /api/arena/answer: Saves participant question answer (+5 marks if correct, 0 otherwise)
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { roomCode, playerId, questionIndex, selectedOption, isFlaggedForReview } = body;

    if (!roomCode || !playerId || questionIndex === undefined || !selectedOption) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    const result = arenaGameManager.savePlayerAnswer({
      roomCode,
      playerId,
      questionIndex,
      selectedOption,
      isFlaggedForReview,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      currentScore: result.currentScore,
      questionsAnswered: result.questionsAnswered,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
