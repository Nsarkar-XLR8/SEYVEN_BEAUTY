'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Plus, Minus, ArrowRight, Check } from 'lucide-react';
import { useCart } from '@/context/cart-context';
import { BRAND } from '@/lib/constants';
import { buildWhatsAppUrl, sanitizeWhatsAppNumber } from '@/lib/concierge';

export function Footer() {
  const { settings } = useCart();
  const [openAccordion, setOpenAccordion] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscribeMessage, setSubscribeMessage] = useState('');

  const supportPhone = settings?.supportPhone || BRAND.supportPhone;
  const supportWhatsApp = settings?.supportWhatsApp || BRAND.supportWhatsApp;
  const rawMessenger = settings?.supportMessenger || BRAND.supportMessenger || 'https://m.me/seyvenofficial';
  const messengerLink = rawMessenger.startsWith('http') ? rawMessenger : `https://${rawMessenger}`;
  const instagramLink = BRAND.supportInstagram || 'https://www.instagram.com/seyven_beauty/';

  const cleanPhone = sanitizeWhatsAppNumber(supportWhatsApp);
  const whatsAppUrl = cleanPhone ? buildWhatsAppUrl(cleanPhone) : 'https://wa.me/8801700000000';

  const toggleAccordion = (id: string) => {
    setOpenAccordion(openAccordion === id ? null : id);
  };

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) return;

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.ok) {
        setIsSubscribed(true);
        setSubscribeMessage(data.message || 'Thank you for subscribing to SEYVEN.');
        setEmail('');
      } else {
        setIsSubscribed(true);
        setSubscribeMessage(data.message || 'Thank you for joining our private client circle.');
        setEmail('');
      }
    } catch {
      setIsSubscribed(true);
      setEmail('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const pillarSections = [
    {
      id: 'help',
      title: 'MAY WE HELP YOU?',
      links: [
        { href: messengerLink, label: 'Contact the Messenger Concierge' },
        { href: '/track-order', label: 'Track Your Parcel Live' },
        { href: '/legal/return_refund', label: 'Return & Exchange Sanctuary Policy' },
        { href: '/legal/shipping_delivery', label: 'Shipping & Nationwide Delivery' },
      ],
    },
    {
      id: 'the-edit',
      title: 'THE EDIT',
      links: [
        { href: '/catalog', label: 'The Sanctuary of International Beauty' },
        { href: '/catalog?curated=climate-research', label: 'Bangladesh Dermal Climate Research' },
        { href: '/legal/privacy', label: 'Privacy & Data Sovereignty' },
        { href: '/legal/terms', label: 'Terms of Service' },
      ],
    },
    {
      id: 'services',
      title: 'EXCLUSIVE SERVICES',
      links: [
        { href: messengerLink, label: 'Bespoke Messenger Concierge' },
        { href: instagramLink, label: 'Instagram Editorial (@seyven_beauty)' },
        { href: '/customer/loyalty', label: 'Sanctuary Privilege VIP Club' },
        { href: '/customer/account', label: 'Private Client Account & Vault' },
      ],
    },
  ];

  return (
    <footer className="w-full bg-black text-white border-t border-[#1F1F1F] pt-12 sm:pt-16 pb-28 lg:pb-12 transition-colors relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12 sm:space-y-16">
        
        {/* ========================================================================= */}
        {/* TIER 1: HAUTE BEAUTY NEWSLETTER (Chanel / Aesop Inspired Minimal Luxury) */}
        {/* ========================================================================= */}
        <div className="text-center max-w-xl mx-auto space-y-3 pb-8 sm:pb-10 border-b border-[#1F1F1F]">
          <h3 className="text-lg sm:text-xl font-serif uppercase tracking-[0.25em] font-light text-white">
            JOIN OUR NEWSLETTER
          </h3>
          
          <p className="text-xs text-[#8E8B85] font-light leading-relaxed max-w-md mx-auto">
            Be the first to receive new formulation arrivals, skincare rituals, and private client privileges.
          </p>

          <div className="pt-2 max-w-md mx-auto">
            {isSubscribed ? (
              <div className="p-3 bg-[#111111] border border-[#C7A97B]/40 flex items-center justify-center space-x-2 text-xs text-[#C7A97B]">
                <Check className="w-4 h-4 text-[#C7A97B] shrink-0" />
                <span className="tracking-[0.1em] font-light">
                  {subscribeMessage || 'Thank you for subscribing to SEYVEN.'}
                </span>
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="pt-1">
                <div className="relative flex items-center border-b border-white/20 focus-within:border-white transition-colors pb-1">
                  <input
                    type="email"
                    required
                    disabled={isSubmitting}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email address"
                    className="w-full bg-transparent text-xs text-white placeholder-[#8E8B85] tracking-[0.12em] py-2 focus:outline-none pr-16 text-center sm:text-left pl-2 disabled:opacity-50"
                  />
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    aria-label="Subscribe to newsletter"
                    className="absolute right-0 py-1.5 px-2 text-[10px] uppercase tracking-[0.2em] font-medium text-[#C7A97B] hover:text-white transition-colors flex items-center space-x-1 disabled:opacity-50"
                  >
                    <span>{isSubmitting ? 'JOINING...' : 'JOIN'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* TIER 2: PILLARS — ACCORDIONS ON MOBILE, 4-COLUMN MEGA-GRID ON DESKTOP */}
        {/* ========================================================================= */}
        
        {/* MOBILE ACCORDIONS (Sleek Bordered Row Layout) */}
        <div className="lg:hidden divide-y divide-[#1F1F1F] border-b border-[#1F1F1F] pb-4">
          {pillarSections.map((section) => {
            const isOpen = openAccordion === section.id;
            return (
              <div key={section.id}>
                <button
                  type="button"
                  onClick={() => toggleAccordion(section.id)}
                  className="w-full py-4 flex items-center justify-between text-left text-xs uppercase tracking-[0.2em] font-medium text-white hover:text-[#C7A97B] transition-colors"
                >
                  <span>{section.title}</span>
                  {isOpen ? (
                    <Minus className="w-4 h-4 text-[#C7A97B] shrink-0" />
                  ) : (
                    <Plus className="w-4 h-4 text-[#8E8B85] shrink-0" />
                  )}
                </button>
                {isOpen && (
                  <div className="pb-5 pt-1 space-y-3 pl-1">
                    {section.links.map((link) => (
                      <Link
                        key={link.label}
                        href={link.href}
                        className="block text-xs font-light text-[#8E8B85] hover:text-white tracking-[0.05em] transition-colors"
                      >
                        {link.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          {/* Concierge & Boutique Accordion Item on Mobile */}
          <div>
            <button
              type="button"
              onClick={() => toggleAccordion('concierge')}
              className="w-full py-4 flex items-center justify-between text-left text-xs uppercase tracking-[0.2em] font-medium text-white hover:text-[#C7A97B] transition-colors"
            >
              <span>BOUTIQUE & CONCIERGE</span>
              {openAccordion === 'concierge' ? (
                <Minus className="w-4 h-4 text-[#C7A97B] shrink-0" />
              ) : (
                <Plus className="w-4 h-4 text-[#8E8B85] shrink-0" />
              )}
            </button>
            {openAccordion === 'concierge' && (
              <div className="pb-5 pt-1 space-y-3.5 pl-1 text-xs text-[#8E8B85] font-light">
                <p className="leading-relaxed">
                  {BRAND.registeredAddress}
                </p>
                <div className="flex flex-col space-y-1 pt-1">
                  <a href={`tel:${supportPhone}`} className="text-white hover:text-[#C7A97B] font-medium tracking-wider">
                    {supportPhone}
                  </a>
                  <span className="text-[10px] text-[#6E6B65]">{BRAND.officeHours}</span>
                </div>
                <div className="pt-1">
                  <span className="text-[10px] uppercase tracking-[0.15em] text-[#C7A97B] block font-medium">
                    WhatsApp Concierge
                  </span>
                  <a
                    href={whatsAppUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-white hover:text-[#C7A97B] font-mono transition-colors"
                  >
                    {supportWhatsApp} ↗
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* DESKTOP 4-COLUMN MEGA GRID (Spacious, Elegant Luxury Spacing) */}
        <div className="hidden lg:grid lg:grid-cols-4 gap-12 pb-14 border-b border-[#1F1F1F]">
          {pillarSections.map((section) => (
            <div key={section.id} className="space-y-4">
              <h4 className="text-xs uppercase tracking-[0.25em] font-medium text-white pb-2 border-b border-[#1F1F1F]">
                {section.title}
              </h4>
              <ul className="space-y-2.5 text-xs font-light text-[#8E8B85]">
                {section.links.map((link) => (
                  <li key={link.label}>
                    <Link href={link.href} className="hover:text-white transition-colors block tracking-[0.05em]">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Desktop Column 4: Concierge & Boutique */}
          <div className="space-y-4 text-xs">
            <h4 className="text-xs uppercase tracking-[0.25em] font-medium text-white pb-2 border-b border-[#1F1F1F]">
              CONCIERGE & THE EDIT
            </h4>
            <div className="space-y-3 text-[#8E8B85] font-light leading-relaxed">
              <p className="text-[11px]">
                {BRAND.registeredAddress}
              </p>
              {supportPhone ? (
                <div className="pt-1">
                  <a href={`tel:${supportPhone}`} className="text-white hover:text-[#C7A97B] font-medium tracking-wider block">
                    Direct: {supportPhone}
                  </a>
                  <span className="text-[10px] text-[#6E6B65] block pt-0.5">{BRAND.officeHours}</span>
                </div>
              ) : null}
              {supportWhatsApp ? (
                <div className="pt-1 border-t border-[#1F1F1F]">
                  <span className="text-[9px] uppercase tracking-[0.2em] text-[#C7A97B] block font-medium">
                    Private Client WhatsApp
                  </span>
                  <a
                    href={whatsAppUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-white hover:text-[#C7A97B] font-mono transition-colors block pt-0.5"
                  >
                    {supportWhatsApp} ↗
                  </a>
                </div>
              ) : null}
              <div className="pt-2">
                <a
                  href={instagramLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#8E8B85] hover:text-white hover:underline flex items-center gap-1.5"
                >
                  <span>Instagram: @{instagramLink.replace(/^https?:\/\/(www\.)?instagram\.com\/?/, '').replace(/\/$/, '')} ↗</span>
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* TIER 3: EXACT GUCCI FOOTER RECREATION (Country/Region + Legal + Wordmark) */}
        {/* ========================================================================= */}
        <div className="space-y-8 pt-4">
          
          {/* COUNTRY/REGION (Matches Gucci Luxury Aesthetics) */}
          <div className="space-y-2">
            <span className="text-[10px] sm:text-xs uppercase tracking-[0.18em] text-[#8E8B85] font-medium block">
              COUNTRY/REGION
            </span>
            <div className="flex items-center space-x-6">
              <span className="text-xs sm:text-sm text-white underline underline-offset-4 decoration-white font-normal cursor-default">
                Bangladesh (English)
              </span>
            </div>
          </div>

          {/* Legal Disclosures & Compliance (Matches Gucci Screenshot Typography) */}
          <div className="space-y-1 text-xs text-[#8E8B85] font-normal leading-relaxed pt-2">
            <p>
              © 2026 SEYVEN Beauty Sanctuary Ltd. - All rights reserved.{BRAND.corporate.dbid ? ` DBID # ${BRAND.corporate.dbid}` : ''}
            </p>
            {BRAND.corporate.tradeLicense ? (
              <p className="text-[11px] text-[#6E6B65]">
                TRADE LICENCE # {BRAND.corporate.tradeLicense}{BRAND.corporate.vatBin ? ` and VAT BIN # ${BRAND.corporate.vatBin}` : ''}
              </p>
            ) : null}
          </div>

          {/* ========================================================================= */}
          {/* TIER 4: MONUMENTAL GUCCI-STYLE SEYVEN SCREEN-SPANNING WORDMARK */}
          {/* ========================================================================= */}
          <div className="w-full pt-10 sm:pt-16 pb-2 overflow-hidden select-none pointer-events-none">
            <div className="w-full flex items-center justify-between font-serif text-[18vw] leading-[0.85] text-white tracking-normal font-light">
              <span>S</span>
              <span>E</span>
              <span>Y</span>
              <span>V</span>
              <span>E</span>
              <span>N</span>
            </div>
          </div>

        </div>

      </div>
    </footer>
  );
}
