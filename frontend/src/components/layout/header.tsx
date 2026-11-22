'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Menu, Search, User, ShoppingBag, X, LogOut, Sparkles, Package } from 'lucide-react';
import { useCart } from '@/context/cart-context';
import { useAuth } from '@/context/auth-context';
import { GUEST_NAV_LINKS, AUTH_NAV_LINKS, BRAND } from '@/lib/constants';
import { MobileNavDrawer } from './mobile-nav-drawer';

interface HeaderProps {
  onOpenSearch?: () => void;
}

export function Header({ onOpenSearch }: HeaderProps) {
  const { itemCount, openBag, settings } = useCart();
  const { user, isAuthenticated, openAuthModal, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const currentNavLinks = (mounted && isAuthenticated) ? AUTH_NAV_LINKS : GUEST_NAV_LINKS;

  useEffect(() => {
    setMounted(true);
  }, []);

  // Close desktop user menu on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <>
      {/* Main Luxury Header */}
      <header className="sticky top-0 z-40 w-full h-20 bg-[#F9F6F0]/90 backdrop-blur-md border-b border-[#E6DFD5]/80 transition-all duration-300">
        <div className="max-w-7xl mx-auto h-full px-4 sm:px-6 lg:px-8 flex items-center justify-between relative">
          
          {/* ========================================================================= */}
          {/* LEFT SECTION */}
          {/* Mobile: Minimalist Hamburger Menu (Reference Image 1) */}
          {/* Desktop: Spaced All-Caps Editorial Navigation Links (Reference Image 2) */}
          {/* ========================================================================= */}
          <div className="flex items-center">
            {/* Mobile Hamburger Button */}
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden p-2 -ml-2 text-[#1C1917] hover:text-[#C7A97B] transition-colors focus:outline-none"
              aria-label="Open Navigation Menu"
            >
              <Menu className="w-6 h-6 stroke-[1.25]" />
            </button>

            {/* Desktop Navigation Links */}
            <nav className="hidden lg:flex items-center space-x-8">
              {currentNavLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-[11px] uppercase tracking-[0.22em] font-medium text-[#1C1917]/80 hover:text-[#1C1917] transition-colors duration-300 relative py-1 group"
                >
                  {link.labelEn}
                  <span className="absolute bottom-0 left-0 w-0 h-[1px] bg-[#C7A97B] transition-all duration-300 group-hover:w-full" />
                </Link>
              ))}
            </nav>
          </div>

          {/* ========================================================================= */}
          {/* CENTER SECTION (ABSOLUTE CENTERING) */}
          {/* Pure Standalone Luxury Emblem: Clicking always navigates Home */}
          {/* ========================================================================= */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center select-none">
            <Link
              href="/"
              className="flex items-center justify-center p-1 group focus:outline-none"
              aria-label="SEYVEN Home"
              title="SEYVEN Home"
            >
              <Image
                src={BRAND.logoPath}
                alt="SEYVEN"
                width={300}
                height={488}
                className="h-9 w-auto sm:h-11 md:h-13 object-contain transition-transform duration-300 ease-out group-hover:scale-105"
                priority
              />
            </Link>
          </div>

          {/* ========================================================================= */}
          {/* RIGHT SECTION */}
          {/* Action Icons: Search, User Profile, Sanctuary Bag */}
          {/* ========================================================================= */}
          <div className="flex items-center space-x-3 sm:space-x-5 text-[#1C1917]">
            {/* Search Trigger */}
            <button
              type="button"
              onClick={onOpenSearch}
              className="p-1.5 text-[#1C1917]/85 hover:text-[#1C1917] transition-colors focus:outline-none"
              aria-label="Search Skincare"
            >
              <Search className="w-5 h-5 stroke-[1.25]" />
            </button>

            {/* Customer Profile / Auth Trigger with Luxury Dropdown */}
            <div className="relative hidden sm:block" ref={userMenuRef}>
              <button
                type="button"
                suppressHydrationWarning
                onClick={isAuthenticated ? () => setIsUserMenuOpen(!isUserMenuOpen) : openAuthModal}
                className="p-1.5 text-[#1C1917]/85 hover:text-[#1C1917] transition-colors focus:outline-none relative"
                aria-label="User Account"
              >
                <User className="w-5 h-5 stroke-[1.25]" />
                {mounted && isAuthenticated && (
                  <span suppressHydrationWarning className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#C7A97B] ring-2 ring-[#F9F6F0]" />
                )}
              </button>

              {/* Desktop Luxury Dropdown Card */}
              {mounted && isAuthenticated && isUserMenuOpen && (
                <div className="absolute right-0 mt-3 w-64 bg-white border border-[#E6DFD5] rounded shadow-xl py-2 z-50 animate-in fade-in duration-150">
                  {/* Header info */}
                  <div className="px-4 py-3 border-b border-[#E6DFD5] bg-[#F9F6F0]/60">
                    <p className="text-xs font-serif font-medium text-[#1C1917] truncate">
                      {user?.fullName || 'Sanctuary Client'}
                    </p>
                    <p className="text-[10px] font-mono text-[#78716C] truncate mt-0.5">
                      {user?.phone || user?.email || 'VIP Member'}
                    </p>
                    <span className="inline-block mt-1.5 px-2 py-0.5 rounded text-[9px] font-mono uppercase tracking-wider bg-[#1C1917] text-[#C7A97B]">
                      Sanctuary Privilege
                    </span>
                  </div>

                  {/* Dropdown Links */}
                  <div className="py-1 text-xs">
                    <Link
                      href="/customer/account"
                      onClick={() => setIsUserMenuOpen(false)}
                      className="flex items-center space-x-2.5 px-4 py-2 text-[#1C1917] hover:bg-[#F9F6F0] transition-colors tracking-wide"
                    >
                      <User className="w-3.5 h-3.5 text-[#C7A97B]" />
                      <span>Client Vault & Orders</span>
                    </Link>

                    <Link
                      href="/care"
                      onClick={() => setIsUserMenuOpen(false)}
                      className="flex items-center space-x-2.5 px-4 py-2 text-[#1C1917] hover:bg-[#F9F6F0] transition-colors tracking-wide"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-[#C7A97B]" />
                      <span>Client Care & Privileges</span>
                    </Link>

                    <Link
                      href="/track-order"
                      onClick={() => setIsUserMenuOpen(false)}
                      className="flex items-center space-x-2.5 px-4 py-2 text-[#1C1917] hover:bg-[#F9F6F0] transition-colors tracking-wide"
                    >
                      <Package className="w-3.5 h-3.5 text-[#C7A97B]" />
                      <span>Track Parcel Live</span>
                    </Link>
                  </div>

                  {/* Divider & Sign Out Button */}
                  <div className="pt-1 border-t border-[#E6DFD5]">
                    <button
                      type="button"
                      onClick={async () => {
                        setIsUserMenuOpen(false);
                        await logout();
                      }}
                      className="w-full flex items-center space-x-2.5 px-4 py-2.5 text-xs uppercase tracking-[0.15em] font-medium text-red-700 hover:bg-red-50 transition-colors text-left"
                    >
                      <LogOut className="w-3.5 h-3.5 text-red-600" />
                      <span>SIGN OUT OF SEYVEN</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Sanctuary Bag (Cart) Trigger with Live Counter */}
            <button
              type="button"
              suppressHydrationWarning
              onClick={openBag}
              className="p-1.5 text-[#1C1917] hover:text-[#C7A97B] transition-colors focus:outline-none relative"
              aria-label="Open Sanctuary Bag"
            >
              <ShoppingBag className="w-5 h-5 stroke-[1.25]" />
              {mounted && itemCount > 0 && (
                <span suppressHydrationWarning className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#1C1917] text-[#F9F6F0] text-[9px] font-medium flex items-center justify-center">
                  {itemCount}
                </span>
              )}
            </button>
          </div>

        </div>
      </header>

      {/* ========================================================================= */}
      {/* HAUTE LUXURY EDITORIAL MOBILE NAVIGATION & CATEGORY TAXONOMY DRAWER       */}
      {/* ========================================================================= */}
      <MobileNavDrawer
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
      />
    </>
  );
}
