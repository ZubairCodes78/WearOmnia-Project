'use client';

import React, { useState, useRef, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X, Send, Headphones, ShieldCheck, User, ChevronRight, PhoneCall, Package, Loader2 } from 'lucide-react';
import { useSettings } from '@/context/SettingsContext';

interface ChatMessage {
  id: string;
  sender: 'bot' | 'user';
  text: string;
  timestamp: string;
  quickReplies?: string[];
  actionLink?: { label: string; url: string } | null;
}

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: '1',
    sender: 'bot',
    text: 'Greetings! Welcome to WearOMNIA Concierge. How may our client team assist you today?',
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    quickReplies: [
      'Track My Order',
      'Custom Sizing & Stitching',
      'Shipping & COD Info',
      '7-Day Exchange Policy',
    ],
  },
];

// Tracking conversation state machine
type TrackingState = 'idle' | 'awaiting_order_number' | 'awaiting_phone' | 'loading';

export const SupportAssistant = () => {
  const pathname = usePathname();
  const { settings } = useSettings();
  const [isOpen, setIsOpen] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Tracking flow state
  const [trackingState, setTrackingState] = useState<TrackingState>('idle');
  const [pendingOrderNumber, setPendingOrderNumber] = useState('');

  // WhatsApp configuration from central settings
  const rawWhatsApp = settings.whatsappNumber || '923180633323';
  const whatsappPhone = rawWhatsApp.replace(/^0/, '92').replace(/\s/g, '');
  const defaultWhatsAppMsg = 'Hi WearOMNIA, I need help with my order.';

  // Detect product page for dynamic mobile bottom clearance
  const isProductPage = Boolean(pathname?.startsWith('/product/'));

  // Hide SupportAssistant on admin routes
  if (pathname?.startsWith('/admin')) {
    return null;
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen, isTyping]);

  const addBotMessage = (text: string, options?: { quickReplies?: string[]; actionLink?: { label: string; url: string } | null }) => {
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setMessages((prev) => [...prev, {
      id: Date.now().toString(),
      sender: 'bot',
      text,
      timestamp: time,
      quickReplies: options?.quickReplies,
      actionLink: options?.actionLink || null,
    }]);
  };

  const handleTrackingFlow = async (userText: string) => {
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    if (trackingState === 'awaiting_order_number') {
      const orderNum = userText.trim().toUpperCase();
      setPendingOrderNumber(orderNum);
      setTrackingState('awaiting_phone');
      setIsTyping(true);
      setTimeout(() => {
        setIsTyping(false);
        addBotMessage(
          `Got it! Order ${orderNum}. For security, please enter the phone number you used during checkout.`,
          { quickReplies: ['Cancel Tracking'] }
        );
      }, 600);
      return true;
    }

    if (trackingState === 'awaiting_phone') {
      if (userText.toLowerCase().includes('cancel')) {
        setTrackingState('idle');
        setPendingOrderNumber('');
        setIsTyping(true);
        setTimeout(() => {
          setIsTyping(false);
          addBotMessage('No problem! How else can I assist you?', {
            quickReplies: ['Track My Order', 'Custom Sizing & Stitching', 'Shipping & COD Info'],
          });
        }, 400);
        return true;
      }

      const phone = userText.trim();
      setTrackingState('loading');
      setIsTyping(true);

      try {
        const res = await fetch('/api/track-order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderNumber: pendingOrderNumber, phone }),
        });

        const data = await res.json();
        setIsTyping(false);

        if (!res.ok) {
          addBotMessage(
            `Sorry, we couldn't verify this order. ${data.error || 'Please check your order number and phone number.'}`,
            {
              quickReplies: ['Try Again', 'Talk to Team'],
              actionLink: { label: 'Track on Website', url: '/track-order' },
            }
          );
        } else {
          const o = data.order;
          const statusLabel = o.status.replace(/_/g, ' ');

          let trackingMsg = `Order #${o.orderNumber}\n\nStatus: ${statusLabel}\nDelivery City: ${o.shippingCity}\nTotal (COD): Rs. ${o.totalAmount.toLocaleString()}`;

          if (o.courier) trackingMsg += `\nCourier: ${o.courier}`;
          if (o.trackingNumber) trackingMsg += `\nTracking: ${o.trackingNumber}`;

          trackingMsg += `\n\nItems: ${o.items.map((i: any) => `${i.title} (x${i.quantity})`).join(', ')}`;

          addBotMessage(trackingMsg, {
            quickReplies: ['Browse Catalog', 'WhatsApp Concierge'],
            actionLink: { label: 'Full Tracking Page', url: '/track-order' },
          });
        }
      } catch (e) {
        setIsTyping(false);
        addBotMessage('Something went wrong. Please try again or track your order on our website.', {
          actionLink: { label: 'Track on Website', url: '/track-order' },
          quickReplies: ['Try Again'],
        });
      }

      setTrackingState('idle');
      setPendingOrderNumber('');
      return true;
    }

    return false;
  };

  const generateBotReply = (userQuery: string): ChatMessage => {
    const q = userQuery.toLowerCase();
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    if (q.includes('track') || q.includes('order status') || q.includes('where is my order') || q.includes('try again')) {
      // Start tracking flow
      setTrackingState('awaiting_order_number');
      return {
        id: Date.now().toString(),
        sender: 'bot',
        text: 'I can help you track your order! Please enter your order number (e.g. OMNIA-10025).',
        timestamp: time,
        quickReplies: ['Cancel Tracking'],
      };
    }

    if (q.includes('shipping') || q.includes('delivery') || q.includes('cod') || q.includes('free')) {
      const freeShippingMsg = settings.freeShippingThreshold > 0
        ? `Shipping is FREE on orders above Rs. ${settings.freeShippingThreshold.toLocaleString()} (Standard Rs. ${settings.flatShippingFee} fee for smaller orders).`
        : `Shipping is FREE on all orders!`;
      return {
        id: Date.now().toString(),
        sender: 'bot',
        text: `We provide Nationwide Cash On Delivery across 200+ cities in Pakistan. ${freeShippingMsg} Delivery takes ${settings.estimatedDeliveryTime || '2-4 business days'}.`,
        timestamp: time,
        quickReplies: ['Custom Sizing', 'Browse Catalog'],
      };
    }

    if (q.includes('stitch') || q.includes('size') || q.includes('custom') || q.includes('fit') || q.includes('tailor')) {
      return {
        id: Date.now().toString(),
        sender: 'bot',
        text: 'Our garments come in high-grade unstitched fabrics as well as standard sizes (S, M, L, XL). All suits include extra margins for custom tailormade fitting.',
        timestamp: time,
        actionLink: { label: 'View Size Guide', url: '/shop' },
        quickReplies: ['Exchange Policy', 'Contact Concierge'],
      };
    }

    if (q.includes('exchange') || q.includes('return') || q.includes('refund') || q.includes('policy')) {
      return {
        id: Date.now().toString(),
        sender: 'bot',
        text: 'We offer a hassle-free 7-Day Garment Exchange Policy across Pakistan. Unstitched & stitched items can be exchanged within 7 days of delivery.',
        timestamp: time,
        actionLink: { label: 'Read Return Policy', url: '/policies/returns' },
        quickReplies: ['Track My Order', 'Shipping Info'],
      };
    }

    if (q.includes('catalog') || q.includes('lawn') || q.includes('silk') || q.includes('velvet') || q.includes('product') || q.includes('shop') || q.includes('browse')) {
      return {
        id: Date.now().toString(),
        sender: 'bot',
        text: 'Explore our latest collection of simple, modest and stylish clothing for women.',
        timestamp: time,
        actionLink: { label: 'Visit Shop', url: '/shop' },
        quickReplies: ['Track My Order', 'WhatsApp Concierge'],
      };
    }

    if (q.includes('whatsapp') || q.includes('phone') || q.includes('contact') || q.includes('support') || q.includes('help')) {
      return {
        id: Date.now().toString(),
        sender: 'bot',
        text: `You can reach our Customer Concierge team via WhatsApp at ${settings.whatsappNumber || '03180633323'} or email us at ${settings.supportEmail || 'wearomniaa@gmail.com'}. Support hours: Monday – Saturday: 10:00 AM – 8:00 PM.`,
        timestamp: time,
        actionLink: { label: 'Contact Page', url: '/contact' },
        quickReplies: ['Browse Catalog', 'Shipping Info'],
      };
    }

    if (q.includes('payment') || q.includes('card') || q.includes('online') || q.includes('bank')) {
      return {
        id: Date.now().toString(),
        sender: 'bot',
        text: 'We currently offer Cash On Delivery (COD) for all orders across Pakistan. This allows you to inspect your package before payment. No advance payment required!',
        timestamp: time,
        quickReplies: ['Shipping Info', 'Exchange Policy'],
      };
    }

    // Default fallback
    return {
      id: Date.now().toString(),
      sender: 'bot',
      text: 'I can help you with order tracking, shipping info, exchange policy, and more. Would you like to:',
      timestamp: time,
      quickReplies: ['Track My Order', 'Shipping Info', 'Exchange Policy', 'Browse Catalog'],
    };
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userText = inputMessage.trim();
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Add user message
    setMessages((prev) => [...prev, {
      id: Date.now().toString(),
      sender: 'user',
      text: userText,
      timestamp: time,
    }]);

    setInputMessage('');

    // Check if we're in tracking flow
    const handledByTracking = await handleTrackingFlow(userText);
    if (handledByTracking) return;

    // Otherwise, generate bot reply
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      const botReply = generateBotReply(userText);
      setMessages((prev) => [...prev, botReply]);
    }, 800);
  };

  const handleQuickReply = (reply: string) => {
    setInputMessage(reply);
    setTimeout(() => handleSendMessage(), 100);
  };

  const handleActionLink = (url: string) => {
    window.location.href = url;
  };

  const whatsappUrl = `https://wa.me/${whatsappPhone}?text=${encodeURIComponent(defaultWhatsAppMsg)}`;

  return (
    <>
      {/* Floating Action Buttons Stack (Concierge + WhatsApp) */}
      <div
        className={`fixed right-4 sm:right-6 z-40 flex flex-col items-end gap-3 pointer-events-none select-none print:hidden transition-[bottom] duration-200 ease-out ${
          isProductPage
            ? 'bottom-[calc(5.25rem+env(safe-area-inset-bottom,0px))] sm:bottom-6'
            : 'bottom-[calc(1rem+env(safe-area-inset-bottom,0px))] sm:bottom-6'
        }`}
        style={{ paddingRight: 'env(safe-area-inset-right, 0px)' }}
      >
        {/* 1. Concierge Button */}
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          title="WearOMNIA Client Concierge"
          aria-label="Open WearOMNIA Concierge"
          className="pointer-events-auto group relative flex items-center justify-center gap-2.5 w-[140px] sm:w-[150px] min-h-[44px] h-11 px-3.5 rounded-full bg-[#06191B] text-[#D4AF37] border border-[#D4AF37]/50 shadow-lg hover:border-[#D4AF37] hover:bg-[#0D2F33] hover:shadow-[#D4AF37]/25 transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 motion-reduce:transform-none cursor-pointer"
        >
          <Headphones className="w-4 h-4 sm:w-4.5 sm:h-4.5 shrink-0 text-[#D4AF37] transition-transform duration-200 group-hover:scale-110 motion-reduce:transform-none" />
          <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-[#FAF8F5] whitespace-nowrap">
            Concierge
          </span>
        </button>

        {/* 2. WhatsApp Button */}
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          title="Chat with WearOMNIA on WhatsApp"
          aria-label="Chat with WearOMNIA on WhatsApp"
          className="pointer-events-auto group relative flex items-center justify-center gap-2.5 w-[140px] sm:w-[150px] min-h-[44px] h-11 px-3.5 rounded-full bg-[#25D366] text-white shadow-lg hover:bg-[#20BA5A] hover:shadow-[#25D366]/30 transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 motion-reduce:transform-none cursor-pointer border border-white/20"
        >
          <svg
            className="w-4 h-4 sm:w-4.5 sm:h-4.5 fill-current text-white shrink-0 transition-transform duration-200 group-hover:scale-110 motion-reduce:transform-none"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372.025-.521-.075-.148-.075-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
          </svg>
          <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-white whitespace-nowrap">
            Chat With Us
          </span>
        </a>
      </div>

      {/* Concierge Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 16 }}
            transition={{ duration: 0.2 }}
            className={`fixed right-4 sm:right-6 z-40 w-[calc(100%-32px)] sm:w-[400px] h-[500px] sm:h-[580px] max-h-[75vh] bg-[#0A2528] border border-[#D4AF37]/30 rounded-2xl shadow-2xl flex flex-col overflow-hidden ${
              isProductPage
                ? 'bottom-[calc(11.5rem+env(safe-area-inset-bottom,0px))] sm:bottom-32'
                : 'bottom-[calc(7.25rem+env(safe-area-inset-bottom,0px))] sm:bottom-32'
            }`}
            style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
          >
            {/* Concierge Header */}
            <div className="bg-gradient-to-r from-[#D4AF37] to-[#C5A028] p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-black/20 flex items-center justify-center">
                  <Headphones className="w-5 h-5 text-black" />
                </div>
                <div>
                  <h3 className="font-serif text-sm font-bold text-black">WearOMNIA Concierge</h3>
                  <p className="text-[10px] text-black/70">Client Care Desk</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 rounded-full bg-black/20 hover:bg-black/30 flex items-center justify-center transition-colors"
                aria-label="Close Support Assistant"
              >
                <X className="w-4 h-4 text-black" />
              </button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#0A0A0A]">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl p-3 ${msg.sender === 'user'
                      ? 'bg-[#D4AF37] text-black'
                      : 'bg-[#262626] text-[#FAF8F5]'
                      }`}
                  >
                    {msg.sender === 'bot' && (
                      <div className="flex items-center gap-2 mb-1">
                        <ShieldCheck className="w-3 h-3 text-[#D4AF37]" />
                        <span className="text-[10px] text-[#A3A3A3]">Concierge</span>
                      </div>
                    )}
                    <p className="text-sm whitespace-pre-line">{msg.text}</p>
                    <span className="text-[10px] opacity-60 mt-1 block">{msg.timestamp}</span>

                    {/* Quick Replies */}
                    {msg.quickReplies && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {msg.quickReplies.map((reply) => (
                          <button
                            key={reply}
                            onClick={() => handleQuickReply(reply)}
                            className="text-xs bg-black/20 hover:bg-black/30 px-3 py-1.5 rounded-full transition-colors"
                          >
                            {reply}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Action Link */}
                    {msg.actionLink && (
                      <button
                        onClick={() => handleActionLink(msg.actionLink?.url || '')}
                        className="flex items-center gap-2 mt-3 text-xs bg-[#D4AF37] text-black px-3 py-1.5 rounded-full hover:bg-[#C5A028] transition-colors font-semibold"
                      >
                        {msg.actionLink?.label || 'Learn More'}
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              ))}

              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-[#262626] rounded-2xl p-3">
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 text-[#D4AF37] animate-spin" />
                      <span className="text-sm text-[#A3A3A3]">Concierge is typing...</span>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-[#141414] border-t border-[#262626]">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Type your message..."
                  className="flex-1 bg-[#0A0A0A] border border-[#262626] rounded-lg px-4 py-2.5 text-sm text-[#FAF8F5] focus:outline-none focus:border-[#D4AF37]"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!inputMessage.trim()}
                  className="bg-[#D4AF37] hover:bg-[#C5A028] text-black p-2.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="Send message"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
              <div className="flex items-center gap-4 mt-3 text-[10px] text-[#A3A3A3]">
                <button
                  onClick={() => window.location.href = '/track-order'}
                  className="flex items-center gap-1 hover:text-[#D4AF37] transition-colors"
                >
                  <Package className="w-3 h-3" />
                  Track Order
                </button>
                <button
                  onClick={() => window.location.href = '/contact'}
                  className="flex items-center gap-1 hover:text-[#D4AF37] transition-colors"
                >
                  <PhoneCall className="w-3 h-3" />
                  Contact Us
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};