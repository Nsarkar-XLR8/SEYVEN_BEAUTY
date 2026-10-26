import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../common/database/prisma.service';

@Injectable()
export class OgGeneratorService {
  private readonly logger = new Logger(OgGeneratorService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Generates a 1200x630 OpenGraph card SVG for a product by slug.
   */
  async generateProductOgCard(slug: string): Promise<string> {
    const product = await this.prisma.product.findUnique({
      where: { slug: slug.trim().toLowerCase() },
      include: {
        category: true,
        variants: {
          where: { isActive: true },
          orderBy: { priceBdt: 'asc' },
          take: 1,
        },
      },
    });

    if (!product) {
      throw new NotFoundException(`Product with slug "${slug}" not found`);
    }

    const primaryVariant = product.variants[0];
    const priceNum = primaryVariant ? Number(primaryVariant.priceBdt) : 0;
    const comparePriceNum = primaryVariant?.compareAtPriceBdt
      ? Number(primaryVariant.compareAtPriceBdt)
      : null;
    const priceFormatted = `৳${priceNum.toLocaleString('en-US')}`;
    const comparePriceFormatted = comparePriceNum
      ? `৳${comparePriceNum.toLocaleString('en-US')}`
      : null;

    const activeIngredients = ['Authentic Import', 'Clinical Grade', 'The Edit'];

    const bstiText =
      product.bstiLicenseNumber && product.bstiStatus === 'APPROVED'
        ? `BSTI CERTIFIED: ${product.bstiLicenseNumber}`
        : 'BSTI QUALITY TESTED';

    const categoryName = product.category?.nameEn || 'Clinical Dermal Skincare';

    return this.renderSvgTemplate({
      titleEn: product.titleEn,
      titleBn: product.titleBn,
      categoryName,
      priceFormatted,
      comparePriceFormatted,
      activeIngredients,
      bstiText,
      paoMonths: product.paoMonths || 12,
    });
  }

  /**
   * High-contrast luxury 1200x630 SVG template engineered for social graph crawlers.
   */
  private renderSvgTemplate(data: {
    titleEn: string;
    titleBn: string;
    categoryName: string;
    priceFormatted: string;
    comparePriceFormatted: string | null;
    activeIngredients: string[];
    bstiText: string;
    paoMonths: number;
  }): string {
    const safeTitleEn = this.escapeXml(data.titleEn);
    const safeTitleBn = this.escapeXml(data.titleBn);
    const safeCategory = this.escapeXml(data.categoryName.toUpperCase());
    const safeBsti = this.escapeXml(data.bstiText);

    // Build ingredients pills
    const ingredientsPills = data.activeIngredients
      .map(
        (ing, idx) => `
        <g transform="translate(${idx * 210}, 0)">
          <rect width="200" height="38" rx="19" fill="#1E293B" stroke="#334155" stroke-width="1.5"/>
          <text x="100" y="24" fill="#E2E8F0" font-family="'Inter', sans-serif" font-size="14" font-weight="600" text-anchor="middle">
            ${this.escapeXml(ing)}
          </text>
        </g>
      `,
      )
      .join('');

    const discountBadge = data.comparePriceFormatted
      ? `
        <text x="320" y="445" fill="#94A3B8" font-family="'Inter', sans-serif" font-size="28" font-weight="500" text-decoration="line-through">
          ${this.escapeXml(data.comparePriceFormatted)}
        </text>
      `
      : '';

    return `<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#070A11"/>
      <stop offset="60%" stop-color="#0F172A"/>
      <stop offset="100%" stop-color="#050811"/>
    </linearGradient>
    <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#D4AF37"/>
      <stop offset="50%" stop-color="#FCD34D"/>
      <stop offset="100%" stop-color="#B8860B"/>
    </linearGradient>
    <linearGradient id="badgeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#059669"/>
      <stop offset="100%" stop-color="#10B981"/>
    </linearGradient>
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="6" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
  </defs>

  <!-- Luxury Dark Backdrop -->
  <rect width="1200" height="630" fill="url(#bgGrad)"/>

  <!-- Decorative Outer Border with Gold Accent -->
  <rect x="24" y="24" width="1152" height="582" rx="16" fill="none" stroke="#1E293B" stroke-width="2"/>
  <rect x="28" y="28" width="1144" height="574" rx="12" fill="none" stroke="#D4AF37" stroke-width="1" stroke-opacity="0.35"/>

  <!-- Top Accent Bar -->
  <rect x="24" y="24" width="1152" height="6" rx="3" fill="url(#goldGrad)"/>

  <!-- Brand Masthead Header -->
  <text x="80" y="95" fill="url(#goldGrad)" font-family="'Cinzel', 'Playfair Display', serif" font-size="28" font-weight="700" letter-spacing="6">
    S E Y V E N
  </text>
  <text x="310" y="95" fill="#64748B" font-family="'Inter', sans-serif" font-size="16" font-weight="500" letter-spacing="3">
    |  CLINICAL DERMAL FORMULATIONS
  </text>

  <!-- Category & BSTI Trust Badges -->
  <g transform="translate(80, 130)">
    <rect width="190" height="32" rx="16" fill="#1E293B" stroke="#D4AF37" stroke-width="1"/>
    <text x="95" y="21" fill="#FCD34D" font-family="'Inter', sans-serif" font-size="12" font-weight="700" letter-spacing="1.5" text-anchor="middle">
      ${safeCategory}
    </text>

    <!-- BSTI Authentic Seal -->
    <g transform="translate(205, 0)">
      <rect width="250" height="32" rx="16" fill="url(#badgeGrad)"/>
      <text x="125" y="21" fill="#FFFFFF" font-family="'Inter', sans-serif" font-size="12" font-weight="700" letter-spacing="1" text-anchor="middle">
        ✓ ${safeBsti}
      </text>
    </g>
  </g>

  <!-- Product English Title -->
  <text x="80" y="245" fill="#FFFFFF" font-family="'Inter', sans-serif" font-size="48" font-weight="800" letter-spacing="-0.5">
    ${safeTitleEn}
  </text>

  <!-- Product Bengali Title -->
  <text x="80" y="305" fill="#94A3B8" font-family="'Hind Siliguri', 'Inter', sans-serif" font-size="26" font-weight="600">
    ${safeTitleBn}
  </text>

  <!-- Active Ingredients Pills Row -->
  <g transform="translate(80, 345)">
    ${ingredientsPills}
  </g>

  <!-- Live Pricing Section -->
  <g transform="translate(80, 410)">
    <text x="0" y="38" fill="url(#goldGrad)" font-family="'Inter', sans-serif" font-size="52" font-weight="900" letter-spacing="-1">
      ${this.escapeXml(data.priceFormatted)}
    </text>
    ${discountBadge}
    <text x="0" y="68" fill="#10B981" font-family="'Inter', sans-serif" font-size="14" font-weight="700" letter-spacing="1">
      ● IN STOCK &amp; READY TO DISPATCH
    </text>
  </g>

  <!-- Footer Micro-Trust Grid -->
  <line x1="80" y1="525" x2="1120" y2="525" stroke="#1E293B" stroke-width="1.5"/>

  <text x="80" y="565" fill="#E2E8F0" font-family="'Inter', sans-serif" font-size="15" font-weight="700">
    Official Dermal Flagship Store
  </text>
  <text x="80" y="588" fill="#64748B" font-family="'Inter', sans-serif" font-size="13">
    100% Genuine Direct Formulations • Period-after-Opening: ${data.paoMonths}M
  </text>

  <!-- Country & Shipping Badge -->
  <text x="1120" y="565" fill="#D4AF37" font-family="'Inter', sans-serif" font-size="15" font-weight="700" text-anchor="end">
    Express Nationwide Delivery
  </text>
  <text x="1120" y="588" fill="#64748B" font-family="'Inter', sans-serif" font-size="13" text-anchor="end">
    Dhaka 24h • All 64 Districts 48-72h • Cash on Delivery / bKash
  </text>
</svg>`;
  }

  private escapeXml(unsafe: string): string {
    return unsafe.replace(/[<>&'"]/g, (c) => {
      switch (c) {
        case '<':
          return '&lt;';
        case '>':
          return '&gt;';
        case '&':
          return '&amp;';
        case '\'':
          return '&apos;';
        case '"':
          return '&quot;';
        default:
          return c;
      }
    });
  }
}
