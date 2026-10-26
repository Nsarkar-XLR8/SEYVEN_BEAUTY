'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, ShieldCheck } from 'lucide-react';
import { useLanguage } from '@/context/language-context';
import { BRAND } from '@/lib/constants';

export default function TermsOfServicePage() {
  const { t } = useLanguage();

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-14 space-y-8 pb-28 lg:pb-16 text-[#1C1917]">
      <div>
        <Link
          href="/"
          className="inline-flex items-center space-x-1.5 text-xs text-[#1C1917]/60 hover:text-[#1C1917] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>{t('Back to Sanctuary', 'হোমে ফিরে যান')}</span>
        </Link>
      </div>

      <div className="space-y-3 pb-6 border-b border-[#E6DFD5]">
        <div className="inline-flex items-center space-x-2 text-[9px] uppercase tracking-[0.25em] text-[#C7A97B] font-medium">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>{t('CLIENT TERMS // SEYVEN SANCTUARY', 'শর্তাবলী // সেভেন অভয়ারণ্য')}</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-serif uppercase tracking-[0.18em] font-light">
          {t('TERMS OF SERVICE', 'ব্যবহারের শর্তাবলী')}
        </h1>
        <p className="text-xs text-[#1C1917]/60 font-mono">
          {t('Effective Date: October 2026 • Bangladesh Digital Commerce Act Compliant', 'কার্যকরের তারিখ: অক্টোবর ২০২৬ • ডিজিটাল কমার্স নীতিমালা নির্দেশিকা অনুযায়ী')}
        </p>
      </div>

      <div className="space-y-6 text-xs text-[#1C1917]/80 font-light leading-relaxed">
        <section className="space-y-2">
          <h2 className="text-sm font-serif uppercase tracking-wider font-medium text-[#1C1917]">
            {t('1. Authentic Brand Curation', '১. আন্তর্জাতিক ব্র্যান্ড কিউরেশন')}
          </h2>
          <p>
            {t(
              'SEYVEN is an independent skincare curator based in Dhaka, Bangladesh. We source genuine, factory-sealed skincare products from international beauty houses. We do not manufacture cosmetic formulations locally.',
              'সেভেন একটি স্বাধীন স্কিনকেয়ার কিউরেটর। আমরা আন্তর্জাতিক শীর্ষ ব্র্যান্ডের আসল ও সিলযুক্ত পণ্য সংগ্রহ করে বাংলাদেশি নারীদের কাছে পৌঁছে দিই। আমরা স্থানীয়ভাবে কোনো প্রসাধনী তৈরি করি না।'
            )}
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-sm font-serif uppercase tracking-wider font-medium text-[#1C1917]">
            {t('2. Pricing & Delivery', '২. মূল্য ও ডেলিভারি')}
          </h2>
          <p>
            {t(
              'All prices shown on SEYVEN are in Bangladeshi Taka (BDT) and inclusive of statutory VAT. Express delivery inside Dhaka is standard ৳70 (1–2 business days), and nationwide delivery outside Dhaka is standard ৳130 (2–3 business days). Orders of ৳2,000 or more enjoy complimentary free shipping.',
              'সেভেনের সকল পণ্যের মূল্য বাংলাদেশি টাকায় (BDT) এবং ভ্যাট অন্তর্ভুক্ত। ঢাকার ভেতরে ডেলিভারি চার্জ ৭০ টাকা (১-২ দিন) এবং ঢাকার বাইরে ১৩০ টাকা (২-৩ দিন)। ২,০০০ টাকা বা তার বেশি অর্ডারে ডেলিভারি সম্পূর্ণ ফ্রি।'
            )}
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-sm font-serif uppercase tracking-wider font-medium text-[#1C1917]">
            {t('3. Payment & Cash on Delivery', '৩. পেমেন্ট ও ক্যাশ অন ডেলিভারি')}
          </h2>
          <p>
            {t(
              'We accept Cash on Delivery (COD) nationwide with open box verification. No advance payment is required — inspect your sealed package before settling the due balance with the courier rider.',
              'আমরা সারাদেশে শতভাগ ক্যাশ অন ডেলিভারি (COD) সুবিধা প্রদান করছি। কোনো অগ্রিম পেমেন্টের প্রয়োজন নেই — পার্সেল দেখে কুরিয়ার রাইডারের কাছে বিল পরিশোধ করার সম্পূর্ণ সুবিধা রয়েছে।'
            )}
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-sm font-serif uppercase tracking-wider font-medium text-[#1C1917]">
            {t('4. Corporate Disclosures', '৪. কর্পোরেট পরিচিতি')}
          </h2>
          <p>
            {BRAND.registeredAddress} • DBID: {BRAND.corporate.dbid} • Trade License: {BRAND.corporate.tradeLicense} • VAT BIN: {BRAND.corporate.vatBin}
          </p>
        </section>
      </div>
    </div>
  );
}
