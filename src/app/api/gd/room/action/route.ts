import { NextResponse } from 'next/server';
import { gdArenaCoordinator } from '@/lib/gd-arena-manager';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const roomCode = (body.roomCode || '').trim().toUpperCase();
    const playerId = (body.playerId || '').trim();
    const action = body.action; // 'STATUS_UPDATE' | 'LEAVE' | 'COMPLETE'

    if (!roomCode || !playerId) {
      return NextResponse.json({ error: 'roomCode and playerId are required.' }, { status: 400 });
    }

    if (action === 'LEAVE') {
      gdArenaCoordinator.leaveRoom(roomCode, playerId);
      return NextResponse.json({ success: true, left: true });
    }

    if (action === 'COMPLETE') {
      await gdArenaCoordinator.completeRoom(roomCode);
      const state = gdArenaCoordinator.getRoomClientState(roomCode, playerId);
      return NextResponse.json({ success: true, roomState: state });
    }

    // Default: update participant status
    gdArenaCoordinator.updateParticipantStatus(roomCode, playerId, {
      isMuted: body.isMuted,
      isSpeaking: body.isSpeaking,
      micReady: body.micReady,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error handling GD room action:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to process action' },
      { status: 500 }
    );
  }
}
