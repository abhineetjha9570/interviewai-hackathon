import { NextResponse } from 'next/server';
import { arenaGameManager } from '@/lib/arena-manager';
import { getCurrentUser } from '@/lib/auth';

// POST /api/arena/join: Participant joins waiting lobby with authenticated identity and room code
export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();

    // Step 2 & 3: Require authenticated identity from server session
    if (!user) {
      return NextResponse.json(
        {
          error: 'Authentication Required: You must sign in with Google or your InterviewAI account before joining an arena room.',
          code: 'AUTH_REQUIRED',
        },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { roomCode } = body;

    if (!roomCode || typeof roomCode !== 'string' || roomCode.trim().length === 0) {
      return NextResponse.json({ error: 'Please enter a valid 6-character room code.' }, { status: 400 });
    }

    // Use verified account display name from server session (never trust browser-supplied name)
    const verifiedDisplayName = user.name || user.email.split('@')[0] || 'Candidate';

    const result = arenaGameManager.joinRoom(
      roomCode.trim(),
      verifiedDisplayName,
      user.id
    );

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      roomCode: roomCode.toUpperCase().trim(),
      playerId: result.playerId,
      participantName: verifiedDisplayName,
    });
  } catch (err: any) {
    console.error('Failed to join arena room:', err);
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
