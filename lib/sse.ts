import { EventEmitter } from 'events';

class SSEManager extends EventEmitter {
  private static instance: SSEManager;

  private constructor() {
    super();
    this.setMaxListeners(100);
  }

  public static getInstance(): SSEManager {
    if (!SSEManager.instance) {
      SSEManager.instance = new SSEManager();
    }
    return SSEManager.instance;
  }

  public broadcast(event: string, data: any) {
    this.emit('admin_event', { event, data, timestamp: new Date().toISOString() });
  }
}

export const sseManager = SSEManager.getInstance();
