import { NextResponse } from 'next/server';
import QRCode from 'qrcode';
import { arenaGameManager } from '@/lib/arena-manager';
import { getCurrentUser } from '@/lib/auth';
import { resolveApplicationOrigin } from '@/lib/network-utils';

// POST /api/arena/create: Host creates an Aptitude Arena room with mobile-compatible QR code & invite URL
export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    const body = await req.json().catch(() => ({}));

    const hostName = user?.name || body.hostName || 'Candidate Host';
    const hostUserId = user?.id || null;

    const result = await arenaGameManager.createRoom({
      hostName,
      hostUserId,
      title: body.title,
      topic: body.topic,
      difficulty: body.difficulty,
      testDurationMinutes: body.testDurationMinutes || 10,
      totalQuestions: body.totalQuestions || 10,
      maxPlayers: body.maxPlayers || 50,
    });

    // Resolve mobile-accessible origin
    const originInfo = resolveApplicationOrigin(req);
    let effectiveOrigin = originInfo.canonicalOrigin;

    // Optional user-specified public tunnel/domain
    if (body.customOrigin && typeof body.customOrigin === 'string') {
      const cleanCustom = body.customOrigin.trim().replace(/\/$/, '');
      if (cleanCustom.startsWith('http://') || cleanCustom.startsWith('https://')) {
        effectiveOrigin = cleanCustom;
      }
    }

    const inviteUrl = `${effectiveOrigin}/aptitude-arena/join?room=${result.roomCode}`;

    // Generate real, high-resolution QR code data URL
    const qrCodeDataUrl = await QRCode.toDataURL(inviteUrl, {
      width: 320,
      margin: 2,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
      errorCorrectionLevel: 'M',
    });

    return NextResponse.json({
      success: true,
      roomCode: result.roomCode,
      hostPlayerId: result.hostPlayerId,
      inviteUrl,
      qrCodeDataUrl,
      originInfo: {
        effectiveOrigin,
        isPublicTunnelOrDomain: originInfo.isPublicTunnelOrDomain,
        detectedIp: originInfo.detectedIp,
      },
    });
  } catch (err: any) {
    console.error('Failed to create arena room:', err);
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
