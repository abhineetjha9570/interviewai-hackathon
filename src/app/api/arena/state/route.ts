import { NextResponse } from 'next/server';
import { arenaGameManager } from '@/lib/arena-manager';

// GET /api/arena/state?roomCode=...&playerId=...
// Fetches full authoritative game state for joining or reconnecting players
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const roomCode = searchParams.get('roomCode');
    const playerId = searchParams.get('playerId');

    if (!roomCode || !playerId) {
      return NextResponse.json({ error: 'roomCode and playerId are required.' }, { status: 400 });
    }

    const state = arenaGameManager.getRoomStateForClient(roomCode, playerId);
    if (!state) {
      return NextResponse.json({ error: 'Room not found or expired.' }, { status: 404 });
    }

    return NextResponse.json({ success: true, state });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
