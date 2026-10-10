import { NextResponse } from 'next/server';
import { arenaGameManager } from '@/lib/arena-manager';

// POST /api/arena/integrity: Records fairness-first browser integrity events
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { roomCode, playerId, eventType, details } = body;

    if (!roomCode || !playerId || !eventType) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    const result = arenaGameManager.logIntegritySignal({
      roomCode,
      playerId,
      eventType,
      details,
    });

    return NextResponse.json({
      success: true,
      totalEvents: result.totalEvents,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
