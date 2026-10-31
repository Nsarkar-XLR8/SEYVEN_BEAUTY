'use client';

import React, { useMemo } from 'react';
import { ShieldCheck, AlertTriangle, CheckCircle, Sparkles, PlusCircle } from 'lucide-react';
import { useCart } from '@/context/cart-context';
import { useLanguage } from '@/context/language-context';
import { ProductDetail } from '@/data/products';

interface PdpCompatibilityCheckerProps {
  currentProduct: ProductDetail;
}

export function PdpCompatibilityChecker({ currentProduct }: PdpCompatibilityCheckerProps) {
  const { lang, t } = useLanguage();
  const { items } = useCart();

  // Evaluate conflict matrix between current product actives and cart items
  const evaluation = useMemo(() => {
    if (items.length === 0) {
      return { status: 'EMPTY_CART', messages: [] };
    }

    const currentCategories = currentProduct.keyActives.map((a) => a.category);
    const messages: { type: 'CONFLICT' | 'SYNERGY' | 'CAUTION'; textEn: string; textBn?: string }[] = [];

    const hasBhaOrAhaInCart = items.some(
      (item) => item.slug.includes('bha') || item.slug.includes('salicylic') || item.slug.includes('exfoliant')
    );
    const hasRetinoidInCurrent = currentCategories.includes('RETINOID');
    const hasBhaInCurrent = currentCategories.includes('AHA_BHA');

    // Rule 1: Retinoids + AHA/BHA
    if (hasRetinoidInCurrent && hasBhaOrAhaInCart) {
      messages.push({
        type: 'CAUTION',
        textEn: 'Caution: You have chemical exfoliants (AHA/BHA) in your Bag. Alternate applications across separate nights to prevent barrier compromise.',
      });
    }

    // Rule 2: Multiple strong exfoliants
    if (hasBhaInCurrent && hasBhaOrAhaInCart) {
      messages.push({
        type: 'CONFLICT',
        textEn: 'Potential Over-Exfoliation: Combining multiple direct chemical acid exfoliants simultaneously can lead to dermal redness.',
      });
    }

    // Rule 3: Soothing + Actives Synergy
    const hasSoothingOrHydrator = currentCategories.some((c) => c === 'SOOTHING' || c === 'HYDRATOR');
    if (hasSoothingOrHydrator && hasBhaOrAhaInCart) {
      messages.push({
        type: 'SYNERGY',
        textEn: 'Synergistic Pairing: The soothing and hydrating actives in this formulation help mitigate potential dryness from exfoliants.',
      });
    }

    // Rule 4: Sun Filter + Morning routine
    const hasSunFilter = currentCategories.includes('SUN_FILTER');
    if (hasSunFilter) {
      messages.push({
        type: 'SYNERGY',
        textEn: 'Essential Photoprotection: High-potency SPF50+ safeguards all treatment serums in your bag from solar degradation.',
      });
    }

    if (messages.length === 0) {
      messages.push({
        type: 'SYNERGY',
        textEn: 'Harmonious Dermal Matrix: No active chemical conflicts detected with the formulations in your Sanctuary Bag.',
      });
    }

    const hasConflict = messages.some((m) => m.type === 'CONFLICT');
    const hasCaution = messages.some((m) => m.type === 'CAUTION');

    return {
      status: hasConflict ? 'CONFLICT' : hasCaution ? 'CAUTION' : 'COMPATIBLE',
      messages,
    };
  }, [currentProduct, items]);

  return (
    <div className="p-4 sm:p-5 bg-[#F9F6F0] border border-[#E6DFD5] space-y-3">
      {/* Title */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2 text-xs uppercase tracking-[0.2em] font-medium text-[#1C1917]">
          <ShieldCheck className="w-3.5 h-3.5 text-[#C7A97B]" />
          <span>{'ACTIVE COMPATIBILITY ENGINE'}</span>
        </div>
        <span className="text-[9px] uppercase tracking-wider text-[#C7A97B] font-medium">
          CLINICAL SAFETY
        </span>
      </div>

      {evaluation.status === 'EMPTY_CART' ? (
        <div className="p-3 bg-[#E6DFD5]/25 border border-[#E6DFD5] text-xs text-[#1C1917]/70 flex items-start space-x-2">
          <Sparkles className="w-3.5 h-3.5 text-[#C7A97B] shrink-0 mt-0.5" />
          <p className="font-light leading-relaxed">
            {'Your Sanctuary Bag is currently empty. As you curate multiple formulations, our clinical compatibility engine will automatically verify active ingredient synergy.'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {evaluation.messages.map((msg, idx) => (
            <div
              key={idx}
              className={`p-3 border text-xs flex items-start space-x-2.5 ${
                msg.type === 'CONFLICT'
                  ? 'bg-rose-50/60 border-rose-200 text-rose-900'
                  : msg.type === 'CAUTION'
                  ? 'bg-amber-50/60 border-amber-200 text-amber-900'
                  : 'bg-emerald-50/60 border-emerald-200 text-emerald-900'
              }`}
            >
              {msg.type === 'CONFLICT' ? (
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              ) : msg.type === 'CAUTION' ? (
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              ) : (
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              )}
              <p className="leading-relaxed">
                {msg.textEn}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
