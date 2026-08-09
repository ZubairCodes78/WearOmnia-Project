import { NextRequest } from 'next/server';
import { adminEventEmitter } from '@/lib/events/event-emitter';
import { verifyAdminSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const isAuthenticated = await verifyAdminSession();
  if (!isAuthenticated) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      // Send initial heartbeat connection message
      controller.enqueue(
        encoder.encode(`data: ${JSON.stringify({ type: 'CONNECTED', timestamp: new Date().toISOString() })}\n\n`)
      );

      const onAdminEvent = (data: any) => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        } catch (err) {
          console.error('[SSE Stream Error]', err);
        }
      };

      adminEventEmitter.on('admin_event', onAdminEvent);

      // Heartbeat interval to keep connection alive
      const heartbeatTimer = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`: heartbeat\n\n`));
        } catch {
          clearInterval(heartbeatTimer);
        }
      }, 25000);

      req.signal.addEventListener('abort', () => {
        adminEventEmitter.off('admin_event', onAdminEvent);
        clearInterval(heartbeatTimer);
        try {
          controller.close();
        } catch {}
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}
