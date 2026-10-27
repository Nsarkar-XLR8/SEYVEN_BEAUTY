'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronRight, Sparkles } from 'lucide-react';
import { useLanguage } from '@/context/language-context';
import { getProductBySlug, getAllProducts, createDynamicProductDetail, ProductDetail } from '@/data/products';
import { PdpGallery } from '@/components/pdp/pdp-gallery';
import { PdpMetaBlock } from '@/components/pdp/pdp-meta-block';
import { PdpDeliveryEstimator } from '@/components/pdp/pdp-delivery-estimator';
import { PdpWaitlistModal } from '@/components/pdp/pdp-waitlist-modal';
import { PdpJsonLd } from '@/components/pdp/pdp-jsonld';
import { ProductCard } from '@/components/storefront/product-card';

interface PdpClientViewProps {
  slug: string;
}

export function PdpClientView({ slug }: PdpClientViewProps) {
  const { lang, t } = useLanguage();
  const staticProduct = getProductBySlug(slug);
  const [product, setProduct] = useState<ProductDetail | undefined>(staticProduct);
  const [isLoading, setIsLoading] = useState(!staticProduct);
  const [isWaitlistOpen, setIsWaitlistOpen] = useState(false);

  useEffect(() => {
    // Security: sanitize slug input to only alphanumeric and dash
    const cleanSlug = slug.replace(/[^a-zA-Z0-9-_]/g, '').toLowerCase();
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://seyven-beauty-backend.onrender.com/api/v1';

    setIsLoading(true);

    // Fetch from resilient Next.js catalog API (with automatic backend / local sync)
    fetch(`/api/catalog/products/${cleanSlug}`)
      .then((res) => (res.ok ? res.json() : fetch(`${apiUrl}/catalog/products/${cleanSlug}`).then((r) => (r.ok ? r.json() : null))))
      .then((data) => {
        if (data && !data.error && (!data.state || data.state === 'PUBLISHED')) {
          setProduct(createDynamicProductDetail(data));
        } else if (staticProduct) {
          setProduct(staticProduct);
        } else {
          setProduct(undefined);
        }
      })
      .catch(() => {
        if (staticProduct) {
          setProduct(staticProduct);
        } else {
          setProduct(undefined);
        }
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [slug, staticProduct]);

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4 py-20 space-y-4">
        <div className="w-8 h-8 border-2 border-[#C7A97B] border-t-transparent animate-spin rounded-full" />
        <span className="text-xs uppercase font-mono tracking-widest text-[#1C1917]/60">
          Loading Curated Formulation...
        </span>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4 py-20 space-y-4">
        <span className="text-3xl font-serif tracking-[0.2em] text-[#1C1917]/30 uppercase">
          FORMULATION NOT FOUND
        </span>
        <p className="text-xs text-[#1C1917]/70 max-w-md font-light">
          {t(
            'The requested formulation may have been archived or is temporarily transitioning in our master registry.',
            'অনুরোধকৃত প্রোডাক্টটি বর্তমানে উপলব্ধ নেই অথবা আপডেট করা হচ্ছে।'
          )}
        </p>
        <Link
          href="/catalog"
          className="mt-4 px-6 py-3 bg-[#1C1917] text-[#F9F6F0] text-xs uppercase tracking-[0.25em] font-medium"
        >
          {t('RETURN TO ALL FORMULATIONS', 'সকল প্রোডাক্ট দেখুন')}
        </Link>
      </div>
    );
  }

  // Related synergistic routine products (excluding current product)
  const relatedProducts = getAllProducts()
    .filter((p) => p.id !== product.id)
    .slice(0, 3);

  return (
    <article className="pb-24 pt-6 space-y-12">
      {/* Inject Silent Schema.org JSON-LD */}
      <PdpJsonLd product={product} />

      {/* Breadcrumb Navigation Strip */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav
          aria-label="Breadcrumbs"
          className="flex items-center space-x-2 text-[10px] uppercase tracking-[0.2em] text-[#1C1917]/60 overflow-x-auto whitespace-nowrap py-2"
        >
          <Link href="/" className="hover:text-[#C7A97B] transition-colors">
            {t('SANCTUARY', 'হোম')}
          </Link>
          <ChevronRight className="w-3 h-3 text-[#E6DFD5] shrink-0" />
          <Link href="/catalog" className="hover:text-[#C7A97B] transition-colors">
            {t('THE FORMULATIONS', 'প্রোডাক্টস')}
          </Link>
          <ChevronRight className="w-3 h-3 text-[#E6DFD5] shrink-0" />
          <span className="text-[#C7A97B] font-medium truncate max-w-xs">
            {product.brand} // {lang === 'bn' ? product.titleBn : product.titleEn}
          </span>
        </nav>
      </div>

      {/* Main PDP Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
          
          {/* Left Column: High-DPI Multi-Angle Image Gallery (5 cols) */}
          <div className="lg:col-span-5 lg:sticky lg:top-28">
            <PdpGallery
              images={product.images}
              title={product.titleEn}
              routineTag={product.routineTag}
              originCountry={product.originCountry}
            />
          </div>

          {/* Right Column: Product Meta, Estimator & Clinical Engine (7 cols) */}
          <div className="lg:col-span-7 space-y-8">
            {/* Meta & Purchasing Block */}
            <PdpMetaBlock
              product={product}
              onOpenWaitlist={() => setIsWaitlistOpen(true)}
            />

            {/* Nationwide Delivery Protocol & Tariff Estimator */}
            <PdpDeliveryEstimator productPriceBdt={product.priceBdt} />
          </div>

        </div>
      </div>

      {/* Synergistic Routine Recommendations Carousel / Grid */}
      {relatedProducts.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 border-t border-[#E6DFD5]">
          <div className="space-y-2 mb-8">
            <div className="flex items-center space-x-2 text-[10px] uppercase tracking-[0.25em] text-[#C7A97B] font-medium">
              <Sparkles className="w-3.5 h-3.5" />
              <span>DERMAL SYNERGY // COMPLEMENTARY REGIMEN</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-serif uppercase tracking-[0.18em] font-light text-[#1C1917]">
              PAIRS SYNERGISTICALLY WITH THIS FORMULATION
            </h2>
            <p className="text-xs text-[#1C1917]/70 font-light max-w-2xl">
              Formulated to layer seamlessly without pilling, pH conflict, or lipid barrier overload in high-humidity climates.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-6 lg:gap-8">
            {relatedProducts.map((rel) => (
              <ProductCard
                key={rel.id}
                id={rel.id}
                slug={rel.slug}
                brand={rel.brand}
                titleEn={rel.titleEn}
                titleBn={rel.titleBn}
                purposeEn={rel.purposeTagEn}
                purposeBn={rel.purposeTagBn}
                volume={rel.volume}
                priceBdt={rel.priceBdt}
                imageUrl={rel.images[0]?.url}
                routineTag={rel.routineTag}
                variantId={rel.variants[0]?.id || rel.id}
              />
            ))}
          </div>
        </section>
      )}

      {/* Waitlist Modal */}
      <PdpWaitlistModal
        product={product}
        isOpen={isWaitlistOpen}
        onClose={() => setIsWaitlistOpen(false)}
      />
    </article>
  );
}
