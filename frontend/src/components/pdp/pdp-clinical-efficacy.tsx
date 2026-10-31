'use client';

import React from 'react';
import Link from 'next/link';
import { Sparkles, MessageCircle, ArrowRight, Compass, Shield, HeartHandshake } from 'lucide-react';
import { useLanguage } from '@/context/language-context';
import { useCart } from '@/context/cart-context';
import { getPrimaryConciergeAction } from '@/lib/concierge';

interface PdpClinicalEfficacyProps {
  productId: string;
  productTitle: string;
}

export function PdpClinicalEfficacy({ productId, productTitle }: PdpClinicalEfficacyProps) {
  const { t } = useLanguage();
  const { settings } = useCart();
  const concierge = getPrimaryConciergeAction(settings, {
    productTitle,
    priceBdt: 0,
  });

  const highlights = [
    {
      icon: Compass,
      title: 'CURATED GLOBAL BRANDS',
      desc: 'Handpicked directly from leading skincare houses across Korea and worldwide.',
    },
    {
      icon: Shield,
      title: 'CLIMATE COMPATIBILITY',
      desc: 'Lightweight textures and barrier-supportive solutions tailored for humid subtropical weather.',
    },
    {
      icon: HeartHandshake,
      title: 'PERSONALIZED ADVISORY',
      desc: 'Consult our skincare advisors for bespoke routine matching and usage guidance.',
    },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* 1. Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-[#E6DFD5]">
        <div className="space-y-2">
          <div className="flex items-center space-x-2 text-[10px] uppercase tracking-[0.25em] text-[#C7A97B] font-medium">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{'THE SANCTUARY OF BEAUTY // CURATED SKINCARE'}</span>
          </div>
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-serif uppercase tracking-[0.16em] font-light text-[#1C1917]">
            {'FIND YOUR PERFECT REGIMEN'}
          </h2>
          <p className="text-xs text-[#1C1917]/70 font-light max-w-xl leading-relaxed">
            {'Discover genuine international skincare selected specifically for Bangladeshi skin concerns.'}
          </p>
        </div>

        <Link
          href="/catalog"
          className="inline-flex items-center space-x-2 text-[10px] uppercase tracking-[0.2em] text-[#1C1917] hover:text-[#C7A97B] transition-colors font-medium"
        >
          <span>{'EXPLORE THE EDIT'}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* 2. Three Luxury Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {highlights.map((item, index) => {
          const Icon = item.icon;
          return (
            <div
              key={index}
              className="p-6 bg-[#F9F6F0] border border-[#E6DFD5] space-y-3"
            >
              <div className="w-8 h-8 rounded-full bg-[#1C1917]/5 flex items-center justify-center text-[#C7A97B]">
                <Icon className="w-4 h-4 stroke-[1.5]" />
              </div>

              <h3 className="text-xs uppercase tracking-[0.2em] font-medium text-[#1C1917]">
                {item.title}
              </h3>

              <p className="text-[11px] text-[#1C1917]/70 font-light leading-relaxed">
                {item.desc}
              </p>
            </div>
          );
        })}
      </div>

      {/* 3. Skin Advisory Concierge Banner */}
      <div className="p-6 sm:p-8 bg-[#1C1917] text-[#F9F6F0] flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2 text-center md:text-left max-w-xl">
          <span className="text-[9px] uppercase tracking-[0.25em] text-[#C7A97B] block font-medium">
            {'COMPLIMENTARY SKIN CONSULTATION'}
          </span>
          <p className="font-serif text-sm sm:text-base font-light leading-relaxed text-[#F9F6F0]/90">
            {'Unsure which international formulation best suits your skin goals? Speak directly with our dedicated beauty advisors.'}
          </p>
        </div>

        <div className="shrink-0 flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <a
            href={concierge.url}
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-3.5 bg-[#C7A97B] text-[#1C1917] text-[10px] uppercase tracking-[0.25em] font-medium hover:bg-[#C7A97B]/90 transition-colors flex items-center justify-center space-x-2 text-center"
          >
            <MessageCircle className="w-3.5 h-3.5" />
            <span>{concierge.shortLabel + ' CONCIERGE'}</span>
          </a>

          <Link
            href="/catalog"
            className="px-6 py-3.5 border border-[#F9F6F0]/30 text-[#F9F6F0] text-[10px] uppercase tracking-[0.25em] font-medium hover:bg-[#F9F6F0]/10 transition-colors flex items-center justify-center space-x-2 text-center"
          >
            <span>{'EXPLORE THE EDIT'}</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
