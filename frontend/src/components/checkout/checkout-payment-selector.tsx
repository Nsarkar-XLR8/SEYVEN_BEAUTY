'use client';

import React from 'react';
import { ShieldCheck, Banknote, CheckCircle2, Sparkles } from 'lucide-react';
import { useLanguage } from '@/context/language-context';

export type PaymentMethod = 'COD';

interface CheckoutPaymentSelectorProps {
  selectedMethod?: PaymentMethod;
  onChangeMethod?: (method: PaymentMethod) => void;
}

export function CheckoutPaymentSelector({ selectedMethod = 'COD', onChangeMethod }: CheckoutPaymentSelectorProps) {
  const { lang, t } = useLanguage();

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-xs uppercase tracking-[0.2em] font-medium text-[#1C1917] block">
          {t('SELECT SETTLEMENT METHOD', 'পেমেন্ট পদ্ধতি')}
        </label>
        <span className="text-[9px] uppercase tracking-wider text-[#C7A97B] font-semibold flex items-center space-x-1">
          <ShieldCheck className="w-3.5 h-3.5 text-[#C7A97B]" />
          <span>100% SECURE & RISK-FREE</span>
        </span>
      </div>

      <div
        onClick={() => onChangeMethod && onChangeMethod('COD')}
        className="p-4 sm:p-5 border-2 border-[#C7A97B] bg-[#F9F6F0] rounded-sm ring-1 ring-[#C7A97B]/30 shadow-xs cursor-pointer select-none transition-all duration-200"
      >
        <div className="flex items-start space-x-3.5">
          {/* Active Radio Badge */}
          <div className="mt-1 w-4 h-4 rounded-full border-2 border-[#C7A97B] flex items-center justify-center shrink-0 bg-white">
            <div className="w-2 h-2 rounded-full bg-[#1C1917]" />
          </div>

          {/* Content */}
          <div className="flex-1 space-y-1.5">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center space-x-2">
                <Banknote className="w-5 h-5 text-[#C7A97B]" />
                <span className="text-sm font-serif uppercase tracking-wider font-semibold text-[#1C1917]">
                  {t('CASH ON DELIVERY (COD)', 'ক্যাশ অন ডেলিভারি (হাতে পেয়ে টাকা দিন)')}
                </span>
              </div>
              <span className="text-[9px] uppercase tracking-wider px-2.5 py-0.5 bg-[#C7A97B] text-[#1C1917] font-bold border border-[#C7A97B]/40 rounded-full shadow-2xs">
                {t('ZERO ADVANCE REQUIRED', 'কোনো অগ্রিম ফি নেই')}
              </span>
            </div>

            <p className="text-xs text-[#1C1917]/80 font-light leading-relaxed">
              {t(
                'Inspect your sealed luxury parcel before handing over cash to the courier hero. No card or bKash advance needed — 100% peace of mind.',
                'পার্সেল হাতে পেয়ে দেখে তারপর সম্পূর্ণ মূল্য ডেলিভারি ম্যানকে দিন। কোনো অগ্রিম ফি বা হিডেন চার্জ নেই।'
              )}
            </p>

            <div className="pt-1 flex items-center gap-3 text-[10px] text-[#78716C] font-mono">
              <span className="flex items-center gap-1 text-emerald-800 font-semibold">
                <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                <span>{t('Pay after inspection', 'দেখে নেওয়ার সুবিধা')}</span>
              </span>
              <span>&bull;</span>
              <span className="flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-[#C7A97B]" />
                <span>{t('Guaranteed Authentic Direct Import', '১০০% অরিজিনাল পণ্য')}</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

