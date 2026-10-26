'use client';

import React from 'react';
import Link from 'next/link';
import { Sparkles, ArrowRight, ShieldCheck, HeartHandshake, CheckCircle2 } from 'lucide-react';
import { useLanguage } from '@/context/language-context';
import { ProductCard } from '@/components/storefront/product-card';

import { getAllProducts, createDynamicProductDetail, ProductDetail } from '@/data/products';

export default function HomePage() {
  const { lang, t } = useLanguage();
  const [products, setProducts] = React.useState<ProductDetail[]>([]);

  React.useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://seyven-beauty-backend.onrender.com/api/v1';

    // Fetch from resilient Next.js catalog API + backend (100% dynamic, published formulations only)
    fetch('/api/catalog/products')
      .then((r) => (r.ok ? r.json() : fetch(`${apiUrl}/catalog/products`).then((b) => (b.ok ? b.json() : null))))
      .then((data) => {
        if (Array.isArray(data)) {
          const cleaned = data.filter((d: any) => d && !d.id?.startsWith('prod-0') && !d.id?.startsWith('dummy-') && (!d.state || d.state === 'PUBLISHED'));
          const formatted: ProductDetail[] = cleaned.map((d: any) => createDynamicProductDetail(d));
          setProducts(formatted);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <div className="pb-16 space-y-10 sm:space-y-16 lg:space-y-20">

      {/* ========================================================================= */}
      {/* 1. HERO DISPLAY SECTION — BOUNDLESS HAUTE LUXURY */}
      {/* ========================================================================= */}
      <section className="relative flex flex-col justify-center items-center text-center px-4 sm:px-6 lg:px-8 pt-4 sm:pt-10 lg:pt-16 xl:pt-20 pb-2 sm:pb-4 lg:pb-12 xl:pb-16 bg-[#F9F6F0]">

        <div className="relative max-w-3xl lg:max-w-5xl xl:max-w-6xl mx-auto space-y-6 sm:space-y-7 lg:space-y-9">

          {/* Haute Monoline Overline (No Clumsy Pill Container or Cut Borders) */}
          <div className="flex items-center justify-center space-x-3 lg:space-x-4 text-[10px] sm:text-[11px] lg:text-xs uppercase tracking-[0.28em] lg:tracking-[0.34em] text-[#8C6D3B] font-medium">
            <span className="w-6 sm:w-8 lg:w-12 h-[1px] bg-[#C7A97B]/40 inline-block" />
            <span>{t('THE SANCTUARY OF BEAUTY', 'সৌন্দর্য ও নিরাময়ের আন্তর্জাতিক অভয়ারণ্য')}</span>
            <span className="w-6 sm:w-8 lg:w-12 h-[1px] bg-[#C7A97B]/40 inline-block" />
          </div>

          {/* Fluid Haute Luxury Editorial Headline — Balanced 2-Line Architecture */}
          <h1 className="text-2xl sm:text-4xl md:text-5xl lg:text-[44px] xl:text-[52px] 2xl:text-[58px] font-serif font-light uppercase tracking-[0.08em] sm:tracking-[0.12em] lg:tracking-[0.10em] xl:tracking-[0.12em] text-[#1C1917] leading-[1.25] sm:leading-[1.18] lg:leading-[1.15] select-none max-w-3xl lg:max-w-5xl mx-auto">
            {lang === 'bn' ? (
              <>
                <span className="inline">ব্যক্তিগত কনসালটেশন।</span> <br className="hidden sm:inline" />
                <span className="font-normal text-[#8C6D3B] block sm:inline">বিশ্বসেরা স্কিনকেয়ার।</span>
              </>
            ) : (
              <>
                <span className="inline">PERSONALIZED CONSULTANCY.</span> <br />
                <span className="font-normal text-[#8C6D3B]">RENOWNED SKINCARE.</span>
              </>
            )}
          </h1>

          {/* Elegant Subtitle */}
          <p className="max-w-xl lg:max-w-2xl xl:max-w-3xl mx-auto text-xs sm:text-sm lg:text-[15px] xl:text-base text-[#1C1917]/75 font-light leading-relaxed lg:leading-[1.8] tracking-wider pt-1">
            {t(
              'We never sell random bottles. We diagnose your exact dermal concerns and curate an authentic international regimen formulated for the Bangladeshi climate.',
              'অনুমানের ওপর ভিত্তি করে ভুল প্রোডাক্ট কেনা নয়। আপনার ত্বকের সুনির্দিষ্ট প্রয়োজন নির্ণয় করে আমরা তৈরি করে দিই সেরা আন্তর্জাতিক ব্র্যান্ডের নিখুঁত রুটিন।'
            )}
          </p>

          {/* Restrained Architectural Luxury Action */}
          <div className="pt-4 sm:pt-6 lg:pt-8 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-5 lg:gap-6 max-w-md lg:max-w-none mx-auto w-full">
            <Link
              href="/catalog"
              className="group w-full sm:w-auto lg:min-w-[240px] xl:min-w-[260px] px-8 lg:px-9 py-3.5 lg:py-4 bg-[#1C1917] hover:bg-[#8C6D3B] text-[#FAF8F5] text-xs uppercase tracking-[0.22em] lg:tracking-[0.24em] font-medium transition-all duration-300 shadow-sm flex items-center justify-center space-x-2.5 lg:space-x-3 rounded-none"
            >
              <span>{t('EXPLORE THE EDIT', 'কালেকশন দেখুন')}</span>
              <ArrowRight className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
            <Link
              href="/catalog?routine=morning"
              className="group w-full sm:w-auto lg:min-w-[240px] xl:min-w-[260px] px-7 lg:px-9 py-3.5 lg:py-4 bg-transparent hover:bg-[#1C1917] text-[#1C1917] hover:text-[#FAF8F5] border border-[#1C1917]/30 hover:border-[#1C1917] text-xs uppercase tracking-[0.22em] lg:tracking-[0.24em] font-medium transition-all duration-300 flex items-center justify-center space-x-2 lg:space-x-3 rounded-none"
            >
              <span>{t('CURATED ROUTINES', 'স্কিনকেয়ার রুটিন')}</span>
              <ArrowRight className="w-3.5 h-3.5 text-[#C7A97B] group-hover:text-[#FAF8F5] transition-all duration-300 group-hover:translate-x-1" />
            </Link>
          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2. THE CURATED EDIT — PURE HAUTE PRODUCT LISTING (WITHOUT FILTERS) */}
      {/* ========================================================================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-baseline justify-between mb-8 sm:mb-12 pb-4 border-b border-[#E6DFD5]">
          <div>
            <span className="text-[10px] uppercase tracking-[0.3em] font-medium text-[#C7A97B] block">
              {t('AUTHENTIC INTERNATIONAL ICONS', 'প্রমাণিত আন্তর্জাতিক ফর্মুলেশন')}
            </span>
            <h2 className="text-2xl sm:text-3xl font-serif uppercase tracking-[0.18em] font-normal text-[#1C1917] mt-1">
              {t('THE CURATED EDIT', 'দ্য কিউরেটেড এডিট')}
            </h2>
          </div>
          <Link
            href="/catalog"
            className="group text-xs uppercase tracking-[0.2em] font-medium text-[#1C1917] hover:text-[#8C6D3B] transition-colors flex items-center space-x-1.5 mt-3 sm:mt-0"
          >
            <span>{t('VIEW ALL FORMULATIONS', 'সকল ফর্মুলেশন দেখুন')}</span>
            <ArrowRight className="w-3.5 h-3.5 text-[#C7A97B] transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        {/* Direct Product Grid — No Filter Clutter */}
        {products.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
            {products.slice(0, 8).map((prod) => (
              <ProductCard
                key={prod.id}
                id={prod.id}
                slug={prod.slug}
                brand={prod.brand}
                titleEn={prod.titleEn}
                titleBn={prod.titleBn}
                purposeEn={prod.purposeTagEn}
                purposeBn={prod.purposeTagBn}
                volume={prod.volume}
                priceBdt={prod.priceBdt}
                imageUrl={prod.images[0]?.url}
                routineTag={prod.routineTag}
                variantId={prod.variants[0]?.id || prod.id}
              />
            ))}
          </div>
        ) : (
          <div className="py-14 text-center space-y-3 border border-[#E6DFD5] bg-[#FAF8F5]/80 p-8 max-w-xl mx-auto shadow-xs">
            <Sparkles className="w-5 h-5 text-[#C7A97B] mx-auto animate-pulse" />
            <h3 className="text-sm font-serif uppercase tracking-[0.2em] text-[#1C1917] font-light">
              {t('COLLECTION READY FOR CURATION', 'কালেকশন প্রস্তুত')}
            </h3>
            <p className="text-xs text-[#1C1917]/65 max-w-md mx-auto font-light leading-relaxed">
              {t(
                'Add verified formulations directly from the Admin Portal to curate your authenticated skincare sanctuary.',
                'আপনার স্কিনকেয়ার ব্র্যান্ডের প্রোডাক্টসমূহ অ্যাডমিন ড্যাশবোর্ড থেকে এক এক করে যুক্ত করুন।'
              )}
            </p>
          </div>
        )}
      </section>

      {/* ========================================================================= */}
      {/* 3. BESPOKE BEAUTY CONCIERGE & PRIVATE ADVISORY */}
      {/* ========================================================================= */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p-8 sm:p-14 bg-[#E6DFD5]/30 border border-[#E6DFD5] text-center space-y-6 relative overflow-hidden">
          <div className="relative z-10 max-w-2xl mx-auto space-y-4">
            <span className="text-[10px] uppercase tracking-[0.3em] font-medium text-[#C7A97B] block">
              {t('BESPOKE PRIVATE CLIENT CARE', 'ব্যক্তিগত বিউটি কনসিয়ার্জ')}
            </span>

            <h2 className="text-2xl sm:text-4xl font-serif uppercase tracking-[0.2em] font-light text-[#1C1917] leading-tight">
              {t('TAILORED SKINCARE GUIDANCE', 'ত্বকের বিশেষায়িত যত্ন ও পরামর্শ')}
            </h2>

            <p className="text-xs sm:text-sm text-[#1C1917]/75 font-light leading-relaxed">
              {t(
                'Connect directly with our dedicated skincare specialists via WhatsApp for bespoke formulation guidance tailored to your specific skin needs.',
                'আপনার ত্বকের উপযোগী সঠিক ফর্মুলেশন বেছে নিতে সরাসরি আমাদের স্কিনকেয়ার স্পেশালিস্টদের সাথে হোয়াটসঅ্যাপে যুক্ত হন।'
              )}
            </p>

            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-5">
              <a
                href="https://wa.me/8801700000000"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto px-8 py-3.5 bg-[#1C1917] hover:bg-[#8C6D3B] text-[#FAF8F5] text-xs uppercase tracking-[0.22em] font-medium transition-all duration-300 shadow-sm flex items-center justify-center space-x-2.5 rounded-none"
              >
                <span>{t('WHATSAPP CONCIERGE', 'হোয়াটসঅ্যাপ কনসিয়ার্জ')}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </a>

              {/* <Link
                href="/catalog"
                className="w-full sm:w-auto px-7 py-3.5 bg-transparent hover:bg-[#1C1917]/5 border border-[#1C1917]/30 hover:border-[#1C1917] text-[#1C1917] text-xs uppercase tracking-[0.22em] font-medium transition-all duration-300 flex items-center justify-center space-x-2 rounded-none"
              >
                <span>{t('EXPLORE THE EDIT', 'কালেকশন দেখুন')}</span>
              </Link> */}
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. THE SEYVEN COMMITMENTS */}
      {/* ========================================================================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 py-12 border-t border-[#E6DFD5]">

          <div className="text-center space-y-3 px-4">
            <div className="w-10 h-10 mx-auto rounded-full border border-[#E6DFD5] flex items-center justify-center text-[#C7A97B]">
              <ShieldCheck className="w-5 h-5 stroke-[1.25]" />
            </div>
            <h3 className="text-xs uppercase tracking-[0.22em] font-medium text-[#1C1917]">
              {t('DIRECT BRAND IMPORTS', 'সরাসরি ব্র্যান্ড থেকে সংগৃহীত')}
            </h3>
            <p className="text-[11px] text-[#1C1917]/70 font-light leading-relaxed">
              {t(
                '100% genuine icons sourced directly from verified international brand partners. Free from harmful mercury or harsh additives.',
                'আন্তর্জাতিক শীর্ষ ব্র্যান্ড থেকে সরাসরি আমদানিকৃত এবং ক্ষতিকর উপাদানমুক্ত নিরাপদ ও খাঁটি স্কিনকেয়ার।'
              )}
            </p>
          </div>

          <div className="text-center space-y-3 px-4">
            <div className="w-10 h-10 mx-auto rounded-full border border-[#E6DFD5] flex items-center justify-center text-[#C7A97B]">
              <CheckCircle2 className="w-5 h-5 stroke-[1.25]" />
            </div>
            <h3 className="text-xs uppercase tracking-[0.22em] font-medium text-[#1C1917]">
              {t('OPTIMAL FRESHNESS CARE', 'উপযুক্ত তাপমাত্রায় সংরক্ষিত')}
            </h3>
            <p className="text-[11px] text-[#1C1917]/70 font-light leading-relaxed">
              {t(
                'Preserved in climate-controlled conditions to protect active botanicals and delicate textures from Bangladesh heat.',
                'গ্রীষ্মমণ্ডলীয় গরমে সক্রিয় উপাদানের কার্যকারিতা ও সতেজতা বজায় রাখতে সার্বক্ষণিক নিয়ন্ত্রিত তাপমাত্রায় সংরক্ষিত।'
              )}
            </p>
          </div>

          <div className="text-center space-y-3 px-4">
            <div className="w-10 h-10 mx-auto rounded-full border border-[#E6DFD5] flex items-center justify-center text-[#C7A97B]">
              <HeartHandshake className="w-5 h-5 stroke-[1.25]" />
            </div>
            <h3 className="text-xs uppercase tracking-[0.22em] font-medium text-[#1C1917]">
              {t('ATTENTIVE CLIENT CARE', 'আন্তরিক গ্রাহক সেবা')}
            </h3>
            <p className="text-[11px] text-[#1C1917]/70 font-light leading-relaxed">
              {t(
                'Complimentary doorstep delivery on qualifying orders and personalized consultation tailored to your journey.',
                'দেশব্যাপী নির্ভরযোগ্য ডেলিভারি সুবিধা এবং আপনার ত্বকের যেকোনো প্রয়োজনে সার্বক্ষণিক আন্তরিক পরামর্শ।'
              )}
            </p>
          </div>

        </div>
      </section>

    </div>
  );
}
