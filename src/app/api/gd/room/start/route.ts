import { NextResponse } from 'next/server';
import { gdArenaCoordinator } from '@/lib/gd-arena-manager';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const roomCode = (body.roomCode || '').trim().toUpperCase();
    const hostPlayerId = (body.hostPlayerId || '').trim();

    if (!roomCode || !hostPlayerId) {
      return NextResponse.json(
        { error: 'roomCode and hostPlayerId are required.' },
        { status: 400 }
      );
    }

    const result = await gdArenaCoordinator.startDiscussion(roomCode, hostPlayerId);
    if (!result.success) {
      return NextResponse.json({ error: result.error || 'Failed to start' }, { status: 403 });
    }

    const clientState = gdArenaCoordinator.getRoomClientState(roomCode, hostPlayerId);

    return NextResponse.json({
      success: true,
      roomState: clientState,
    });
  } catch (error: any) {
    console.error('Error starting GD discussion:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to start discussion' },
      { status: 500 }
    );
  }
}
