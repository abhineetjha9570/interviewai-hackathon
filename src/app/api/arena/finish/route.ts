import { NextResponse } from 'next/server';
import { arenaGameManager } from '@/lib/arena-manager';

// POST /api/arena/finish: Finalizes participant test and returns verified scorecard
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { roomCode, playerId } = body;

    if (!roomCode || !playerId) {
      return NextResponse.json({ error: 'Missing roomCode or playerId' }, { status: 400 });
    }

    const result = arenaGameManager.submitAndFinishPlayerTest(roomCode, playerId);
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      scorecard: result.scorecard,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
