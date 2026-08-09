'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  Layers,
  Tag,
  Star,
  Users,
  Boxes,
  Settings,
  ShieldCheck,
  ExternalLink,
  Menu,
  X,
  Lock,
  FileText,
  Activity,
  Ruler,
  LogOut,
} from 'lucide-react';
import { Poppins } from 'next/font/google';
import { AdminNotificationProvider } from '@/context/AdminNotificationContext';
import { NotificationCenter } from '@/components/admin/NotificationCenter';

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  display: 'swap',
});

function AdminLayoutInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Bypass admin sidebar for print pages
  if (pathname.includes('/invoice') || pathname.includes('/packing-slip') || pathname.includes('/label')) {
    return <>{children}</>;
  }

  const navItems = [
    { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Orders Console', href: '/admin/orders', icon: ShoppingBag },
    { name: 'Products Catalog', href: '/admin/products', icon: Package },
    { name: 'Size Guides', href: '/admin/size-guides', icon: Ruler },
    { name: 'Categories', href: '/admin/categories', icon: Layers },
    { name: 'Coupons & Promos', href: '/admin/coupons', icon: Tag },
    { name: 'Review Queue', href: '/admin/reviews', icon: Star },
    { name: 'Customer Base', href: '/admin/customers', icon: Users },
    { name: 'Stock & Inventory', href: '/admin/inventory', icon: Boxes },
    { name: 'Stock Movement Logs', href: '/admin/inventory/logs', icon: FileText },
    { name: 'Automation & WhatsApp', href: '/admin/automation-logs', icon: Activity },
    { name: 'Security Audit', href: '/admin/audit-logs', icon: ShieldCheck },
    { name: 'Site Settings & COD', href: '/admin/settings', icon: Settings },
  ];

  return (
    <div className="admin-panel min-h-screen bg-[#06191B] text-[#FAF8F5] flex flex-col lg:flex-row selection:bg-champagne selection:text-teal-950">
      {/* Clean Modern UI Admin Sidebar */}
      <aside className="hidden lg:flex lg:flex-col w-64 bg-[#0A2528]/80 backdrop-blur-xl text-offwhite border-r border-champagne/20 shrink-0 min-h-screen font-sans">
        <div className="p-6 border-b border-champagne/15">
          <Link href="/admin/dashboard" className="block">
            <span className="font-sans text-2xl font-extrabold tracking-tight text-offwhite uppercase">
              Wear<span className="text-champagne">OMNIA</span>
            </span>
            <span className="block text-[10px] uppercase tracking-[0.25em] text-champagne/80 mt-1 font-sans flex items-center gap-1 font-bold">
              <Lock className="w-3 h-3 text-champagne" /> Admin Portal
            </span>
          </Link>
        </div>

        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto font-sans">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                  isActive
                    ? 'bg-champagne text-teal-950 shadow-lg shadow-champagne/10'
                    : 'text-offwhite/70 hover:bg-[#103A3E]/60 hover:text-champagne'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-teal-950' : 'text-champagne'}`} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-champagne/15 font-sans space-y-2">
          <button
            onClick={async () => {
              await fetch('/api/admin/logout', { method: 'POST' });
              window.location.href = '/admin/login';
            }}
            className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl bg-red-900/30 text-red-400 text-xs font-bold uppercase tracking-wider hover:bg-red-900/50 transition-all border border-red-900/50"
          >
            <span className="flex items-center gap-2"><LogOut className="w-3.5 h-3.5" /> Logout</span>
          </button>
          <Link
            href="/"
            target="_blank"
            className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-[#0D3337] text-champagne text-xs font-bold uppercase tracking-wider hover:bg-champagne hover:text-teal-950 transition-all border border-champagne/30"
          >
            <span>Live Storefront</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>
      </aside>

      {/* Main Content Workspace */}
      <div className="flex-1 flex flex-col min-w-0 font-sans">
        {/* Header Top Bar */}
        <header className="h-16 bg-[#0A2528]/90 backdrop-blur-xl border-b border-champagne/15 px-4 sm:px-8 flex items-center justify-between sticky top-0 z-30 shadow-md">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
              className="lg:hidden p-2 text-champagne hover:bg-teal-900 rounded-xl"
            >
              <Menu className="w-6 h-6" />
            </button>
            <h2 className="font-sans text-base font-bold text-champagne hidden sm:block tracking-wide uppercase">
              Admin Management Console
            </h2>
          </div>

          <div className="flex items-center gap-4 font-sans">
            <NotificationCenter />
          </div>
        </header>

        {/* Mobile Sidebar */}
        {mobileSidebarOpen && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md lg:hidden flex font-sans">
            <div className="w-72 bg-[#0A2528] text-offwhite h-full p-6 flex flex-col justify-between shadow-2xl border-r border-champagne/30 overflow-y-auto max-h-screen">
              <div>
                <div className="flex items-center justify-between border-b border-champagne/20 pb-4 mb-6">
                  <span className="font-sans text-lg font-bold text-champagne">WearOMNIA Admin</span>
                  <button onClick={() => setMobileSidebarOpen(false)} className="p-1 text-champagne">
                    <X className="w-6 h-6" />
                  </button>
                </div>
                <div className="space-y-1.5 font-sans">
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        onClick={() => setMobileSidebarOpen(false)}
                        className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                          isActive
                            ? 'bg-champagne text-teal-950 shadow-md'
                            : 'text-offwhite/80 hover:bg-champagne hover:text-teal-950'
                        }`}
                      >
                        <Icon className={`w-4 h-4 ${isActive ? 'text-teal-950' : 'text-champagne'}`} />
                        <span>{item.name}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>

              <div className="pt-6 border-t border-champagne/20 mt-6 font-sans">
                <Link
                  href="/"
                  target="_blank"
                  className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-[#0D3337] text-champagne text-xs font-bold uppercase tracking-wider hover:bg-champagne hover:text-teal-950 transition-all border border-champagne/30"
                >
                  <span>Live Storefront</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
            <div className="flex-1" onClick={() => setMobileSidebarOpen(false)} />
          </div>
        )}

        {/* Page Workspace */}
        <main className="flex-1 p-4 sm:p-8 overflow-y-auto font-sans">{children}</main>
      </div>
    </div>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminNotificationProvider>
      <AdminLayoutInner>{children}</AdminLayoutInner>
    </AdminNotificationProvider>
  );
}
