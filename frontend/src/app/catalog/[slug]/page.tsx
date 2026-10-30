import React, { Suspense } from 'react';
import { Metadata } from 'next';
import { getAllProducts, getProductBySlug } from '@/data/products';
import { PdpClientView } from '@/components/pdp/pdp-client-view';

interface PageProps {
  params: Promise<{ slug: string }>;
}


export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = getProductBySlug(slug);

  if (!product) {
    const cleanTitle = slug
      .split('-')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
    return {
      title: `${cleanTitle} Price in Bangladesh | 100% Authentic — SEYVEN`,
      description: `Buy authentic ${cleanTitle} in Bangladesh with free Facebook Messenger consultation & Cash on Delivery at SEYVEN.`,
      alternates: {
        canonical: `https://theseyven.com/products/${slug}`,
      },
    };
  }

  const volumeStr = product.variants?.[0]?.volume ? ` (${product.variants[0].volume})` : '';
  const priceFormatted = product.priceBdt ? `৳${product.priceBdt}` : '';
  const pageTitle = `${product.brand} — ${product.titleEn}${volumeStr} Price in Bangladesh | 100% Authentic — SEYVEN`;
  const pageDescription = `Buy original ${product.brand} ${product.titleEn} in Bangladesh${priceFormatted ? ` at ${priceFormatted}` : ''}. 100% genuine brand-sealed imported skincare with free Messenger skin consultation & express Cash on Delivery nationwide.`;

  return {
    title: pageTitle,
    description: pageDescription,
    keywords: [
      product.brand,
      product.titleEn,
      `${product.brand} ${product.titleEn}`,
      `${product.titleEn} price in Bangladesh`,
      `${product.brand} price in BD`,
      `original ${product.brand} Bangladesh`,
      `authentic ${product.titleEn} Dhaka`,
      'authentic skincare Bangladesh',
      'free Messenger skincare consultation',
      'Cash on delivery BD',
    ],
    alternates: {
      canonical: `https://theseyven.com/products/${slug}`,
    },
    openGraph: {
      title: `${product.brand} — ${product.titleEn} | 100% Authentic SEYVEN`,
      description: pageDescription,
      url: `https://theseyven.com/products/${slug}`,
      siteName: 'SEYVEN — The Sanctuary of Beauty',
      locale: 'en_BD',
      type: 'website',
      images: product.images[0]?.url
        ? [
            {
              url: product.images[0].url,
              width: 800,
              height: 800,
              alt: `${product.brand} ${product.titleEn} Authentic Imported Skincare`,
            },
          ]
        : [],
    },
  };
}

async function ProductDetailContent({ params }: PageProps) {
  const { slug } = await params;
  return <PdpClientView slug={slug} />;
}

export default function ProductDetailPage({ params }: PageProps) {
  return (
    <Suspense
      fallback={
        <div className="min-h-[70vh] flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-[#C7A97B] border-t-transparent animate-spin rounded-full" />
        </div>
      }
    >
      <ProductDetailContent params={params} />
    </Suspense>
  );
}
