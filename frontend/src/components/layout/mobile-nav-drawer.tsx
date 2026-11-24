'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  X,
  ChevronRight,
  User,
  LogOut,
} from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { useCart } from '@/context/cart-context';
import { BRAND, GUEST_NAV_LINKS, AUTH_NAV_LINKS } from '@/lib/constants';
import {
  DynamicCategoryNode,
  buildDynamicCategoryHierarchy,
  formatCategoryTitle,
} from '@/data/category-taxonomy';

interface MobileNavDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileNavDrawer({ isOpen, onClose }: MobileNavDrawerProps) {
  const { user, isAuthenticated, openAuthModal, logout } = useAuth();
  const { settings } = useCart();
  const [activeTab, setActiveTab] = useState<'MENU' | 'CATEGORIES'>('CATEGORIES');
  const [expandedLevel1Id, setExpandedLevel1Id] = useState<string | null>(null);
  const [expandedLevel2Id, setExpandedLevel2Id] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [categories, setCategories] = useState<DynamicCategoryNode[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setMounted(true);
  }, []);

  // 100% Dynamic: Live Sync with Admin Database Category Tree
  useEffect(() => {
    let isMounted = true;

    async function loadLiveCategories() {
      try {
        const res = await fetch('/api/catalog/categories').catch(() => null);
        if (res && res.ok) {
          const data = await res.json();
          if (isMounted && Array.isArray(data) && data.length > 0) {
            const tree = buildDynamicCategoryHierarchy(data);
            setCategories(tree);
            // Keep all categories initially collapsed by default
          }
        }
      } catch (err) {
        console.warn('[MobileNavDrawer] Live category fetch notice:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadLiveCategories();

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

  const toggleLevel1 = (catId: string) => {
    setExpandedLevel1Id((prev) => (prev === catId ? null : catId));
    setExpandedLevel2Id(null);
  };

  const toggleLevel2 = (subId: string) => {
    setExpandedLevel2Id((prev) => (prev === subId ? null : subId));
  };

  // Strictly original navigation links (No over-engineered pages or badges)
  const navLinks = mounted && isAuthenticated ? AUTH_NAV_LINKS : GUEST_NAV_LINKS;

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
        {/* TOP BRAND HEADER (Strictly Logo + SEYVEN Name + Clean X Only)             */}
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
            <span className="text-xs uppercase tracking-[0.25em] font-serif font-bold text-[#1C1917] block leading-none">
              SEYVEN
            </span>
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
        {/* Elegant Minimalist Tabs                                                   */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-2 border-b border-[#E6DFD5] bg-[#FAF8F5] select-none shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('MENU')}
            className={`py-3.5 text-[11px] uppercase tracking-[0.22em] font-semibold transition-all relative cursor-pointer ${
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
            className={`py-3.5 text-[11px] uppercase tracking-[0.22em] font-semibold transition-all relative cursor-pointer ${
              activeTab === 'CATEGORIES'
                ? 'text-[#1C1917] bg-[#F9F6F0]'
                : 'text-stone-500 hover:text-[#1C1917] bg-[#FAF8F5]'
            }`}
          >
            CATEGORIES
            {activeTab === 'CATEGORIES' && (
              <span className="absolute bottom-0 left-0 w-full h-[2.5px] bg-[#C7A97B]" />
            )}
          </button>
        </div>

        {/* ========================================================================= */}
        {/* SCROLLABLE DRAWER CONTENT                                                 */}
        {/* ========================================================================= */}
        <div className="flex-1 overflow-y-auto px-4 py-2">

          {/* TAB 1: ORIGINAL LUXURY MENU (Strictly core pages, zero badges/noise) */}
          {activeTab === 'MENU' && (
            <nav className="divide-y divide-[#E6DFD5]/70">
              <Link
                href="/"
                onClick={onClose}
                className="block py-3.5 px-2 text-xs uppercase tracking-[0.25em] font-medium text-[#1C1917] hover:text-[#C7A97B] transition-colors"
              >
                HOME
              </Link>
              {navLinks.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  className="block py-3.5 px-2 text-xs uppercase tracking-[0.25em] font-medium text-[#1C1917] hover:text-[#C7A97B] transition-colors"
                >
                  {item.labelEn}
                </Link>
              ))}
            </nav>
          )}

          {/* TAB 2: HIERARCHICAL LUXURY CATEGORIES (Ravissa 3-Level Standard, Matching Menu Typography & Colors) */}
          {activeTab === 'CATEGORIES' && (
            <div className="divide-y divide-[#E6DFD5]/70">
              {isLoading && categories.length === 0 ? (
                <div className="py-6 space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-9 bg-[#E6DFD5]/40 rounded animate-pulse" />
                  ))}
                </div>
              ) : categories.length === 0 ? (
                <div className="py-8 text-center text-xs text-stone-500 font-mono">
                  No categories published yet.
                </div>
              ) : (
                categories.map((dept) => {
                  const hasLevel2 = Array.isArray(dept.children) && dept.children.length > 0;
                  const isLevel1Expanded = expandedLevel1Id === dept.id;

                  if (hasLevel2) {
                    return (
                      <div key={dept.id} className="group">
                        {/* Level 1: Root Department Header (e.g. SKIN CARE, BODY CARE) */}
                        <button
                          type="button"
                          onClick={() => toggleLevel1(dept.id)}
                          className={`w-full py-3.5 px-2 flex items-center justify-between text-left transition-colors cursor-pointer select-none ${
                            isLevel1Expanded ? 'text-[#C7A97B]' : 'text-[#1C1917] hover:text-[#C7A97B]'
                          }`}
                        >
                          <span className="text-xs uppercase tracking-[0.25em] font-medium">
                            {dept.nameEn}
                          </span>
                          <ChevronRight
                            className={`w-4 h-4 text-stone-400 transition-transform duration-200 shrink-0 ${
                              isLevel1Expanded ? 'rotate-90 text-[#C7A97B]' : 'group-hover:text-[#1C1917]'
                            }`}
                          />
                        </button>

                        {/* Level 2 Subcategories Container */}
                        {isLevel1Expanded && (
                          <div className="py-1 border-t border-[#E6DFD5]/50 divide-y divide-[#E6DFD5]/40 bg-[#F4EFE6]/30">
                            {/* "All [Department]" Link */}
                            <Link
                              href={`/catalog?category=${encodeURIComponent(dept.slug)}`}
                              onClick={onClose}
                              className="block py-2.5 pl-6 pr-4 text-[11px] uppercase tracking-[0.22em] font-medium text-[#1C1917]/70 hover:text-[#C7A97B] transition-colors"
                            >
                              All {dept.nameEn} &rarr;
                            </Link>

                            {/* Level 2 Child Items */}
                            {dept.children!.map((sub) => {
                              const hasLevel3 = Array.isArray(sub.children) && sub.children.length > 0;
                              const isLevel2Expanded = expandedLevel2Id === sub.id;

                              if (hasLevel3) {
                                return (
                                  <div key={sub.id}>
                                    {/* Level 2 Expandable Subcategory (e.g. Cleanser, Sun Protection) */}
                                    <button
                                      type="button"
                                      onClick={() => toggleLevel2(sub.id)}
                                      className={`w-full py-2.5 pl-6 pr-4 flex items-center justify-between text-left transition-colors cursor-pointer select-none ${
                                        isLevel2Expanded ? 'text-[#C7A97B] font-semibold' : 'text-[#1C1917]/90 hover:text-[#C7A97B]'
                                      }`}
                                    >
                                      <span className="text-xs uppercase tracking-[0.18em] font-medium">
                                        {formatCategoryTitle(sub.nameEn)}
                                      </span>
                                      <ChevronRight
                                        className={`w-3.5 h-3.5 text-stone-400 transition-transform duration-200 shrink-0 ${
                                          isLevel2Expanded ? 'rotate-90 text-[#C7A97B]' : ''
                                        }`}
                                      />
                                    </button>

                                    {/* Level 3 Micro-Types Container (e.g. Cleansing Oil, Balm, Water, Foam) */}
                                    {isLevel2Expanded && (
                                      <div className="py-1.5 pl-9 pr-4 border-t border-[#E6DFD5]/30 space-y-1 bg-[#EFE9DF]/40">
                                        {/* "All [Subcategory]" Link */}
                                        <Link
                                          href={`/catalog?category=${encodeURIComponent(sub.slug)}`}
                                          onClick={onClose}
                                          className="block py-1.5 text-[11px] uppercase tracking-[0.2em] font-medium text-[#1C1917]/70 hover:text-[#C7A97B] transition-colors"
                                        >
                                          All {formatCategoryTitle(sub.nameEn)} &rarr;
                                        </Link>

                                        {/* Level 3 Leaf Items */}
                                        {sub.children!.map((micro) => (
                                          <Link
                                            key={micro.id}
                                            href={`/catalog?category=${encodeURIComponent(micro.slug)}`}
                                            onClick={onClose}
                                            className="block py-1.5 text-xs tracking-wider text-[#1C1917]/80 hover:text-[#C7A97B] transition-colors"
                                          >
                                            {formatCategoryTitle(micro.nameEn)}
                                          </Link>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                );
                              }

                              // Level 2 Leaf Category (No Level 3 children)
                              return (
                                <Link
                                  key={sub.id}
                                  href={`/catalog?category=${encodeURIComponent(sub.slug)}`}
                                  onClick={onClose}
                                  className="block py-2.5 pl-6 pr-4 text-xs uppercase tracking-[0.18em] font-medium text-[#1C1917]/90 hover:text-[#C7A97B] transition-colors"
                                >
                                  {formatCategoryTitle(sub.nameEn)}
                                </Link>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  }

                  // Level 1 Leaf Category (No Level 2 children)
                  return (
                    <Link
                      key={dept.id}
                      href={`/catalog?category=${encodeURIComponent(dept.slug)}`}
                      onClick={onClose}
                      className="py-3.5 px-2 flex items-center justify-between text-[#1C1917] hover:text-[#C7A97B] transition-colors group cursor-pointer"
                    >
                      <span className="text-xs uppercase tracking-[0.25em] font-medium">
                        {dept.nameEn}
                      </span>
                      <ChevronRight className="w-3.5 h-3.5 text-stone-300 group-hover:text-[#C7A97B] transition-colors shrink-0" />
                    </Link>
                  );
                })
              )}
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
                className="flex items-center justify-between p-2.5 rounded bg-white border border-[#E6DFD5] hover:border-[#C7A97B] transition-colors"
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
              className="w-full py-2.5 px-3 rounded bg-[#1C1917] hover:bg-[#2C2724] text-[#C7A97B] transition-colors text-center text-xs uppercase tracking-[0.2em] font-bold flex items-center justify-center space-x-2 shadow-sm cursor-pointer"
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
