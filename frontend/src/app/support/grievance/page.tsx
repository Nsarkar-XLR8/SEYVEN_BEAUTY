'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, MessageCircle, Phone, Mail, Clock, HeartHandshake } from 'lucide-react';
import { useCart } from '@/context/cart-context';
import { getPrimaryConciergeAction } from '@/lib/concierge';
import { BRAND } from '@/lib/constants';

export default function ClientSupportConciergePage() {
  const { settings } = useCart();
  const concierge = getPrimaryConciergeAction(settings);
  const supportPhone = settings?.supportPhone || BRAND.supportPhone;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-14 space-y-10 pb-28 lg:pb-16 text-[#1C1917]">
      <div>
        <Link
          href="/"
          className="inline-flex items-center space-x-1.5 text-xs text-[#1C1917]/60 hover:text-[#1C1917] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Sanctuary</span>
        </Link>
      </div>

      <div className="text-center space-y-3 max-w-xl mx-auto">
        <div className="inline-flex items-center space-x-2 px-3 py-1 bg-[#E6DFD5]/40 border border-[#E6DFD5] text-[9px] uppercase tracking-[0.3em] font-medium text-[#C7A97B]">
          <HeartHandshake className="w-3.5 h-3.5" />
          <span>DEDICATED CLIENT CARE</span>
        </div>

        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-serif uppercase tracking-[0.18em] font-light">
          CLIENT SUPPORT CONCIERGE
        </h1>

        <p className="text-xs sm:text-sm text-[#1C1917]/70 font-light leading-relaxed">
          We are here to assist you at every step of your skincare journey. For routine guidance, parcel inquiries, or order exchanges, connect directly with our beauty advisors.
        </p>
      </div>

      <div className="p-8 bg-[#F9F6F0] border border-[#C7A97B]/50 space-y-6 text-center">
        <div className="w-12 h-12 rounded-full bg-[#1C1917] text-[#C7A97B] flex items-center justify-center mx-auto">
          <MessageCircle className="w-6 h-6 stroke-[1.5]" />
        </div>

        <div className="space-y-1">
          <h2 className="text-sm font-serif uppercase tracking-[0.2em] font-medium text-[#1C1917]">
            FASTEST ASSISTANCE: CONCIERGE CARE
          </h2>
          <p className="text-xs text-[#1C1917]/75 font-light">
            Average reply time: within 5 minutes during business hours
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <a
            href={concierge.url}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto px-8 py-3.5 bg-[#1C1917] hover:bg-[#1C1917]/90 text-[#F9F6F0] text-xs uppercase tracking-[0.22em] font-medium transition-all shadow-sm flex items-center justify-center space-x-2"
          >
            <MessageCircle className="w-4 h-4 text-[#C7A97B]" />
            <span>MESSAGE ON {concierge.shortLabel}</span>
          </a>

          {supportPhone ? (
            <a
              href={`tel:${supportPhone.replace(/\s+/g, '')}`}
              className="w-full sm:w-auto px-8 py-3.5 border border-[#1C1917] hover:bg-[#1C1917] hover:text-[#F9F6F0] text-[#1C1917] text-xs uppercase tracking-[0.22em] font-medium transition-all flex items-center justify-center space-x-2"
            >
              <Phone className="w-4 h-4 text-[#C7A97B]" />
              <span>{supportPhone}</span>
            </a>
          ) : null}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-[#E6DFD5] text-xs text-[#1C1917]/80">
        <div className="p-4 bg-[#F9F6F0] border border-[#E6DFD5] space-y-1.5">
          <Phone className="w-4 h-4 text-[#C7A97B]" />
          <strong className="block text-[#1C1917]">Hotline</strong>
          <span>{supportPhone || BRAND.supportEmail}</span>
        </div>

        <div className="p-4 bg-[#F9F6F0] border border-[#E6DFD5] space-y-1.5">
          <Mail className="w-4 h-4 text-[#C7A97B]" />
          <strong className="block text-[#1C1917]">Email Support</strong>
          <span>{BRAND.supportEmail}</span>
        </div>

        <div className="p-4 bg-[#F9F6F0] border border-[#E6DFD5] space-y-1.5">
          <Clock className="w-4 h-4 text-[#C7A97B]" />
          <strong className="block text-[#1C1917]">Care Hours</strong>
          <span>{BRAND.officeHours}</span>
        </div>
      </div>
    </div>
  );
}
