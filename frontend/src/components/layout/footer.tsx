'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Check, Plus, Minus } from 'lucide-react';
import { BRAND } from '@/lib/constants';
import { useLanguage } from '@/context/language-context';
import { useCart } from '@/context/cart-context';

import { buildWhatsAppUrl, sanitizeMessengerUrl, sanitizeInstagramUrl } from '@/lib/concierge';

export function Footer() {
  const { lang, t } = useLanguage();
  const { settings } = useCart();
  const [email, setEmail] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [subscribeMessage, setSubscribeMessage] = useState<string | null>(null);
  const [openAccordion, setOpenAccordion] = useState<string | null>(null);

  const supportPhone = settings?.supportPhone || BRAND.supportPhone;
  const supportWhatsApp = settings?.supportWhatsApp || BRAND.supportWhatsApp;
  const messengerLink = sanitizeMessengerUrl(settings?.supportMessenger || BRAND.supportMessenger);
  const instagramLink = sanitizeInstagramUrl(settings?.supportInstagram || BRAND.supportInstagram);
  const facebookLink = settings?.supportFacebook || BRAND.supportFacebook;
  const whatsAppUrl = buildWhatsAppUrl(supportWhatsApp, 'Hi SEYVEN Concierge! I would like to inquire about your dermal formulations.');

  const toggleAccordion = (id: string) => {
    setOpenAccordion(openAccordion === id ? null : id);
  };

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://seyven-beauty-backend.onrender.com/api/v1';
      const res = await fetch(`${apiUrl}/newsletter/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), source: 'FOOTER' }),
      });
      const data = await res.json().catch(() => null);
      setIsSubscribed(true);
      if (data?.message) {
        setSubscribeMessage(data.message);
      }
      setEmail('');
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
      titleEn: 'MAY WE HELP YOU?',
      titleBn: 'গ্রাহক সেবা ও সহায়তা',
      links: [
        { href: messengerLink, labelEn: 'Contact the Messenger Concierge', labelBn: 'কাস্টমার কেয়ার ও কনসিয়ার্জ' },
        { href: '/track-order', labelEn: 'Track Your Parcel Live', labelBn: 'পার্সেল লাইভ ট্র্যাকিং' },
        { href: '/legal/return_refund', labelEn: 'Return & Exchange Sanctuary Policy', labelBn: 'রিটার্ন ও রিফান্ড নীতি' },
        { href: '/legal/shipping_delivery', labelEn: 'Shipping & Nationwide Delivery', labelBn: 'দেশব্যাপী ডেলিভারি সংক্রান্ত তথ্য' },
      ],
    },
    {
      id: 'the-edit',
      titleEn: 'THE EDIT',
      titleBn: 'সেভেন পরিচয়',
      links: [
        { href: '/catalog', labelEn: 'The Sanctuary of International Beauty', labelBn: 'সৌন্দর্যের আন্তর্জাতিক অভয়ারণ্য' },
        { href: '/catalog?curated=climate-research', labelEn: 'Bangladesh Dermal Climate Research', labelBn: 'বাংলাদেশি ত্বকের উপযোগী স্কিনকেয়ার' },
        { href: '/legal/privacy', labelEn: 'Privacy & Data Sovereignty', labelBn: 'তথ্য সুরক্ষা ও প্রাইভেসি নীতিমালা' },
        { href: '/legal/terms', labelEn: 'Terms of Service', labelBn: 'ব্যবহারের আইনি শর্তাবলী' },
      ],
    },
    {
      id: 'services',
      titleEn: 'EXCLUSIVE SERVICES',
      titleBn: 'বিশেষ সুবিধা ও সেবা',
      links: [
        { href: messengerLink, labelEn: 'Bespoke Messenger Concierge', labelBn: 'ব্যক্তিগত মেসেঞ্জার কনসিয়ার্জ' },
        { href: instagramLink, labelEn: 'Instagram Editorial (@seyven_beauty)', labelBn: 'ইনস্টাগ্রাম বিউটি কেয়ার' },
        { href: '/customer/loyalty', labelEn: 'Sanctuary Privilege VIP Club', labelBn: 'ভিআইপি লয়্যালটি প্রোগ্রাম ও পয়েন্ট' },
        { href: '/customer/account', labelEn: 'Private Client Account & Vault', labelBn: 'গ্রাহক প্রোফাইল ও অর্ডার হিস্ট্রি' },
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
            {t('JOIN OUR NEWSLETTER', 'নিউজলেটারে যুক্ত থাকুন')}
          </h3>
          
          <p className="text-xs text-[#8E8B85] font-light leading-relaxed max-w-md mx-auto">
            {t(
              'Be the first to receive new formulation arrivals, skincare rituals, and private client privileges.',
              'নতুন স্কিনকেয়ার কালেকশন, বিউটি রুটিন টিপস এবং এক্সক্লুসিভ সুবিধার নিয়মিত আপডেট পেতে সাবস্ক্রাইব করুন।'
            )}
          </p>

          <div className="pt-2 max-w-md mx-auto">
            {isSubscribed ? (
              <div className="p-3 bg-[#111111] border border-[#C7A97B]/40 flex items-center justify-center space-x-2 text-xs text-[#C7A97B]">
                <Check className="w-4 h-4 text-[#C7A97B] shrink-0" />
                <span className="tracking-[0.1em] font-light">
                  {subscribeMessage || t('Thank you for subscribing to SEYVEN.', 'সেভেন নিউজলেটারে আপনাকে স্বাগতম।')}
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
                    placeholder={t('Enter your email address', 'আপনার ইমেইল অ্যাড্রেস লিখুন')}
                    className="w-full bg-transparent text-xs text-white placeholder-[#8E8B85] tracking-[0.12em] py-2 focus:outline-none pr-16 text-center sm:text-left pl-2 disabled:opacity-50"
                  />
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    aria-label="Subscribe to newsletter"
                    className="absolute right-0 py-1.5 px-2 text-[10px] uppercase tracking-[0.2em] font-medium text-[#C7A97B] hover:text-white transition-colors flex items-center space-x-1 disabled:opacity-50"
                  >
                    <span>{isSubmitting ? (lang === 'bn' ? 'যুক্ত হচ্ছে...' : 'JOINING...') : t('JOIN', 'যুক্ত হন')}</span>
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
        
        {/* MOBILE ACCORDION (Gucci's signature mobile UX) */}
        <div className="lg:hidden divide-y divide-[#1F1F1F] border-y border-[#1F1F1F]">
          {pillarSections.map((section) => {
            const isOpen = openAccordion === section.id;
            return (
              <div key={section.id}>
                <button
                  type="button"
                  onClick={() => toggleAccordion(section.id)}
                  className="w-full py-4 flex items-center justify-between text-left text-xs uppercase tracking-[0.2em] font-medium text-white hover:text-[#C7A97B] transition-colors"
                >
                  <span>{lang === 'bn' ? section.titleBn : section.titleEn}</span>
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
                        key={`${section.id}-${link.labelEn}`}
                        href={link.href}
                        className="block text-xs font-light text-[#8E8B85] hover:text-white transition-colors tracking-[0.05em]"
                      >
                        {lang === 'bn' ? link.labelBn : link.labelEn}
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
              <span>{t('BOUTIQUE & CONCIERGE', 'বুটিক ও কনসিয়ার্জ')}</span>
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
                {lang === 'bn' ? section.titleBn : section.titleEn}
              </h4>
              <ul className="space-y-2.5 text-xs font-light text-[#8E8B85]">
                {section.links.map((link) => (
                  <li key={`${section.id}-${link.labelEn}`}>
                    <Link href={link.href} className="hover:text-white transition-colors block tracking-[0.05em]">
                      {lang === 'bn' ? link.labelBn : link.labelEn}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Desktop Column 4: Concierge & Boutique */}
          <div className="space-y-4 text-xs">
            <h4 className="text-xs uppercase tracking-[0.25em] font-medium text-white pb-2 border-b border-[#1F1F1F]">
              {t('CONCIERGE & THE EDIT', 'বুটিক ও কনসিয়ার্জ')}
            </h4>
            <div className="space-y-3 text-[#8E8B85] font-light leading-relaxed">
              <p className="text-[11px]">
                {BRAND.registeredAddress}
              </p>
              {supportPhone ? (
                <div className="pt-1">
                  <a href={`tel:${supportPhone}`} className="text-white hover:text-[#C7A97B] font-medium tracking-wider block">
                    {supportPhone}
                  </a>
                  <span className="text-[10px] text-[#6E6B65] block mt-0.5">{BRAND.officeHours}</span>
                </div>
              ) : null}
              <p className="text-[11px] pt-1 text-[#8E8B85]">
                {BRAND.supportEmail}
              </p>
              <div className="pt-2 flex flex-col gap-1.5 text-[10px] font-mono">
                {supportWhatsApp && whatsAppUrl ? (
                  <a
                    href={whatsAppUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-white hover:text-[#C7A97B] transition-colors flex items-center gap-1.5"
                  >
                    <span>WhatsApp: {supportWhatsApp} ↗</span>
                  </a>
                ) : null}
                <a
                  href={messengerLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#C7A97B] hover:underline flex items-center gap-1.5"
                >
                  <span>Messenger: {messengerLink.replace(/^https?:\/\//, '')} ↗</span>
                </a>
                <a
                  href={facebookLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#8E8B85] hover:text-white hover:underline flex items-center gap-1.5"
                >
                  <span>Facebook: /{facebookLink.replace(/^https?:\/\/(www\.)?facebook\.com\/?/, '')} ↗</span>
                </a>
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
