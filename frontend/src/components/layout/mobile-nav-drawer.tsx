'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  X,
  ChevronDown,
  ChevronRight,
  ArrowRight,
  User,
  LogOut,
  Sparkles,
  ShieldCheck,
  Package,
} from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { useCart } from '@/context/cart-context';
import { BRAND } from '@/lib/constants';
import {
  SEYVEN_CATEGORY_TAXONOMY,
  SEYVEN_EDITORIAL_MENU,
  ParentCategoryItem,
  mergeDynamicTaxonomy,
} from '@/data/category-taxonomy';

interface MobileNavDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileNavDrawer({ isOpen, onClose }: MobileNavDrawerProps) {
  const { user, isAuthenticated, openAuthModal, logout } = useAuth();
  const { settings } = useCart();
  const [activeTab, setActiveTab] = useState<'MENU' | 'CATEGORIES'>('CATEGORIES');
  const [expandedCategoryId, setExpandedCategoryId] = useState<string | null>('skincare');
  const [mounted, setMounted] = useState(false);
  const [taxonomy, setTaxonomy] = useState<ParentCategoryItem[]>(SEYVEN_CATEGORY_TAXONOMY);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch live categories from API to dynamically merge any admin-created categories
  useEffect(() => {
    let isMounted = true;
    async function loadDynamicCategories() {
      try {
        const res = await fetch('/api/catalog/categories').catch(() => null);
        if (res && res.ok) {
          const data = await res.json();
          if (isMounted && Array.isArray(data) && data.length > 0) {
            setTaxonomy(mergeDynamicTaxonomy(data));
          }
        }
      } catch {
        // Graceful fallback to pristine default SEYVEN taxonomy
      }
    }
    loadDynamicCategories();
    return () => {
      isMounted = false;
    };
  }, []);

  // Lock background scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const toggleCategory = (catId: string) => {
    setExpandedCategoryId((prev) => (prev === catId ? null : catId));
  };

  const getSubcategoryHref = (sub: {
    filterType?: 'category' | 'concern' | 'brand' | 'sort' | 'badge';
    filterValue: string;
    slug: string;
  }) => {
    if (sub.filterType === 'concern') {
      return sub.filterValue === 'all' ? '/catalog' : `/catalog?concern=${encodeURIComponent(sub.filterValue)}`;
    }
    if (sub.filterType === 'brand') {
      return sub.filterValue === 'all' ? '/catalog' : `/catalog?brand=${encodeURIComponent(sub.filterValue)}`;
    }
    if (sub.filterType === 'sort') {
      return `/catalog?sort=${encodeURIComponent(sub.filterValue)}`;
    }
    if (sub.filterType === 'badge') {
      return `/catalog?badge=${encodeURIComponent(sub.filterValue)}`;
    }
    return sub.filterValue === 'all' ? '/catalog' : `/catalog?category=${encodeURIComponent(sub.filterValue)}`;
  };

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[#1C1917]/50 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer Surface */}
      <div className="fixed inset-y-0 left-0 max-w-sm w-full bg-[#F9F6F0] border-r border-[#E6DFD5] shadow-2xl flex flex-col justify-between z-10 animate-in slide-in-from-left duration-300">
        
        {/* ========================================================================= */}
        {/* TOP BRAND HEADER (Clean & Minimalist, No Search Clutter)                  */}
        {/* ========================================================================= */}
        <div className="p-4 sm:p-5 border-b border-[#E6DFD5] flex items-center justify-between bg-[#F9F6F0]">
          <Link
            href="/"
            onClick={onClose}
            className="flex items-center space-x-2.5 group focus:outline-none"
            aria-label="SEYVEN Home"
          >
            <Image
              src={BRAND.logoPath}
              alt="SEYVEN"
              width={300}
              height={441}
              className="h-8 w-auto object-contain transition-transform duration-200 group-hover:scale-105"
            />
            <div>
              <span className="text-xs uppercase tracking-[0.25em] font-serif font-bold text-[#1C1917] block leading-none">
                SEYVEN
              </span>
              <span className="text-[8px] uppercase tracking-[0.25em] text-[#C7A97B] font-mono block mt-0.5">
                The Sanctuary
              </span>
            </div>
          </Link>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-[#1C1917]/70 hover:text-[#1C1917] hover:bg-[#E6DFD5]/50 transition-colors cursor-pointer"
            aria-label="Close menu"
          >
            <X className="w-5 h-5 stroke-[1.5]" />
          </button>
        </div>

        {/* ========================================================================= */}
        {/* DUAL-TAB CONTROLLER: [ MENU ] | [ CATEGORIES ]                            */}
        {/* Haute Luxury Styling with Champagne Gold Indicator                        */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-2 border-b border-[#E6DFD5] bg-[#FAF8F5] select-none shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('MENU')}
            className={`py-3 text-[11px] uppercase tracking-[0.22em] font-semibold transition-all relative cursor-pointer ${
              activeTab === 'MENU'
                ? 'text-[#1C1917] bg-[#F9F6F0]'
                : 'text-stone-500 hover:text-[#1C1917] bg-[#FAF8F5]'
            }`}
          >
            MENU
            {activeTab === 'MENU' && (
              <span className="absolute bottom-0 left-0 w-full h-[2.5px] bg-[#C7A97B]" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('CATEGORIES')}
            className={`py-3 text-[11px] uppercase tracking-[0.22em] font-semibold transition-all relative cursor-pointer flex items-center justify-center space-x-1.5 ${
              activeTab === 'CATEGORIES'
                ? 'text-[#1C1917] bg-[#F9F6F0]'
                : 'text-stone-500 hover:text-[#1C1917] bg-[#FAF8F5]'
            }`}
          >
            <span>CATEGORIES</span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#C7A97B]" />
            {activeTab === 'CATEGORIES' && (
              <span className="absolute bottom-0 left-0 w-full h-[2.5px] bg-[#C7A97B]" />
            )}
          </button>
        </div>

        {/* ========================================================================= */}
        {/* SCROLLABLE DRAWER BODY                                                    */}
        {/* ========================================================================= */}
        <div className="flex-1 overflow-y-auto px-4 py-5 divide-y divide-[#E6DFD5]/70">

          {/* TAB 1: EDITORIAL MENU */}
          {activeTab === 'MENU' && (
            <nav className="flex flex-col space-y-4 pt-1">
              {SEYVEN_EDITORIAL_MENU.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  className={`text-xs uppercase tracking-[0.22em] font-medium py-1.5 px-2 rounded transition-colors flex items-center justify-between group ${
                    item.isAccent
                      ? 'text-[#8C6D3B] font-bold bg-[#FAF8F5]'
                      : 'text-[#1C1917] hover:text-[#C7A97B] hover:bg-[#FAF8F5]'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <span>{item.label}</span>
                    {item.badge && (
                      <span className="text-[8px] uppercase tracking-widest px-1.5 py-0.5 rounded font-mono font-bold bg-[#C7A97B]/20 text-[#8C6D3B]">
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 text-[#C7A97B] transition-opacity -translate-x-1 group-hover:translate-x-0" />
                </Link>
              ))}
            </nav>
          )}

          {/* TAB 2: LUXURY CATEGORY ACCORDION TAXONOMY */}
          {activeTab === 'CATEGORIES' && (
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between pb-2 text-[9px] uppercase tracking-[0.2em] font-mono text-[#8C6D3B] font-bold">
                <span>The Sanctuary Taxonomy</span>
                <span>Direct Filter</span>
              </div>

              {taxonomy.map((parent) => {
                const isExpanded = expandedCategoryId === parent.id;

                return (
                  <div
                    key={parent.id}
                    className="border border-[#E6DFD5] rounded-lg overflow-hidden bg-white shadow-2xs transition-all"
                  >
                    {/* Parent Category Header Button */}
                    <button
                      type="button"
                      onClick={() => toggleCategory(parent.id)}
                      className={`w-full p-3.5 flex items-center justify-between text-left transition-colors cursor-pointer ${
                        isExpanded
                          ? 'bg-[#FAF8F5] border-b border-[#E6DFD5]'
                          : 'hover:bg-[#FAF8F5]'
                      }`}
                    >
                      <div className="min-w-0 pr-2">
                        <div className="flex items-center space-x-2">
                          <span className="font-serif text-xs font-bold text-[#1C1917] tracking-wider uppercase">
                            {parent.name}
                          </span>
                          {parent.badge && (
                            <span className="text-[8px] uppercase tracking-wider px-1.5 py-0.2 rounded font-mono font-bold bg-[#C7A97B]/15 text-[#8C6D3B]">
                              {parent.badge}
                            </span>
                          )}
                        </div>
                        {parent.subtitle && (
                          <span className="block text-[9.5px] text-stone-500 font-mono tracking-tight mt-0.5 truncate">
                            {parent.subtitle}
                          </span>
                        )}
                      </div>

                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center transition-transform duration-200 shrink-0 ${
                          isExpanded
                            ? 'bg-[#1C1917] text-[#C7A97B] rotate-180'
                            : 'bg-stone-100 text-stone-600'
                        }`}
                      >
                        <ChevronDown className="w-3.5 h-3.5" />
                      </div>
                    </button>

                    {/* Subcategories Accordion Content */}
                    {isExpanded && (
                      <div className="bg-[#FAF8F5] p-2.5 space-y-1 divide-y divide-[#E6DFD5]/40 border-l-2 border-[#C7A97B]">
                        {parent.subcategories.map((sub, idx) => {
                          const href = getSubcategoryHref(sub);
                          const isViewAll = idx === 0;

                          return (
                            <Link
                              key={sub.id}
                              href={href}
                              onClick={onClose}
                              className={`flex items-center justify-between py-2 px-2.5 rounded text-xs transition-colors group cursor-pointer ${
                                isViewAll
                                  ? 'font-serif font-bold text-[#8C6D3B] hover:bg-[#C7A97B]/15'
                                  : 'text-stone-700 hover:text-[#1C1917] hover:bg-white'
                              }`}
                            >
                              <div className="flex items-center space-x-2">
                                <span className={`text-[10px] ${isViewAll ? 'text-[#8C6D3B]' : 'text-[#C7A97B]'}`}>
                                  {isViewAll ? '✦' : '•'}
                                </span>
                                <span className={`${isViewAll ? 'tracking-wider' : 'tracking-normal'}`}>
                                  {sub.name}
                                </span>
                                {sub.badge && (
                                  <span className="text-[8px] uppercase tracking-wider px-1 rounded font-mono font-semibold bg-emerald-100 text-emerald-800">
                                    {sub.badge}
                                  </span>
                                )}
                              </div>
                              <ArrowRight className="w-3 h-3 text-[#C7A97B] opacity-0 group-hover:opacity-100 transition-opacity" />
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ========================================================================= */}
        {/* BOTTOM SECTION: VIP ACCOUNT & CONCIERGE CARE                              */}
        {/* ========================================================================= */}
        <div className="p-4 bg-[#FAF8F5] border-t border-[#E6DFD5] space-y-3 shrink-0">
          {/* User Account / Sign In */}
          {mounted && isAuthenticated ? (
            <div className="space-y-2">
              <Link
                href="/customer/account"
                onClick={onClose}
                className="flex items-center justify-between p-2.5 rounded-lg bg-white border border-[#E6DFD5] hover:border-[#C7A97B] transition-colors shadow-2xs"
              >
                <div className="flex items-center space-x-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-[#1C1917] text-[#C7A97B] flex items-center justify-center font-serif text-xs font-bold shrink-0">
                    {user?.fullName ? user.fullName.charAt(0).toUpperCase() : 'S'}
                  </div>
                  <div className="min-w-0">
                    <span className="block text-xs font-serif font-semibold text-[#1C1917] truncate">
                      {user?.fullName || 'Sanctuary Client'}
                    </span>
                    <span className="block text-[9px] uppercase tracking-wider text-[#C7A97B] font-mono">
                      VIP Privilege Vault
                    </span>
                  </div>
                </div>
                <span className="text-[10px] text-[#C7A97B] font-mono font-bold tracking-wider">
                  ENTER &rarr;
                </span>
              </Link>

              <button
                type="button"
                onClick={async () => {
                  onClose();
                  await logout();
                }}
                className="w-full py-2 px-2.5 rounded bg-white hover:bg-rose-50 border border-[#E6DFD5] hover:border-rose-200 text-left flex items-center justify-between text-[10px] uppercase tracking-[0.18em] font-medium text-rose-700 transition-colors cursor-pointer"
              >
                <span className="flex items-center space-x-1.5">
                  <LogOut className="w-3 h-3 text-rose-600" />
                  <span>Sign Out of SEYVEN</span>
                </span>
                <span className="text-rose-400">&rarr;</span>
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => {
                onClose();
                openAuthModal();
              }}
              className="w-full py-2.5 px-3 rounded-lg bg-[#1C1917] hover:bg-[#2C2724] text-[#C7A97B] transition-colors text-center text-xs uppercase tracking-[0.2em] font-bold flex items-center justify-center space-x-2 shadow-sm cursor-pointer"
            >
              <User className="w-3.5 h-3.5 text-[#C7A97B]" />
              <span>SIGN IN / REGISTER</span>
            </button>
          )}

          {/* Client Care Hotline & Currency Standard */}
          <div className="pt-1 text-[9.5px] text-[#1C1917]/70 space-y-1.5 border-t border-[#E6DFD5]/60">
            <div className="flex items-center justify-between">
              <span className="uppercase tracking-[0.18em] font-medium text-[#1C1917]/60">
                INTERNATIONAL CURATION
              </span>
              <span className="uppercase tracking-wider text-[#1C1917]/50 font-mono">
                BANGLADESH · BDT ৳
              </span>
            </div>

            {(settings?.supportPhone || BRAND.supportPhone) && (
              <p className="uppercase tracking-[0.15em] text-[#8C6D3B] font-semibold text-[9px]">
                DIRECT CLIENT CARE · {settings?.supportPhone || BRAND.supportPhone}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
