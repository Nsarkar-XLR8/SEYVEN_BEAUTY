'use client';

import React, { useState, Suspense } from 'react';
import { usePathname } from 'next/navigation';
import { LanguageProvider } from '@/context/language-context';
import { AuthProvider } from '@/context/auth-context';
import { CartProvider } from '@/context/cart-context';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { MobileDock } from '@/components/layout/mobile-dock';
import { CartDrawer } from '@/components/cart/cart-drawer';
import { AuthModal } from '@/components/auth/auth-modal';
import { SearchOverlay } from '@/components/search/search-overlay';

function StorefrontChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const isCheckout = pathname === '/checkout';

  return (
    <div className="min-h-screen flex flex-col bg-[#F9F6F0] text-[#1C1917] overflow-x-clip selection:bg-[#C7A97B]/30 selection:text-[#1C1917]">
      <Header onOpenSearch={() => setIsSearchOpen(true)} />
      <main className="flex-1 w-full">{children}</main>
      {!isCheckout && <Footer />}
      <MobileDock />
      <CartDrawer />
      <AuthModal />
      <SearchOverlay
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
      />
    </div>
  );
}

export function AppProviders({ children }: { children: React.ReactNode }) {
  React.useEffect(() => {
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').catch(() => {
          // Silent fallback if service worker registration is restricted
        });
      });
    }
  }, []);

  return (
    <LanguageProvider>
      <AuthProvider>
        <CartProvider>
          <Suspense fallback={<div className="min-h-screen bg-[#F9F6F0]">{children}</div>}>
            <StorefrontChrome>{children}</StorefrontChrome>
          </Suspense>
        </CartProvider>
      </AuthProvider>
    </LanguageProvider>
  );
}

