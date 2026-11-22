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
  CategoryNode,
  buildDepartmentTaxonomy,
} from '@/data/category-taxonomy';

interface MobileNavDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileNavDrawer({ isOpen, onClose }: MobileNavDrawerProps) {
  const { user, isAuthenticated, openAuthModal, logout } = useAuth();
  const { settings } = useCart();
  const [activeTab, setActiveTab] = useState<'MENU' | 'CATEGORIES'>('CATEGORIES');
  const [expandedCategoryId, setExpandedCategoryId] = useState<string | null>('dept-skincare');
  const [mounted, setMounted] = useState(false);
  const [departments, setDepartments] = useState<CategoryNode[]>(() => buildDepartmentTaxonomy([], []));

  useEffect(() => {
    setMounted(true);
  }, []);

  // 100% Dynamic: Live Sync with Admin Database & Catalog
  useEffect(() => {
    let isMounted = true;

    async function loadDynamicCategories() {
      try {
        const [catRes, prodRes] = await Promise.all([
          fetch('/api/catalog/categories').catch(() => null),
          fetch('/api/catalog/products').catch(() => null),
        ]);

        const catData = catRes && catRes.ok ? await catRes.json() : [];
        const prodData = prodRes && prodRes.ok ? await prodRes.json() : [];

        if (isMounted) {
          const dynamicTree = buildDepartmentTaxonomy(catData, prodData);
          if (dynamicTree.length > 0) {
            setDepartments(dynamicTree);
          }
        }
      } catch {
        // Retain pristine luxury default fallback
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

          {/* TAB 2: HIERARCHICAL LUXURY CATEGORIES (Ravissa Style: Departments + Expandable Subcategories) */}
          {activeTab === 'CATEGORIES' && (
            <div className="divide-y divide-[#E6DFD5]/70">
              {departments.map((dept) => {
                const hasChildren = Array.isArray(dept.children) && dept.children.length > 0;
                const isExpanded = expandedCategoryId === dept.id;

                if (hasChildren) {
                  return (
                    <div key={dept.id} className="group">
                      {/* Department Row with Subtle Chevron */}
                      <button
                        type="button"
                        onClick={() => toggleCategory(dept.id)}
                        className={`w-full py-3.5 px-2 flex items-center justify-between text-left transition-colors cursor-pointer select-none ${
                          isExpanded ? 'text-[#C7A97B]' : 'text-[#1C1917] hover:text-[#C7A97B]'
                        }`}
                      >
                        <span className="text-xs uppercase font-serif tracking-[0.2em] font-semibold">
                          {dept.nameEn}
                        </span>
                        <ChevronRight
                          className={`w-4 h-4 text-stone-400 transition-transform duration-200 shrink-0 ${
                            isExpanded ? 'rotate-90 text-[#C7A97B]' : 'group-hover:text-[#1C1917]'
                          }`}
                        />
                      </button>

                      {/* Subcategories (Minimalist indented list matching Ravissa) */}
                      {isExpanded && (
                        <div className="bg-[#FAF8F5]/80 py-1 border-t border-[#E6DFD5]/40 divide-y divide-[#E6DFD5]/40">
                          {/* "All [Department]" Link */}
                          <Link
                            href={`/catalog?category=${encodeURIComponent(dept.slug)}`}
                            onClick={onClose}
                            className="block py-2.5 pl-6 pr-4 text-xs font-serif font-bold text-[#8C6D3B] hover:text-[#1C1917] tracking-wider transition-colors"
                          >
                            All {dept.nameEn} &rarr;
                          </Link>

                          {/* Subcategory Items */}
                          {dept.children!.map((sub) => (
                            <Link
                              key={sub.id}
                              href={`/catalog?category=${encodeURIComponent(sub.slug)}`}
                              onClick={onClose}
                              className="block py-2.5 pl-6 pr-4 text-xs font-sans text-stone-600 hover:text-[#C7A97B] font-medium tracking-wide transition-colors"
                            >
                              {sub.nameEn}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                }

                // Leaf category row without children
                return (
                  <Link
                    key={dept.id}
                    href={`/catalog?category=${encodeURIComponent(dept.slug)}`}
                    onClick={onClose}
                    className="py-3.5 px-2 flex items-center justify-between text-[#1C1917] hover:text-[#C7A97B] transition-colors group cursor-pointer"
                  >
                    <span className="text-xs uppercase font-serif tracking-[0.2em] font-semibold">
                      {dept.nameEn}
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 text-stone-300 group-hover:text-[#C7A97B] transition-colors shrink-0" />
                  </Link>
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
