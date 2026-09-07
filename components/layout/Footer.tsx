'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Mail, Phone, Instagram, Facebook, ShieldCheck, Truck, RotateCcw, Clock, Package, MessageCircle } from 'lucide-react';
import { ScrollReveal } from '@/components/layout/ScrollReveal';

interface SiteSettings {
  whatsappNumber: string;
  storeEmail: string;
  storeAddress: string;
  instagramUrl: string;
  facebookUrl: string;
  tiktokUrl: string;
  supportHours: string;
  copyrightText: string;
}

export const Footer = () => {
  const pathname = usePathname();
  const [settings, setSettings] = useState<SiteSettings>({
    whatsappNumber: '03180633323',
    storeEmail: 'wearomniaa@gmail.com',
    storeAddress: 'Lahore, Pakistan',
    instagramUrl: 'https://www.instagram.com/wearomnia_/',
    facebookUrl: 'https://www.facebook.com/profile.php?id=61579169068040',
    tiktokUrl: 'https://www.tiktok.com/@wearomnia_',
    supportHours: 'Monday – Saturday: 10:00 AM – 8:00 PM',
    copyrightText: '© 2026 WearOMNIA. All rights reserved.'
  });

  useEffect(() => {
    fetch('/api/site-settings')
      .then(res => res.json())
      .then(data => {
        if (data.settings) {
          setSettings(data.settings);
        }
      })
      .catch(() => { });
  }, []);

  if (pathname?.startsWith('/admin')) return null;

  const whatsappInternational = settings.whatsappNumber.replace(/^0/, '92').replace(/\s/g, '');

  return (
    <footer className="bg-teal text-offwhite border-t border-teal-800/80 pt-16 pb-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top Feature Highlights Bar - 3D Floating Cards */}
        <ScrollReveal className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 pb-14 border-b border-teal-700/50">
          <div className="bg-teal-900/60 backdrop-blur-md p-5 rounded-2xl border border-champagne/20 hover:border-champagne/50 hover:-translate-y-1 transition-all duration-300 shadow-md group">
            <div className="w-12 h-12 rounded-xl bg-teal-950/80 text-champagne flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <Truck className="w-6 h-6 text-champagne" />
            </div>
            <h4 className="font-serif text-base font-bold text-champagne">Fast Nationwide Delivery</h4>
            <p className="text-xs text-offwhite/70 mt-1 leading-relaxed">Direct Cash On Delivery to your doorstep across all cities in Pakistan.</p>
          </div>

          <div className="bg-teal-900/60 backdrop-blur-md p-5 rounded-2xl border border-champagne/20 hover:border-champagne/50 hover:-translate-y-1 transition-all duration-300 shadow-md group">
            <div className="w-12 h-12 rounded-xl bg-teal-950/80 text-champagne flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <ShieldCheck className="w-6 h-6 text-champagne" />
            </div>
            <h4 className="font-serif text-base font-bold text-champagne">100% Authentic Fabric</h4>
            <p className="text-xs text-offwhite/70 mt-1 leading-relaxed">Carefully selected breathable cotton, lawn, linen, and luxury micro velvet.</p>
          </div>

          <div className="bg-teal-900/60 backdrop-blur-md p-5 rounded-2xl border border-champagne/20 hover:border-champagne/50 hover:-translate-y-1 transition-all duration-300 shadow-md group">
            <div className="w-12 h-12 rounded-xl bg-teal-950/80 text-champagne flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <RotateCcw className="w-6 h-6 text-champagne" />
            </div>
            <h4 className="font-serif text-base font-bold text-champagne">7-Day Easy Exchange</h4>
            <p className="text-xs text-offwhite/70 mt-1 leading-relaxed">Simple size and style replacements with zero complicated forms.</p>
          </div>

          <div className="bg-teal-900/60 backdrop-blur-md p-5 rounded-2xl border border-champagne/20 hover:border-champagne/50 hover:-translate-y-1 transition-all duration-300 shadow-md group">
            <div className="w-12 h-12 rounded-xl bg-teal-950/80 text-champagne flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <Clock className="w-6 h-6 text-champagne" />
            </div>
            <h4 className="font-serif text-base font-bold text-champagne">Friendly Customer Support</h4>
            <p className="text-xs text-offwhite/70 mt-1 leading-relaxed">Personal WhatsApp sizing assistance available Monday to Saturday.</p>
          </div>
        </ScrollReveal>

        {/* Middle Footer Navigation Links */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 py-14 border-b border-teal-700/50">
          {/* Brand Editorial Info */}
          <div className="md:col-span-4 space-y-4">
            <Link href="/" className="inline-block">
              <span className="font-serif text-3xl tracking-tight text-offwhite font-black uppercase">
                Wear<span className="text-champagne">OMNIA</span>
              </span>
              <span className="text-[10px] sm:text-[11px] uppercase font-bold tracking-[0.25em] text-champagne block mt-0.5">
                Modest Luxury &amp; Couture
              </span>
            </Link>
            <p className="text-xs leading-relaxed text-offwhite/80 max-w-sm font-sans">
              Modest clothes. Immodestly good outfit days. Designed for university mornings, coffee runs, and everything in between.
            </p>
            <div className="pt-2">
              <span className="text-[11px] uppercase tracking-widest font-bold text-champagne block mb-1">
                Follow Along
              </span>
              <p className="text-[11px] text-offwhite/70 mb-3">
                For outfit inspiration, new drops and occasional wardrobe emergencies.
              </p>
              <div className="flex items-center gap-3">
              <a
                href={settings.instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                title="Follow us on Instagram"
                className="w-10 h-10 rounded-xl bg-teal-950 border border-champagne/30 flex items-center justify-center text-champagne hover:bg-champagne hover:text-teal transition-all duration-300 shadow-sm"
              >
                <Instagram className="w-4 h-4" />
              </a>
              <a
                href={settings.facebookUrl}
                target="_blank"
                rel="noopener noreferrer"
                title="Follow us on Facebook"
                className="w-10 h-10 rounded-xl bg-teal-950 border border-champagne/30 flex items-center justify-center text-champagne hover:bg-champagne hover:text-teal transition-all duration-300 shadow-sm"
              >
                <Facebook className="w-4 h-4" />
              </a>
              <a
                href={settings.tiktokUrl}
                target="_blank"
                rel="noopener noreferrer"
                title="Follow us on TikTok"
                className="w-10 h-10 rounded-xl bg-teal-950 border border-champagne/30 flex items-center justify-center text-champagne hover:bg-champagne hover:text-teal transition-all duration-300 shadow-sm"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 3 15.65 6.34 6.34 0 0 0 9.35 22a6.3 6.3 0 0 0 6.32-6.32V9.37a8.16 8.16 0 0 0 4.92 1.62V7.55a4.85 4.85 0 0 1-1-.86z" />
                </svg>
              </a>
            </div>
          </div>
        </div>

        {/* Customer Care Links */}
          <div className="md:col-span-4 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-widest text-champagne">Quick Navigation</h4>
            <ul className="space-y-2 text-xs text-offwhite/80">
              <li><Link href="/shop" className="hover:text-champagne transition-colors duration-300">Shop All Collection</Link></li>
              <li><Link href="/our-story" className="hover:text-champagne transition-colors duration-300 font-medium text-champagne">Our Story &amp; Heritage</Link></li>
              <li><Link href="/track-order" className="hover:text-champagne transition-colors duration-300 flex items-center gap-1.5"><Package className="w-3.5 h-3.5 text-champagne/80" /> Track My Order</Link></li>
              <li><Link href="/size-guide" className="hover:text-champagne transition-colors duration-300">Size &amp; Fit Guide</Link></li>
              <li><Link href="/contact" className="hover:text-champagne transition-colors duration-300">Contact Us</Link></li>
              <li><Link href="/faq" className="hover:text-champagne transition-colors duration-300">Frequently Asked Questions</Link></li>
              <li><Link href="/policies/shipping" className="hover:text-champagne transition-colors duration-300">Shipping &amp; Delivery Terms</Link></li>
              <li><Link href="/policies/returns" className="hover:text-champagne transition-colors duration-300">Exchange &amp; Return Policy</Link></li>
              <li><Link href="/policies/privacy" className="hover:text-champagne transition-colors duration-300">Privacy Policy</Link></li>
              <li><Link href="/policies/terms" className="hover:text-champagne transition-colors duration-300">Terms of Service</Link></li>
            </ul>
          </div>

          {/* Customer Support */}
          <div className="md:col-span-4 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-widest text-champagne">Get In Touch</h4>
            <div className="space-y-3 text-xs text-offwhite/80">
              <a
                href={`https://wa.me/${whatsappInternational}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 hover:text-champagne transition-colors duration-300 bg-teal-950/60 p-2.5 rounded-xl border border-champagne/20"
              >
                <MessageCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{settings.whatsappNumber} (WhatsApp Live Chat)</span>
              </a>
              <a
                href={`mailto:${settings.storeEmail}`}
                className="flex items-center gap-2 hover:text-champagne transition-colors duration-300 bg-teal-950/60 p-2.5 rounded-xl border border-champagne/20"
              >
                <Mail className="w-4 h-4 text-champagne shrink-0" />
                <span>{settings.storeEmail}</span>
              </a>
              {settings.supportHours && (
                <p className="flex items-center gap-2 text-offwhite/70 px-1">
                  <Clock className="w-4 h-4 text-champagne shrink-0" />
                  <span>{settings.supportHours}</span>
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Copyright & COD Notice */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-offwhite/70">
          <p>{settings.copyrightText}</p>
          <div className="flex flex-wrap items-center gap-3">
            <span className="bg-teal-950 border border-champagne/30 text-champagne px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider">
              Cash On Delivery Nationwide
            </span>
            <span className="text-[11px] text-offwhite/60">Delivered with PostEx, TCS &amp; Leopard Courier</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
