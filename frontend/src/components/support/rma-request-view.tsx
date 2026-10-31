'use client';

import React from 'react';
import Link from 'next/link';
import { RotateCcw, ShieldCheck, MessageCircle, Phone, ArrowLeft, CheckCircle2, Truck, HeartHandshake } from 'lucide-react';
import { useLanguage } from '@/context/language-context';
import { useCart } from '@/context/cart-context';
import { getPrimaryConciergeAction } from '@/lib/concierge';
import { BRAND } from '@/lib/constants';

export function RmaRequestView() {
  const { lang, t } = useLanguage();
  const { settings } = useCart();
  const concierge = getPrimaryConciergeAction(settings);
  const supportPhone = settings?.supportPhone || BRAND.supportPhone;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-14 space-y-10 pb-28 lg:pb-16">
      
      {/* Back button */}
      <div>
        <Link
          href="/"
          className="inline-flex items-center space-x-1.5 text-xs text-[#1C1917]/60 hover:text-[#1C1917] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>{'Back to Sanctuary'}</span>
        </Link>
      </div>

      {/* Header Banner */}
      <div className="text-center space-y-3 max-w-xl mx-auto">
        <div className="inline-flex items-center space-x-2 px-3 py-1 bg-[#E6DFD5]/40 border border-[#E6DFD5] text-[9px] uppercase tracking-[0.3em] font-medium text-[#C7A97B]">
          <RotateCcw className="w-3.5 h-3.5" />
          <span>{'HASSLE-FREE PROMISE'}</span>
        </div>

        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-serif uppercase tracking-[0.18em] font-light text-[#1C1917]">
          {'7-DAY CONCIERGE EXCHANGE'}
        </h1>

        <p className="text-xs sm:text-sm text-[#1C1917]/70 font-light leading-relaxed">
          {'We want you to love your skincare experience. If your parcel arrived damaged in transit, leaked, or was not what you ordered, we will arrange a complimentary doorstep replacement without any complex forms.'}
        </p>
      </div>

      {/* Primary Action Card: 1-Tap WhatsApp Concierge */}
      <div className="p-8 bg-[#F9F6F0] border border-[#C7A97B]/60 space-y-6 text-center shadow-xs">
        <div className="w-12 h-12 rounded-full bg-[#1C1917] text-[#C7A97B] flex items-center justify-center mx-auto">
          <MessageCircle className="w-6 h-6 stroke-[1.5]" />
        </div>

        <div className="space-y-1.5 max-w-md mx-auto">
          <h2 className="text-sm font-serif uppercase tracking-[0.2em] font-medium text-[#1C1917]">
            {'MESSAGE OUR CLIENT CARE CONCIERGE'}
          </h2>
          <p className="text-xs text-[#1C1917]/75 font-light leading-relaxed">
            {'Simply send us your Order ID or phone number on WhatsApp. Our dedicated beauty advisors will confirm your details and arrange a reverse-pickup instantly.'}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <a
            href={concierge.url}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto px-8 py-3.5 bg-[#1C1917] hover:bg-[#1C1917]/90 text-[#F9F6F0] text-xs uppercase tracking-[0.22em] font-medium transition-all shadow-sm flex items-center justify-center space-x-2"
          >
            <MessageCircle className="w-4 h-4 text-[#C7A97B]" />
            <span>{`CHAT ON ${concierge.shortLabel}`}</span>
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

      {/* 3 Simple Steps */}
      <div className="space-y-4 pt-4 border-t border-[#E6DFD5]">
        <h3 className="text-xs font-serif uppercase tracking-[0.2em] font-medium text-[#1C1917] text-center">
          {'HOW OUR EFFORTLESS EXCHANGE WORKS'}
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
          <div className="p-5 bg-[#F9F6F0] border border-[#E6DFD5] space-y-2">
            <span className="w-6 h-6 rounded-full bg-[#1C1917] text-[#F9F6F0] flex items-center justify-center text-[11px] font-sans font-bold tabular-nums">
              1
            </span>
            <h4 className="text-xs font-serif uppercase tracking-wider text-[#1C1917] font-medium">
              {'CONTACT US IN 7 DAYS'}
            </h4>
            <p className="text-[11px] text-[#1C1917]/70 font-light leading-relaxed">
              {'Let us know within 7 days of receiving your parcel via WhatsApp or direct phone call.'}
            </p>
          </div>

          <div className="p-5 bg-[#F9F6F0] border border-[#E6DFD5] space-y-2">
            <span className="w-6 h-6 rounded-full bg-[#1C1917] text-[#F9F6F0] flex items-center justify-center text-[11px] font-sans font-bold tabular-nums">
              2
            </span>
            <h4 className="text-xs font-serif uppercase tracking-wider text-[#1C1917] font-medium">
              {'KEEP PACKAGING INTACT'}
            </h4>
            <p className="text-[11px] text-[#1C1917]/70 font-light leading-relaxed">
              {'Keep the outer carton and product seals intact to protect cosmetic hygiene standards.'}
            </p>
          </div>

          <div className="p-5 bg-[#F9F6F0] border border-[#E6DFD5] space-y-2">
            <span className="w-6 h-6 rounded-full bg-[#1C1917] text-[#F9F6F0] flex items-center justify-center text-[11px] font-sans font-bold tabular-nums">
              3
            </span>
            <h4 className="text-xs font-serif uppercase tracking-wider text-[#1C1917] font-medium">
              {'DOORSTEP SWAP'}
            </h4>
            <p className="text-[11px] text-[#1C1917]/70 font-light leading-relaxed">
              {'Our courier rider collects the damaged piece and hands over your fresh replacement at your doorstep.'}
            </p>
          </div>
        </div>
      </div>

    </div>
  );
}
