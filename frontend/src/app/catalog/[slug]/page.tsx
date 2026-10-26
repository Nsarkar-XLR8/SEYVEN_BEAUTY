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
      title: `${cleanTitle} | SEYVEN`,
      description: 'Authentic imported formulation curated by SEYVEN — The Sanctuary of Beauty.',
    };
  }

  return {
    title: `${product.brand} — ${product.titleEn} | SEYVEN`,
    description: product.shortDescriptionEn,
    openGraph: {
      title: `${product.brand} — ${product.titleEn}`,
      description: product.shortDescriptionEn,
      images: product.images[0]?.url ? [product.images[0].url] : [],
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
