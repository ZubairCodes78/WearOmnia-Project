'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Bell, Volume2, Check, X, ShoppingBag, ExternalLink, AlertTriangle } from 'lucide-react';
import { useAdminNotifications } from '@/context/AdminNotificationContext';

export const NotificationCenter = () => {
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    playAudioChime,
    latestToast,
    dismissToast,
  } = useAdminNotifications();

  const [isOpen, setIsOpen] = useState(false);

  // SSE Stream Listener
  useEffect(() => {
    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource('/api/admin/events');

      eventSource.addEventListener('NEW_ORDER', (e: MessageEvent) => {
        playAudioChime();
        if ('Notification' in window && Notification.permission === 'granted') {
          try {
            const data = JSON.parse(e.data);
            new Notification(`🔔 New Order #${data.orderNumber}`, {
              body: `${data.customerName} placed an order of Rs. ${data.amount?.toLocaleString()} from ${data.city}.`,
              icon: '/favicon.ico',
            });
          } catch (err) {}
        }
      });

      eventSource.addEventListener('LOW_STOCK', () => {
        playAudioChime();
      });
    } catch (err) {
      console.warn('SSE EventSource setup error:', err);
    }

    return () => {
      if (eventSource) eventSource.close();
    };
  }, [playAudioChime]);

  // Request browser notification permission once
  const requestBrowserPermission = () => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          requestBrowserPermission();
        }}
        className="relative p-2 text-teal hover:bg-sand rounded-xl transition-all"
        title="Real-Time SSE Order Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 bg-red-600 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>

      <button
        onClick={playAudioChime}
        className="p-2 text-teal hover:bg-sand rounded-xl transition-all hidden sm:block"
        title="Test Order Audio Chime"
      >
        <Volume2 className="w-5 h-5 text-champagne-700" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-offwhite rounded-2xl shadow-2xl border border-sand z-50 overflow-hidden">
          <div className="p-4 bg-teal text-offwhite flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-champagne" />
              <h4 className="font-serif font-bold text-sm">Real-Time SSE Notifications</h4>
              {unreadCount > 0 && (
                <span className="bg-champagne text-teal-950 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  {unreadCount} New
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-[11px] text-champagne hover:underline font-semibold"
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-sand">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-xs text-charcoal-muted">
                No notifications received yet.
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className={`p-4 transition-colors ${
                    !n.isRead ? 'bg-champagne-50/70 border-l-4 border-teal' : 'bg-offwhite'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h5 className="font-serif font-bold text-xs text-teal flex items-center gap-1">
                        {n.message.includes('Low Stock') ? (
                          <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
                        ) : (
                          <ShoppingBag className="w-3.5 h-3.5 text-teal" />
                        )}
                        {n.title}
                      </h5>
                      <p className="text-[11px] text-charcoal-muted mt-0.5">{n.message}</p>
                      <span className="text-[9px] text-charcoal-muted mt-1 block font-mono">
                        {new Date(n.createdAt).toLocaleTimeString()}
                      </span>
                    </div>

                    {!n.isRead && (
                      <button
                        onClick={() => markAsRead(n.id)}
                        className="text-teal hover:text-teal-900 p-1"
                        title="Mark read"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Floating Incoming Toast Notification Banner */}
      {latestToast && (
        <div className="fixed top-20 right-6 z-50 bg-teal text-offwhite p-5 rounded-2xl shadow-2xl border-2 border-champagne max-w-sm animate-fade-in">
          <div className="flex items-start justify-between gap-3">
            <div className="w-10 h-10 rounded-full bg-champagne text-teal-950 flex items-center justify-center shrink-0">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-champagne block">
                ⚡ Real-Time Instant Alert!
              </span>
              <h4 className="font-serif font-bold text-sm text-offwhite mt-0.5">{latestToast.title}</h4>
              <p className="text-xs text-offwhite/90 mt-1">{latestToast.message}</p>
            </div>
            <button onClick={dismissToast} className="text-champagne hover:text-offwhite p-1">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="mt-3 pt-3 border-t border-teal-800 flex justify-end">
            <Link
              href="/admin/orders"
              onClick={dismissToast}
              className="bg-champagne text-teal-950 px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-offwhite transition-colors"
            >
              Open Orders Console
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};
