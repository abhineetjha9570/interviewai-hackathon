import { NextResponse } from 'next/server';
import { gdArenaCoordinator } from '@/lib/gd-arena-manager';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const roomCode = searchParams.get('code')?.trim().toUpperCase();
    const playerId = searchParams.get('playerId')?.trim();

    if (!roomCode) {
      return NextResponse.json({ error: 'Room code is required.' }, { status: 400 });
    }

    const state = gdArenaCoordinator.getRoomClientState(roomCode, playerId);
    if (!state) {
      return NextResponse.json({ error: 'Room not found or expired.' }, { status: 404 });
    }

    return NextResponse.json({ success: true, roomState: state });
  } catch (error: any) {
    console.error('Error fetching GD room state:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch GD room state' },
      { status: 500 }
    );
  }
}
