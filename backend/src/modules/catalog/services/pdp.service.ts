import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../common/database/prisma.service';
import { PreviewTokenService } from './preview-token.service';
import { SchemaOrgService } from './schema-org.service';
import { ShippingEstimatorService } from './shipping-estimator.service';
import { LotStatus, PublicationState } from '@prisma/client';

@Injectable()
export class PdpService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly previewTokenService: PreviewTokenService,
    private readonly schemaOrgService: SchemaOrgService,
    private readonly shippingEstimatorService: ShippingEstimatorService,
  ) {}

  /**
   * Generates high-speed composite PDP data bundling variant matrix, live stock badges,
   * INCI breakdown, dermal protocol FAQs, delivery estimators, and Schema.org JSON-LD.
   */
  async getProductDetailPage(slug: string, previewToken?: string) {
    const product = await this.prisma.product.findUnique({
      where: { slug },
      include: {
        category: true,
        variants: {
          include: {
            lots: { where: { status: LotStatus.ACTIVE } },
            bundleComponents: {
              include: {
                childVariant: {
                  include: {
                    lots: { where: { status: LotStatus.ACTIVE } },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!product) {
      throw new NotFoundException(`Product with slug "${slug}" not found`);
    }

    // Publication state & preview token check
    if (product.publicationState !== PublicationState.PUBLISHED) {
      if (!previewToken) {
        throw new NotFoundException(`Product with slug "${slug}" is currently unpublished`);
      }
      const verifiedProductId = this.previewTokenService.verifyPreviewToken(previewToken);
      if (verifiedProductId !== product.id) {
        throw new BadRequestException('Preview token does not match this product');
      }
    }

    // 1. Compute Variant Matrix with Live Lot Stock
    let totalCatalogStock = 0;
    let minPriceBdt = Infinity;
    let compareAtPriceBdt: number | null = null;

    const formattedVariants = product.variants.map((v) => {
      let availableStock = 0;

      if (v.isBundle && v.bundleComponents && v.bundleComponents.length > 0) {
        const comboStocks = v.bundleComponents.map((comp) => {
          const childLots = comp.childVariant?.lots || [];
          const childStock = childLots.reduce(
            (sum, lot) => sum + Math.max(0, lot.availableQuantity - lot.reservedQuantity),
            0,
          );
          return Math.floor(childStock / comp.quantity);
        });
        availableStock = Math.min(...comboStocks, 0);
      } else {
        availableStock = (v.lots || []).reduce(
          (sum, lot) => sum + Math.max(0, lot.availableQuantity - lot.reservedQuantity),
          0,
        );
      }

      totalCatalogStock += availableStock;
      const price = Number(v.priceBdt);
      if (price < minPriceBdt) minPriceBdt = price;
      if (v.compareAtPriceBdt) {
        const compPrice = Number(v.compareAtPriceBdt);
        if (!compareAtPriceBdt || compPrice > compareAtPriceBdt) {
          compareAtPriceBdt = compPrice;
        }
      }

      return {
        id: v.id,
        sku: v.sku,
        barcode: v.barcode,
        volumeMlG: v.volumeMlG,
        priceBdt: v.priceBdt,
        compareAtPriceBdt: v.compareAtPriceBdt,
        weightGrams: v.weightGrams,
        isBundle: v.isBundle,
        availableStock,
        stockStatus: availableStock > 10 ? 'IN_STOCK' : availableStock > 0 ? 'LOW_STOCK' : 'OUT_OF_STOCK',
      };
    });

    // 2. INCI Dermal Formulation Breakdown
    const inciBreakdown: any[] = [];

    // 4. Curated FAQs derived from Dermal Protocols & Guidelines
    const faqs = [
      {
        questionEn: `How do I incorporate ${product.titleEn} into my daily skincare regimen?`,
        questionBn: `How do I incorporate ${product.titleEn} into my daily skincare regimen?`,
        answerEn: product.dermalProtocolEn || 'Apply evenly to cleansed skin morning and evening.',
        answerBn: product.dermalProtocolEn || 'Apply evenly to cleansed skin morning and evening.',
      },
      {
        questionEn: 'How should I perform a patch test before first use?',
        questionBn: 'How should I perform a patch test before first use?',
        answerEn: product.patchTestGuideEn || 'Apply a small dime-sized amount behind the ear or inner forearm for 24 hours.',
        answerBn: product.patchTestGuideEn || 'Apply a small dime-sized amount behind the ear or inner forearm for 24 hours.',
      },
      {
        questionEn: 'Is this formula safe during pregnancy and nursing?',
        questionBn: 'Is this formula safe during pregnancy and nursing?',
        answerEn: product.isPregnancySafe
          ? 'Yes, this dermal formulation is free of contraindicated retinoids and safe for pregnancy.'
          : 'Please consult your obstetrician before use as active concentrations may not be recommended during pregnancy.',
        answerBn: product.isPregnancySafe
          ? 'Yes, this dermal formulation is free of contraindicated retinoids and safe for pregnancy.'
          : 'Please consult your obstetrician before use as active concentrations may not be recommended during pregnancy.',
      },
      {
        questionEn: 'What is the recommended storage guidance and shelf life?',
        questionBn: 'What is the recommended storage guidance and shelf life?',
        answerEn: `${product.storageGuidanceEn || 'Store in a cool, dry place away from direct sunlight.'} Use within ${product.paoMonths || 12} months after opening.`,
        answerBn: `${product.storageGuidanceEn || 'Store in a cool, dry place away from direct sunlight.'} Use within ${product.paoMonths || 12} months after opening.`,
      },
    ];

    // 5. Default Fast Shipping Estimates
    const defaultDhakaEstimate = this.shippingEstimatorService.estimateDelivery({
      division: 'Dhaka',
      district: 'Dhaka',
      orderAmountBdt: minPriceBdt !== Infinity ? minPriceBdt : 0,
    });

    const defaultNationwideEstimate = this.shippingEstimatorService.estimateDelivery({
      division: 'Chittagong',
      orderAmountBdt: minPriceBdt !== Infinity ? minPriceBdt : 0,
    });

    // 6. Schema.org JSON-LD Generation
    const schemaOrg = this.schemaOrgService.generatePdpJsonLd({
      id: product.id,
      slug: product.slug,
      titleEn: product.titleEn,
      titleBn: product.titleBn,
      shortDescriptionEn: product.shortDescriptionEn || undefined,
      shortDescriptionBn: product.shortDescriptionBn || undefined,
      dermalProtocolEn: product.dermalProtocolEn || undefined,
      patchTestGuideEn: product.patchTestGuideEn || undefined,
      storageGuidanceEn: product.storageGuidanceEn || undefined,
      paoMonths: product.paoMonths,
      category: product.category ? { nameEn: product.category.nameEn, slug: product.category.slug } : null,
      variants: formattedVariants,
    });

    return {
      product: {
        id: product.id,
        slug: product.slug,
        titleEn: product.titleEn,
        titleBn: product.titleBn,
        shortDescriptionEn: product.shortDescriptionEn,
        shortDescriptionBn: product.shortDescriptionBn,
        dermalProtocolEn: product.dermalProtocolEn,
        dermalProtocolBn: product.dermalProtocolBn,
        patchTestGuideEn: product.patchTestGuideEn,
        patchTestGuideBn: product.patchTestGuideBn,
        storageGuidanceEn: product.storageGuidanceEn,
        storageGuidanceBn: product.storageGuidanceBn,
        paoMonths: product.paoMonths,
        isPregnancySafe: product.isPregnancySafe,
        isLactationSafe: product.isLactationSafe,
        bstiStatus: product.bstiStatus,
        bstiLicenseNumber: product.bstiLicenseNumber,
        category: product.category,
        minPriceBdt: minPriceBdt !== Infinity ? minPriceBdt : null,
        compareAtPriceBdt,
        totalAvailableStock: totalCatalogStock,
        overallStockStatus: totalCatalogStock > 10 ? 'IN_STOCK' : totalCatalogStock > 0 ? 'LOW_STOCK' : 'OUT_OF_STOCK',
        variants: formattedVariants,
        inciBreakdown,
        claims: [],
      },
      faqs,
      shippingEstimates: {
        insideDhaka: defaultDhakaEstimate,
        outsideDhaka: defaultNationwideEstimate,
      },
      schemaOrg,
    };
  }
}
