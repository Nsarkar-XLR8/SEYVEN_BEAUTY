'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { X, ShoppingBag, Plus, Minus, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';
import { useCart } from '@/context/cart-context';

function DrawerPrice({
  amount,
  prefix = '',
  size = 'md',
  isDiscount = false,
  isHighlight = false,
}: {
  amount: number;
  prefix?: string;
  size?: 'sm' | 'md' | 'lg';
  isDiscount?: boolean;
  isHighlight?: boolean;
}) {
  const rounded = Math.round(amount);
  const formatted = rounded.toLocaleString('en-IN');

  const sizeClass =
    size === 'sm'
      ? 'text-xs'
      : size === 'lg'
      ? 'text-base sm:text-lg'
      : 'text-xs sm:text-sm';

  const colorClass = isDiscount
    ? 'text-[#8C6D3B]'
    : isHighlight
    ? 'text-[#1C1917] font-semibold'
    : 'text-[#1C1917]';

  return (
    <span className={`font-mono tracking-tight font-medium ${sizeClass} ${colorClass}`}>
      {prefix}৳{formatted}
    </span>
  );
}

export function CartDrawer() {
  const {
    isBagOpen,
    closeBag,
    items,
    itemCount,
    subtotalBdt,
    discountBdt,
    privilegeCode,
    activePrivilegeLabel,
    updateQuantity,
    removeItem,
    removePrivilege,
  } = useCart();

  if (!isBagOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Dim Backdrop */}
      <div
        className="absolute inset-0 bg-[#1C1917]/60 backdrop-blur-xs transition-opacity cursor-pointer"
        onClick={closeBag}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-0 sm:pl-10">
        {/* Drawer Surface */}
        <div className="w-screen max-w-md bg-[#F9F6F0] border-l border-[#E6DFD5] shadow-2xl flex flex-col h-full max-h-screen overflow-hidden">
          
          {/* 1. Header (Fixed Top) */}
          <div className="px-5 sm:px-6 py-4 sm:py-5 border-b border-[#E6DFD5] flex items-center justify-between shrink-0 bg-[#F9F6F0]">
            <div className="flex items-center space-x-2">
              <ShoppingBag className="w-4 h-4 text-[#C7A97B]" />
              <h2 className="text-xs uppercase tracking-[0.25em] font-medium text-[#1C1917]">
                SANCTUARY BAG ({itemCount})
              </h2>
            </div>
            <button
              type="button"
              onClick={closeBag}
              className="p-1.5 text-[#1C1917]/60 hover:text-[#1C1917] focus:outline-none transition-colors cursor-pointer"
            >
              <X className="w-5 h-5 stroke-[1.5]" />
            </button>
          </div>

          {/* 2. Scrollable Middle Body (Items + Voucher + Cost Breakdown) */}
          <div className="flex-1 overflow-y-auto overscroll-contain -webkit-overflow-scrolling: touch px-4 sm:px-6 py-3 space-y-4 min-h-0">
            {/* Cart Item List */}
            {items.length === 0 ? (
              <div className="h-48 flex flex-col items-center justify-center text-center space-y-3">
                <div className="w-10 h-10 rounded-full border border-[#E6DFD5] flex items-center justify-center text-[#C7A97B]/70">
                  <ShoppingBag className="w-5 h-5 stroke-[1]" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] font-medium text-[#1C1917]">
                    YOUR BAG IS EMPTY
                  </p>
                  <p className="text-[11px] text-[#1C1917]/60 font-light mt-0.5">
                    Discover our clinical formulations curated for your skin.
                  </p>
                </div>
                <Link
                  href="/catalog"
                  onClick={closeBag}
                  className="px-5 py-2.5 bg-[#1C1917] text-[#F9F6F0] text-[10px] uppercase tracking-[0.25em] font-medium hover:bg-[#1C1917]/90 transition-all"
                >
                  EXPLORE FORMULATIONS
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-[#E6DFD5]/80">
                {items.map((item) => (
                  <div key={item.id} className="py-3.5 flex items-start space-x-3.5">
                    <div className="relative w-14 h-18 bg-[#E6DFD5]/40 shrink-0 border border-[#E6DFD5] overflow-hidden">
                      {item.image ? (
                        <Image
                          src={item.image}
                          alt={item.titleEn}
                          fill
                          sizes="56px"
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[9px] text-[#1C1917]/40">
                          SEYVEN
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-1">
                        <div>
                          <h4 className="text-xs uppercase tracking-[0.12em] font-medium text-[#1C1917] truncate">
                            {item.titleEn}
                          </h4>
                          <p className="text-[10px] uppercase tracking-[0.08em] text-[#1C1917]/60 mt-0.5">
                            {item.volume}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeItem(item.id)}
                          className="p-1 text-[#1C1917]/40 hover:text-[#1C1917] transition-colors cursor-pointer"
                          title="Remove Item"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="flex items-center justify-between mt-2.5">
                        {/* Quantity Controls */}
                        <div className="flex items-center border border-[#E6DFD5] bg-[#F9F6F0]">
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="p-1.5 hover:text-[#C7A97B] transition-colors focus:outline-none cursor-pointer"
                            aria-label="Decrease quantity"
                          >
                            <Minus className="w-3 h-3 stroke-[1.5]" />
                          </button>
                          <span className="px-2 text-xs font-mono font-medium">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="p-1.5 hover:text-[#C7A97B] transition-colors focus:outline-none cursor-pointer"
                            aria-label="Increase quantity"
                          >
                            <Plus className="w-3 h-3 stroke-[1.5]" />
                          </button>
                        </div>

                        {/* Item Total Price */}
                        <DrawerPrice amount={item.priceBdt * item.quantity} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Privilege and Discount Row */}
            {items.length > 0 && (privilegeCode || discountBdt > 0) && (
              <div className="space-y-2 pt-3 border-t border-[#E6DFD5]">
                {/* Active Sanctuary Client Privilege Badge */}
                {privilegeCode && (
                  <div className="p-2.5 bg-[#1C1917] text-[#FAF8F5] border border-[#C7A97B]/60 flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-1.5 min-w-0">
                      <Sparkles className="w-3.5 h-3.5 text-[#C7A97B] shrink-0" />
                      <span className="font-serif text-[10px] uppercase tracking-wider truncate">
                        SANCTUARY PRIVILEGE HONORED:{' '}
                        <strong className="font-mono text-[#C7A97B] font-semibold">{privilegeCode}</strong>
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={removePrivilege}
                      className="text-[9px] text-[#FAF8F5]/60 hover:text-white underline cursor-pointer tracking-wider transition-colors shrink-0 ml-2"
                    >
                      REMOVE
                    </button>
                  </div>
                )}

                {discountBdt > 0 && (
                  <div className="flex justify-between items-center text-[#8C6D3B] text-xs pt-1">
                    <span className="flex items-center gap-1.5 font-light">
                      <Sparkles className="w-3 h-3 text-[#C7A97B]" />
                      <span className="font-serif">
                        {activePrivilegeLabel || 'Sanctuary Privilege Courtesy'}
                      </span>
                    </span>
                    <DrawerPrice amount={discountBdt} prefix="-" isDiscount />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 3. Sticky Bottom Checkout Bar */}
          {items.length > 0 && (
            <div className="p-4 sm:p-5 border-t border-[#E6DFD5] bg-[#F9F6F0] shrink-0 space-y-3 pb-[calc(1rem+env(safe-area-inset-bottom))] shadow-xl">
              <div className="flex justify-between items-baseline">
                <span className="text-xs uppercase tracking-[0.2em] font-medium text-[#1C1917]">
                  TOTAL DUE
                </span>
                <DrawerPrice amount={Math.max(0, subtotalBdt - discountBdt)} size="lg" isHighlight />
              </div>

              <Link
                href="/checkout"
                onClick={closeBag}
                className="w-full py-3.5 bg-[#1C1917] hover:bg-[#1C1917]/90 active:scale-[0.99] text-[#F9F6F0] uppercase text-xs tracking-[0.22em] font-medium flex items-center justify-center space-x-2 transition-all shadow-md cursor-pointer"
              >
                <span>PROCEED TO CHECKOUT</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <div className="flex items-center justify-center space-x-3 pt-0.5 text-[9px] uppercase tracking-[0.1em] text-[#1C1917]/60">
                <span className="flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-[#C7A97B]" />
                  MINDFULLY CRAFTED
                </span>
                <span>•</span>
                <span>DEDICATED CLIENT CARE</span>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
