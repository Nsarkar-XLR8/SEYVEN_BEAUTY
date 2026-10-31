'use client';

import React, { useState } from 'react';
import { ChevronDown, Sparkles, Heart, ShieldCheck, Info } from 'lucide-react';
import { useLanguage } from '@/context/language-context';
import { ProductDetail } from '@/data/products';

interface PdpClinicalAccordionProps {
  product: ProductDetail;
}

export function PdpClinicalAccordion({ product }: PdpClinicalAccordionProps) {
  const { lang, t } = useLanguage();

  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    benefits: true,
    howToUse: true,
    safety: false,
    fullInci: false,
  });

  const toggleSection = (key: string) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="border-t border-[#E6DFD5] divide-y divide-[#E6DFD5]">
      
      {/* ------------------------------------------------------------------------- */}
      {/* SECTION 1: WHY YOUR SKIN WILL LOVE THIS */}
      {/* ------------------------------------------------------------------------- */}
      <div className="py-4">
        <button
          type="button"
          onClick={() => toggleSection('benefits')}
          className="w-full flex items-center justify-between text-left group"
        >
          <div className="flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-[#C7A97B]" />
            <h3 className="text-xs uppercase tracking-[0.22em] font-serif font-medium text-[#1C1917] group-hover:text-[#C7A97B] transition-colors">
              {'WHY YOUR SKIN WILL LOVE THIS'}
            </h3>
          </div>
          <ChevronDown
            className={`w-4 h-4 text-[#1C1917]/60 transition-transform duration-300 ${
              openSections.benefits ? 'rotate-180 text-[#C7A97B]' : ''
            }`}
          />
        </button>

        {openSections.benefits && (
          <div className="pt-4 space-y-4 animate-in fade-in duration-200">
            {/* Climate & Texture Note */}
            <div className="p-3.5 bg-[#F9F6F0] border-l-2 border-[#C7A97B] text-xs text-[#1C1917]/85 leading-relaxed font-light">
              <span className="font-medium text-[#1C1917] block mb-1">
                {'Beauty Note for Bangladeshi Climate:'}
              </span>
              {product.dermalStoryEn}
            </div>

            {/* Key Active Highlights (Clean, intuitive cards without chemical jargon) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {product.keyActives.map((active, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-[#F9F6F0] border border-[#E6DFD5] space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-serif font-medium text-[#1C1917]">
                      {active.name}
                    </span>
                    <span className="text-[9px] uppercase tracking-wider text-[#C7A97B] font-medium">
                      {'ACTIVE HERO'}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#1C1917]/75 font-light leading-relaxed">
                    {active.purposeEn}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ------------------------------------------------------------------------- */}
      {/* SECTION 2: HOW TO USE & ROUTINE ORDER */}
      {/* ------------------------------------------------------------------------- */}
      <div className="py-4">
        <button
          type="button"
          onClick={() => toggleSection('howToUse')}
          className="w-full flex items-center justify-between text-left group"
        >
          <div className="flex items-center space-x-2">
            <Heart className="w-4 h-4 text-[#C7A97B]" />
            <h3 className="text-xs uppercase tracking-[0.22em] font-serif font-medium text-[#1C1917] group-hover:text-[#C7A97B] transition-colors">
              {'HOW TO APPLY & DAILY ROUTINE'}
            </h3>
          </div>
          <ChevronDown
            className={`w-4 h-4 text-[#1C1917]/60 transition-transform duration-300 ${
              openSections.howToUse ? 'rotate-180 text-[#C7A97B]' : ''
            }`}
          />
        </button>

        {openSections.howToUse && (
          <div className="pt-4 space-y-3.5 animate-in fade-in duration-200">
            <div className="grid gap-2.5">
              {product.usageSteps.map((step) => (
                <div
                  key={step.step}
                  className="p-3 bg-[#F9F6F0] border border-[#E6DFD5] flex items-start space-x-3"
                >
                  <span className="w-5 h-5 shrink-0 bg-[#1C1917] text-[#F9F6F0] text-[10px] font-sans flex items-center justify-center font-bold tabular-nums rounded-full mt-0.5">
                    {step.step}
                  </span>
                  <div className="space-y-0.5">
                    <h4 className="text-xs font-serif uppercase tracking-wider text-[#1C1917] font-medium">
                      {step.titleEn}
                    </h4>
                    <p className="text-xs text-[#1C1917]/75 font-light leading-relaxed">
                      {step.instructionEn}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Routine timing badge */}
            <div className="flex items-center space-x-2 text-[10px] uppercase tracking-wider text-[#1C1917]/60 pt-1">
              <span>{'IDEAL TIME TO APPLY:'}</span>
              <span className="font-semibold text-[#C7A97B]">{product.routinePeriod} ROUTINE</span>
            </div>
          </div>
        )}
      </div>

      {/* ------------------------------------------------------------------------- */}
      {/* SECTION 3: GENTLE CARE & AUTHENTICITY */}
      {/* ------------------------------------------------------------------------- */}
      <div className="py-4">
        <button
          type="button"
          onClick={() => toggleSection('safety')}
          className="w-full flex items-center justify-between text-left group"
        >
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-[#C7A97B]" />
            <h3 className="text-xs uppercase tracking-[0.22em] font-serif font-medium text-[#1C1917] group-hover:text-[#C7A97B] transition-colors">
              {'GENTLE CARE & AUTHENTICITY'}
            </h3>
          </div>
          <ChevronDown
            className={`w-4 h-4 text-[#1C1917]/60 transition-transform duration-300 ${
              openSections.safety ? 'rotate-180 text-[#C7A97B]' : ''
            }`}
          />
        </button>

        {openSections.safety && (
          <div className="pt-4 space-y-3.5 animate-in fade-in duration-200">
            {/* Quick Suitability Badges */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              <div className="p-3 bg-[#F9F6F0] border border-[#E6DFD5] text-center space-y-0.5">
                <span className="text-[8px] uppercase tracking-wider text-[#1C1917]/60 block">
                  {'PREGNANCY'}
                </span>
                <span className={`text-[10px] uppercase tracking-wider font-semibold ${product.isPregnancySafe ? 'text-emerald-700' : 'text-amber-700'}`}>
                  {product.isPregnancySafe ? 'SAFE TO USE' : 'CONSULT OB-GYN'}
                </span>
              </div>

              <div className="p-3 bg-[#F9F6F0] border border-[#E6DFD5] text-center space-y-0.5">
                <span className="text-[8px] uppercase tracking-wider text-[#1C1917]/60 block">
                  {'SKIN BARRIER'}
                </span>
                <span className="text-[10px] uppercase tracking-wider font-semibold text-emerald-700">
                  {'GENTLE & TESTED'}
                </span>
              </div>

              <div className="p-3 bg-[#F9F6F0] border border-[#E6DFD5] text-center space-y-0.5 col-span-2 sm:col-span-1">
                <span className="text-[8px] uppercase tracking-wider text-[#1C1917]/60 block">
                  {'AUTHENTICITY'}
                </span>
                <span className="text-[10px] uppercase tracking-wider font-semibold text-[#1C1917]">
                  {product.originCountry ? product.originCountry.toUpperCase() : 'DIRECT IMPORT'}
                </span>
              </div>
            </div>

            {/* Storage Guidance */}
            <div className="p-3 bg-[#F9F6F0] border border-[#E6DFD5] text-xs text-[#1C1917]/80 flex items-center space-x-2">
              <Info className="w-3.5 h-3.5 text-[#C7A97B] shrink-0" />
              <span>
                <strong>{'Storage Note: '}</strong>
                {product.storageGuidanceEn}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* ------------------------------------------------------------------------- */}
      {/* SECTION 4: FULL INGREDIENTS LIST (COLLAPSED & CLEAN) */}
      {/* ------------------------------------------------------------------------- */}
      <div className="py-4">
        <button
          type="button"
          onClick={() => toggleSection('fullInci')}
          className="w-full flex items-center justify-between text-left group"
        >
          <div className="flex items-center space-x-2">
            <Info className="w-4 h-4 text-[#C7A97B]" />
            <h3 className="text-xs uppercase tracking-[0.22em] font-serif font-medium text-[#1C1917] group-hover:text-[#C7A97B] transition-colors">
              {'FULL INGREDIENTS (INCI)'}
            </h3>
          </div>
          <ChevronDown
            className={`w-4 h-4 text-[#1C1917]/60 transition-transform duration-300 ${
              openSections.fullInci ? 'rotate-180 text-[#C7A97B]' : ''
            }`}
          />
        </button>

        {openSections.fullInci && (
          <div className="pt-4 space-y-2 animate-in fade-in duration-200">
            <p className="text-xs text-[#1C1917]/60 font-light">
              {'Complete ingredient transparency adhering to international cosmetic standards:'}
            </p>
            <div className="p-3 bg-[#F9F6F0] border border-[#E6DFD5] text-[11px] text-[#1C1917]/75 font-sans leading-relaxed max-h-36 overflow-y-auto">
              {product.fullInci.map((ing) => ing.inciName).join(', ')}.
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
