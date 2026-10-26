'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ShieldCheck, ThermometerSnowflake, Sparkles, HeartHandshake, ArrowRight, Truck, CheckCircle2 } from 'lucide-react';
import { useLanguage } from '@/context/language-context';
import { BRAND } from '@/lib/constants';

export default function AboutPage() {
  const { lang, t } = useLanguage();

  return (
    <div className="min-h-screen bg-[#F9F6F0] text-[#1C1917] pb-24 space-y-16 sm:space-y-24">

      {/* ========================================================================= */}
      {/* 1. EDITORIAL HERO — THE SANCTUARY OF BEAUTY */}
      {/* ========================================================================= */}
      <section className="relative px-4 sm:px-6 lg:px-8 pt-10 sm:pt-16 pb-12 sm:pb-20 border-b border-[#E6DFD5] text-center">
        <div className="max-w-4xl mx-auto space-y-6 sm:space-y-8">
          
          {/* Haute Monoline Overline */}
          <div className="flex items-center justify-center space-x-3 text-[10px] sm:text-[11px] uppercase tracking-[0.28em] text-[#C7A97B] font-medium">
            <span className="w-8 h-[1px] bg-[#C7A97B]/40 inline-block" />
            <span>{t('THE SANCTUARY OF BEAUTY', 'সৌন্দর্য ও নিরাময়ের আন্তর্জাতিক অভয়ারণ্য')}</span>
            <span className="w-8 h-[1px] bg-[#C7A97B]/40 inline-block" />
          </div>

          {/* Majestic Serif Headline */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-serif font-light uppercase tracking-[0.12em] sm:tracking-[0.16em] text-[#1C1917] leading-[1.2] select-none">
            {lang === 'bn' ? (
              <>
                বিশুদ্ধতার প্রতিশ্রুতি। <br />
                <span className="text-[#8C6D3B] font-normal">আসল আন্তর্জাতিক স্কিনকেয়ার।</span>
              </>
            ) : (
              <>
                THE PURSUIT OF PURITY. <br />
                <span className="text-[#8C6D3B] font-normal">CURATED FOR BANGLADESH.</span>
              </>
            )}
          </h1>

          {/* Architectural Subtitle */}
          <p className="max-w-2xl mx-auto text-xs sm:text-sm text-[#1C1917]/75 font-light leading-relaxed tracking-wider uppercase">
            {t(
              'BORN FROM A REFUSAL TO COMPROMISE. WE CURATE RENOWNED INTERNATIONAL DERMATOLOGICAL ICONS FORMULATED TO THRIVE IN TROPICAL HUMIDITY.',
              'অনুমানের ওপর নির্ভর নয়। বাংলাদেশের উষ্ণ ও আর্দ্র আবহাওয়ার উপযোগী প্রমাণিত আন্তর্জাতিক স্কিনকেয়ার নিয়ে আমাদের অবিচল যাত্রা।'
            )}
          </p>

          {/* Monogram Seal */}
          {/* <div className="pt-4 flex justify-center">
            <div className="relative w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center border border-[#C7A97B]/50 rounded-full bg-[#FAF8F5]">
              <Image
                src={BRAND.logoPath}
                alt="SEYVEN Monogram"
                width={80}
                height={80}
                className="w-8 sm:w-10 h-auto object-contain"
              />
            </div>
          </div> */}

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2. THE SEYVEN MANIFESTO — EDITORIAL NARRATIVE */}
      {/* ========================================================================= */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-14 items-center">
          
          <div className="md:col-span-5 space-y-4">
            <span className="text-[10px] uppercase tracking-[0.3em] font-medium text-[#C7A97B] block">
              {t('OUR GENESIS', 'আমাদের সূচনা')}
            </span>
            <h2 className="text-2xl sm:text-4xl font-serif uppercase tracking-[0.14em] font-light text-[#1C1917] leading-tight">
              {t('WHY SEYVEN WAS FOUNDED', 'সেভেনের প্রতিষ্ঠা')}
            </h2>
            <div className="w-12 h-[1px] bg-[#C7A97B]" />
          </div>

          <div className="md:col-span-7 space-y-4 text-xs sm:text-sm text-[#1C1917]/80 font-light leading-relaxed">
            <p>
              {t(
                'The Bangladeshi beauty landscape has long been flooded with counterfeit formulations, hazardous mercury-based bleaches, and misstored active serums spoiled by equatorial heat.',
                'আমাদের দেশের বাজারে দীর্ঘদিন ধরে নকল প্রসাধন, ক্ষতিকর মার্কারিযুক্ত ব্লিচিং ক্রিম এবং তীব্র গরমে নষ্ট হয়ে যাওয়া স্কিনকেয়ার প্রোডাক্টের ছড়াছড়ি ছিল।'
              )}
            </p>
            <p>
              {t(
                'SEYVEN was established as a sanctuary. We reject mass retail chaos in favor of bespoke dermal curation. Every single flacon in our care is imported directly from verified brand laboratories across Seoul, Paris, Tokyo, and New York — sealed, authentic, and climate-protected.',
                'সেভেনের জন্ম সেই সমঝোতাহীন অবস্থান থেকে। আমরা পাইকারি রিটেইল শপের মতো অন্ধভাবে প্রোডাক্ট বিক্রি করি না; প্রতিটি ফর্মুলেশন সরাসরি সিউল, প্যারিস, টোকিও ও নিউ ইয়র্কের অনুমোদিত ল্যাবরেটরি থেকে সিলগালা অবস্থায় সংগ্রহ করে যথাযথ তাপমাত্রায় সংরক্ষণ করি।'
              )}
            </p>
          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. FOUR ARCHITECTURAL PILLARS (THE 60-30-7-3 LUXURY SYSTEM) */}
      {/* ========================================================================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16 space-y-3">
          <span className="text-[10px] uppercase tracking-[0.3em] font-medium text-[#C7A97B] block">
            {t('SANCTUARY STANDARDS', 'আমাদের চার মূল স্তম্ভ')}
          </span>
          <h2 className="text-2xl sm:text-4xl font-serif uppercase tracking-[0.16em] font-light text-[#1C1917]">
            {t('THE FOUR PILLARS OF INTEGRITY', 'নির্ভরযোগ্যতার চার স্তম্ভ')}
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          
          {/* Pillar 1: Authenticity */}
          <div className="p-7 sm:p-8 bg-[#FAF8F5] border border-[#E6DFD5] space-y-4 flex flex-col justify-between hover:border-[#C7A97B] transition-colors duration-300">
            <div className="space-y-3">
              <span className="text-[10px] font-mono tracking-[0.25em] text-[#C7A97B] block">01 // SOURCE</span>
              <div className="w-10 h-10 rounded-full border border-[#E6DFD5] bg-[#F9F6F0] flex items-center justify-center text-[#C7A97B]">
                <ShieldCheck className="w-5 h-5 stroke-[1.25]" />
              </div>
              <h3 className="font-serif text-lg uppercase tracking-[0.14em] text-[#1C1917]">
                {t('DIRECT BRAND IMPORTS', 'সরাসরি ব্র্যান্ড সংগ্রহ')}
              </h3>
              <p className="text-[11px] text-[#1C1917]/70 font-light leading-relaxed uppercase tracking-wider">
                {t(
                  '100% genuine icons with anti-counterfeit seals directly sourced from verified global distributors. Zero third-party brokers.',
                  'কোনো মধ্যস্বত্বভোগী নয়। সরাসরি বৈশ্বিক ব্র্যান্ড থেকে আমদানিকৃত ১০০% আসল ও সিলগালা করা প্রসাধন।'
                )}
              </p>
            </div>
            <span className="text-[9px] uppercase tracking-[0.22em] text-[#8C6D3B] font-mono pt-3 border-t border-[#E6DFD5]/70 block">
              BSTI CERTIFIED COMPLIANCE
            </span>
          </div>

          {/* Pillar 2: Climate Custody */}
          <div className="p-7 sm:p-8 bg-[#FAF8F5] border border-[#E6DFD5] space-y-4 flex flex-col justify-between hover:border-[#C7A97B] transition-colors duration-300">
            <div className="space-y-3">
              <span className="text-[10px] font-mono tracking-[0.25em] text-[#C7A97B] block">02 // CLIMATE</span>
              <div className="w-10 h-10 rounded-full border border-[#E6DFD5] bg-[#F9F6F0] flex items-center justify-center text-[#C7A97B]">
                <ThermometerSnowflake className="w-5 h-5 stroke-[1.25]" />
              </div>
              <h3 className="font-serif text-lg uppercase tracking-[0.14em] text-[#1C1917]">
                {t('CLIMATE-CONTROLLED CARE', 'তাপমাত্রা নিয়ন্ত্রিত সংরক্ষণ')}
              </h3>
              <p className="text-[11px] text-[#1C1917]/70 font-light leading-relaxed uppercase tracking-wider">
                {t(
                  'Preserved continuously at 15°C–25°C to guard active botanicals and delicate vitamin serums against severe tropical heat degradation.',
                  'গ্রীষ্মমণ্ডলীয় তাপদাহে সক্রিয় ভিটামিন ও ফর্মুলার কার্যকারিতা অক্ষুণ্ণ রাখতে সার্বক্ষণিক শীতাতপ নিয়ন্ত্রিত ওয়্যারহাউজ সংরক্ষণ।'
                )}
              </p>
            </div>
            <span className="text-[9px] uppercase tracking-[0.22em] text-[#8C6D3B] font-mono pt-3 border-t border-[#E6DFD5]/70 block">
              15°C – 25°C CONSTANT VAULT
            </span>
          </div>

          {/* Pillar 3: Logistics Integrity */}
          <div className="p-7 sm:p-8 bg-[#FAF8F5] border border-[#E6DFD5] space-y-4 flex flex-col justify-between hover:border-[#C7A97B] transition-colors duration-300">
            <div className="space-y-3">
              <span className="text-[10px] font-mono tracking-[0.25em] text-[#C7A97B] block">03 // DISPATCH</span>
              <div className="w-10 h-10 rounded-full border border-[#E6DFD5] bg-[#F9F6F0] flex items-center justify-center text-[#C7A97B]">
                <Truck className="w-5 h-5 stroke-[1.25]" />
              </div>
              <h3 className="font-serif text-lg uppercase tracking-[0.14em] text-[#1C1917]">
                {t('WHITE-GLOVE DISPATCH', 'নিরাপদ ডেলিভারি নেটওয়ার্ক')}
              </h3>
              <p className="text-[11px] text-[#1C1917]/70 font-light leading-relaxed uppercase tracking-wider">
                {t(
                  'Secure delivery routed primarily via Pathao Express (with Steadfast backup custody) in tamper-evident sanctuary boxes.',
                  'পাঠাও এক্সপ্রেসের নির্ভরযোগ্য নেটওয়ার্ক এবং স্টিডফাস্ট ব্যাকআপের মাধ্যমে সিলড বক্সে দেশব্যাপী নিরাপদ ডেলিভারি।'
                )}
              </p>
            </div>
            <span className="text-[9px] uppercase tracking-[0.22em] text-[#8C6D3B] font-mono pt-3 border-t border-[#E6DFD5]/70 block">
              PATHAO PRIMARY DISPATCH
            </span>
          </div>

          {/* Pillar 4: Bespoke Advisory */}
          <div className="p-7 sm:p-8 bg-[#FAF8F5] border border-[#E6DFD5] space-y-4 flex flex-col justify-between hover:border-[#C7A97B] transition-colors duration-300">
            <div className="space-y-3">
              <span className="text-[10px] font-mono tracking-[0.25em] text-[#C7A97B] block">04 // ADVISORY</span>
              <div className="w-10 h-10 rounded-full border border-[#E6DFD5] bg-[#F9F6F0] flex items-center justify-center text-[#C7A97B]">
                <HeartHandshake className="w-5 h-5 stroke-[1.25]" />
              </div>
              <h3 className="font-serif text-lg uppercase tracking-[0.14em] text-[#1C1917]">
                {t('PERSONALIZED ADVISORY', 'ব্যক্তিগত স্কিন কনসালটেশন')}
              </h3>
              <p className="text-[11px] text-[#1C1917]/70 font-light leading-relaxed uppercase tracking-wider">
                {t(
                  'We diagnose dermal root concerns before suggesting a regimen. Direct WhatsApp concierge guidance tailored to your skin.',
                  'অপ্রয়োজনীয় প্রোডাক্ট চাপিয়ে দেওয়া নয়; আপনার ত্বকের ধরন অনুযায়ী সঠিক ফর্মুলেশন বেছে দিতে আন্তরিক পরামর্শ।'
                )}
              </p>
            </div>
            <span className="text-[9px] uppercase tracking-[0.22em] text-[#8C6D3B] font-mono pt-3 border-t border-[#E6DFD5]/70 block">
              WHATSAPP BEAUTY CONCIERGE
            </span>
          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. CORPORATE TRANSPARENCY & CITIZENSHIP */}
      {/* ========================================================================= */}
      {/* <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p-8 sm:p-12 bg-[#FAF8F5] border border-[#E6DFD5] space-y-6">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <span className="text-[10px] uppercase tracking-[0.3em] font-medium text-[#C7A97B]">
              {t('LEGAL DISCLOSURE', 'আইনগত স্বীকৃতি')}
            </span>
            <h3 className="font-serif text-xl sm:text-2xl uppercase tracking-[0.14em] text-[#1C1917]">
              {t('REGISTERED BANGLADESHI ENTERPRISE', 'নিবন্ধিত বাণিজ্যিক প্রতিষ্ঠান')}
            </h3>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center pt-2">
            <div className="p-4 bg-[#F9F6F0] border border-[#E6DFD5]/80">
              <span className="text-[9px] uppercase tracking-wider text-[#1C1917]/50 block">DBID CERTIFICATE</span>
              <span className="text-xs font-mono font-medium text-[#1C1917] mt-1 block">{BRAND.corporate.dbid}</span>
            </div>
            <div className="p-4 bg-[#F9F6F0] border border-[#E6DFD5]/80">
              <span className="text-[9px] uppercase tracking-wider text-[#1C1917]/50 block">TRADE LICENSE</span>
              <span className="text-xs font-mono font-medium text-[#1C1917] mt-1 block">{BRAND.corporate.tradeLicense}</span>
            </div>
            <div className="p-4 bg-[#F9F6F0] border border-[#E6DFD5]/80">
              <span className="text-[9px] uppercase tracking-wider text-[#1C1917]/50 block">VAT / BIN NUMBER</span>
              <span className="text-xs font-mono font-medium text-[#1C1917] mt-1 block">{BRAND.corporate.vatBin}</span>
            </div>
            <div className="p-4 bg-[#F9F6F0] border border-[#E6DFD5]/80">
              <span className="text-[9px] uppercase tracking-wider text-[#1C1917]/50 block">TAX TIN ID</span>
              <span className="text-xs font-mono font-medium text-[#1C1917] mt-1 block">{BRAND.corporate.tin}</span>
            </div>
          </div>

          <p className="text-[10px] text-center text-[#1C1917]/60 font-mono tracking-wider uppercase pt-2">
            {BRAND.registeredAddress}
          </p>
        </div>
      </section> */}

      {/* ========================================================================= */}
      {/* 5. INVITATION ACTION */}
      {/* ========================================================================= */}
      <section className="max-w-3xl mx-auto px-4 text-center space-y-6 pt-4">
        <h3 className="text-xl sm:text-3xl font-serif uppercase tracking-[0.16em] font-light text-[#1C1917]">
          {t('EXPERIENCE THE CURATED EDIT', 'আপনার স্কিনকেয়ার যাত্রা শুরু করুন')}
        </h3>
        <p className="text-xs sm:text-sm text-[#1C1917]/70 font-light leading-relaxed uppercase tracking-wider max-w-lg mx-auto">
          {t(
            'EXPLORE OUR VERIFIED INTERNATIONAL FORMULATIONS TAILORED FOR YOUR SKIN.',
            'বিশ্বসেরা খাঁটি ফর্মুলেশনের মাধ্যমে আপনার ত্বকের স্বাস্থ্য পুনরুজ্জীবিত করুন।'
          )}
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
          <Link
            href="/catalog"
            className="w-full sm:w-auto px-8 py-3.5 bg-[#1C1917] hover:bg-[#8C6D3B] text-[#FAF8F5] text-xs uppercase tracking-[0.22em] font-medium transition-all duration-300 shadow-sm flex items-center justify-center space-x-2.5 rounded-none"
          >
            <span>{t('EXPLORE THE EDIT', 'কালেকশন দেখুন')}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
          <Link
            href="/customer/loyalty"
            className="w-full sm:w-auto px-7 py-3.5 bg-transparent hover:bg-[#1C1917]/5 border border-[#1C1917]/30 hover:border-[#1C1917] text-[#1C1917] text-xs uppercase tracking-[0.22em] font-medium transition-all duration-300 flex items-center justify-center space-x-2 rounded-none"
          >
            <span>{t('CLIENT PRIVILEGES', 'ক্লায়েন্ট প্রিভিলেজ')}</span>
          </Link>
        </div>
      </section>

    </div>
  );
}
