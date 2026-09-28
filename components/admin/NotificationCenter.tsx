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
        className="relative p-2 text-[#D4AF37] hover:bg-[#103A3E] rounded-xl transition-colors"
        title="Real-Time SSE Order Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 bg-red-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>

      <button
        onClick={playAudioChime}
        className="p-2 text-[#D4AF37]/80 hover:text-[#D4AF37] hover:bg-[#103A3E] rounded-xl transition-colors hidden sm:block"
        title="Test Order Audio Chime"
      >
        <Volume2 className="w-5 h-5" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-[#0A2528] rounded-2xl shadow-2xl border border-[#D4AF37]/30 z-50 overflow-hidden font-sans">
          <div className="p-4 bg-[#06191B] border-b border-[#D4AF37]/20 text-[#FAF8F5] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-[#D4AF37]" />
              <h4 className="font-bold text-xs uppercase tracking-wider text-[#FAF8F5]">Real-Time Notifications</h4>
              {unreadCount > 0 && (
                <span className="bg-[#D4AF37] text-black text-[10px] font-black px-2 py-0.5 rounded-full">
                  {unreadCount} New
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-[11px] text-[#D4AF37] hover:underline font-semibold"
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-[#D4AF37]/10">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-xs text-[#FAF8F5]/50">
                No notifications received yet.
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className={`p-4 transition-colors ${
                    !n.isRead ? 'bg-[#0D3337]/60 border-l-4 border-[#D4AF37]' : 'bg-[#0A2528]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h5 className="font-bold text-xs text-[#FAF8F5] flex items-center gap-1.5">
                        {n.message.includes('Low Stock') ? (
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                        ) : (
                          <ShoppingBag className="w-3.5 h-3.5 text-[#D4AF37]" />
                        )}
                        {n.title}
                      </h5>
                      <p className="text-[11px] text-[#FAF8F5]/70 mt-1 leading-relaxed">{n.message}</p>
                      <span className="text-[9px] text-[#D4AF37]/80 mt-1.5 block font-mono">
                        {new Date(n.createdAt).toLocaleTimeString()}
                      </span>
                    </div>

                    {!n.isRead && (
                      <button
                        onClick={() => markAsRead(n.id)}
                        className="text-[#D4AF37] hover:text-white p-1"
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
        <div className="fixed top-20 right-6 z-50 bg-[#0A2528] text-[#FAF8F5] p-5 rounded-2xl shadow-2xl border border-[#D4AF37]/40 max-w-sm font-sans animate-in fade-in duration-200">
          <div className="flex items-start justify-between gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#0D3337] border border-[#D4AF37]/40 text-[#D4AF37] flex items-center justify-center shrink-0">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#D4AF37] block">
                Instant Order Alert
              </span>
              <h4 className="font-bold text-sm text-[#FAF8F5] mt-0.5">{latestToast.title}</h4>
              <p className="text-xs text-[#FAF8F5]/80 mt-1 leading-relaxed">{latestToast.message}</p>
            </div>
            <button onClick={dismissToast} className="text-[#FAF8F5]/60 hover:text-white p-1">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="mt-4 pt-3 border-t border-[#D4AF37]/20 flex justify-end">
            <Link
              href="/admin/orders"
              onClick={dismissToast}
              className="bg-[#D4AF37] text-black px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-[#FAF8F5] transition-colors shadow-sm"
            >
              Open Orders Console
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};
