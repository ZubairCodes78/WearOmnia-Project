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
  actionLink?: { label: string; url: string } | null;
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

export const SupportAssistant = () => {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Tracking flow state
  const [trackingState, setTrackingState] = useState<TrackingState>('idle');
  const [pendingOrderNumber, setPendingOrderNumber] = useState('');

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
        text: 'Explore our latest collection of simple, modest and stylish clothing for women.',
        timestamp: time,
        actionLink: { label: 'Visit Shop', url: '/shop' },
        quickReplies: ['🚚 Track My Order', '📞 WhatsApp Support'],
      };
    }

    if (q.includes('whatsapp') || q.includes('phone') || q.includes('contact') || q.includes('support') || q.includes('help')) {
      return {
        id: Date.now().toString(),
        sender: 'bot',
        text: 'You can reach our Customer Support team via WhatsApp at 03180633323 or email us at Wearomniaa@gmail.com. Support hours: Monday – Saturday: 10:00 AM – 8:00 PM.',
        timestamp: time,
        actionLink: { label: 'Contact Page', url: '/contact' },
        quickReplies: ['🛍️ Browse Catalog', '📦 Shipping Info'],
      };
    }

    if (q.includes('payment') || q.includes('card') || q.includes('online') || q.includes('bank')) {
      return {
        id: Date.now().toString(),
        sender: 'bot',
        text: 'We currently offer Cash On Delivery (COD) for all orders across Pakistan. This allows you to inspect your package before payment. No advance payment required!',
        timestamp: time,
        quickReplies: ['📦 Shipping Info', '🔄 Exchange Policy'],
      };
    }

    // Default fallback
    return {
      id: Date.now().toString(),
      sender: 'bot',
      text: 'I can help you with order tracking, shipping info, exchange policy, and more. Would you like to:',
      timestamp: time,
      quickReplies: ['🚚 Track My Order', '📦 Shipping Info', '🔄 Exchange Policy', '🛍️ Browse Catalog'],
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

  return (
    <>
      {/* Floating SupportAssistant Trigger Button */}
      <motion.button
        onClick={() => setIsOpen(true)}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95 }}
        transition={{ duration: 0.3 }}
        className="fixed bottom-16 right-4 sm:bottom-20 sm:right-6 z-40 flex items-center gap-2 bg-gradient-to-r from-[#D4AF37] to-[#C5A028] text-black p-2.5 sm:px-4 sm:py-3 rounded-full shadow-2xl hover:shadow-[#D4AF37]/40 font-sans pb-safe"
        title="Customer Support"
        aria-label="Open Customer Support Assistant"
      >
        <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
        <span className="text-xs uppercase font-bold tracking-wider">
          Help
        </span>
      </motion.button>

      {/* SupportAssistant Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-16 right-4 left-4 sm:left-auto sm:bottom-8 sm:right-8 z-50 w-[calc(100%-32px)] sm:w-[400px] h-[500px] sm:h-[600px] max-h-[70vh] sm:max-h-[80vh] bg-[#141414] border border-[#262626] rounded-2xl shadow-2xl flex flex-col overflow-hidden pb-safe"
          >
            {/* SupportAssistant Header */}
            <div className="bg-gradient-to-r from-[#D4AF37] to-[#C5A028] p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-black/20 flex items-center justify-center">
                  <Bot className="w-5 h-5 text-black" />
                </div>
                <div>
                  <h3 className="font-serif text-sm font-bold text-black">WearOMNIA Support</h3>
                  <p className="text-[10px] text-black/70">Customer Service</p>
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
                    className={`max-w-[80%] rounded-2xl p-3 ${
                      msg.sender === 'user'
                        ? 'bg-[#D4AF37] text-black'
                        : 'bg-[#262626] text-[#FAF8F5]'
                    }`}
                  >
                    {msg.sender === 'bot' && (
                      <div className="flex items-center gap-2 mb-1">
                        <Bot className="w-3 h-3 text-[#D4AF37]" />
                        <span className="text-[10px] text-[#A3A3A3]">Support</span>
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
                      <span className="text-sm text-[#A3A3A3]">Support is typing...</span>
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