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
  Truck,
  RotateCcw,
  CreditCard,
} from 'lucide-react';
import { AdminNotificationProvider } from '@/context/AdminNotificationContext';
import { NotificationCenter } from '@/components/admin/NotificationCenter';

interface NavGroup {
  title: string;
  items: Array<{
    name: string;
    href: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: string;
  }>;
}

const NAV_GROUPS: NavGroup[] = [
  {
    title: 'Core Operations',
    items: [
      { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
      { name: 'Orders Console', href: '/admin/orders', icon: ShoppingBag },
      { name: 'Shipping & PostEx', href: '/admin/shipping', icon: Truck },
    ],
  },
  {
    title: 'Catalog & Stock',
    items: [
      { name: 'Products Catalog', href: '/admin/products', icon: Package },
      { name: 'Size Guides', href: '/admin/size-guides', icon: Ruler },
      { name: 'Categories', href: '/admin/categories', icon: Layers },
      { name: 'Stock & Inventory', href: '/admin/inventory', icon: Boxes },
      { name: 'Movement Logs', href: '/admin/inventory/logs', icon: FileText },
    ],
  },
  {
    title: 'Clientele & Marketing',
    items: [
      { name: 'Customer Base', href: '/admin/customers', icon: Users },
      { name: 'Coupons & Promos', href: '/admin/coupons', icon: Tag },
      { name: 'Review Queue', href: '/admin/reviews', icon: Star },
    ],
  },
  {
    title: 'System & Automation',
    items: [
      { name: 'WhatsApp Automation', href: '/admin/automation-logs', icon: Activity },
      { name: 'Security Audit', href: '/admin/audit-logs', icon: ShieldCheck },
      { name: 'Site Settings & COD', href: '/admin/settings', icon: Settings },
    ],
  },
];

function AdminLayoutInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Bypass admin sidebar for print and thermal label views
  if (pathname.includes('/invoice') || pathname.includes('/packing-slip') || pathname.includes('/label')) {
    return <>{children}</>;
  }

  return (
    <div className="admin-panel min-h-screen bg-[#06191B] text-[#FAF8F5] flex flex-col lg:flex-row selection:bg-[#D4AF37] selection:text-black">
      {/* Luxury Dark Sidebar */}
      <aside className="hidden lg:flex lg:flex-col w-64 bg-[#0A2528]/95 backdrop-blur-2xl text-[#FAF8F5] border-r border-[#D4AF37]/20 shrink-0 min-h-screen font-sans">
        <div className="p-6 border-b border-[#D4AF37]/15">
          <Link href="/admin/dashboard" className="block">
            <span className="font-serif text-2xl font-extrabold tracking-tight text-[#FAF8F5] uppercase">
              Wear<span className="text-[#D4AF37]">OMNIA</span>
            </span>
            <span className="block text-[10px] uppercase tracking-[0.25em] text-[#D4AF37]/90 mt-1 font-sans flex items-center gap-1.5 font-bold">
              <Lock className="w-3 h-3 text-[#D4AF37]" /> Enterprise Admin
            </span>
          </Link>
        </div>

        <nav className="flex-1 p-4 space-y-6 overflow-y-auto font-sans scrollbar-thin scrollbar-thumb-teal-900">
          {NAV_GROUPS.map((group) => (
            <div key={group.title} className="space-y-1.5">
              <span className="text-[10px] uppercase font-extrabold tracking-[0.2em] text-[#D4AF37]/70 px-3 block">
                {group.title}
              </span>
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href || (item.href !== '/admin/dashboard' && pathname.startsWith(`${item.href}/`));
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                      isActive
                        ? 'bg-[#D4AF37] text-black shadow-lg shadow-[#D4AF37]/15 font-extrabold'
                        : 'text-[#FAF8F5]/75 hover:bg-[#103A3E]/70 hover:text-[#D4AF37]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-black' : 'text-[#D4AF37]'}`} />
                      <span className="truncate">{item.name}</span>
                    </div>
                    {item.badge && (
                      <span className="px-1.5 py-0.5 text-[9px] rounded-full bg-red-500 text-white font-bold font-mono">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="p-4 border-t border-[#D4AF37]/15 font-sans space-y-2 bg-[#06191B]/50">
          <button
            onClick={async () => {
              await fetch('/api/admin/logout', { method: 'POST' });
              window.location.href = '/admin/login';
            }}
            className="w-full flex items-center justify-between px-3.5 py-2 rounded-xl bg-red-950/40 text-red-300 text-xs font-bold uppercase tracking-wider hover:bg-red-900/60 transition-all border border-red-800/40"
          >
            <span className="flex items-center gap-2"><LogOut className="w-3.5 h-3.5" /> Logout</span>
          </button>
          <Link
            href="/"
            target="_blank"
            className="flex items-center justify-between px-3.5 py-2 rounded-xl bg-[#0D3337] text-[#D4AF37] text-xs font-bold uppercase tracking-wider hover:bg-[#D4AF37] hover:text-black transition-all border border-[#D4AF37]/30"
          >
            <span>Live Storefront</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 font-sans">
        {/* Header Top Bar */}
        <header className="h-16 bg-[#0A2528]/95 backdrop-blur-xl border-b border-[#D4AF37]/15 px-4 sm:px-8 flex items-center justify-between sticky top-0 z-30 shadow-md">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
              className="lg:hidden p-2 text-[#D4AF37] hover:bg-teal-900/60 rounded-xl transition-colors"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="hidden sm:flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <h2 className="font-sans text-xs font-bold text-[#D4AF37] tracking-widest uppercase">
                WearOMNIA Enterprise Management System
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-4 font-sans">
            <NotificationCenter />
          </div>
        </header>

        {/* Mobile Sidebar Drawer */}
        {mobileSidebarOpen && (
          <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md lg:hidden flex font-sans animate-in fade-in duration-200">
            <div className="w-80 bg-[#0A2528] text-[#FAF8F5] h-full p-6 flex flex-col justify-between shadow-2xl border-r border-[#D4AF37]/30 overflow-y-auto max-h-screen">
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-[#D4AF37]/20 pb-4">
                  <div>
                    <span className="font-serif text-xl font-bold text-[#FAF8F5]">Wear<span className="text-[#D4AF37]">OMNIA</span></span>
                    <span className="block text-[10px] text-[#D4AF37] font-bold uppercase tracking-widest">Admin Console</span>
                  </div>
                  <button onClick={() => setMobileSidebarOpen(false)} className="p-1.5 text-[#D4AF37] hover:bg-teal-900 rounded-lg">
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="space-y-6">
                  {NAV_GROUPS.map((group) => (
                    <div key={group.title} className="space-y-1.5">
                      <span className="text-[10px] uppercase font-bold tracking-widest text-[#D4AF37]/70 px-2 block">
                        {group.title}
                      </span>
                      {group.items.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname === item.href || (item.href !== '/admin/dashboard' && pathname.startsWith(`${item.href}/`));
                        return (
                          <Link
                            key={item.name}
                            href={item.href}
                            onClick={() => setMobileSidebarOpen(false)}
                            className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                              isActive
                                ? 'bg-[#D4AF37] text-black shadow-md font-extrabold'
                                : 'text-[#FAF8F5]/80 hover:bg-[#D4AF37]/20 hover:text-[#D4AF37]'
                            }`}
                          >
                            <Icon className={`w-4 h-4 ${isActive ? 'text-black' : 'text-[#D4AF37]'}`} />
                            <span>{item.name}</span>
                          </Link>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-6 border-t border-[#D4AF37]/20 mt-6 font-sans space-y-2">
                <button
                  onClick={async () => {
                    await fetch('/api/admin/logout', { method: 'POST' });
                    window.location.href = '/admin/login';
                  }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-red-950/40 text-red-300 text-xs font-bold uppercase tracking-wider border border-red-800/40"
                >
                  <LogOut className="w-4 h-4" /> Logout
                </button>
                <Link
                  href="/"
                  target="_blank"
                  className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#0D3337] text-[#D4AF37] text-xs font-bold uppercase tracking-wider border border-[#D4AF37]/30"
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
