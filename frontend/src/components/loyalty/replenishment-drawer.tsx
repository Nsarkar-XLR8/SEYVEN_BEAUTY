'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { RefreshCw, ShoppingBag, Clock, AlertTriangle, CheckCircle2, Sparkles, ArrowRight } from 'lucide-react';
import { useCart } from '@/context/cart-context';
import { useLanguage } from '@/context/language-context';
import { formatBdt } from '@/lib/formatters';

export interface ReplenishmentItem {
  id: string;
  productId: string;
  slug: string;
  variantId: string;
  titleEn: string;
  titleBn: string;
  volume: string;
  priceBdt: number;
  imageUrl?: string;
  deliveredDate: string;
  estimatedLifespanDays: number;
  daysRemaining: number;
  depletionPercent: number; // 0 to 100
  status: 'DUE_SOON' | 'ACTIVE' | 'DEPLETED';
}

interface ReplenishmentDrawerProps {
  items?: ReplenishmentItem[];
}

export function ReplenishmentDrawer({ items = [] }: ReplenishmentDrawerProps) {
  const { lang, t } = useLanguage();
  const { addItem } = useCart();
  const [reorderedId, setReorderedId] = useState<string | null>(null);

  if (!items || items.length === 0) {
    return null;
  }

  const sampleItems: ReplenishmentItem[] = items;

  const handleReorder = (item: ReplenishmentItem) => {
    addItem({
      variantId: item.variantId,
      productId: item.productId,
      slug: item.slug,
      titleEn: item.titleEn,
      titleBn: item.titleBn,
      volume: item.volume,
      priceBdt: item.priceBdt,
      image: item.imageUrl,
    });

    setReorderedId(item.id);
    setTimeout(() => setReorderedId(null), 2500);
  };

  return (
    <div className="p-6 bg-[#F9F6F0] border border-[#E6DFD5] space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E6DFD5] pb-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2 text-[10px] uppercase tracking-[0.25em] text-[#C7A97B] font-semibold">
            <RefreshCw className="w-3.5 h-3.5" />
            <span>{t('YOUR BEAUTY ROUTINE', 'আপনার পছন্দের স্কিনকেয়ার রুটিন')}</span>
          </div>

          <h3 className="text-base sm:text-lg font-serif uppercase tracking-[0.16em] text-[#1C1917] font-medium">
            {t('EASY ROUTINE RE-ORDER', 'সহজেই পুনরায় অর্ডার করুন')}
          </h3>
        </div>

        <span className="text-[10px] text-[#1C1917]/60 font-light">
          {t('1-Tap replenishment for your curated icons', 'এক ক্লিকেই আপনার পছন্দের প্রোডাক্ট পুনরায় সংগ্রহ করুন')}
        </span>
      </div>

      {/* Replenishment Items List */}
      <div className="space-y-4">
        {sampleItems.map((item) => {
          const isDueSoon = item.status === 'DUE_SOON';
          const isReordered = reorderedId === item.id;

          return (
            <div
              key={item.id}
              className={`p-4 border transition-all ${isDueSoon
                  ? 'bg-amber-50/30 border-amber-200/80'
                  : 'bg-[#F9F6F0] border-[#E6DFD5]'
                }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">

                {/* Product Meta & Image */}
                <div className="flex items-center space-x-4">
                  <div className="relative w-14 h-16 bg-[#E6DFD5]/40 border border-[#E6DFD5] overflow-hidden shrink-0">
                    {item.imageUrl ? (
                      <Image src={item.imageUrl} alt={item.titleEn} fill sizes="56px" className="object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[8px] font-serif text-[#1C1917]/30">
                        SEYVEN
                      </div>
                    )}
                  </div>

                  <div className="space-y-0.5">
                    <div className="flex items-center space-x-2">
                      <Link
                        href={`/catalog/${item.slug}`}
                        className="text-xs font-serif uppercase tracking-wider text-[#1C1917] hover:text-[#C7A97B] font-medium transition-colors"
                      >
                        {lang === 'bn' ? item.titleBn : item.titleEn}
                      </Link>
                    </div>

                    <p className="text-[10px] text-[#1C1917]/60 font-mono">
                      {item.volume} • Delivered on {item.deliveredDate}
                    </p>

                    <p className="text-xs font-sans font-semibold text-[#1C1917] tabular-nums pt-0.5">
                      {formatBdt(item.priceBdt)}
                    </p>
                  </div>
                </div>

                {/* Status Badge & Action Button */}
                <div className="flex items-center justify-between sm:justify-end gap-4">
                  <span className={`text-[9px] uppercase tracking-wider px-2.5 py-1 border font-medium ${isDueSoon
                      ? 'bg-amber-50 text-amber-900 border-amber-200'
                      : 'bg-[#E6DFD5]/40 text-[#1C1917]/70 border-[#E6DFD5]'
                    }`}>
                    {isDueSoon ? t('TIME TO REFILL', 'রিফিল করার উপযুক্ত সময়') : t('IN YOUR ROUTINE', 'আপনার রুটিনে অন্তর্ভুক্ত')}
                  </span>

                  {/* 1-Tap Reorder Action */}
                  <button
                    type="button"
                    onClick={() => handleReorder(item)}
                    className={`px-4 py-2.5 text-xs uppercase tracking-[0.2em] font-medium transition-colors flex items-center space-x-1.5 shrink-0 cursor-pointer ${isReordered
                        ? 'bg-emerald-700 text-[#F9F6F0]'
                        : 'bg-[#1C1917] hover:bg-[#1C1917]/90 text-[#F9F6F0]'
                      }`}
                  >
                    {isReordered ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#C7A97B]" />
                        <span>ADDED</span>
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-3 h-3 text-[#C7A97B]" />
                        <span>{t('ORDER AGAIN', 'পুনরায় অর্ডার')}</span>
                      </>
                    )}
                  </button>
                </div>

              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
