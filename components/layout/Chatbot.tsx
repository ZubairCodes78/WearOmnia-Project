'use client';

import React, { useState, useRef, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X, Send, Sparkles, Bot, User, ChevronRight, PhoneCall, Package, Loader2 } from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'bot' | 'user';
  text: string;
  timestamp: string;
  quickReplies?: string[];
  actionLink?: { label: string; url: string };
}

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: '1',
    sender: 'bot',
    text: 'Greetings! Welcome to WearOMNIA Customer Support. How may I assist you with your luxury shopping today?',
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    quickReplies: [
      '🚚 Track My Order',
      '🧵 Custom Stitching & Sizes',
      '📦 Shipping & COD Info',
      '🔄 7-Day Exchange Policy',
    ],
  },
];

// Tracking conversation state machine
type TrackingState = 'idle' | 'awaiting_order_number' | 'awaiting_phone' | 'loading';

export const Chatbot = () => {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Tracking flow state
  const [trackingState, setTrackingState] = useState<TrackingState>('idle');
  const [pendingOrderNumber, setPendingOrderNumber] = useState('');

  // Hide Chatbot on admin routes
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

  const addBotMessage = (text: string, options?: { quickReplies?: string[]; actionLink?: { label: string; url: string } }) => {
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setMessages((prev) => [...prev, {
      id: Date.now().toString(),
      sender: 'bot',
      text,
      timestamp: time,
      quickReplies: options?.quickReplies,
      actionLink: options?.actionLink,
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
          { quickReplies: ['❌ Cancel Tracking'] }
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
          addBotMessage('No problem! How else can I help you?', {
            quickReplies: ['🚚 Track My Order', '🧵 Custom Stitching', '📦 Shipping Info'],
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
              quickReplies: ['🚚 Try Again', '📞 Talk to Agent'],
              actionLink: { label: 'Track on Website', url: '/track-order' },
            }
          );
        } else {
          const o = data.order;
          const statusEmojis: Record<string, string> = {
            PENDING: '⏳', CONFIRMED: '✅', PACKING: '📦', DISPATCHED: '🚚',
            OUT_FOR_DELIVERY: '🏍️', DELIVERED: '✅', CANCELLED: '❌', RETURNED: '↩️',
          };
          const statusLabel = o.status.replace(/_/g, ' ');
          const emoji = statusEmojis[o.status] || '📋';

          let trackingMsg = `${emoji} Order #${o.orderNumber}\n\nStatus: ${statusLabel}\nDelivery City: ${o.shippingCity}\nTotal (COD): Rs. ${o.totalAmount.toLocaleString()}`;

          if (o.courier) trackingMsg += `\nCourier: ${o.courier}`;
          if (o.trackingNumber) trackingMsg += `\nTracking: ${o.trackingNumber}`;

          trackingMsg += `\n\nItems: ${o.items.map((i: any) => `${i.title} (x${i.quantity})`).join(', ')}`;

          addBotMessage(trackingMsg, {
            quickReplies: ['🛍️ Shop Collection', '📞 WhatsApp Support'],
            actionLink: { label: 'Full Tracking Page', url: '/track-order' },
          });
        }
      } catch (e) {
        setIsTyping(false);
        addBotMessage('Something went wrong. Please try again or track your order on our website.', {
          actionLink: { label: 'Track on Website', url: '/track-order' },
          quickReplies: ['🚚 Try Again'],
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
        quickReplies: ['❌ Cancel Tracking'],
      };
    }

    if (q.includes('shipping') || q.includes('delivery') || q.includes('cod') || q.includes('free')) {
      return {
        id: Date.now().toString(),
        sender: 'bot',
        text: 'We provide Nationwide Cash On Delivery across 200+ cities in Pakistan. Shipping is FREE on orders above Rs. 10,000 (Standard Rs. 250 fee for smaller orders). Delivery takes 2-4 business days.',
        timestamp: time,
        quickReplies: ['🧵 Custom Stitching', '🛍️ Browse Catalog'],
      };
    }

    if (q.includes('stitch') || q.includes('size') || q.includes('custom') || q.includes('fit') || q.includes('tailor')) {
      return {
        id: Date.now().toString(),
        sender: 'bot',
        text: 'Our garments come in high-grade unstitched fabrics as well as standard sizes (S, M, L, XL). All suits include extra margins for custom tailormade fitting.',
        timestamp: time,
        actionLink: { label: 'View Size Guide', url: '/shop' },
        quickReplies: ['🔄 Exchange Policy', '📞 Talk to Designer'],
      };
    }

    if (q.includes('exchange') || q.includes('return') || q.includes('refund') || q.includes('policy')) {
      return {
        id: Date.now().toString(),
        sender: 'bot',
        text: 'We offer a hassle-free 7-Day Garment Exchange Policy across Pakistan. Unstitched & stitched items can be exchanged within 7 days of delivery.',
        timestamp: time,
        actionLink: { label: 'Read Return Policy', url: '/policies/returns' },
        quickReplies: ['🚚 Track My Order', '📦 Shipping Info'],
      };
    }

    if (q.includes('catalog') || q.includes('lawn') || q.includes('silk') || q.includes('velvet') || q.includes('product') || q.includes('shop') || q.includes('browse')) {
      return {
        id: Date.now().toString(),
        sender: 'bot',
        text: 'Explore our latest Haute Couture collection featuring Velvet Royale Couture, Unstitched Luxury Lawn, and Pure Silk Chiffon editions!',
        timestamp: time,
        actionLink: { label: 'Explore Shop Catalog', url: '/shop' },
        quickReplies: ['🚚 Shipping Info', '🧵 Custom Stitching'],
      };
    }

    return {
      id: Date.now().toString(),
      sender: 'bot',
      text: "Thank you for reaching out! For specific inquiries, product customizations, or bulk orders, our atelier team is live on WhatsApp.",
      timestamp: time,
      actionLink: { label: 'Chat with Live Agent on WhatsApp', url: 'https://wa.me/923001234567' },
      quickReplies: ['🚚 Track Order', '📦 Shipping Info', '🛍️ Shop Collection'],
    };
  };

  const handleSend = async (textToSend?: string) => {
    const text = textToSend || inputMessage;
    if (!text.trim()) return;

    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: text.trim(),
      timestamp: time,
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputMessage('');

    // Check if we're in a tracking flow
    const handled = await handleTrackingFlow(text);
    if (handled) return;

    // Normal response flow
    setIsTyping(true);
    setTimeout(() => {
      const botMsg = generateBotReply(text);
      setMessages((prev) => [...prev, botMsg]);
      setIsTyping(false);
    }, 700);
  };

  return (
    <>
      {/* Floating Chatbot Trigger Button */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-36 right-4 sm:bottom-20 sm:right-6 z-40 bg-teal text-champagne p-3.5 sm:px-4 sm:py-3 rounded-full shadow-2xl flex items-center gap-2.5 border border-champagne/40 font-sans"
        aria-label="Toggle Atelier AI Assistant"
      >
        <div className="relative">
          <Bot className="w-5 h-5 sm:w-6 sm:h-6 text-champagne" />
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full animate-pulse border border-teal" />
        </div>
        <span className="hidden sm:inline text-xs uppercase font-bold tracking-wider text-offwhite">
          OMNIA Concierge AI
        </span>
      </motion.button>

      {/* Chat Interface Drawer */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.25 }}
            className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 w-[calc(100vw-2rem)] sm:w-[380px] h-[520px] max-h-[82vh] z-50 bg-offwhite/95 backdrop-blur-2xl rounded-3xl shadow-2xl border border-champagne flex flex-col overflow-hidden font-sans text-charcoal"
          >
            {/* Chatbot Header */}
            <div className="bg-teal text-offwhite p-4 border-b border-champagne/20 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-teal-900 border border-champagne/40 flex items-center justify-center text-champagne">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-serif text-sm font-bold text-champagne">WearOMNIA AI Concierge</h3>
                  <span className="text-[10px] text-offwhite/70 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Always Active 24/7
                  </span>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 text-offwhite/80 hover:text-champagne transition-colors rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Chat Message Stream */}
            <div className="flex-1 p-4 overflow-y-auto space-y-4 text-xs">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <div className="flex items-start gap-2 max-w-[85%]">
                    {msg.sender === 'bot' && (
                      <div className="w-6 h-6 rounded-full bg-teal text-champagne flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                        <Bot className="w-3.5 h-3.5" />
                      </div>
                    )}
                    <div
                      className={`p-3 rounded-2xl leading-relaxed shadow-sm ${
                        msg.sender === 'user'
                          ? 'bg-teal text-champagne rounded-tr-none font-medium'
                          : 'bg-sand/70 text-charcoal border border-sand rounded-tl-none font-sans'
                      }`}
                    >
                      <p className="whitespace-pre-line">{msg.text}</p>

                      {/* Action Link Button */}
                      {msg.actionLink && (
                        <a
                          href={msg.actionLink.url}
                          target={msg.actionLink.url.startsWith('http') ? '_blank' : '_self'}
                          rel="noopener noreferrer"
                          className="mt-2.5 inline-flex items-center gap-1.5 bg-champagne text-teal-950 px-3 py-1.5 rounded-lg text-[10px] uppercase font-bold tracking-wider hover:bg-sand transition-colors shadow-sm"
                        >
                          {msg.actionLink.label} <ChevronRight className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>

                  <span className="text-[9px] text-charcoal-muted mt-1 px-1">{msg.timestamp}</span>

                  {/* Quick Replies Options */}
                  {msg.quickReplies && msg.sender === 'bot' && (
                    <div className="flex flex-wrap gap-1.5 mt-2 max-w-[90%]">
                      {msg.quickReplies.map((reply, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleSend(reply)}
                          className="bg-offwhite text-teal hover:bg-champagne hover:text-teal-950 border border-sand px-2.5 py-1 rounded-full text-[10px] font-semibold transition-all shadow-xs"
                        >
                          {reply}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              {/* Typing indicator */}
              {isTyping && (
                <div className="flex items-center gap-2 text-charcoal-muted">
                  <div className="w-6 h-6 rounded-full bg-teal text-champagne flex items-center justify-center">
                    <Bot className="w-3.5 h-3.5" />
                  </div>
                  <div className="bg-sand/60 px-3 py-2 rounded-2xl flex items-center gap-1 border border-sand">
                    <span className="w-1.5 h-1.5 bg-teal rounded-full animate-bounce" />
                    <span className="w-1.5 h-1.5 bg-teal rounded-full animate-bounce [animation-delay:0.2s]" />
                    <span className="w-1.5 h-1.5 bg-teal rounded-full animate-bounce [animation-delay:0.4s]" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Chat Input Field */}
            <div className="p-3 bg-sand/40 border-t border-sand shrink-0">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend();
                }}
                className="flex items-center gap-2"
              >
                <input
                  type="text"
                  placeholder={
                    trackingState === 'awaiting_order_number'
                      ? 'Enter order number...'
                      : trackingState === 'awaiting_phone'
                      ? 'Enter phone number...'
                      : 'Ask about orders, lawn suits, COD...'
                  }
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  className="flex-1 bg-offwhite border border-sand rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-teal placeholder-charcoal-muted"
                />
                <button
                  type="submit"
                  disabled={!inputMessage.trim() || trackingState === 'loading'}
                  className="bg-teal text-champagne p-2 rounded-xl hover:bg-teal-900 transition-colors disabled:opacity-40 shrink-0"
                >
                  {trackingState === 'loading' ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </button>
              </form>
              <div className="flex items-center justify-between text-[9px] text-charcoal-muted pt-1 px-1">
                <span>Powered by WearOMNIA Concierge AI</span>
                <a
                  href="https://wa.me/923001234567"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-teal font-semibold hover:underline flex items-center gap-0.5"
                >
                  <PhoneCall className="w-2.5 h-2.5" /> Live Agent
                </a>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
