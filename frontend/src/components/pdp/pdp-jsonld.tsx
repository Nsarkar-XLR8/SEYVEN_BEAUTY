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
        name: `${product.brand} — ${product.titleEn}`,
        alternateName: [
          product.titleEn,
          product.titleBn,
          `${product.brand} ${product.titleEn}`,
          `${product.brand} ${product.titleEn} Bangladesh`,
        ],
        image: product.images.map((img) => img.url),
        description: `${product.shortDescriptionEn} 100% authentic brand-sealed international imported formulation with complimentary Facebook Messenger skincare consultation & express Cash on Delivery across Bangladesh.`,
        category: product.category || 'Skincare',
        brand: {
          '@type': 'Brand',
          name: product.brand,
        },
        sku: product.variants[0]?.sku || product.id,
        offers: {
          '@type': 'Offer',
          url: `https://theseyven.com/products/${product.slug}`,
          priceCurrency: 'BDT',
          price: product.priceBdt,
          priceValidUntil: '2028-12-31',
          itemCondition: 'https://schema.org/NewCondition',
          availability:
            product.stockStatus === 'IN_STOCK'
              ? 'https://schema.org/InStock'
              : 'https://schema.org/OutOfStock',
          seller: {
            '@type': 'Organization',
            name: 'SEYVEN — The Sanctuary of Beauty',
            url: 'https://theseyven.com',
          },
          shippingDetails: {
            '@type': 'OfferShippingDetails',
            shippingRate: {
              '@type': 'MonetaryAmount',
              value: 70,
              currency: 'BDT',
            },
            shippingDestination: {
              '@type': 'DefinedRegion',
              addressCountry: 'BD',
            },
            deliveryTime: {
              '@type': 'ShippingDeliveryTime',
              handlingTime: {
                '@type': 'QuantitativeValue',
                minValue: 0,
                maxValue: 1,
                unitCode: 'DAY',
              },
              transitTime: {
                '@type': 'QuantitativeValue',
                minValue: 1,
                maxValue: 3,
                unitCode: 'DAY',
              },
            },
          },
          hasMerchantReturnPolicy: {
            '@type': 'MerchantReturnPolicy',
            applicableCountry: 'BD',
            returnPolicyCategory: 'https://schema.org/MerchantReturnFiniteReturnWindow',
            merchantReturnDays: 7,
            returnMethod: 'https://schema.org/ReturnByMail',
            returnFees: 'https://schema.org/FreeReturn',
          },
        },
      },
      {
        '@type': 'Service',
        name: 'Complimentary Skincare & Beauty Consultation',
        serviceType: 'Dermal Problem Advisory',
        provider: {
          '@type': 'Organization',
          name: 'SEYVEN — The Sanctuary of Beauty',
          url: 'https://theseyven.com',
        },
        areaServed: {
          '@type': 'Country',
          name: 'Bangladesh',
        },
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'BDT',
          description: '100% Free 1-on-1 Skin & Beauty Problem Consultation via Facebook Messenger',
        },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'Home',
            item: 'https://theseyven.com',
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: 'Catalog',
            item: 'https://theseyven.com/catalog',
          },
          {
            '@type': 'ListItem',
            position: 3,
            name: `${product.brand} — ${product.titleEn}`,
            item: `https://theseyven.com/products/${product.slug}`,
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
