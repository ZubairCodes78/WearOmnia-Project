import { sseManager } from '@/lib/sse';
import { verifyAdminSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const isAuthenticated = await verifyAdminSession();
  if (!isAuthenticated) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();

      // Send initial heartbeat
      controller.enqueue(
        encoder.encode(`event: ping\ndata: ${JSON.stringify({ status: 'connected', time: new Date() })}\n\n`)
      );

      const listener = ({ event, data, timestamp }: any) => {
        try {
          const payload = `event: ${event}\ndata: ${JSON.stringify({ ...data, timestamp })}\n\n`;
          controller.enqueue(encoder.encode(payload));
        } catch (e) {
          console.error('SSE Error:', e);
        }
      };

      sseManager.on('admin_event', listener);

      req.signal.addEventListener('abort', () => {
        sseManager.off('admin_event', listener);
        try {
          controller.close();
        } catch (e) {}
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
