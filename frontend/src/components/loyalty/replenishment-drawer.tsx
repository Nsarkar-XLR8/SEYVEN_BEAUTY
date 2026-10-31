'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { RefreshCw, CheckCircle2 } from 'lucide-react';
import { useCart } from '@/context/cart-context';
import { formatBdt } from '@/lib/formatters';

interface ReplenishmentItem {
  id: string;
  slug: string;
  titleEn: string;
  volume: string;
  priceBdt: number;
  imageUrl?: string;
  deliveredDate: string;
  status: 'DUE_SOON' | 'ACTIVE';
}

export function ReplenishmentDrawer() {
  const { addItem } = useCart();
  const [reorderedId, setReorderedId] = useState<string | null>(null);

  const sampleItems: ReplenishmentItem[] = [
    {
      id: 'rep-01',
      slug: 'seyven-niacinamide-10-serum',
      titleEn: 'Seyven Niacinamide 10% Clinical Formulation',
      volume: '30ml',
      priceBdt: 1850,
      imageUrl: '/images/products/niacinamide.jpg',
      deliveredDate: '12 Sep 2026',
      status: 'DUE_SOON',
    },
    {
      id: 'rep-02',
      slug: 'seyven-ceramide-barrier-cream',
      titleEn: 'Seyven Ceramide Dermal Barrier Shield',
      volume: '50ml',
      priceBdt: 2400,
      imageUrl: '/images/products/ceramide.jpg',
      deliveredDate: '28 Aug 2026',
      status: 'ACTIVE',
    },
  ];

  const handleReorder = (item: ReplenishmentItem) => {
    addItem({
      variantId: `var-${item.id}`,
      productId: item.id,
      slug: item.slug,
      titleEn: item.titleEn,
      titleBn: item.titleEn,
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
            <span>YOUR BEAUTY ROUTINE</span>
          </div>

          <h3 className="text-base sm:text-lg font-serif uppercase tracking-[0.16em] text-[#1C1917] font-medium">
            EASY ROUTINE RE-ORDER
          </h3>
        </div>

        <span className="text-[10px] text-[#1C1917]/60 font-light">
          1-Tap replenishment for your curated icons
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
              className={`p-4 border transition-all ${
                isDueSoon
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
                        {item.titleEn}
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
                  <span
                    className={`text-[9px] uppercase tracking-wider px-2.5 py-1 border font-medium ${
                      isDueSoon
                        ? 'bg-amber-50 text-amber-900 border-amber-200'
                        : 'bg-[#E6DFD5]/40 text-[#1C1917]/70 border-[#E6DFD5]'
                    }`}
                  >
                    {isDueSoon ? 'TIME TO REFILL' : 'IN YOUR ROUTINE'}
                  </span>

                  {/* 1-Tap Reorder Action */}
                  <button
                    type="button"
                    onClick={() => handleReorder(item)}
                    className={`px-4 py-2.5 text-xs uppercase tracking-[0.2em] font-medium transition-colors flex items-center space-x-1.5 shrink-0 cursor-pointer ${
                      isReordered
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
                        <span>ORDER AGAIN</span>
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
