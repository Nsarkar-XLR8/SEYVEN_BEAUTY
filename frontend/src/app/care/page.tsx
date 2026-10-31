'use client';

import React from 'react';
import Link from 'next/link';
import {
  MessageCircle,
  Sparkles,
  ShieldCheck,
  Gift,
  HeartHandshake,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldAlert,
  Send,
} from 'lucide-react';
import { BRAND } from '@/lib/constants';
import { useCart } from '@/context/cart-context';

export default function ClientCarePage() {
  const { settings } = useCart();
  const messengerUrl = settings?.supportMessenger || BRAND.supportMessenger || 'https://m.me/seyvenofficial';
  const messengerLink = messengerUrl.startsWith('http') ? messengerUrl : `https://${messengerUrl}`;

  const carePillars = [
    {
      icon: MessageCircle,
      badge: 'ALWAYS COMPLIMENTARY',
      title: 'Bespoke 1-on-1 Skincare Advisory',
      desc: 'Whether navigating barrier repair, stubborn hyperpigmentation, or tropical humidity breakouts — our dedicated advisors guide you 1-on-1 on Messenger. Free routine evaluations, formulation comparisons, and zero purchase obligation.',
    },
    {
      icon: Sparkles,
      badge: 'ALWAYS 5% COURTESY',
      title: 'Always 5% Off For Repeat Clients',
      desc: 'Lifelong reverence for our patrons. From your second order onwards, repeat clients always receive an automatic 5% courtesy discount on every single purchase. No coupon codes needed, no points math, no expiration — seamlessly recognized and applied at checkout.',
    },
    {
      icon: Gift,
      badge: 'SEASONAL CELEBRATIONS',
      title: 'Festive Curations & 7% Courtesy',
      desc: 'During festive occasions (Eid-ul-Fitr, Durga Puja, and seasonal launches), enjoy automatic 7% celebrations and curated discovery deluxe minis — seamlessly reflected in your bag with zero codes.',
    },
    {
      icon: ShieldCheck,
      badge: 'CLIMATE ARCHITECTURE',
      title: '100% Sealed Global Authenticity',
      desc: 'Direct laboratory imports with hermetic tamper-proof seals and climate-controlled storage. Delivered via express 24h courier in Dhaka and nationwide doorstep handover across all 64 districts.',
    },
  ];

  const consultationSteps = [
    {
      step: '01',
      title: 'Initiate Conversation',
      desc: 'Tap our Messenger concierge anytime. Tell us your skin type, primary concerns, or current daily routine.',
    },
    {
      step: '02',
      title: 'Bespoke Formulation Plan',
      desc: 'Our beauty advisors analyze ingredient synergies and suggest exact international formulations calibrated for Bangladesh’s weather.',
    },
    {
      step: '03',
      title: 'Seamless Fulfillment',
      desc: 'Place your order comfortably online or let our concierge take your address and dispatch it directly to your doorstep.',
    },
  ];

  return (
    <div className="min-h-screen bg-[#F9F6F0] text-[#1C1917] pb-24 space-y-16 sm:space-y-20">

      {/* ========================================================================= */}
      {/* 1. EDITORIAL HEADER */}
      {/* ========================================================================= */}
      <section className="relative px-4 sm:px-6 lg:px-8 pt-10 sm:pt-16 pb-12 sm:pb-16 border-b border-[#E6DFD5] text-center">
        <div className="max-w-3xl mx-auto space-y-5 sm:space-y-6">
          
          <div className="flex items-center justify-center space-x-3 text-[10px] sm:text-[11px] uppercase tracking-[0.28em] text-[#C7A97B] font-medium">
            <span className="w-8 h-[1px] bg-[#C7A97B]/40 inline-block" />
            <span>THE SANCTUARY OF CARE // CLIENT CONCIERGE</span>
            <span className="w-8 h-[1px] bg-[#C7A97B]/40 inline-block" />
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-serif font-light uppercase tracking-[0.14em] sm:tracking-[0.18em] text-[#1C1917] leading-[1.2]">
            DEDICATED ADVISORY. <br />
            <span className="text-[#8C6D3B] font-normal">ALWAYS COMPLIMENTARY.</span>
          </h1>

          <p className="max-w-2xl mx-auto text-xs sm:text-sm text-[#1C1917]/75 font-light leading-relaxed tracking-wider uppercase">
            SKINCARE SHOULD BE SINGULAR, NEVER GENERALIZED. WE SOLVE ALL DERMAL CONCERNS 1-ON-1 VIA MESSENGER CONCIERGE WITH ZERO CONSULTATION CHARGE.
          </p>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2. PRIMARY HERO ACTION CARD — MESSENGER CONCIERGE */}
      {/* ========================================================================= */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-sm overflow-hidden border border-[#C7A97B]/50 bg-gradient-to-br from-[#1C1917] via-[#2A2421] to-[#1C1917] text-[#FAF8F5] p-8 sm:p-12 shadow-2xl space-y-8">
          
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#C7A97B]/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 space-y-4 max-w-2xl">
            <div className="inline-flex items-center space-x-2 px-3 py-1 bg-[#C7A97B]/15 border border-[#C7A97B]/40 rounded-full text-[10px] uppercase tracking-[0.25em] text-[#E6C687] font-medium">
              <Sparkles className="w-3.5 h-3.5" />
              <span>FREE 1-ON-1 SKIN CONSULTATION</span>
            </div>

            <h2 className="text-2xl sm:text-4xl font-serif font-light uppercase tracking-[0.14em] text-[#FAF8F5] leading-snug">
              HAVE A SKIN CONCERN? <br />
              <span className="text-[#E6C687]">SPEAK DIRECTLY WITH OUR EXPERTS.</span>
            </h2>

            <p className="text-xs sm:text-sm text-[#FAF8F5]/80 font-light leading-relaxed">
              Unsure if a formulation matches your skin type, or struggling with redness, acne, or uneven tone? Send us a message on Facebook Messenger. Our skincare specialists provide personalized, honest recommendations calibrated specifically for Bangladesh’s humid subtropical climate.
            </p>
          </div>

          <div className="relative z-10 flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2">
            <a
              href={messengerLink}
              target="_blank"
              rel="noopener noreferrer"
              className="px-8 py-4 bg-[#C7A97B] hover:bg-[#D4B88C] active:scale-[0.99] text-[#1C1917] text-xs uppercase tracking-[0.22em] font-medium transition-all shadow-lg flex items-center justify-center space-x-2.5 text-center cursor-pointer"
            >
              <MessageCircle className="w-4 h-4" />
              <span>START FREE MESSENGER CONSULTATION</span>
            </a>

            <div className="flex items-center justify-center space-x-2 text-[10px] uppercase tracking-wider text-[#FAF8F5]/60">
              <Clock className="w-3.5 h-3.5 text-[#C7A97B]" />
              <span>REPLIES WITHIN MINUTES • 9AM – 10PM BST</span>
            </div>
          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. FOUR LUXURY CARE PILLARS */}
      {/* ========================================================================= */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center space-y-2">
          <span className="text-[10px] uppercase tracking-[0.25em] text-[#C7A97B] font-medium">
            WHY CLIENTS REVERE SEYVEN
          </span>
          <h2 className="text-2xl sm:text-3xl font-serif uppercase tracking-[0.14em] font-light text-[#1C1917]">
            THE FOUR PILLARS OF CLIENT CARE
          </h2>
          <div className="w-12 h-[1px] bg-[#C7A97B] mx-auto mt-2" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          {carePillars.map((p, idx) => {
            const Icon = p.icon;
            return (
              <div
                key={idx}
                className="p-7 sm:p-8 bg-[#FAF8F5] border border-[#E8E2D9] rounded-sm space-y-4 hover:border-[#C7A97B] transition-all group"
              >
                <div className="flex items-center justify-between">
                  <div className="w-11 h-11 rounded-full bg-[#1C1917]/5 border border-[#E8E2D9] flex items-center justify-center text-[#C7A97B] group-hover:scale-105 transition-transform">
                    <Icon className="w-5 h-5 stroke-[1.5]" />
                  </div>
                  <span className="text-[9px] font-mono uppercase tracking-widest text-[#8C6D3B] font-semibold bg-[#F4EFEA] px-2.5 py-1 rounded-sm border border-[#E8E2D9]">
                    {p.badge}
                  </span>
                </div>

                <div className="space-y-2">
                  <h3 className="text-base sm:text-lg font-serif uppercase tracking-wider text-[#1C1917]">
                    {p.title}
                  </h3>
                  <p className="text-xs sm:text-[13px] text-[#1C1917]/70 font-light leading-relaxed">
                    {p.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. THREE SIMPLE STEPS */}
      {/* ========================================================================= */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center space-y-2">
          <span className="text-[10px] uppercase tracking-[0.25em] text-[#C7A97B] font-medium">
            HOW IT WORKS
          </span>
          <h2 className="text-2xl sm:text-3xl font-serif uppercase tracking-[0.14em] font-light text-[#1C1917]">
            EFFORTLESS ADVISORY IN THREE STEPS
          </h2>
          <div className="w-12 h-[1px] bg-[#C7A97B] mx-auto mt-2" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
          {consultationSteps.map((s, idx) => (
            <div
              key={idx}
              className="p-6 sm:p-7 bg-white border border-[#E8E2D9] rounded-sm space-y-3 relative shadow-xs"
            >
              <span className="text-3xl font-serif font-light text-[#C7A97B]/70 block">
                {s.step}
              </span>
              <h4 className="text-sm uppercase tracking-wider font-medium text-[#1C1917]">
                {s.title}
              </h4>
              <p className="text-xs text-[#1C1917]/70 font-light leading-relaxed">
                {s.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. FOOTER CONCIERGE BANNER */}
      {/* ========================================================================= */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
        <div className="p-8 sm:p-10 bg-[#1C1917] text-[#FAF8F5] flex flex-col md:flex-row items-center justify-between gap-6 rounded-sm border border-[#C7A97B]/40 shadow-xl">
          <div className="space-y-2 text-center md:text-left">
            <span className="text-[9px] uppercase tracking-[0.25em] text-[#C7A97B] font-semibold block">
              ASSISTED CONCIERGE ORDERING
            </span>
            <p className="font-serif text-base sm:text-lg font-light text-[#FAF8F5]/90 max-w-md leading-relaxed">
              Prefer to order via chat? Simply message our team with what you need, and we will arrange doorstep dispatch for you.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto shrink-0">
            <a
              href={messengerLink}
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3.5 bg-[#C7A97B] hover:bg-[#D4B88C] text-[#1C1917] text-xs uppercase tracking-[0.2em] font-medium transition-all text-center flex items-center justify-center space-x-2"
            >
              <MessageCircle className="w-4 h-4" />
              <span>CHAT WITH CONCIERGE</span>
            </a>

            <Link
              href="/catalog"
              className="px-6 py-3.5 border border-[#C7A97B]/60 hover:border-[#C7A97B] hover:bg-[#C7A97B]/10 text-[#FAF8F5] text-xs uppercase tracking-[0.2em] font-medium transition-all text-center flex items-center justify-center space-x-2"
            >
              <span>EXPLORE THE EDIT</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}
