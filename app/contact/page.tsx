'use client';

import React, { useState, useEffect } from 'react';
import { Mail, Phone, Clock, MessageSquare, Send, CheckCircle2, MapPin } from 'lucide-react';

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({ name: '', phone: '', email: '', message: '' });
  const [settings, setSettings] = useState({
    whatsappNumber: '03180633323',
    storeEmail: 'Wearomniaa@gmail.com',
    supportHours: 'Monday – Saturday: 10:00 AM – 8:00 PM',
    instagramUrl: 'https://www.instagram.com/wearomnia_/',
    facebookUrl: 'https://www.facebook.com/profile.php?id=61579169068040',
    tiktokUrl: 'https://www.tiktok.com/@wearomnia_'
  });

  useEffect(() => {
    fetch('/api/site-settings')
      .then(res => res.json())
      .then(data => {
        if (data.settings) {
          setSettings({
            whatsappNumber: data.settings.whatsappNumber || '03180633323',
            storeEmail: data.settings.storeEmail || 'Wearomniaa@gmail.com',
            supportHours: data.settings.supportHours || 'Monday – Saturday: 10:00 AM – 8:00 PM',
            instagramUrl: data.settings.instagramUrl || 'https://www.instagram.com/wearomnia_/',
            facebookUrl: data.settings.facebookUrl || 'https://www.facebook.com/profile.php?id=61579169068040',
            tiktokUrl: data.settings.tiktokUrl || 'https://www.tiktok.com/@wearomnia_'
          });
        }
      })
      .catch(() => {});
  }, []);

  const whatsappInternational = settings.whatsappNumber.replace(/^0/, '92').replace(/\s/g, '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="bg-offwhite min-h-screen py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Title */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-xs uppercase tracking-[0.3em] font-semibold text-champagne-700">
            Customer Support
          </span>
          <h1 className="font-serif text-3xl sm:text-5xl font-bold text-teal mt-2">
            Contact WearOMNIA
          </h1>
          <p className="text-xs sm:text-sm text-charcoal-muted mt-3 leading-relaxed font-sans">
            Our customer support team is available to assist you with suit sizing, order customization, dispatch details, and nationwide COD inquiries.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Left Info Cards */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-sand/60 p-8 rounded-3xl border border-sand space-y-6 shadow-sm">
              <h3 className="font-serif text-xl font-bold text-teal border-b border-sand pb-3">
                Contact Information
              </h3>

              <div className="space-y-4 text-xs text-charcoal">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-teal text-champagne flex items-center justify-center shrink-0 mt-0.5">
                    <Phone className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-teal">Phone & WhatsApp Support</h4>
                    <p className="text-charcoal-muted">{settings.whatsappNumber} ({settings.supportHours})</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-teal text-champagne flex items-center justify-center shrink-0 mt-0.5">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-teal">Email Inquiries</h4>
                    <p className="text-charcoal-muted">{settings.storeEmail}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-teal text-champagne flex items-center justify-center shrink-0 mt-0.5">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-teal">Business Hours</h4>
                    <p className="text-charcoal-muted">{settings.supportHours}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-teal text-champagne flex items-center justify-center shrink-0 mt-0.5">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-teal">Location</h4>
                    <p className="text-charcoal-muted">Lahore, Pakistan</p>
                  </div>
                </div>
              </div>

              {/* Direct WhatsApp CTA */}
              <a
                href={`https://wa.me/${whatsappInternational}?text=Hi%20WearOMNIA,%20I%20need%20help%20with%20my%20order.`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full bg-green-700 text-white py-3.5 rounded-xl text-xs uppercase font-bold tracking-wider hover:bg-green-800 transition-all flex items-center justify-center gap-2 shadow"
              >
                <MessageSquare className="w-4 h-4" /> Chat Instantly On WhatsApp
              </a>
            </div>

            {/* Social Media Links */}
            <div className="bg-sand/60 p-8 rounded-3xl border border-sand space-y-4 shadow-sm">
              <h3 className="font-serif text-xl font-bold text-teal">Follow Us</h3>
              <div className="flex flex-col gap-3">
                <a href={settings.instagramUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-teal hover:text-champagne-700 transition-colors">
                  <span className="w-8 h-8 rounded-full bg-teal text-champagne flex items-center justify-center text-xs font-bold">IG</span>
                  <span className="text-xs font-semibold">Instagram</span>
                </a>
                <a href={settings.facebookUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-teal hover:text-champagne-700 transition-colors">
                  <span className="w-8 h-8 rounded-full bg-teal text-champagne flex items-center justify-center text-xs font-bold">FB</span>
                  <span className="text-xs font-semibold">Facebook</span>
                </a>
                <a href={settings.tiktokUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-teal hover:text-champagne-700 transition-colors">
                  <span className="w-8 h-8 rounded-full bg-teal text-champagne flex items-center justify-center text-xs font-bold">TT</span>
                  <span className="text-xs font-semibold">TikTok</span>
                </a>
              </div>
            </div>
          </div>

          {/* Right Form */}
          <div className="lg:col-span-7 bg-offwhite p-8 sm:p-10 rounded-3xl border border-sand shadow-lg space-y-6">
            <h3 className="font-serif text-2xl font-bold text-teal">Send Us A Message</h3>
            <p className="text-xs text-charcoal-muted font-sans">
              Fill out the form below and an WearOMNIA styling specialist will respond within 24 hours.
            </p>

            {submitted ? (
              <div className="bg-teal text-champagne p-8 rounded-2xl border border-champagne/40 text-center space-y-3">
                <CheckCircle2 className="w-12 h-12 text-champagne mx-auto" />
                <h4 className="font-serif text-2xl text-offwhite font-bold">Message Received</h4>
                <p className="text-xs text-offwhite/80 max-w-sm mx-auto">
                  Thank you for reaching out to WearOMNIA. Our customer support team will contact you shortly via phone or WhatsApp.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs uppercase font-semibold text-charcoal block mb-1">Your Full Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Zainab Chaudhry"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-3 bg-sand rounded-xl text-xs text-charcoal border border-sand focus:outline-none focus:ring-1 focus:ring-teal"
                    />
                  </div>
                  <div>
                    <label className="text-xs uppercase font-semibold text-charcoal block mb-1">Phone / WhatsApp *</label>
                    <input
                      type="tel"
                      required
                      placeholder="0300-1234567"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-4 py-3 bg-sand rounded-xl text-xs text-charcoal border border-sand focus:outline-none focus:ring-2 focus:ring-teal"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs uppercase font-semibold text-charcoal block mb-1">Email Address</label>
                  <input
                    type="email"
                    placeholder="zainab@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-3 bg-sand rounded-xl text-xs text-charcoal border border-sand focus:outline-none focus:ring-2 focus:ring-teal"
                  />
                </div>

                <div>
                  <label className="text-xs uppercase font-semibold text-charcoal block mb-1">Your Message *</label>
                  <textarea
                    required
                    rows={5}
                    placeholder="Inquire about suit availability, custom size stitching, or delivery timeline..."
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="w-full px-4 py-3 bg-sand rounded-xl text-xs text-charcoal border border-sand focus:outline-none focus:ring-2 focus:ring-teal"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-teal text-champagne py-4 rounded-xl text-xs uppercase font-bold tracking-widest hover:bg-teal-900 transition-all shadow-md flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" /> Send Message
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
