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
  LogOut,
  Truck,
  RotateCcw,
  CreditCard,
  BarChart3,
  Bell,
  Cpu,
  Printer,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
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
    title: 'Overview',
    items: [
      { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
    ],
  },
  {
    title: 'Commerce',
    items: [
      { name: 'Orders', href: '/admin/orders', icon: ShoppingBag },
      { name: 'Products', href: '/admin/products', icon: Package },
      { name: 'Categories', href: '/admin/categories', icon: Layers },
      { name: 'Customers', href: '/admin/customers', icon: Users },
      { name: 'Reviews', href: '/admin/reviews', icon: Star },
      { name: 'Coupons', href: '/admin/coupons', icon: Tag },
    ],
  },
  {
    title: 'Inventory',
    items: [
      { name: 'Stock', href: '/admin/inventory', icon: Boxes },
      { name: 'Stock Movement', href: '/admin/inventory/logs', icon: FileText },
    ],
  },
  {
    title: 'Shipping',
    items: [
      { name: 'Shipments', href: '/admin/shipping', icon: Truck },
      { name: 'PostEx', href: '/admin/shipping/postex', icon: Cpu },
      { name: 'Returns / RTO', href: '/admin/shipping/returns', icon: RotateCcw },
      { name: 'COD Settlement', href: '/admin/shipping/cod', icon: CreditCard },
      { name: 'Labels', href: '/admin/shipping/labels', icon: Printer },
    ],
  },
  {
    title: 'Communication',
    items: [
      { name: 'WhatsApp Automation', href: '/admin/automation-logs', icon: Activity },
    ],
  },
  {
    title: 'Reports',
    items: [
      { name: 'Analytics', href: '/admin/reports', icon: BarChart3 },
      { name: 'Courier Reports', href: '/admin/shipping/postex', icon: TrendingUp },
    ],
  },
  {
    title: 'System',
    items: [
      { name: 'Settings', href: '/admin/settings', icon: Settings },
      { name: 'Security Audit', href: '/admin/audit-logs', icon: ShieldCheck },
    ],
  },
];

function AdminLayoutInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Restore collapsed preference from localStorage
  React.useEffect(() => {
    try {
      const saved = localStorage.getItem('wearomnia_admin_sidebar_collapsed');
      if (saved !== null) {
        setIsCollapsed(saved === 'true');
      }
    } catch {
      // Fallback
    }
  }, []);

  const toggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('wearomnia_admin_sidebar_collapsed', String(next));
      } catch {
        // Fallback
      }
      return next;
    });
  };

  // Bypass admin sidebar for invoice, packing-slip and print views
  if (pathname === '/admin/login' || pathname.includes('/invoice') || pathname.includes('/packing-slip') || pathname.includes('/label')) {
    return <>{children}</>;
  }

  return (
    <AdminNotificationProvider>
      <div className="admin-panel min-h-screen bg-[#06191B] text-[#FAF8F5] flex flex-col lg:flex-row selection:bg-[#D4AF37] selection:text-black">
      {/* SaaS Collapsible Sidebar */}
      <aside
        className={`hidden lg:flex lg:flex-col ${
          isCollapsed ? 'w-20' : 'w-64'
        } bg-[#0A2528]/95 backdrop-blur-2xl text-[#FAF8F5] border-r border-[#D4AF37]/20 shrink-0 min-h-screen font-sans shadow-2xl transition-all duration-300 ease-in-out relative`}
      >
        {/* Header Branding + Collapse Toggle */}
        <div className={`p-4 border-b border-[#D4AF37]/20 bg-[#06191B]/40 flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
          {!isCollapsed ? (
            <Link href="/admin/dashboard" className="block group min-w-0">
              <span className="font-serif text-xl font-black tracking-tight text-[#FAF8F5] uppercase group-hover:text-[#D4AF37] transition-colors truncate block">
                Wear<span className="text-[#D4AF37]">OMNIA</span>
              </span>
              <span className="text-[9.5px] uppercase font-bold tracking-[0.2em] text-[#D4AF37] block mt-0.5">
                Commerce OS
              </span>
            </Link>
          ) : (
            <Link href="/admin/dashboard" className="block text-center group" title="WearOMNIA Commerce OS">
              <span className="font-serif text-lg font-black text-[#D4AF37] group-hover:scale-110 transition-transform block">
                WO
              </span>
            </Link>
          )}

          <button
            onClick={toggleCollapse}
            className="p-1.5 rounded-lg text-[#D4AF37]/80 hover:text-[#D4AF37] hover:bg-[#103A3E] transition-colors cursor-pointer"
            title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
            aria-label={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation Groups */}
        <nav className="flex-1 p-3 space-y-5 overflow-y-auto font-sans scrollbar-thin scrollbar-thumb-teal-900/50">
          {NAV_GROUPS.map((group) => (
            <div key={group.title} className="space-y-1">
              {!isCollapsed ? (
                <span className="text-[9.5px] uppercase font-black tracking-[0.22em] text-[#D4AF37]/70 px-3 block">
                  {group.title}
                </span>
              ) : (
                <div className="w-6 h-px bg-[#D4AF37]/20 mx-auto my-2" />
              )}
              {group.items.map((item) => {
                const Icon = item.icon;
                const isExactOnly = ['/admin/dashboard', '/admin/shipping', '/admin/inventory'].includes(item.href);
                const isActive = isExactOnly ? pathname === item.href : (pathname === item.href || pathname.startsWith(`${item.href}/`));
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    title={isCollapsed ? item.name : undefined}
                    className={`group relative flex items-center ${
                      isCollapsed ? 'justify-center px-2 py-2.5' : 'justify-between px-3 py-2.5'
                    } rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-200 ${
                      isActive
                        ? 'bg-gradient-to-r from-[#0D3337] to-[#124046] text-[#FAF8F5] border border-[#D4AF37]/40 shadow-lg shadow-black/40 font-black'
                        : 'text-[#FAF8F5]/75 hover:bg-[#103A3E]/60 hover:text-[#D4AF37]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className={`w-4 h-4 shrink-0 transition-colors ${isActive ? 'text-[#D4AF37]' : 'text-[#D4AF37]/80'}`} />
                      {!isCollapsed && <span className="truncate">{item.name}</span>}
                    </div>

                    {!isCollapsed && item.badge && (
                      <span className="px-1.5 py-0.5 text-[9px] rounded-full bg-red-500 text-white font-bold font-mono shadow">
                        {item.badge}
                      </span>
                    )}

                    {/* Collapsed Tooltip */}
                    {isCollapsed && (
                      <span className="pointer-events-none absolute left-full ml-3 z-50 hidden rounded-md bg-[#0A2528] px-2.5 py-1 text-[11px] font-bold text-[#D4AF37] border border-[#D4AF37]/30 shadow-xl group-hover:block whitespace-nowrap">
                        {item.name}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Footer Actions */}
        <div className={`p-3 border-t border-[#D4AF37]/20 font-sans space-y-2 bg-[#06191B]/60 ${isCollapsed ? 'text-center' : ''}`}>
          <button
            onClick={async () => {
              await fetch('/api/admin/logout', { method: 'POST' });
              window.location.href = '/admin/login';
            }}
            className={`w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-red-950/40 text-red-300 text-xs font-bold uppercase tracking-wider hover:bg-red-900/60 transition-all border border-red-800/40 cursor-pointer shadow-sm ${
              isCollapsed ? 'px-2' : 'px-3'
            }`}
            title="Logout Admin"
          >
            <LogOut className="w-3.5 h-3.5 shrink-0" />
            {!isCollapsed && <span>Logout</span>}
          </button>
          <Link
            href="/"
            target="_blank"
            className={`w-full flex items-center justify-between py-2 rounded-xl bg-[#0D3337] text-[#D4AF37] text-xs font-bold uppercase tracking-wider hover:bg-[#D4AF37] hover:text-black transition-all border border-[#D4AF37]/30 shadow-md ${
              isCollapsed ? 'px-2 justify-center' : 'px-3'
            }`}
            title="Preview Live Storefront"
          >
            {!isCollapsed && <span>Storefront</span>}
            <ExternalLink className="w-3.5 h-3.5 shrink-0" />
          </Link>
        </div>
      </aside>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden font-sans">
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

                <div className="space-y-5">
                  {NAV_GROUPS.map((group) => (
                    <div key={group.title} className="space-y-1">
                      <span className="text-[9.5px] uppercase font-extrabold tracking-[0.22em] text-[#D4AF37]/60 px-3 block">
                        {group.title}
                      </span>
                      {group.items.map((item) => {
                        const Icon = item.icon;
                                const isExactOnly = ['/admin/dashboard', '/admin/shipping', '/admin/inventory'].includes(item.href);
                        const isActive = isExactOnly ? pathname === item.href : (pathname === item.href || pathname.startsWith(`${item.href}/`));
                        return (
                          <Link
                            key={item.name}
                            href={item.href}
                            onClick={() => setMobileSidebarOpen(false)}
                            className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all ${
                              isActive
                                ? 'bg-[#DFC3A0]/15 text-[#FAF8F5] border border-[#DFC3A0]/30 shadow-lg shadow-black/15 font-extrabold'
                                : 'text-[#FAF8F5]/75 hover:bg-[#103A3E]/70 hover:text-[#DFC3A0]'
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#DFC3A0]' : 'text-[#D4AF37]'}`} />
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
                </div>
              </div>

              <div className="border-t border-[#D4AF37]/20 pt-4 space-y-2">
                <button
                  onClick={async () => {
                    await fetch('/api/admin/logout', { method: 'POST' });
                    window.location.href = '/admin/login';
                  }}
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-red-950/40 text-red-300 rounded-xl text-xs font-bold uppercase tracking-wider border border-red-800/40"
                >
                  <LogOut className="w-4 h-4" /> Logout
                </button>
                <Link
                  href="/"
                  target="_blank"
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-[#0D3337] text-[#D4AF37] rounded-xl text-xs font-bold uppercase tracking-wider border border-[#D4AF37]/30"
                >
                  <span>Live Storefront</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Content Children */}
        <main className="flex-1 p-5 sm:p-7 lg:p-9 xl:p-12 bg-[#06191B] min-w-0">{children}</main>
      </div>
      </div>
    </AdminNotificationProvider>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminLayoutInner>{children}</AdminLayoutInner>;
}
