import { Injectable } from '@nestjs/common';

export interface SchemaOrgProductInput {
  id: string;
  slug: string;
  titleEn: string;
  titleBn: string;
  shortDescriptionEn?: string;
  shortDescriptionBn?: string;
  dermalProtocolEn?: string;
  patchTestGuideEn?: string;
  storageGuidanceEn?: string;
  paoMonths?: number;
  category?: { nameEn: string; slug: string } | null;
  variants: Array<{
    sku: string;
    barcode?: string | null;
    priceBdt: any;
    compareAtPriceBdt?: any;
    availableStock: number;
    volumeMlG: any;
  }>;
  reviewsSummary?: {
    averageRating: number;
    totalReviews: number;
  };
}

@Injectable()
export class SchemaOrgService {
  private readonly BASE_URL = 'https://seyven.com';

  /**
   * Generates comprehensive Schema.org JSON-LD structured data for luxury e-commerce PDP.
   */
  generatePdpJsonLd(product: SchemaOrgProductInput): {
    productJsonLd: Record<string, unknown>;
    faqJsonLd: Record<string, unknown>;
    breadcrumbJsonLd: Record<string, unknown>;
  } {
    const productUrl = `${this.BASE_URL}/products/${product.slug}`;
    const defaultVariant = product.variants[0];

    // 1. Product JSON-LD with Offers & AggregateRating
    const offers = product.variants.map((v) => ({
      '@type': 'Offer',
      sku: v.sku,
      gtin: v.barcode || undefined,
      price: Number(v.priceBdt),
      priceCurrency: 'BDT',
      priceValidUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      itemCondition: 'https://schema.org/NewCondition',
      availability: v.availableStock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      url: productUrl,
      seller: {
        '@type': 'Organization',
        name: 'SEYVEN — The Sanctuary of Beauty',
        url: this.BASE_URL,
      },
    }));

    const productJsonLd: Record<string, unknown> = {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: product.titleEn,
      alternateName: product.titleBn,
      description: product.shortDescriptionEn,
      sku: defaultVariant ? defaultVariant.sku : product.id,
      brand: {
        '@type': 'Brand',
        name: 'SEYVEN',
        url: this.BASE_URL,
      },
      category: product.category?.nameEn || 'Skincare',
      url: productUrl,
      offers,
    };

    if (product.reviewsSummary && product.reviewsSummary.totalReviews > 0) {
      productJsonLd.aggregateRating = {
        '@type': 'AggregateRating',
        ratingValue: product.reviewsSummary.averageRating,
        reviewCount: product.reviewsSummary.totalReviews,
        bestRating: 5,
        worstRating: 1,
      };
    }

    // 2. FAQPage JSON-LD derived from Dermal Protocols & Patch-test Guides
    const faqEntities: Array<{ '@type': string; name: string; acceptedAnswer: { '@type': string; text: string } }> = [];

    if (product.dermalProtocolEn) {
      faqEntities.push({
        '@type': 'Question',
        name: `How do I incorporate ${product.titleEn} into my daily skincare regimen?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: product.dermalProtocolEn,
        },
      });
    }

    if (product.patchTestGuideEn) {
      faqEntities.push({
        '@type': 'Question',
        name: `How should I perform a patch test for ${product.titleEn}?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: product.patchTestGuideEn,
        },
      });
    }

    if (product.storageGuidanceEn) {
      faqEntities.push({
        '@type': 'Question',
        name: `How should this dermal formula be stored?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: product.storageGuidanceEn,
        },
      });
    }

    if (product.paoMonths) {
      faqEntities.push({
        '@type': 'Question',
        name: `What is the Period-After-Opening (PAO) shelf life?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: `This product should be used within ${product.paoMonths} months once unsealed.`,
        },
      });
    }

    const faqJsonLd: Record<string, unknown> = {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faqEntities,
    };

    // 3. BreadcrumbList JSON-LD
    const breadcrumbJsonLd: Record<string, unknown> = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Home',
          item: this.BASE_URL,
        },
        ...(product.category
          ? [
              {
                '@type': 'ListItem',
                position: 2,
                name: product.category.nameEn,
                item: `${this.BASE_URL}/category/${product.category.slug}`,
              },
              {
                '@type': 'ListItem',
                position: 3,
                name: product.titleEn,
                item: productUrl,
              },
            ]
          : [
              {
                '@type': 'ListItem',
                position: 2,
                name: product.titleEn,
                item: productUrl,
              },
            ]),
      ],
    };

    return {
      productJsonLd,
      faqJsonLd,
      breadcrumbJsonLd,
    };
  }
}
