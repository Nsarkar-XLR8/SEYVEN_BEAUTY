'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Crown, Sparkles, Award, ArrowRight, ShieldCheck, Check, ArrowLeft, Heart, MessageCircle, Gift } from 'lucide-react';
import { useLanguage } from '@/context/language-context';
import { useAuth } from '@/context/auth-context';
import { useCart } from '@/context/cart-context';
import { getPrimaryConciergeAction } from '@/lib/concierge';
import { formatBdt } from '@/lib/formatters';
import { ReplenishmentDrawer } from '@/components/loyalty/replenishment-drawer';

export default function LoyaltyPage() {
  const { lang, t } = useLanguage();
  const { user, isAuthenticated, openAuthModal } = useAuth();
  const { settings } = useCart();
  const concierge = getPrimaryConciergeAction(settings);
  const [mounted, setMounted] = useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const isReturningClient = (user as any)?.ordersSummary?.deliveredOrdersCount > 0 || (user as any)?.ordersCount > 0;

  const privilegePillars = [
    {
      titleEn: '5% Returning Client Privilege',
      titleBn: '৫% সম্মানিত ক্লায়েন্ট প্রিভিলেজ',
      descEn: 'Honoring repeat curations with an automatic 5% courtesy discount on every subsequent purchase. No points calculation, no codes.',
      descBn: 'প্রথম অর্ডারের পর প্রতিটি পরবর্তী ক্রয়ে স্বয়ংক্রিয় ৫% বিশেষ ছাড়। কোনো জটিল পয়েন্ট বা কুপন কোডের প্রয়োজন নেই।',
      icon: Crown,
      activeStatus: isReturningClient ? 'ACTIVE FOR YOUR ACCOUNT' : 'UNLOCKED AFTER 1ST ORDER',
    },
    {
      titleEn: 'Seasonal Festival Courtesy',
      titleBn: 'সিজনাল ফেস্টিভ্যাল কার্টেসী',
      descEn: 'Automatic 7% courtesy discount during Eid-ul-Fitr, Durga Puja, and festive seasons, applied directly at cart.',
      descBn: 'ঈদ ও পূজাসহ বিশেষ উৎসবের মৌসুমে কার্টে সরাসরি ৭% উৎসব ছাড় স্বয়ংক্রিয়ভাবে প্রযোজ্য।',
      icon: Gift,
      activeStatus: 'LIVE THIS SEASON',
    },
    {
      titleEn: 'Private WhatsApp Concierge',
      titleBn: 'ব্যক্তিগত হোয়াটসঅ্যাপ কনসিয়ার্জ',
      descEn: 'Direct 1-on-1 private messaging with our skincare advisory team for customized formulation selection.',
      descBn: 'আপনার ত্বকের জন্য সেরা ফর্মুলেশন বাছাই করতে আমাদের এক্সপার্ট টিমের সাথে সরাসরি হোয়াটসঅ্যাপ চ্যাট।',
      icon: MessageCircle,
      activeStatus: 'AVAILABLE 7 DAYS',
    },
    {
      titleEn: '100% Guaranteed Authenticity',
      titleBn: '১০০% আসল আমদানিকৃত ফর্মুলেশন',
      descEn: 'Strictly sealed international direct import batches with climate-controlled warehouse custody.',
      descBn: 'কোরিয়া, জাপান ও বিশ্বখ্যাত ব্র্যান্ড থেকে সরাসরি সংগৃহীত ১০০% আসল প্রসাধন সামগ্রী।',
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
            <span className="hidden sm:inline">{t('THE EDIT', 'ক্যাটালগ')}</span>
          </Link>
          <span className="text-[#E6DFD5]">•</span>
          <span className="text-xs font-serif uppercase tracking-[0.2em] font-medium text-[#1C1917]">
            {t('SANCTUARY CLIENT PRIVILEGE', 'সেভেন ক্লায়েন্ট প্রিভিলেজ')}
          </span>
        </div>
      </div>

      {/* Hero Banner: Luxury Sanctuary Card */}
      <div className="relative rounded-sm overflow-hidden border border-[#C7A97B]/40 bg-gradient-to-br from-[#1C1917] via-[#2A2421] to-[#1C1917] text-[#FAF8F5] p-8 sm:p-12 shadow-xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#C7A97B]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 space-y-6 max-w-2xl">
          <div className="inline-flex items-center space-x-2 px-3 py-1 border border-[#C7A97B]/50 rounded-full text-[10px] uppercase tracking-[0.25em] text-[#C7A97B]">
            <Crown className="w-3.5 h-3.5" />
            <span>{t('THE SANCTUARY PRIVILEGE', 'সানকচুয়ারি প্রিভিলেজ')}</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-serif tracking-[0.06em] text-[#FAF8F5] leading-tight">
            {t('Pure Courtesy. No Gimmicks. No Points.', 'বিশুদ্ধ সৌজন্য। কোনো জটিল পয়েন্ট বা শর্তহীন।')}
          </h1>

          <p className="text-xs sm:text-sm text-[#FAF8F5]/80 font-light leading-relaxed">
            {t(
              'At SEYVEN, luxury means recognizing our patrons effortlessly. Once you receive your inaugural curation, all subsequent orders receive an automatic 5% Client Courtesy Privilege, plus seasonal festival privileges.',
              'সেভেনে আপনার আস্থার মূল্যায়ন অত্যন্ত মর্যাদাপূর্ণ। আপনার প্রথম সফল অর্ডারের পর থেকে প্রতিটি ক্রয়ে আপনি পাচ্ছেন আজীবন স্বয়ংক্রিয় ৫% বিশেষ সুবিধা ও উৎসবের স্পেশাল ডিসকাউন্ট।'
            )}
          </p>

          <div className="pt-2 flex flex-wrap gap-4">
            <Link
              href="/catalog"
              className="px-5 py-2.5 bg-[#C7A97B] text-[#1C1917] text-[11px] uppercase tracking-[0.2em] font-medium hover:bg-[#FAF8F5] transition-colors rounded-sm"
            >
              {t('EXPLORE THE EDIT', 'ফর্মুলেশন দেখুন')}
            </Link>
            <a
              href={concierge.url}
              target="_blank"
              rel="noopener noreferrer"
              className="px-5 py-2.5 border border-[#FAF8F5]/30 text-[#FAF8F5] text-[11px] uppercase tracking-[0.2em] hover:bg-[#FAF8F5] hover:text-[#1C1917] transition-colors rounded-sm inline-flex items-center space-x-2"
            >
              <MessageCircle className="w-3.5 h-3.5 text-[#C7A97B]" />
              <span>{t('PRIVATE CONCIERGE', 'প্রাইভেট কনসিয়ার্জ')}</span>
            </a>
          </div>
        </div>
      </div>

      {/* Privilege Pillars Grid */}
      <section className="space-y-6">
        <div className="space-y-1">
          <span className="text-[10px] uppercase tracking-[0.25em] text-[#C7A97B] font-semibold block">
            {t('HOW PRIVILEGE WORKS', 'প্রিভিলেজ সুবিধা কীভাবে কাজ করে')}
          </span>
          <h2 className="text-xl font-serif uppercase tracking-[0.12em] text-[#1C1917]">
            {t('FOUR PILLARS OF CLIENT REVERENCE', 'আমাদের সেবার ৪টি মূল স্তম্ভ')}
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
                    {lang === 'bn' ? p.titleBn : p.titleEn}
                  </h3>
                  <p className="text-xs text-[#1C1917]/70 font-light leading-relaxed">
                    {lang === 'bn' ? p.descBn : p.descEn}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Replenishment Engine Drawer - Only for authenticated clients with active routines */}
      {isAuthenticated && <ReplenishmentDrawer />}

    </div>
  );
}
