'use client';

import React from 'react';
import Link from 'next/link';
import { ShieldCheck, ThermometerSnowflake, ArrowRight, Truck, HeartHandshake } from 'lucide-react';

export default function AboutPage() {
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
            <span>THE SANCTUARY OF BEAUTY</span>
            <span className="w-8 h-[1px] bg-[#C7A97B]/40 inline-block" />
          </div>

          {/* Majestic Serif Headline */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-serif font-light uppercase tracking-[0.12em] sm:tracking-[0.16em] text-[#1C1917] leading-[1.2] select-none">
            THE PURSUIT OF PURITY. <br />
            <span className="text-[#8C6D3B] font-normal">CURATED FOR BANGLADESH.</span>
          </h1>

          {/* Architectural Subtitle */}
          <p className="max-w-2xl mx-auto text-xs sm:text-sm text-[#1C1917]/75 font-light leading-relaxed tracking-wider uppercase">
            BORN FROM A REFUSAL TO COMPROMISE. WE CURATE RENOWNED INTERNATIONAL DERMATOLOGICAL ICONS FORMULATED TO THRIVE IN TROPICAL HUMIDITY.
          </p>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2. THE SEYVEN MANIFESTO — EDITORIAL NARRATIVE */}
      {/* ========================================================================= */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-14 items-center">
          
          <div className="md:col-span-5 space-y-4">
            <span className="text-[10px] uppercase tracking-[0.3em] font-medium text-[#C7A97B] block">
              OUR GENESIS
            </span>
            <h2 className="text-2xl sm:text-4xl font-serif uppercase tracking-[0.14em] font-light text-[#1C1917] leading-tight">
              WHY SEYVEN WAS FOUNDED
            </h2>
            <div className="w-12 h-[1px] bg-[#C7A97B]" />
          </div>

          <div className="md:col-span-7 space-y-4 text-xs sm:text-sm text-[#1C1917]/80 font-light leading-relaxed">
            <p>
              The Bangladeshi beauty landscape has long been flooded with counterfeit formulations, hazardous mercury-based bleaches, and misstored active serums spoiled by equatorial heat.
            </p>
            <p>
              SEYVEN was established as a sanctuary. We reject mass retail chaos in favor of bespoke dermal curation. Every single flacon in our care is imported directly from verified brand laboratories across Seoul, Paris, Tokyo, and New York — sealed, authentic, and climate-protected.
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
            SANCTUARY STANDARDS
          </span>
          <h2 className="text-2xl sm:text-4xl font-serif uppercase tracking-[0.16em] font-light text-[#1C1917]">
            THE FOUR PILLARS OF INTEGRITY
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
                DIRECT BRAND IMPORTS
              </h3>
              <p className="text-[11px] text-[#1C1917]/70 font-light leading-relaxed uppercase tracking-wider">
                100% genuine icons with anti-counterfeit seals directly sourced from verified global distributors. Zero third-party brokers.
              </p>
            </div>
            <span className="text-[9px] uppercase tracking-[0.22em] text-[#8C6D3B] font-mono pt-3 border-t border-[#E6DFD5]/70 block">
              AUTHENTIC DIRECT IMPORT
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
                CLIMATE-CONTROLLED CARE
              </h3>
              <p className="text-[11px] text-[#1C1917]/70 font-light leading-relaxed uppercase tracking-wider">
                Preserved continuously at 15°C–25°C to guard active botanicals and delicate vitamin serums against severe tropical heat degradation.
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
                WHITE-GLOVE DISPATCH
              </h3>
              <p className="text-[11px] text-[#1C1917]/70 font-light leading-relaxed uppercase tracking-wider">
                Secure delivery routed primarily via Pathao Express (with Steadfast backup custody) in tamper-evident sanctuary boxes.
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
                PERSONALIZED ADVISORY
              </h3>
              <p className="text-[11px] text-[#1C1917]/70 font-light leading-relaxed uppercase tracking-wider">
                We diagnose dermal root concerns before suggesting a regimen. Direct concierge guidance tailored to your skin.
              </p>
            </div>
            <span className="text-[9px] uppercase tracking-[0.22em] text-[#8C6D3B] font-mono pt-3 border-t border-[#E6DFD5]/70 block">
              BEAUTY CONCIERGE
            </span>
          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. INVITATION ACTION */}
      {/* ========================================================================= */}
      <section className="max-w-3xl mx-auto px-4 text-center space-y-6 pt-4">
        <h3 className="text-xl sm:text-3xl font-serif uppercase tracking-[0.16em] font-light text-[#1C1917]">
          EXPERIENCE THE CURATED EDIT
        </h3>
        <p className="text-xs sm:text-sm text-[#1C1917]/70 font-light leading-relaxed uppercase tracking-wider max-w-lg mx-auto">
          EXPLORE OUR VERIFIED INTERNATIONAL FORMULATIONS TAILORED FOR YOUR SKIN.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
          <Link
            href="/catalog"
            className="w-full sm:w-auto px-8 py-3.5 bg-[#1C1917] hover:bg-[#8C6D3B] text-[#FAF8F5] text-xs uppercase tracking-[0.22em] font-medium transition-all duration-300 shadow-sm flex items-center justify-center space-x-2.5 rounded-none"
          >
            <span>EXPLORE THE EDIT</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
          <Link
            href="/care"
            className="w-full sm:w-auto px-7 py-3.5 bg-transparent hover:bg-[#1C1917]/5 border border-[#1C1917]/30 hover:border-[#1C1917] text-[#1C1917] text-xs uppercase tracking-[0.22em] font-medium transition-all duration-300 flex items-center justify-center space-x-2 rounded-none"
          >
            <span>CLIENT CARE</span>
          </Link>
        </div>
      </section>

    </div>
  );
}
