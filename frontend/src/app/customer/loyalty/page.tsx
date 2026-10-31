'use client';

import React from 'react';
import Link from 'next/link';
import { Crown, ShieldCheck, ArrowLeft, MessageCircle, Gift } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { useCart } from '@/context/cart-context';
import { getPrimaryConciergeAction } from '@/lib/concierge';
import { ReplenishmentDrawer } from '@/components/loyalty/replenishment-drawer';

export default function LoyaltyPage() {
  const { user, isAuthenticated } = useAuth();
  const { settings } = useCart();
  const concierge = getPrimaryConciergeAction(settings);

  const isReturningClient = (user as any)?.ordersSummary?.deliveredOrdersCount > 0 || (user as any)?.ordersCount > 0;

  const privilegePillars = [
    {
      title: '5% Returning Client Privilege',
      desc: 'Honoring repeat curations with an automatic 5% courtesy discount on every subsequent purchase. No points calculation, no codes.',
      icon: Crown,
      activeStatus: isReturningClient ? 'ACTIVE FOR YOUR ACCOUNT' : 'UNLOCKED AFTER 1ST ORDER',
    },
    {
      title: 'Seasonal Festival Courtesy',
      desc: 'Automatic 7% courtesy discount during Eid-ul-Fitr, Durga Puja, and festive seasons, applied directly at cart.',
      icon: Gift,
      activeStatus: 'LIVE THIS SEASON',
    },
    {
      title: 'Complimentary Skincare Advisory',
      desc: 'Direct 1-on-1 private messaging with our skincare advisors on Messenger for bespoke formulation selection. Always 100% complimentary.',
      icon: MessageCircle,
      activeStatus: 'ALWAYS COMPLIMENTARY',
    },
    {
      title: '100% Guaranteed Authenticity',
      desc: 'Strictly sealed international direct import batches with climate-controlled warehouse custody.',
      icon: ShieldCheck,
      activeStatus: 'SANCTUARY STANDARD',
    },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-12 pb-28 lg:pb-16">
      {/* Top Navigation */}
      <div className="flex items-center justify-between border-b border-[#E6DFD5] pb-4">
        <div className="flex items-center space-x-3">
          <Link
            href="/catalog"
            className="text-xs uppercase tracking-wider text-[#1C1917]/60 hover:text-[#1C1917] flex items-center space-x-1"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">THE EDIT</span>
          </Link>
          <span className="text-[#E6DFD5]">•</span>
          <span className="text-xs font-serif uppercase tracking-[0.2em] font-medium text-[#1C1917]">
            SANCTUARY CLIENT PRIVILEGE
          </span>
        </div>
      </div>

      {/* Hero Banner: Luxury Sanctuary Card */}
      <div className="relative rounded-sm overflow-hidden border border-[#C7A97B]/40 bg-gradient-to-br from-[#1C1917] via-[#2A2421] to-[#1C1917] text-[#FAF8F5] p-8 sm:p-12 shadow-xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#C7A97B]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 space-y-6 max-w-2xl">
          <div className="inline-flex items-center space-x-2 px-3 py-1 border border-[#C7A97B]/50 rounded-full text-[10px] uppercase tracking-[0.25em] text-[#C7A97B]">
            <Crown className="w-3.5 h-3.5" />
            <span>THE SANCTUARY PRIVILEGE</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-serif tracking-[0.06em] text-[#FAF8F5] leading-tight">
            Pure Courtesy. No Gimmicks. No Points.
          </h1>

          <p className="text-xs sm:text-sm text-[#FAF8F5]/80 font-light leading-relaxed">
            At SEYVEN, luxury means recognizing our patrons effortlessly. Once you receive your inaugural curation, all subsequent orders receive an automatic 5% Client Courtesy Privilege, plus seasonal festival privileges.
          </p>

          <div className="pt-2 flex flex-wrap gap-4">
            <Link
              href="/catalog"
              className="px-5 py-2.5 bg-[#C7A97B] text-[#1C1917] text-[11px] uppercase tracking-[0.2em] font-medium hover:bg-[#FAF8F5] transition-colors rounded-sm"
            >
              EXPLORE THE EDIT
            </Link>
            <a
              href={concierge.url}
              target="_blank"
              rel="noopener noreferrer"
              className="px-5 py-2.5 border border-[#FAF8F5]/30 text-[#FAF8F5] text-[11px] uppercase tracking-[0.2em] hover:bg-[#FAF8F5] hover:text-[#1C1917] transition-colors rounded-sm inline-flex items-center space-x-2"
            >
              <MessageCircle className="w-3.5 h-3.5 text-[#C7A97B]" />
              <span>PRIVATE CONCIERGE</span>
            </a>
          </div>
        </div>
      </div>

      {/* Privilege Pillars Grid */}
      <section className="space-y-6">
        <div className="space-y-1">
          <span className="text-[10px] uppercase tracking-[0.25em] text-[#C7A97B] font-semibold block">
            HOW PRIVILEGE WORKS
          </span>
          <h2 className="text-xl font-serif uppercase tracking-[0.12em] text-[#1C1917]">
            FOUR PILLARS OF CLIENT REVERENCE
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {privilegePillars.map((p, idx) => {
            const Icon = p.icon;
            return (
              <div
                key={idx}
                className="p-6 bg-[#FAF8F5] border border-[#E8E2D9] rounded-sm space-y-4 hover:border-[#C7A97B] transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-full bg-[#F4EFEA] border border-[#E8E2D9] flex items-center justify-center text-[#C7A97B]">
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-[9px] font-mono uppercase tracking-widest text-[#C7A97B] font-semibold bg-[#F4EFEA] px-2.5 py-1 rounded-sm border border-[#E8E2D9]">
                    {p.activeStatus}
                  </span>
                </div>

                <div className="space-y-1.5">
                  <h3 className="text-base font-serif uppercase tracking-wider text-[#1C1917]">
                    {p.title}
                  </h3>
                  <p className="text-xs text-[#1C1917]/70 font-light leading-relaxed">
                    {p.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Replenishment Engine Drawer */}
      {isAuthenticated && <ReplenishmentDrawer />}

    </div>
  );
}
