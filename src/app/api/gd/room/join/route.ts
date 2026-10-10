import { NextResponse } from 'next/server';
import { gdArenaCoordinator } from '@/lib/gd-arena-manager';
import { getCurrentUser } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    const body = await req.json().catch(() => ({}));

    const roomCode = (body.roomCode || '').trim().toUpperCase();
    if (!roomCode) {
      return NextResponse.json({ error: 'Room code is required.' }, { status: 400 });
    }

    const playerName = (body.playerName || user?.name || 'Participant').trim();

    const result = await gdArenaCoordinator.joinRoom({
      roomCode,
      userId: user?.id || null,
      playerName,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error || 'Failed to join room' }, { status: 400 });
    }

    const clientState = gdArenaCoordinator.getRoomClientState(roomCode, result.playerId);

    return NextResponse.json({
      success: true,
      roomCode,
      playerId: result.playerId,
      roomState: clientState,
    });
  } catch (error: any) {
    console.error('Error joining GD room:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to join GD room' },
      { status: 500 }
    );
  }
}
