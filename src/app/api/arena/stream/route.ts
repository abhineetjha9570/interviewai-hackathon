import { arenaGameManager } from '@/lib/arena-manager';

// GET /api/arena/stream?roomCode=...&playerId=...
// Real-time Server-Sent Events stream for room events and countdown tickers
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const roomCode = searchParams.get('roomCode');
  const playerId = searchParams.get('playerId');

  if (!roomCode) {
    return new Response('Missing roomCode parameter', { status: 400 });
  }

  const encoder = new TextEncoder();
  const stream = new TransformStream();
  const writer = stream.writable.getWriter();

  const sendEvent = (event: any) => {
    try {
      const data = `data: ${JSON.stringify(event)}\n\n`;
      writer.write(encoder.encode(data));
    } catch (_) {}
  };

  // Immediate handshake event
  sendEvent({
    type: 'CONNECTED',
    payload: { roomCode, playerId, connectedAt: Date.now() },
  });

  // Subscribe to real-time events for this room
  const unsubscribe = arenaGameManager.subscribe(roomCode, (event) => {
    sendEvent(event);
  });

  // Heartbeat ping every 15 seconds to prevent browser timeouts
  const heartbeat = setInterval(() => {
    try {
      writer.write(encoder.encode(': heartbeat\n\n'));
    } catch (_) {
      clearInterval(heartbeat);
    }
  }, 15000);

  // Clean up on client disconnect
  req.signal.addEventListener('abort', () => {
    clearInterval(heartbeat);
    unsubscribe();
    try {
      writer.close();
    } catch (_) {}
  });

  return new Response(stream.readable, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
    },
  });
}
