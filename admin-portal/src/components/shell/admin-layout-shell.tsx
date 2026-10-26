'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  ShoppingBag,
  Sparkles,
  Printer,
  Truck,
  Crown,
  LogOut,
  Mail,
  Menu,
  X,
  Clock,
  ChevronDown,
  SlidersHorizontal,
} from 'lucide-react';
import { useAdmin } from '@/context/admin-context';
import { StaffRole } from '@/types/admin';

interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
  badge?: string;
  allowedRoles?: StaffRole[];
}

export function AdminLayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { staffUser, isAuthenticated, isReady, logout, switchRole, orders } = useAdmin();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState<string>('');

  const pendingOrdersCount = orders.filter((o) => o.status === 'PLACED').length;

  const navItems: NavItem[] = [
    {
      name: 'Overview',
      href: '/',
      icon: LayoutDashboard,
    },
    {
      name: 'Catalog & SKUs',
      href: '/catalog',
      icon: Sparkles,
      allowedRoles: ['SUPER_ADMIN', 'CATALOG_MANAGER'],
    },
    {
      name: 'Orders Desk',
      href: '/orders',
      icon: ShoppingBag,
      badge: pendingOrdersCount > 0 ? `${pendingOrdersCount}` : undefined,
    },
    {
      name: 'Warehouse & 4x6 Label',
      href: '/warehouse',
      icon: Printer,
      allowedRoles: ['SUPER_ADMIN', 'FULFILLMENT_OPERATOR'],
    },
    {
      name: 'Smart Dispatch',
      href: '/dispatch',
      icon: Truck,
      allowedRoles: ['SUPER_ADMIN', 'FULFILLMENT_OPERATOR'],
    },
    {
      name: 'Client Tiers & Loyalty',
      href: '/loyalty',
      icon: Crown,
      allowedRoles: ['SUPER_ADMIN', 'CATALOG_MANAGER', 'FINANCE_OFFICER'],
    },
    {
      name: 'Campaigns & Newsletter',
      href: '/newsletter',
      icon: Mail,
      allowedRoles: ['SUPER_ADMIN', 'CATALOG_MANAGER'],
    },
    {
      name: 'Platform Settings',
      href: '/settings',
      icon: SlidersHorizontal,
      allowedRoles: ['SUPER_ADMIN', 'FINANCE_OFFICER'],
    },
  ];

  // Live Bangladesh Standard Time Clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('en-US', {
          timeZone: 'Asia/Dhaka',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        }) + ' BST'
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Authentication check
  useEffect(() => {
    if (isReady && !isAuthenticated && pathname !== '/login') {
      router.push('/login');
    }
  }, [isReady, isAuthenticated, pathname, router]);

  if (pathname === '/login') {
    return <>{children}</>;
  }

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const rolesList: StaffRole[] = [
    'SUPER_ADMIN',
    'FULFILLMENT_OPERATOR',
    'CATALOG_MANAGER',
    'SUPPORT_AGENT',
    'FINANCE_OFFICER',
  ];

  return (
    <div className="min-h-screen bg-[#F9F6F0] text-[#1C1917] flex flex-col lg:flex-row antialiased">
      {/* ========================================================================= */}
      {/* 1. DESKTOP / LAPTOP FIXED SIDEBAR (Noir Espresso #1C1917)                  */}
      {/* ========================================================================= */}
      <aside className="hidden lg:flex w-64 xl:w-72 bg-[#1C1917] text-[#F9F6F0] flex-col justify-between shrink-0 h-screen sticky top-0 border-r border-[#292524] z-30 select-none shadow-2xl">
        <div className="flex flex-col h-full overflow-y-auto">
          {/* Atelier Brand Emblem Header */}
          <div className="p-6 border-b border-[#292524] flex items-center justify-between">
            <Link href="/" className="flex items-center space-x-3 group">
              <div className="w-8 h-8 rounded border border-[#C7A97B]/40 bg-[#201D1A] flex items-center justify-center p-1 group-hover:border-[#C7A97B] transition-colors overflow-hidden">
                <Image
                  src="/images/seyven-monogram.png"
                  alt="SEYVEN Monogram"
                  width={32}
                  height={47}
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <span className="font-serif tracking-[0.25em] text-sm text-[#F9F6F0] block font-semibold">
                  SEYVEN
                </span>
                <span className="text-[9px] uppercase tracking-[0.16em] text-[#C7A97B] block font-mono">
                  The Sanctuary of Beauty
                </span>
              </div>
            </Link>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1.5 flex-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded text-xs font-mono tracking-wider transition-all duration-200 group ${
                    isActive
                      ? 'bg-[#201D1A] text-[#C7A97B] border-l-2 border-[#C7A97B] font-semibold'
                      : 'text-[#E6DFD5]/70 hover:text-[#F9F6F0] hover:bg-[#201D1A]/60'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Icon className={`w-4 h-4 transition-transform group-hover:scale-110 ${isActive ? 'text-[#C7A97B]' : 'text-[#E6DFD5]/50'}`} />
                    <span>{item.name}</span>
                  </div>
                  {item.badge && (
                    <span className="px-1.5 py-0.5 text-[9px] font-bold rounded bg-[#C7A97B] text-[#141211]">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Staff Profile & Role Switcher */}
          <div className="p-4 border-t border-[#292524] bg-[#141211]/60">
            <div className="relative">
              <button
                type="button"
                onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
                className="w-full flex items-center justify-between p-2 rounded hover:bg-[#201D1A] transition-colors text-left"
              >
                <div className="flex items-center space-x-2.5">
                  <div className="w-8 h-8 rounded-full bg-[#C7A97B] text-[#141211] font-bold text-xs flex items-center justify-center font-mono">
                    {staffUser?.avatar || 'SO'}
                  </div>
                  <div className="overflow-hidden">
                    <div className="text-xs text-[#F9F6F0] font-medium truncate">
                      {staffUser?.name || 'Farah Rahman'}
                    </div>
                    <div className="text-[10px] text-[#C7A97B] font-mono tracking-wider truncate">
                      {staffUser?.role?.replace('_', ' ')}
                    </div>
                  </div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-[#E6DFD5]/50 shrink-0" />
              </button>

              {roleDropdownOpen && (
                <div className="absolute bottom-full left-0 w-full mb-2 bg-[#201D1A] border border-[#292524] rounded-lg shadow-2xl p-1.5 z-50 text-xs font-mono">
                  <div className="px-2 py-1 text-[9px] uppercase tracking-wider text-[#E6DFD5]/50 border-b border-[#292524] mb-1">
                    Simulate Role (Admin Audit)
                  </div>
                  {rolesList.map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => {
                        switchRole(r);
                        setRoleDropdownOpen(false);
                      }}
                      className={`w-full text-left px-2 py-1.5 rounded transition-colors text-[11px] ${
                        staffUser?.role === r
                          ? 'bg-[#C7A97B] text-[#141211] font-bold'
                          : 'text-[#E6DFD5]/80 hover:bg-[#141211] hover:text-[#F9F6F0]'
                      }`}
                    >
                      {r.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={handleLogout}
              className="mt-3 w-full py-1.5 px-2 text-[10px] uppercase font-mono tracking-wider text-[#E6DFD5]/50 hover:text-red-400 transition-colors flex items-center justify-center space-x-1"
            >
              <LogOut className="w-3 h-3" />
              <span>Sign Out Session</span>
            </button>
          </div>
        </div>
      </aside>

      {/* ========================================================================= */}
      {/* 2. MOBILE & TABLET HEADER                                                 */}
      {/* ========================================================================= */}
      <header className="lg:hidden sticky top-0 z-40 bg-[#1C1917] text-[#F9F6F0] border-b border-[#292524] px-4 py-3 flex items-center justify-between select-none">
        <button
          type="button"
          onClick={() => setMobileMenuOpen(true)}
          className="p-1.5 text-[#E6DFD5] hover:text-[#C7A97B] focus:outline-none"
          aria-label="Open Admin Menu"
        >
          <Menu className="w-6 h-6" />
        </button>

        <div className="text-center">
          <span className="font-serif tracking-[0.2em] text-xs font-semibold block text-[#F9F6F0]">
            SEYVEN
          </span>
          <span className="text-[8px] uppercase tracking-wider text-[#C7A97B] font-mono">
            The Sanctuary of Beauty
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <div className="w-7 h-7 rounded-full bg-[#C7A97B] text-[#141211] font-bold text-[10px] flex items-center justify-center font-mono">
            {staffUser?.avatar || 'SO'}
          </div>
        </div>
      </header>

      {/* Mobile Off-Canvas Slide Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 max-w-xs w-full bg-[#1C1917] text-[#F9F6F0] shadow-2xl p-6 flex flex-col justify-between z-10">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-[#292524]">
                <div className="flex items-center space-x-2">
                  <div className="w-7 h-7 rounded border border-[#C7A97B] bg-[#201D1A] flex items-center justify-center p-0.5 overflow-hidden">
                    <Image
                      src="/images/seyven-monogram.png"
                      alt="SEYVEN Monogram"
                      width={28}
                      height={41}
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <span className="font-serif tracking-widest text-xs font-semibold">
                    SEYVEN OPERATIONS
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1 text-[#E6DFD5]/70 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <nav className="mt-6 space-y-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center justify-between px-3 py-2.5 rounded text-xs font-mono tracking-wider ${
                        isActive
                          ? 'bg-[#201D1A] text-[#C7A97B] border-l-2 border-[#C7A97B]'
                          : 'text-[#E6DFD5]/80 hover:bg-[#201D1A]/50'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <Icon className="w-4 h-4" />
                        <span>{item.name}</span>
                      </div>
                      {item.badge && (
                        <span className="px-1.5 py-0.5 text-[9px] font-bold rounded bg-[#C7A97B] text-[#141211]">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </nav>
            </div>

            <div className="pt-4 border-t border-[#292524] space-y-2">
              <div className="text-[10px] text-[#E6DFD5]/60 font-mono">
                Operator: <span className="text-[#C7A97B]">{staffUser?.name}</span> ({staffUser?.role})
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="w-full py-2 bg-[#201D1A] hover:bg-red-950/40 text-red-400 text-xs font-mono rounded flex items-center justify-center space-x-1.5 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Log Out</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. MAIN WORKSPACE CONTENT CANVAS (Alabaster Silk #F9F6F0)                  */}
      {/* ========================================================================= */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Executive Sub-Bar (Desktop Live Clock & Quick Status) */}
        <div className="hidden lg:flex items-center justify-between px-8 py-3.5 bg-white border-b border-[#E6DFD5] select-none text-xs">
          <div className="flex items-center space-x-2 text-[#1C1917]/70 font-mono text-[11px]">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Fulfillment Pipeline Active · Database Synchronized</span>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1.5 text-[#1C1917]/80 font-mono text-xs">
              <Clock className="w-3.5 h-3.5 text-[#C7A97B]" />
              <span>{currentTime}</span>
            </div>
          </div>
        </div>

        {/* Page Content Body */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto pb-16">
          {children}
        </main>
      </div>
    </div>
  );
}
