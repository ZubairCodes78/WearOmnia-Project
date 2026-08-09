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
    storeEmail: 'Wearomniaa@gmail.com',
    storeAddress: '',
    instagramUrl: 'https://www.instagram.com/wearomnia_/',
    facebookUrl: 'https://www.facebook.com/profile.php?id=61579168069040',
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
      .catch(() => {});
  }, []);

  if (pathname?.startsWith('/admin')) return null;

  const whatsappInternational = settings.whatsappNumber.replace(/^0/, '92').replace(/\s/g, '');

  return (
    <footer className="bg-teal text-offwhite border-t border-teal-800 pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top Feature Highlights Bar */}
        <ScrollReveal className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-12 border-b border-teal-700/60 text-center md:text-left">
          <div className="flex flex-col items-center md:items-start gap-2">
            <Truck className="w-7 h-7 text-champagne" />
            <h4 className="font-serif text-lg font-medium text-champagne">Nationwide Delivery</h4>
            <p className="text-xs text-offwhite/70">Express Cash On Delivery across 200+ cities in Pakistan.</p>
          </div>
          <div className="flex flex-col items-center md:items-start gap-2">
            <ShieldCheck className="w-7 h-7 text-champagne" />
            <h4 className="font-serif text-lg font-medium text-champagne">100% Authentic Craft</h4>
            <p className="text-xs text-offwhite/70">Hand-finished embroideries, pure silks & premium micro velvet.</p>
          </div>
          <div className="flex flex-col items-center md:items-start gap-2">
            <RotateCcw className="w-7 h-7 text-champagne" />
            <h4 className="font-serif text-lg font-medium text-champagne">7-Day Easy Exchange</h4>
            <p className="text-xs text-offwhite/70">Hassle-free size & garment replacement policy.</p>
          </div>
          <div className="flex flex-col items-center md:items-start gap-2">
            <Clock className="w-7 h-7 text-champagne" />
            <h4 className="font-serif text-lg font-medium text-champagne">Customer Support</h4>
            <p className="text-xs text-offwhite/70">WhatsApp assistance available {settings.supportHours}.</p>
          </div>
        </ScrollReveal>

        {/* Middle Footer Navigation Links */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 py-14 border-b border-teal-700/60">
          {/* Brand Editorial Info */}
          <div className="md:col-span-4 space-y-4">
            <Link href="/" className="inline-block">
              <span className="font-serif text-3xl tracking-tight text-offwhite font-bold uppercase">
                Wear<span className="text-champagne">OMNIA</span>
              </span>
            </Link>
            <p className="text-xs leading-relaxed text-offwhite/80 max-w-sm font-sans">
              WearOMNIA represents modern Pakistani luxury fashion. Elegant embroidery, rich velvet silhouettes, and premium unstitched lawn collections.
            </p>
            <div className="flex items-center gap-3 pt-2">
              <a
                href={settings.instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                title="Follow us on Instagram"
                className="w-9 h-9 rounded-full bg-teal-900 border border-champagne/40 flex items-center justify-center text-champagne hover:bg-champagne hover:text-teal transition-all duration-300"
              >
                <Instagram className="w-4 h-4" />
              </a>
              <a
                href={settings.facebookUrl}
                target="_blank"
                rel="noopener noreferrer"
                title="Follow us on Facebook"
                className="w-9 h-9 rounded-full bg-teal-900 border border-champagne/40 flex items-center justify-center text-champagne hover:bg-champagne hover:text-teal transition-all duration-300"
              >
                <Facebook className="w-4 h-4" />
              </a>
              <a
                href={settings.tiktokUrl}
                target="_blank"
                rel="noopener noreferrer"
                title="Follow us on TikTok"
                className="w-9 h-9 rounded-full bg-teal-900 border border-champagne/40 flex items-center justify-center text-champagne hover:bg-champagne hover:text-teal transition-all duration-300"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 3 15.65 6.34 6.34 0 0 0 9.35 22a6.3 6.3 0 0 0 6.32-6.32V9.37a8.16 8.16 0 0 0 4.92 1.62V7.55a4.85 4.85 0 0 1-1-.86z" />
                </svg>
              </a>
            </div>
          </div>

          {/* Customer Care Links */}
          <div className="md:col-span-4 space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-widest text-champagne">Useful Pages</h4>
            <ul className="space-y-2 text-xs text-offwhite/80">
              <li><Link href="/shop" className="hover:text-champagne transition-colors duration-300">Shop</Link></li>
              <li><Link href="/track-order" className="hover:text-champagne transition-colors duration-300 flex items-center gap-1.5"><Package className="w-3.5 h-3.5 text-champagne/70" /> Track Order</Link></li>
              <li><Link href="/size-guide" className="hover:text-champagne transition-colors duration-300">Size Guide</Link></li>
              <li><Link href="/contact" className="hover:text-champagne transition-colors duration-300">Contact Us</Link></li>
              <li><Link href="/faq" className="hover:text-champagne transition-colors duration-300">FAQ</Link></li>
              <li><Link href="/policies/shipping" className="hover:text-champagne transition-colors duration-300">Shipping &amp; Delivery</Link></li>
              <li><Link href="/policies/returns" className="hover:text-champagne transition-colors duration-300">Returns &amp; Exchanges</Link></li>
              <li><Link href="/policies/refund" className="hover:text-champagne transition-colors duration-300">Refund Policy</Link></li>
              <li><Link href="/policies/privacy" className="hover:text-champagne transition-colors duration-300">Privacy Policy</Link></li>
              <li><Link href="/policies/terms" className="hover:text-champagne transition-colors duration-300">Terms of Service</Link></li>
            </ul>
          </div>

          {/* Customer Support */}
          <div className="md:col-span-4 space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-widest text-champagne">Customer Support</h4>
            <div className="space-y-2.5 text-xs text-offwhite/80">
              <a 
                href={`https://wa.me/${whatsappInternational}`} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2 hover:text-champagne transition-colors duration-300"
              >
                <MessageCircle className="w-4 h-4 text-champagne shrink-0" />
                <span>{settings.whatsappNumber} (WhatsApp)</span>
              </a>
              <p className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-champagne shrink-0" />
                <span>{settings.storeEmail}</span>
              </p>
              {settings.supportHours && (
                <p className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-champagne shrink-0" />
                  <span>{settings.supportHours}</span>
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Copyright & COD Notice */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-offwhite/60">
          <p>{settings.copyrightText}</p>
          <div className="flex items-center gap-3">
            <span className="bg-teal-900 border border-champagne/30 text-champagne px-3 py-1 rounded text-[11px] font-semibold uppercase">
              Cash On Delivery Only
            </span>
            <span className="text-[11px]">Deliveries Handled by TCS & Leopard Courier</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
