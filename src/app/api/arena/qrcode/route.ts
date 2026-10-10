import { NextResponse } from 'next/server';
import QRCode from 'qrcode';
import { resolveApplicationOrigin } from '@/lib/network-utils';

// POST /api/arena/qrcode: Dynamically regenerates mobile QR code with updated tunnel or network URL
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { roomCode, customOrigin } = body;

    if (!roomCode) {
      return NextResponse.json({ error: 'Missing roomCode' }, { status: 400 });
    }

    const originInfo = resolveApplicationOrigin(req);
    let effectiveOrigin = originInfo.canonicalOrigin;

    if (customOrigin && typeof customOrigin === 'string') {
      const cleanCustom = customOrigin.trim().replace(/\/$/, '');
      if (cleanCustom.startsWith('http://') || cleanCustom.startsWith('https://')) {
        effectiveOrigin = cleanCustom;
      }
    }

    const inviteUrl = `${effectiveOrigin}/aptitude-arena/join?room=${roomCode.toUpperCase().trim()}`;

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
      inviteUrl,
      qrCodeDataUrl,
      origin: effectiveOrigin,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
