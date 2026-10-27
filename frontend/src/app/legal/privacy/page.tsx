'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, ShieldCheck, Lock } from 'lucide-react';
import { useLanguage } from '@/context/language-context';
import { useCart } from '@/context/cart-context';
import { BRAND } from '@/lib/constants';

export default function PrivacyPolicyPage() {
  const { t } = useLanguage();
  const { settings } = useCart();
  const supportWhatsApp = settings?.supportWhatsApp || BRAND.supportWhatsApp;

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
          <Lock className="w-3.5 h-3.5" />
          <span>{t('DATA CONFIDENTIALITY // SEYVEN SANCTUARY', 'তথ্য নিরাপত্তা // সেভেন অভয়ারণ্য')}</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-serif uppercase tracking-[0.18em] font-light">
          {t('PRIVACY & DATA PROTECTION', 'তথ্য সুরক্ষা নীতিমালা')}
        </h1>
        <p className="text-xs text-[#1C1917]/60 font-mono">
          {t('Your personal privacy is our absolute priority', 'আপনার ব্যক্তিগত তথ্যের গোপনীয়তা রক্ষায় আমরা প্রতিশ্রুতিবদ্ধ')}
        </p>
      </div>

      <div className="space-y-6 text-xs text-[#1C1917]/80 font-light leading-relaxed">
        <section className="space-y-2">
          <h2 className="text-sm font-serif uppercase tracking-wider font-medium text-[#1C1917]">
            {t('1. Complete Discretion & Confidentiality', '১. পূর্ণ গোপনীয়তা')}
          </h2>
          <p>
            {t(
              'We only collect the contact information (name, mobile phone, and delivery address) strictly necessary to process your order and coordinate courier delivery. We never sell, rent, or share your contact details with external advertisers or third-party marketing companies.',
              'আমরা শুধুমাত্র আপনার পার্সেল পৌঁছে দেওয়ার জন্য প্রয়োজনীয় নাম, মোবাইল নম্বর এবং ঠিকানা সংগ্রহ করি। আমরা কখনোই আপনার ব্যক্তিগত তথ্য কোনো তৃতীয় পক্ষ বা বিজ্ঞাপনী সংস্থার কাছে হস্তান্তর বা বিক্রি করি না।'
            )}
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-sm font-serif uppercase tracking-wider font-medium text-[#1C1917]">
            {t('2. Skincare Advisory Privacy', '২. স্কিনকেয়ার কনসালটেশনের তথ্যের নিরাপত্তা')}
          </h2>
          <p>
            {t(
              'Any details you share with our beauty advisors (skin concerns, routine preferences, allergies) are treated with strict confidentiality. They are used exclusively to provide bespoke skincare recommendations.',
              'আমাদের স্কিন কনসালটেশনে অংশ নেওয়ার সময় দেওয়া ত্বকের সমস্যা বা পছন্দের তথ্য সম্পূর্ণ গোপন রাখা হয় এবং তা শুধু আপনাকে সঠিক পণ্য নির্বাচনে সহায়তা করতেই ব্যবহৃত হয়।'
            )}
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-sm font-serif uppercase tracking-wider font-medium text-[#1C1917]">
            {t('3. Contact & Care', '৩. যোগাযোগ ও সহায়তা')}
          </h2>
          <p>
            {t(
              `If you wish to update your saved address or delete your order history, please contact our care concierge at ${BRAND.supportEmail} or via WhatsApp at ${supportWhatsApp}.`,
              `আপনার সংরক্ষিত ঠিকানা আপডেট করতে বা কোনো তথ্য সম্পর্কে জানতে আমাদের কাস্টমার কেয়ারে যোগাযোগ করুন: ${BRAND.supportEmail} অথবা হোয়াটসঅ্যাপ: ${supportWhatsApp}।`
            )}
          </p>
        </section>
      </div>
    </div>
  );
}
