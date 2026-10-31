'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { ChevronDown, Sparkles, ShieldCheck } from 'lucide-react';
import { useCart } from '@/context/cart-context';
import { useLanguage } from '@/context/language-context';
import { formatBdt } from '@/lib/formatters';

interface CheckoutOrderSummaryProps {
  deliveryFeeBdt: number;
  loyaltyDiscountBdt: number;
}

function BdtPrice({
  amount,
  prefix = '',
  size = 'sm',
  isHighlight = false,
  isDiscount = false,
  className = '',
}: {
  amount: number;
  prefix?: string;
  size?: 'xs' | 'sm' | 'base' | 'lg' | 'xl';
  isHighlight?: boolean;
  isDiscount?: boolean;
  className?: string;
}) {
  const formattedNumber = Math.round(Math.abs(amount)).toLocaleString('en-IN');

  if (size === 'xl') {
    return (
      <span className={`inline-flex items-baseline font-sans tabular-nums ${className}`}>
        {prefix && <span className="mr-0.5 text-base font-normal">{prefix}</span>}
        <span className="text-sm font-normal text-[#C7A97B] mr-1 select-none">৳</span>
        <span className="text-xl sm:text-2xl font-semibold tracking-tight text-[#1C1917]">
          {formattedNumber}
        </span>
      </span>
    );
  }

  if (size === 'base') {
    return (
      <span className={`inline-flex items-baseline font-sans tabular-nums ${className}`}>
        {prefix && <span className="mr-0.5 text-xs font-normal">{prefix}</span>}
        <span className="text-xs font-normal text-[#C7A97B] mr-1 select-none">৳</span>
        <span className="text-sm font-semibold tracking-tight text-[#1C1917]">
          {formattedNumber}
        </span>
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-baseline font-sans tabular-nums ${
        isDiscount
          ? 'text-emerald-700 font-medium'
          : isHighlight
          ? 'text-[#1C1917] font-semibold'
          : 'text-[#1C1917] font-medium'
      } ${className}`}
    >
      {prefix && <span className="mr-0.5">{prefix}</span>}
      <span
        className={`select-none mr-0.5 ${
          isDiscount
            ? 'text-emerald-600/80 text-[11px]'
            : 'text-[#1C1917]/50 text-[11px]'
        }`}
      >
        ৳
      </span>
      <span className={size === 'xs' ? 'text-[11px]' : 'text-xs'}>
        {formattedNumber}
      </span>
    </span>
  );
}

export function CheckoutOrderSummary({ deliveryFeeBdt, loyaltyDiscountBdt }: CheckoutOrderSummaryProps) {
  const { lang, t } = useLanguage();
  const {
    items,
    subtotalBdt,
    discountBdt,
    privilegeCode,
    activePrivilegeLabel,
    applyPrivilege,
    removePrivilege,
    isCampaignRunning,
    settings,
    vatBdt,
  } = useCart();
  const [isItemsExpanded, setIsItemsExpanded] = useState(false);
  const [inputCode, setInputCode] = useState('');
  const [isApplying, setIsApplying] = useState(false);
  const [applyError, setApplyError] = useState<string | null>(null);

  const handleApply = async () => {
    if (!inputCode.trim()) return;
    setIsApplying(true);
    setApplyError(null);
    const res = await applyPrivilege(inputCode);
    setIsApplying(false);
    if (!res.success) {
      setApplyError(res.message);
    } else {
      setInputCode('');
    }
  };

  const netTotal = Math.max(0, subtotalBdt - discountBdt - loyaltyDiscountBdt + deliveryFeeBdt);

  return (
    <div className="bg-[#F9F6F0] border border-[#E6DFD5] p-4 sm:p-6 space-y-5">
      {/* Mobile Collapsible Header */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setIsItemsExpanded(!isItemsExpanded)}
          className="flex items-center space-x-2 text-left group cursor-pointer"
        >
          <span className="text-xs font-serif uppercase tracking-[0.2em] font-medium text-[#1C1917] group-hover:text-[#C7A97B] transition-colors">
            SANCTUARY BAG SUMMARY ({items.length})
          </span>
          <ChevronDown
            className={`w-3.5 h-3.5 text-[#1C1917]/60 transition-transform duration-200 ${
              isItemsExpanded ? 'rotate-180 text-[#C7A97B]' : ''
            }`}
          />
        </button>

        <BdtPrice amount={netTotal} size="base" />
      </div>

      {/* Item List (Always visible on desktop, collapsible on mobile) */}
      <div className={`${isItemsExpanded ? 'block' : 'hidden lg:block'} space-y-3 pt-1 border-t border-[#E6DFD5]/70`}>
        {items.map((item) => (
          <div key={item.id} className="flex items-center space-x-3 text-xs py-1.5">
            <div className="relative w-12 h-14 bg-[#E6DFD5]/30 border border-[#E6DFD5] shrink-0 overflow-hidden">
              {item.image ? (
                <Image src={item.image} alt={item.titleEn} fill sizes="48px" className="object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[8px] font-serif text-[#1C1917]/40">
                  SEYVEN
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0 space-y-0.5">
              <p className="font-serif uppercase tracking-wider text-[#1C1917] font-medium truncate">
                {item.titleEn}
              </p>
              <p className="text-[10px] text-[#1C1917]/60 tracking-wider">
                {item.volume} • QTY: {item.quantity}
              </p>
            </div>

            <div className="shrink-0">
              <BdtPrice amount={item.priceBdt * item.quantity} />
            </div>
          </div>
        ))}

        {/* Complimentary Gift With Purchase badge for orders 2500+ */}
        {subtotalBdt >= 2500 && (
          <div className="p-2.5 bg-[#C7A97B]/10 border border-[#C7A97B]/40 flex items-center space-x-2 text-[10px] text-[#1C1917]">
            <Sparkles className="w-3.5 h-3.5 text-[#C7A97B] shrink-0" />
            <span className="font-medium tracking-wide">
              [ COMPLIMENTARY LUXURY MINIATURE INCLUDED ]
            </span>
          </div>
        )}
      </div>

      {/* Campaign Privilege Section: Only displayed when festival campaign is running */}
      {isCampaignRunning && (
        <div className="pt-2 border-t border-[#E6DFD5]/80 space-y-2">
          {privilegeCode ? (
            <div className="p-2.5 bg-[#1C1917] text-[#FAF8F5] border border-[#C7A97B]/60 flex items-center justify-between text-xs">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-3.5 h-3.5 text-[#C7A97B] shrink-0" />
                <span className="font-serif tracking-wider text-[11px] uppercase">
                  PRIVILEGE HONORED:{' '}
                  <strong className="font-mono text-[#C7A97B] font-semibold">{privilegeCode}</strong>
                </span>
              </div>
              <button
                type="button"
                onClick={removePrivilege}
                className="text-[10px] text-[#FAF8F5]/60 hover:text-white underline cursor-pointer tracking-wider transition-colors"
              >
                REMOVE
              </button>
            </div>
          ) : (
            <div>
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={inputCode}
                  onChange={(e) => {
                    setInputCode(e.target.value.toUpperCase());
                    setApplyError(null);
                  }}
                  placeholder="Privilege Code (e.g. EID7)"
                  className="flex-1 bg-white border border-[#E6DFD5] px-3 py-2 text-xs uppercase tracking-wider text-[#1C1917] placeholder:text-[#1C1917]/40 focus:outline-hidden focus:border-[#C7A97B]"
                />
                <button
                  type="button"
                  onClick={handleApply}
                  disabled={isApplying || !inputCode.trim()}
                  className="px-4 py-2 bg-[#1C1917] hover:bg-[#1C1917]/90 disabled:opacity-40 text-[#F9F6F0] text-[11px] uppercase tracking-wider font-medium cursor-pointer transition-colors"
                >
                  {isApplying ? '...' : 'APPLY'}
                </button>
              </div>
              {applyError && (
                <p className="text-[10px] text-rose-600 mt-1 font-light">{applyError}</p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Financial Breakdown Table */}
      <div className="space-y-2.5 pt-1 text-xs">
        {/* Subtotal */}
        <div className="flex justify-between items-center text-[#1C1917]/80">
          <span className="font-light">Subtotal (Formulations)</span>
          <BdtPrice amount={subtotalBdt} />
        </div>

        {/* Client Privilege Discount */}
        {discountBdt > 0 && (
          <div className="flex justify-between items-center text-[#8C6D3B]">
            <span className="flex items-center gap-1.5 font-light">
              <Sparkles className="w-3.5 h-3.5 text-[#C7A97B]" />
              <span className="font-serif">
                {activePrivilegeLabel || 'Sanctuary Client Privilege'}
              </span>
            </span>
            <BdtPrice amount={discountBdt} prefix="-" isDiscount />
          </div>
        )}

        {/* Returning Client Courtesy */}
        {loyaltyDiscountBdt > 0 && (
          <div className="flex justify-between items-center text-emerald-800">
            <span className="flex items-center gap-1.5 font-light">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 inline-block" />
              Returning Client Courtesy Privilege
            </span>
            <BdtPrice amount={loyaltyDiscountBdt} prefix="-" isDiscount />
          </div>
        )}

        {/* Delivery Fee */}
        <div className="flex justify-between items-center text-[#1C1917]/80">
          <span className="font-light">Delivery Protocol Fee</span>
          {deliveryFeeBdt === 0 ? (
            <span className="text-[10px] uppercase tracking-wider font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded-xs">
              COMPLIMENTARY
            </span>
          ) : (
            <BdtPrice amount={deliveryFeeBdt} />
          )}
        </div>

        {/* Government VAT notice */}
        {settings?.isVatEnabled && vatBdt > 0 && (
          <div className="flex justify-between items-center text-[#1C1917]/60 text-[11px] pt-0.5">
            <span className="font-light">
              Government VAT ({settings.vatRatePercent}% Inclusive)
            </span>
            <BdtPrice amount={vatBdt} size="xs" className="text-[#1C1917]/60" />
          </div>
        )}

        {/* Net Payable Luxury Box */}
        <div className="mt-3.5 pt-3.5 pb-3 px-3.5 bg-[#E6DFD5]/25 border border-[#E6DFD5] flex justify-between items-baseline">
          <div className="space-y-0.5">
            <span className="text-xs uppercase tracking-[0.2em] font-medium text-[#1C1917] block">
              NET PAYABLE TOTAL
            </span>
            <span className="text-[9px] uppercase tracking-wider text-[#C7A97B] font-medium block">
              {settings?.isVatEnabled && vatBdt > 0
                ? 'OFFICIAL NBR TAX INVOICE INCLUDED'
                : 'DIRECT FORMULATION IMPORT'}
            </span>
          </div>
          <BdtPrice amount={netTotal} size="xl" isHighlight />
        </div>
      </div>
    </div>
  );
}
