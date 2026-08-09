import { EventEmitter } from 'events';

// Global singleton Event Emitter for Admin Real-Time SSE Streams
const globalForEvents = global as unknown as { adminEventEmitter?: EventEmitter };

export const adminEventEmitter =
  globalForEvents.adminEventEmitter || new EventEmitter();

if (process.env.NODE_ENV !== 'production') {
  globalForEvents.adminEventEmitter = adminEventEmitter;
}

adminEventEmitter.setMaxListeners(100);

export function broadcastAdminEvent(data: {
  type: string;
  order?: any;
  notification?: any;
  sound?: boolean;
  timestamp: string;
}) {
  adminEventEmitter.emit('admin_event', data);
}
