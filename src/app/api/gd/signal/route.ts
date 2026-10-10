import { NextResponse } from 'next/server';
import { gdArenaCoordinator } from '@/lib/gd-arena-manager';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const roomCode = (body.roomCode || '').trim().toUpperCase();
    const action = body.action; // 'POST' | 'PULL'
    const playerId = (body.playerId || '').trim();

    if (!roomCode || !playerId) {
      return NextResponse.json({ error: 'roomCode and playerId are required.' }, { status: 400 });
    }

    if (action === 'POST') {
      const { toPlayerId, type, payload } = body;
      if (!toPlayerId || !type || !payload) {
        return NextResponse.json({ error: 'Missing signal fields' }, { status: 400 });
      }

      gdArenaCoordinator.postSignal(roomCode, playerId, toPlayerId, type, payload);
      return NextResponse.json({ success: true });
    }

    if (action === 'PULL') {
      const pendingSignals = gdArenaCoordinator.pullSignals(roomCode, playerId);
      return NextResponse.json({ success: true, signals: pendingSignals });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    console.error('Error handling WebRTC signal:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to handle signal' },
      { status: 500 }
    );
  }
}
