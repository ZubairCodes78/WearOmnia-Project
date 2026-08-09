'use client';

import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { OrderNotification } from '@/lib/types';

interface AdminNotificationContextType {
  notifications: OrderNotification[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  playAudioChime: () => void;
  latestToast: OrderNotification | null;
  dismissToast: () => void;
}

const AdminNotificationContext = createContext<AdminNotificationContextType | undefined>(undefined);

export const AdminNotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<OrderNotification[]>([]);
  const [latestToast, setLatestToast] = useState<OrderNotification | null>(null);
  const knownIdsRef = useRef<Set<string>>(new Set());

  // Web Audio Chime Generator
  const playAudioChime = () => {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      
      const now = ctx.currentTime;
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();

      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(523.25, now); // C5
      osc1.frequency.exponentialRampToValueAtTime(659.25, now + 0.15); // E5
      osc1.frequency.exponentialRampToValueAtTime(783.99, now + 0.35); // G5

      gain1.gain.setValueAtTime(0.3, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

      osc1.connect(gain1);
      gain1.connect(ctx.destination);

      osc1.start(now);
      osc1.stop(now + 0.6);
    } catch (e) {
      console.warn('Audio chime error:', e);
    }
  };

  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/admin/notifications/poll', { cache: 'no-store' });
      if (!res.ok) return;
      const data: OrderNotification[] = await res.json();

      let newlyArrived: OrderNotification | null = null;

      data.forEach((n) => {
        if (!knownIdsRef.current.has(n.id)) {
          knownIdsRef.current.add(n.id);
          // If this is a newly arrived order during this session
          if (knownIdsRef.current.size > data.length - 1) {
            newlyArrived = n;
          }
        }
      });

      setNotifications(data);

      if (newlyArrived) {
        setLatestToast(newlyArrived);
        playAudioChime();
      }
    } catch (e) {
      console.error('Notification poll error:', e);
    }
  };

  useEffect(() => {
    fetchNotifications();

    // 1. Establish Real-time Server-Sent Events (SSE) Stream
    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource('/api/admin/events/sse');
      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'ORDER_AUTO_CONFIRMED' || data.type === 'NEW_ORDER') {
            fetchNotifications();
            if (data.sound !== false) {
              playAudioChime();
            }
          }
        } catch (e) {
          console.error('[SSE Client Error]', e);
        }
      };
    } catch (e) {
      console.warn('SSE fallback to polling');
    }

    // 2. Polling Fallback Every 4 seconds
    const interval = setInterval(fetchNotifications, 4000);

    return () => {
      if (eventSource) eventSource.close();
      clearInterval(interval);
    };
  }, []);

  const markAsRead = async (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
    try {
      await fetch('/api/admin/notifications/mark-read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
    } catch (e) {
      console.error(e);
    }
  };

  const markAllAsRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    try {
      await fetch('/api/admin/notifications/mark-read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ all: true }),
      });
    } catch (e) {
      console.error(e);
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <AdminNotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
        playAudioChime,
        latestToast,
        dismissToast: () => setLatestToast(null),
      }}
    >
      {children}
    </AdminNotificationContext.Provider>
  );
};

export const useAdminNotifications = () => {
  const context = useContext(AdminNotificationContext);
  if (!context) throw new Error('useAdminNotifications must be used within AdminNotificationProvider');
  return context;
};
