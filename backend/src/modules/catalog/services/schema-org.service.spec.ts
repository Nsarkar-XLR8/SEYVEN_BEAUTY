import { SchemaOrgService } from './schema-org.service';

describe('SchemaOrgService', () => {
  let service: SchemaOrgService;

  beforeEach(() => {
    service = new SchemaOrgService();
  });

  it('should generate Product, FAQPage, and BreadcrumbList JSON-LD structured data', () => {
    const jsonLd = service.generatePdpJsonLd({
      id: 'prod-1',
      slug: 'triple-ceramide-cream',
      titleEn: 'Triple Ceramide Barrier Cream',
      titleBn: 'Triple Ceramide Barrier Cream',
      shortDescriptionEn: 'Barrier repair cream with ceramides and panthenol',
      dermalProtocolEn: 'Apply morning and night',
      patchTestGuideEn: 'Apply behind the ear for 24h',
      storageGuidanceEn: 'Store in cool place',
      paoMonths: 12,
      category: { nameEn: 'Moisturizers', slug: 'moisturizers' },
      variants: [
        {
          sku: 'SEY-CERAMIDE-50ML',
          barcode: '8941234567890',
          priceBdt: 1850,
          compareAtPriceBdt: 2200,
          availableStock: 50,
          volumeMlG: 50,
        },
      ],
      reviewsSummary: {
        averageRating: 4.8,
        totalReviews: 25,
      },
    });

    expect(jsonLd.productJsonLd).toBeDefined();
    expect(jsonLd.productJsonLd['@type']).toBe('Product');
    expect(jsonLd.productJsonLd['name']).toBe('Triple Ceramide Barrier Cream');
    expect((jsonLd.productJsonLd['offers'] as any[])[0].price).toBe(1850);
    expect((jsonLd.productJsonLd['aggregateRating'] as any).ratingValue).toBe(4.8);

    expect(jsonLd.faqJsonLd).toBeDefined();
    expect(jsonLd.faqJsonLd['@type']).toBe('FAQPage');
    expect((jsonLd.faqJsonLd['mainEntity'] as any[]).length).toBeGreaterThanOrEqual(3);

    expect(jsonLd.breadcrumbJsonLd).toBeDefined();
    expect(jsonLd.breadcrumbJsonLd['@type']).toBe('BreadcrumbList');
  });
});
