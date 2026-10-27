'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { X, Plus, Minus, ShoppingBag, ArrowRight, Tag, ShieldCheck, Sparkles } from 'lucide-react';
import { useCart } from '@/context/cart-context';
import { useLanguage } from '@/context/language-context';
import { formatBdt } from '@/lib/formatters';

function DrawerPrice({
  amount,
  prefix = '',
  size = 'sm',
  isDiscount = false,
  isHighlight = false,
}: {
  amount: number;
  prefix?: string;
  size?: 'xs' | 'sm' | 'base' | 'lg';
  isDiscount?: boolean;
  isHighlight?: boolean;
}) {
  const formatted = Math.round(Math.abs(amount)).toLocaleString('en-IN');
  return (
    <span
      className={`inline-flex items-baseline font-sans tabular-nums ${
        isDiscount
          ? 'text-emerald-700 font-medium'
          : isHighlight
          ? 'text-[#1C1917] font-semibold'
          : 'text-[#1C1917] font-medium'
      }`}
    >
      {prefix && <span className="mr-0.5">{prefix}</span>}
      <span
        className={`select-none mr-0.5 ${
          isHighlight
            ? 'text-[#C7A97B] text-xs'
            : isDiscount
            ? 'text-emerald-600/80 text-[11px]'
            : 'text-[#1C1917]/50 text-[11px]'
        }`}
      >
        ৳
      </span>
      <span className={size === 'lg' ? 'text-base font-semibold' : size === 'base' ? 'text-sm' : size === 'xs' ? 'text-[11px]' : 'text-xs'}>
        {formatted}
      </span>
    </span>
  );
}

export function CartDrawer() {
  const pathname = usePathname();
  const {
    items,
    itemCount,
    subtotalBdt,
    vatBdt,
    discountBdt,
    privilegeCode,
    activePrivilegeLabel,
    deliveryFeeBdt,
    totalBdt,
    freeDeliveryThreshold,
    amountNeededForFreeDelivery,
    freeDeliveryProgressPercent,
    isBagOpen,
    closeBag,
    updateQuantity,
    removeItem,
    removePrivilege,
  } = useCart();

  const { t } = useLanguage();

  // Close bag automatically on route change (e.g. going to /checkout)
  useEffect(() => {
    if (isBagOpen) {
      closeBag();
    }
  }, [pathname]);

  if (!isBagOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Dimmed Alabaster Backdrop */}
      <div
        className="fixed inset-0 bg-[#1C1917]/50 backdrop-blur-xs transition-opacity"
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
                {t('SANCTUARY BAG', 'শপিং ব্যাগ')} ({itemCount})
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

          {/* Dynamic Free Delivery Progress Bar (100% Dynamic from Admin Settings) */}
          {items.length > 0 && (
            <div className="px-5 sm:px-6 py-2.5 bg-[#F5F1E8] border-b border-[#E6DFD5] space-y-1.5 shrink-0">
              <div className="flex items-center justify-between text-[11px] font-serif">
                {amountNeededForFreeDelivery > 0 ? (
                  <span className="text-[#1C1917]/80">
                    {t(
                      `Add ৳${amountNeededForFreeDelivery.toLocaleString()} more for Complimentary Delivery`,
                      `ফ্রি ডেলিভারির জন্য আরও ৳${amountNeededForFreeDelivery.toLocaleString()} যোগ করুন`
                    )}
                  </span>
                ) : (
                  <span className="text-emerald-800 font-medium flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#C7A97B]" />
                    {t('Complimentary Nationwide Delivery Unlocked', 'কমপ্লিমেন্টারি ফ্রি ডেলিভারি সক্রিয় হয়েছে')}
                  </span>
                )}
                <span className="text-[10px] font-mono text-[#78716C]">
                  ৳{(subtotalBdt - discountBdt).toLocaleString()} / ৳{freeDeliveryThreshold.toLocaleString()}
                </span>
              </div>
              <div className="w-full h-1 bg-[#E6DFD5] overflow-hidden rounded-full">
                <div
                  className="h-full bg-[#C7A97B] transition-all duration-300"
                  style={{ width: `${freeDeliveryProgressPercent}%` }}
                />
              </div>
            </div>
          )}

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
                    {t('YOUR BAG IS EMPTY', 'আপনার ব্যাগ খালি')}
                  </p>
                  <p className="text-[11px] text-[#1C1917]/60 font-light mt-0.5">
                    {t('Discover our clinical formulations curated for your skin.', 'আপনার ত্বকের যত্নে বিজ্ঞানসম্মত ফর্মুলেশনগুলো দেখুন।')}
                  </p>
                </div>
                <Link
                  href="/catalog"
                  onClick={closeBag}
                  className="px-5 py-2.5 bg-[#1C1917] text-[#F9F6F0] text-[10px] uppercase tracking-[0.25em] font-medium hover:bg-[#1C1917]/90 transition-all"
                >
                  {t('EXPLORE FORMULATIONS', 'ফর্মুলেশনসমূহ দেখুন')}
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
                            {t(item.titleEn, item.titleBn)}
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
                            onClick={() => updateQuantity(item.id, -1)}
                            className="px-2 py-1 text-xs text-[#1C1917]/70 hover:text-[#1C1917] focus:outline-none cursor-pointer"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="px-2 text-xs font-sans font-medium text-[#1C1917] tabular-nums">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.id, 1)}
                            className="px-2 py-1 text-xs text-[#1C1917]/70 hover:text-[#1C1917] focus:outline-none cursor-pointer"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        {/* Price */}
                        <DrawerPrice amount={item.priceBdt * item.quantity} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Price Breakdown Details (Only rendered if privilege or seasonal discount is active) */}
            {items.length > 0 && (privilegeCode || discountBdt > 0) && (
              <div className="space-y-2 pt-3 border-t border-[#E6DFD5]">
                {/* Active Sanctuary Client Privilege Badge (Auto-honored from seasonal campaign or private link) */}
                {privilegeCode && (
                  <div className="p-2.5 bg-[#1C1917] text-[#FAF8F5] border border-[#C7A97B]/60 flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-1.5 min-w-0">
                      <Sparkles className="w-3.5 h-3.5 text-[#C7A97B] shrink-0" />
                      <span className="font-serif text-[10px] uppercase tracking-wider truncate">
                        {t('SANCTUARY PRIVILEGE HONORED:', 'প্রিভিলেজ সক্রিয়:')}{' '}
                        <strong className="font-mono text-[#C7A97B] font-semibold">{privilegeCode}</strong>
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={removePrivilege}
                      className="text-[9px] text-[#FAF8F5]/60 hover:text-white underline cursor-pointer tracking-wider transition-colors shrink-0 ml-2"
                    >
                      {t('REMOVE', 'মুছুন')}
                    </button>
                  </div>
                )}

                {discountBdt > 0 && (
                  <div className="flex justify-between items-center text-[#8C6D3B] text-xs pt-1">
                    <span className="flex items-center gap-1.5 font-light">
                      <Sparkles className="w-3 h-3 text-[#C7A97B]" />
                      <span className="font-serif">
                        {activePrivilegeLabel || t('Sanctuary Privilege Courtesy', 'সানকচুয়ারি প্রিভিলেজ ছাড়')}
                      </span>
                    </span>
                    <DrawerPrice amount={discountBdt} prefix="-" isDiscount />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 3. Sticky Bottom Checkout Bar (100% Always Visible on Mobile) */}
          {items.length > 0 && (
            <div className="p-4 sm:p-5 border-t border-[#E6DFD5] bg-[#F9F6F0] shrink-0 space-y-3 pb-[calc(1rem+env(safe-area-inset-bottom))] shadow-xl">
              <div className="flex justify-between items-baseline">
                <span className="text-xs uppercase tracking-[0.2em] font-medium text-[#1C1917]">
                  {t('TOTAL DUE', 'সর্বমোট')}
                </span>
                <DrawerPrice amount={Math.max(0, subtotalBdt - discountBdt)} size="lg" isHighlight />
              </div>

              <Link
                href="/checkout"
                onClick={closeBag}
                className="w-full py-3.5 bg-[#1C1917] hover:bg-[#1C1917]/90 active:scale-[0.99] text-[#F9F6F0] uppercase text-xs tracking-[0.22em] font-medium flex items-center justify-center space-x-2 transition-all shadow-md cursor-pointer"
              >
                <span>{t('PROCEED TO CHECKOUT', 'অর্ডার সম্পন্ন করুন')}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <div className="flex items-center justify-center space-x-3 pt-0.5 text-[9px] uppercase tracking-[0.1em] text-[#1C1917]/60">
                <span className="flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-[#C7A97B]" />
                  {t('MINDFULLY CRAFTED', 'নিখুঁত ডার্মাল কেয়ার')}
                </span>
                <span>•</span>
                <span>{t('DEDICATED CLIENT CARE', 'বিশ্বস্ত কাস্টমার কেয়ার')}</span>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
