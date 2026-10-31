'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, MessageCircle, ShoppingBag, Compass, User } from 'lucide-react';
import { useCart } from '@/context/cart-context';
import { useAuth } from '@/context/auth-context';
import { BRAND } from '@/lib/constants';

export function MobileDock() {
  const pathname = usePathname();
  const { itemCount, openBag } = useCart();
  const { isAuthenticated, openAuthModal } = useAuth();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (pathname === '/checkout' || pathname?.startsWith('/products/')) return null;

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#F9F6F0]/95 backdrop-blur-lg border-t border-[#E6DFD5]/90 py-2 px-3 pb-[calc(0.5rem+env(safe-area-inset-bottom))] shadow-lg transition-transform">
      <div className="flex items-center justify-around max-w-md mx-auto">
        
        {/* Tab 1: Home */}
        <Link
          href="/"
          className={`flex flex-col items-center justify-center p-1 w-14 transition-colors ${
            pathname === '/' ? 'text-[#1C1917]' : 'text-[#1C1917]/50 hover:text-[#1C1917]'
          }`}
        >
          <Home className="w-5 h-5 stroke-[1.25]" />
          <span className="text-[9px] uppercase tracking-[0.15em] font-medium mt-1">
            HOME
          </span>
        </Link>

        {/* Tab 2: Catalog / Sanctuary */}
        <Link
          href="/catalog"
          className={`flex flex-col items-center justify-center p-1 w-14 transition-colors ${
            pathname.startsWith('/catalog') ? 'text-[#1C1917]' : 'text-[#1C1917]/50 hover:text-[#1C1917]'
          }`}
        >
          <Compass className="w-5 h-5 stroke-[1.25]" />
          <span className="text-[9px] uppercase tracking-[0.15em] font-medium mt-1">
            SHOP
          </span>
        </Link>

        {/* Tab 3: Bag Trigger (Center prominence) */}
        <button
          type="button"
          suppressHydrationWarning
          onClick={openBag}
          className="flex flex-col items-center justify-center p-1 w-14 text-[#1C1917] relative focus:outline-none"
        >
          <div className="relative" suppressHydrationWarning>
            <ShoppingBag className="w-5 h-5 stroke-[1.35] text-[#1C1917]" />
            {mounted && itemCount > 0 && (
              <span suppressHydrationWarning className="absolute -top-1 -right-2 w-4 h-4 rounded-full bg-[#C7A97B] text-[#F9F6F0] text-[8px] font-semibold flex items-center justify-center">
                {itemCount}
              </span>
            )}
          </div>
          <span className="text-[9px] uppercase tracking-[0.15em] font-medium mt-1">
            BAG
          </span>
        </button>

        {/* Tab 4: Dedicated Client Care & Complimentary Advisory */}
        <Link
          href="/care"
          className={`flex flex-col items-center justify-center p-1 w-14 transition-colors ${
            pathname === '/care' ? 'text-[#C7A97B]' : 'text-[#1C1917]/50 hover:text-[#1C1917]'
          }`}
        >
          <MessageCircle className="w-5 h-5 stroke-[1.25]" />
          <span className="text-[9px] uppercase tracking-[0.15em] font-medium mt-1">
            CARE
          </span>
        </Link>

        {/* Tab 5: Profile / Auth */}
        <button
          type="button"
          suppressHydrationWarning
          onClick={isAuthenticated ? () => window.location.href = '/customer/account' : openAuthModal}
          className="flex flex-col items-center justify-center p-1 w-14 text-[#1C1917]/50 hover:text-[#1C1917] focus:outline-none"
        >
          <User className="w-5 h-5 stroke-[1.25]" />
          <span suppressHydrationWarning className="text-[9px] uppercase tracking-[0.15em] font-medium mt-1">
            {mounted && isAuthenticated ? 'ACCOUNT' : 'LOGIN'}
          </span>
        </button>

      </div>
    </nav>
  );
}
