'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Truck, Clock, ShieldCheck } from 'lucide-react';
import { useLanguage } from '@/context/language-context';
import { BRAND } from '@/lib/constants';

export default function ShippingDeliveryPage() {
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
          <Truck className="w-3.5 h-3.5" />
          <span>{t('DOORSTEP LOGISTICS // SEYVEN SANCTUARY', 'ডেলিভারি সংক্রান্ত তথ্যাবলী')}</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-serif uppercase tracking-[0.18em] font-light">
          {t('SHIPPING & DELIVERY PROTOCOL', 'ডেলিভারি সংক্রান্ত নিয়মাবলী')}
        </h1>
        <p className="text-xs text-[#1C1917]/60 font-mono">
          {t('Nationwide 64 districts coverage with Pathao Express Courier', 'পাঠাও এক্সপ্রেস কুরিয়ারের মাধ্যমে দেশব্যাপী ৬৪ জেলায় দ্রুত ডেলিভারি')}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-5 bg-[#F9F6F0] border border-[#E6DFD5] space-y-2">
          <span className="text-[10px] uppercase tracking-[0.2em] font-medium text-[#C7A97B] block">
            {t('INSIDE DHAKA METRO', 'ঢাকার ভেতরে')}
          </span>
          <p className="text-xl font-serif font-medium text-[#1C1917]">৳70</p>
          <p className="text-xs text-[#1C1917]/70 font-light">
            {t('1–2 Business Days Express Delivery via Pathao directly to your doorstep.', '১-২ কর্মদিবসের মধ্যে পাঠাও কুরিয়ারের মাধ্যমে দ্রুততম হোম ডেলিভারি।')}
          </p>
        </div>

        <div className="p-5 bg-[#F9F6F0] border border-[#E6DFD5] space-y-2">
          <span className="text-[10px] uppercase tracking-[0.2em] font-medium text-[#C7A97B] block">
            {t('OUTSIDE DHAKA (ALL 64 DISTRICTS)', 'ঢাকার বাইরে (সারাদেশ)')}
          </span>
          <p className="text-xl font-serif font-medium text-[#1C1917]">৳130</p>
          <p className="text-xs text-[#1C1917]/70 font-light">
            {t('2–3 Business Days Doorstep Courier via Pathao Courier Express.', '২-৩ কর্মদিবসের মধ্যে নির্ভরযোগ্য পাঠাও এক্সপ্রেস ডেলিভারি।')}
          </p>
        </div>
      </div>

      <div className="p-4 bg-[#F9F6F0] border-l-2 border-[#C7A97B] text-xs text-[#1C1917]/85 space-y-1">
        <strong className="block text-[#1C1917]">
          {t('Complimentary Free Delivery on Orders ৳2,000+', '২,০০০ টাকা বা তার বেশি অর্ডারে ফ্রি ডেলিভারি')}
        </strong>
        <p className="font-light">
          {t(
            'Whenever your shopping bag total reaches ৳2,000 or more, delivery fees are completely waived across Bangladesh.',
            'আপনার শপিং ব্যাগের মোট মূল্য ২,০০০ টাকা বা তার বেশি হলেই ডেলিভারি চার্জ সম্পূর্ণ ফ্রি।'
          )}
        </p>
      </div>

      <div className="space-y-4 text-xs text-[#1C1917]/80 font-light leading-relaxed">
        <h2 className="text-sm font-serif uppercase tracking-wider font-medium text-[#1C1917]">
          {t('Delivery Guidelines', 'ডেলিভারি নির্দেশনা')}
        </h2>
        <ul className="list-disc pl-5 space-y-1.5">
          <li>{t('Courier riders will call your phone prior to delivery.', 'ডেলিভারির পূর্বে কুরিয়ার প্রতিনিধি আপনার ফোনে কল করবেন।')}</li>
          <li>{t('Please inspect the outer packaging seals upon arrival.', 'পার্সেল গ্রহণের সময় মূল সিল অক্ষত আছে কিনা দেখে নিন।')}</li>
          <li>{t('For Cash on Delivery, please keep the exact cash amount ready for the rider.', 'ক্যাশ অন ডেলিভারিতে দ্রুত সেবার জন্য যথাসম্ভব সঠিক খুচরা টাকা প্রস্তুত রাখুন।')}</li>
        </ul>
      </div>
    </div>
  );
}
