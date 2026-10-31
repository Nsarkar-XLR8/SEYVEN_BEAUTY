'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, ShieldCheck } from 'lucide-react';
import { BRAND } from '@/lib/constants';

export default function TermsOfServicePage() {
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
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>CLIENT TERMS // SEYVEN SANCTUARY</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-serif uppercase tracking-[0.18em] font-light">
          TERMS OF SERVICE
        </h1>
        <p className="text-xs text-[#1C1917]/60 font-mono">
          Effective Date: October 2026 • Bangladesh Digital Commerce Act Compliant
        </p>
      </div>

      <div className="space-y-6 text-xs text-[#1C1917]/80 font-light leading-relaxed">
        <section className="space-y-2">
          <h2 className="text-sm font-serif uppercase tracking-wider font-medium text-[#1C1917]">
            1. Authentic Brand Curation
          </h2>
          <p>
            SEYVEN is an independent skincare curator based in Dhaka, Bangladesh. We source genuine, factory-sealed skincare products from international beauty houses. We do not manufacture cosmetic formulations locally.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-sm font-serif uppercase tracking-wider font-medium text-[#1C1917]">
            2. Pricing & Delivery
          </h2>
          <p>
            All prices shown on SEYVEN are in Bangladeshi Taka (BDT) and inclusive of statutory VAT. Express delivery inside Dhaka is standard ৳70 (1–2 business days), and nationwide delivery outside Dhaka is standard ৳130 (2–3 business days). Orders of ৳2,000 or more enjoy complimentary free shipping.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-sm font-serif uppercase tracking-wider font-medium text-[#1C1917]">
            3. Payment & Cash on Delivery
          </h2>
          <p>
            We accept Cash on Delivery (COD) nationwide with open box verification. No advance payment is required — inspect your sealed package before settling the due balance with the courier rider.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-sm font-serif uppercase tracking-wider font-medium text-[#1C1917]">
            4. Corporate Disclosures
          </h2>
          <p>
            {BRAND.registeredAddress}
            {BRAND.corporate.dbid ? ` • DBID: ${BRAND.corporate.dbid}` : ''}
            {BRAND.corporate.tradeLicense ? ` • Trade License: ${BRAND.corporate.tradeLicense}` : ''}
            {BRAND.corporate.vatBin ? ` • VAT BIN: ${BRAND.corporate.vatBin}` : ''}
          </p>
        </section>
      </div>
    </div>
  );
}
