import { NextResponse } from 'next/server';
import { arenaGameManager } from '@/lib/arena-manager';

// POST /api/arena/start: Host starts the test from the lobby early
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { roomCode, hostPlayerId } = body;

    if (!roomCode || !hostPlayerId) {
      return NextResponse.json({ error: 'Missing roomCode or hostPlayerId' }, { status: 400 });
    }

    const result = arenaGameManager.startTest(roomCode, hostPlayerId);
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      questions: result.questions,
      state: result.state,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
