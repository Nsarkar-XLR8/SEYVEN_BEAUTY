import React from 'react';
import { ProductDetail } from '@/data/products';

interface PdpJsonLdProps {
  product: ProductDetail;
}

export function PdpJsonLd({ product }: PdpJsonLdProps) {
  const schemaData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Product',
        name: product.titleEn,
        image: product.images.map((img) => img.url),
        description: product.shortDescriptionEn,
        brand: {
          '@type': 'Brand',
          name: product.brand,
        },
        sku: product.variants[0]?.sku || product.id,
        offers: {
          '@type': 'Offer',
          url: `https://seyven.com.bd/catalog/${product.slug}`,
          priceCurrency: 'BDT',
          price: product.priceBdt,
          priceValidUntil: '2027-12-31',
          itemCondition: 'https://schema.org/NewCondition',
          availability:
            product.stockStatus === 'IN_STOCK'
              ? 'https://schema.org/InStock'
              : 'https://schema.org/OutOfStock',
          seller: {
            '@type': 'Organization',
            name: 'SEYVEN — The Sanctuary of Beauty',
          },
        },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'Home',
            item: 'https://seyven.com.bd',
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: 'Catalog',
            item: 'https://seyven.com.bd/catalog',
          },
          {
            '@type': 'ListItem',
            position: 3,
            name: product.titleEn,
            item: `https://seyven.com.bd/catalog/${product.slug}`,
          },
        ],
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }}
    />
  );
}
