import { NextResponse } from 'next/server';
import QRCode from 'qrcode';
import { gdArenaCoordinator } from '@/lib/gd-arena-manager';
import { resolveApplicationOrigin } from '@/lib/network-utils';
import { getCurrentUser } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    const body = await req.json().catch(() => ({}));

    const topic = (body.topic || '').trim();
    if (!topic || topic.length < 3) {
      return NextResponse.json(
        { error: 'Please provide a valid discussion topic (at least 3 characters).' },
        { status: 400 }
      );
    }

    const hostName = (body.hostName || user?.name || 'Candidate Host').trim();
    const category = body.category || 'Technology';
    const durationMinutes = parseInt(body.durationMinutes) || 10;
    const maxParticipants = parseInt(body.maxParticipants) || 6;
    const language = body.language || 'English';
    const difficulty = body.difficulty || 'Intermediate';
    const hasAiModerator = body.hasAiModerator !== false;

    // Create room via authoritative coordinator
    const { roomCode, hostPlayerId, roomState } = await gdArenaCoordinator.createRoom({
      hostUserId: user?.id || null,
      hostName,
      topic,
      category,
      durationMinutes,
      maxParticipants,
      language,
      difficulty,
      hasAiModerator,
    });

    // Public invite origin resolution (prevents hardcoded localhost on mobile)
    const { canonicalOrigin } = resolveApplicationOrigin(req);
    const inviteUrl = `${canonicalOrigin}/dashboard/gd-arena?join=${roomCode}`;

    // Generate high-resolution QR code
    const qrCodeDataUrl = await QRCode.toDataURL(inviteUrl, {
      width: 320,
      margin: 2,
      color: {
        dark: '#0F172A',
        light: '#FFFFFF',
      },
    });

    return NextResponse.json({
      success: true,
      roomCode,
      hostPlayerId,
      inviteUrl,
      qrCodeDataUrl,
      roomState: gdArenaCoordinator.getRoomClientState(roomCode, hostPlayerId),
    });
  } catch (error: any) {
    console.error('Error creating GD room:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to create GD room' },
      { status: 500 }
    );
  }
}
