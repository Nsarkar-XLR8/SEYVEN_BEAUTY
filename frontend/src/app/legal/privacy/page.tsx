'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Lock } from 'lucide-react';
import { useCart } from '@/context/cart-context';
import { BRAND } from '@/lib/constants';

export default function PrivacyPolicyPage() {
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
          <span>Back to Sanctuary</span>
        </Link>
      </div>

      <div className="space-y-3 pb-6 border-b border-[#E6DFD5]">
        <div className="inline-flex items-center space-x-2 text-[9px] uppercase tracking-[0.25em] text-[#C7A97B] font-medium">
          <Lock className="w-3.5 h-3.5" />
          <span>DATA CONFIDENTIALITY // SEYVEN SANCTUARY</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-serif uppercase tracking-[0.18em] font-light">
          PRIVACY & DATA PROTECTION
        </h1>
        <p className="text-xs text-[#1C1917]/60 font-mono">
          Your personal privacy is our absolute priority
        </p>
      </div>

      <div className="space-y-6 text-xs text-[#1C1917]/80 font-light leading-relaxed">
        <section className="space-y-2">
          <h2 className="text-sm font-serif uppercase tracking-wider font-medium text-[#1C1917]">
            1. Complete Discretion & Confidentiality
          </h2>
          <p>
            We only collect the contact information (name, mobile phone, and delivery address) strictly necessary to process your order and coordinate courier delivery. We never sell, rent, or share your contact details with external advertisers or third-party marketing companies.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-sm font-serif uppercase tracking-wider font-medium text-[#1C1917]">
            2. Skincare Advisory Privacy
          </h2>
          <p>
            Any details you share with our beauty advisors (skin concerns, routine preferences, allergies) are treated with strict confidentiality. They are used exclusively to provide bespoke skincare recommendations.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-sm font-serif uppercase tracking-wider font-medium text-[#1C1917]">
            3. Contact & Care
          </h2>
          <p>
            {supportWhatsApp
              ? `If you wish to update your saved address or delete your order history, please contact our care concierge at ${BRAND.supportEmail} or via WhatsApp at ${supportWhatsApp}.`
              : `If you wish to update your saved address or delete your order history, please contact our care concierge at ${BRAND.supportEmail}.`}
          </p>
        </section>
      </div>
    </div>
  );
}
