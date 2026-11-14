import React from 'react';
import { ProductDetail } from '@/data/products';

interface PdpJsonLdProps {
  product: ProductDetail;
}

export function PdpJsonLd({ product }: PdpJsonLdProps) {
  const productUrl = `https://www.theseyven.com/products/${product.slug}`;
  const sellerUrl = 'https://www.theseyven.com';

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
          `${product.titleEn} price in Bangladesh`,
          `${product.brand} price in BD`,
        ],
        image: product.images.map((img) => img.url),
        description: `${product.shortDescriptionEn || product.titleEn} — 100% genuine imported formulation sourced via official authorized brand distributors in Bangladesh. Features complimentary Facebook Messenger skin consultation & express Cash on Delivery nationwide.`,
        category: product.category || 'Skincare',
        brand: {
          '@type': 'Brand',
          name: product.brand,
        },
        sku: product.variants[0]?.sku || product.id,
        offers: {
          '@type': 'Offer',
          url: productUrl,
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
            url: sellerUrl,
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
            returnPolicyCountry: 'BD',
            returnPolicyCategory: 'https://schema.org/MerchantReturnFiniteReturnWindow',
            merchantReturnDays: 3,
            returnMethod: 'https://schema.org/ReturnByMail',
            returnFees: 'https://schema.org/FreeReturn',
            refundType: 'https://schema.org/FullRefund',
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
          url: sellerUrl,
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
            item: sellerUrl,
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: product.category || 'Skincare',
            item: `${sellerUrl}/catalog`,
          },
          {
            '@type': 'ListItem',
            position: 3,
            name: `${product.brand} — ${product.titleEn}`,
            item: productUrl,
          },
        ],
      },
      {
        '@type': 'FAQPage',
        mainEntity: [
          {
            '@type': 'Question',
            name: `Is ${product.brand} ${product.titleEn} original and authentic in Bangladesh?`,
            acceptedAnswer: {
              '@type': 'Answer',
              text: `Yes, 100% original and authentic. SEYVEN sources exclusively through official authorized brand distributors and certified global supply channels in Bangladesh. Every unit is brand-sealed and comes with open-box Cash on Delivery inspection.`,
            },
          },
          {
            '@type': 'Question',
            name: `What is the price of ${product.brand} ${product.titleEn} in Bangladesh?`,
            acceptedAnswer: {
              '@type': 'Answer',
              text: `The authentic price of ${product.brand} ${product.titleEn} at SEYVEN is ৳${product.priceBdt} BDT with express nationwide Cash on Delivery.`,
            },
          },
          {
            '@type': 'Question',
            name: `How fast is the delivery across Bangladesh?`,
            acceptedAnswer: {
              '@type': 'Answer',
              text: `Orders inside Dhaka are delivered within 1–2 days via express courier. Orders outside Dhaka across all 64 districts are delivered within 2–3 days with doorstep Cash on Delivery.`,
            },
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
