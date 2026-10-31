'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Plus, Check } from 'lucide-react';
import { useCart } from '@/context/cart-context';
import { useLanguage } from '@/context/language-context';
import { formatBdt } from '@/lib/formatters';

export interface ProductCardProps {
  id: string;
  slug: string;
  brand?: string;
  titleEn: string;
  titleBn: string;
  purposeEn?: string;
  purposeBn?: string;
  volume: string;
  priceBdt: number;
  imageUrl?: string;
  routineTag?: string;
  variantId: string;
}

export function ProductCard({
  id,
  slug,
  brand,
  titleEn,
  titleBn,
  purposeEn,
  purposeBn,
  volume,
  priceBdt,
  imageUrl,
  routineTag,
  variantId,
}: ProductCardProps) {
  const { addItem } = useCart();
  const { lang, t } = useLanguage();
  const [isJustAdded, setIsJustAdded] = React.useState(false);

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    addItem(
      {
        variantId,
        productId: id,
        slug,
        titleEn,
        titleBn,
        volume,
        priceBdt,
        image: imageUrl,
      },
      1,
      false // Keep browsing fluid without intrusive drawer interruptions
    );

    // Plan A: Instant satisfying tactile checkmark micro-feedback
    setIsJustAdded(true);
    setTimeout(() => {
      setIsJustAdded(false);
    }, 2000);
  };

  const [imgError, setImgError] = React.useState(false);

  return (
    <div className="group relative flex flex-col justify-between transition-all duration-300">
      {/* 4:5 Image Canvas */}
      <div className="relative aspect-[4/5] w-full bg-[#E6DFD5]/30 border border-[#E6DFD5] overflow-hidden flex items-center justify-center">
        <Link href={`/catalog/${slug}`} className="absolute inset-0 block">
          {imageUrl && !imgError ? (
            <Image
              src={imageUrl}
              alt={titleEn}
              fill
              unoptimized
              sizes="(max-width: 768px) 50vw, 25vw"
              onError={() => setImgError(true)}
              className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center select-none">
              <span className="text-xl font-serif tracking-[0.3em] uppercase text-[#1C1917]/25 font-light">
                SEYVEN
              </span>
              <span className="text-[9px] uppercase tracking-[0.2em] text-[#C7A97B]/50 mt-1">
                THE SANCTUARY OF BEAUTY
              </span>
            </div>
          )}
        </Link>

        {/* Routine Tag Pill */}
        {routineTag && (
          <div className="absolute top-2 left-2 sm:top-3 sm:left-3 bg-[#F9F6F0]/90 backdrop-blur-sm px-2 py-0.5 sm:px-2.5 sm:py-1 text-[7px] sm:text-[8px] uppercase tracking-[0.18em] sm:tracking-[0.2em] text-[#C7A97B] font-medium border border-[#E6DFD5] pointer-events-none z-10">
            {routineTag}
          </div>
        )}

        {/* Desktop Luxury Quick Add Slide-Up Bar */}
        <div className="absolute inset-x-0 bottom-0 p-3 hidden sm:block pointer-events-none z-20">
          <button
            type="button"
            onClick={handleQuickAdd}
            className={`w-full py-2.5 backdrop-blur-md text-[9px] uppercase tracking-[0.22em] font-medium transition-all duration-300 shadow-lg flex items-center justify-center space-x-1.5 opacity-0 translate-y-3 group-hover:opacity-100 group-hover:translate-y-0 pointer-events-auto ${
              isJustAdded
                ? 'bg-[#1C1917] text-[#C7A97B]'
                : 'bg-[#1C1917]/90 hover:bg-[#1C1917] text-[#F9F6F0]'
            }`}
          >
            {isJustAdded ? (
              <>
                <Check className="w-3.5 h-3.5 text-[#C7A97B] stroke-[2.5]" />
                <span>{'ADDED TO BAG'}</span>
              </>
            ) : (
              <>
                <Plus className="w-3.5 h-3.5 stroke-[1.5]" />
                <span>{'QUICK ADD'}</span>
              </>
            )}
          </button>
        </div>

        {/* Mobile Minimal Floating Action Button (Plan A: Instant Tactile Checkmark) */}
        <button
          type="button"
          onClick={handleQuickAdd}
          aria-label={'Add to Bag'}
          className={`sm:hidden absolute bottom-2 right-2 w-7 h-7 rounded-full backdrop-blur-md shadow-sm flex items-center justify-center transition-all duration-300 z-20 ${
            isJustAdded
              ? 'bg-[#1C1917] text-[#C7A97B] scale-110 shadow-md ring-2 ring-[#C7A97B]/40'
              : 'bg-[#F9F6F0]/95 border border-[#E6DFD5] text-[#1C1917] active:scale-90'
          }`}
        >
          {isJustAdded ? (
            <Check className="w-3.5 h-3.5 text-[#C7A97B] stroke-[2.5]" />
          ) : (
            <Plus className="w-3 h-3 stroke-[1.5]" />
          )}
        </button>
      </div>

      {/* Product Details Block */}
      <Link href={`/catalog/${slug}`} className="block pt-2 sm:pt-3 pb-1 space-y-0.5 sm:space-y-1">
        {brand && (
          <p className="text-[8px] sm:text-[10px] uppercase tracking-[0.2em] sm:tracking-[0.25em] text-[#1C1917]/70 font-medium">
            {brand}
          </p>
        )}

        <h3 className="text-xs sm:text-sm font-serif uppercase tracking-[0.12em] sm:tracking-[0.16em] font-normal text-[#1C1917] group-hover:text-[#C7A97B] transition-colors leading-snug line-clamp-1">
          {titleEn}
        </h3>

        {purposeEn && (
          <p className="text-[8px] sm:text-[9px] uppercase tracking-[0.15em] sm:tracking-[0.2em] text-[#C7A97B] font-medium truncate">
            {purposeEn}
          </p>
        )}

        <div className="flex items-center justify-between pt-0.5 sm:pt-1 gap-2">
          <span className="text-[9px] sm:text-[10px] uppercase tracking-[0.12em] text-[#1C1917]/60 truncate">
            {volume}
          </span>
          <span className="text-[11px] sm:text-xs font-sans font-medium text-[#1C1917] tabular-nums whitespace-nowrap shrink-0">
            {formatBdt(priceBdt)}
          </span>
        </div>
      </Link>
    </div>
  );
}
