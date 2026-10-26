import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PublicationState } from '@prisma/client';
import { PrismaService } from '../../../common/database/prisma.service';
import { RedisService } from '../../../common/redis/redis.service';
import { SitemapUrlEntry } from '../interfaces/seo.interface';

@Injectable()
export class SitemapService {
  private readonly logger = new Logger(SitemapService.name);
  private readonly baseUrl: string;
  private readonly sitemapCacheKey = 'seo:sitemap:xml';
  private readonly cacheTtlSeconds = 3600; // 1 hour

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly configService: ConfigService,
  ) {
    this.baseUrl = (
      this.configService.get<string>('BASE_URL') ||
      this.configService.get<string>('FRONTEND_URL') ||
      'https://seyven.com.bd'
    ).replace(/\/$/, '');
  }

  /**
   * Generates or fetches cached XML sitemap conforming to sitemaps.org 0.9 schema.
   */
  async getSitemapXml(): Promise<string> {
    const cachedXml = await this.redis.get(this.sitemapCacheKey);
    if (cachedXml) {
      return cachedXml;
    }

    const entries = await this.collectSitemapEntries();
    const xml = this.buildXmlFromEntries(entries);

    // Cache the XML output
    await this.redis.set(this.sitemapCacheKey, xml, this.cacheTtlSeconds);
    this.logger.log(`Generated and cached fresh sitemap with ${entries.length} URLs`);

    return xml;
  }

  /**
   * Invalidates Redis sitemap cache. Call after publishing products or modifying categories.
   */
  async invalidateSitemapCache(): Promise<void> {
    await this.redis.del(this.sitemapCacheKey);
    this.logger.log('Sitemap cache invalidated');
  }

  /**
   * Collects all public canonical routes from static pages, published products, and active categories.
   */
  async collectSitemapEntries(): Promise<SitemapUrlEntry[]> {
    const nowStr = new Date().toISOString().split('T')[0];
    const entries: SitemapUrlEntry[] = [
      {
        loc: `${this.baseUrl}/`,
        lastmod: nowStr,
        changefreq: 'daily',
        priority: 1.0,
      },
      {
        loc: `${this.baseUrl}/catalog`,
        lastmod: nowStr,
        changefreq: 'daily',
        priority: 0.9,
      },
      {
        loc: `${this.baseUrl}/customer/loyalty`,
        lastmod: nowStr,
        changefreq: 'weekly',
        priority: 0.8,
      },
      {
        loc: `${this.baseUrl}/track-order`,
        lastmod: nowStr,
        changefreq: 'monthly',
        priority: 0.5,
      },
      {
        loc: `${this.baseUrl}/terms`,
        lastmod: nowStr,
        changefreq: 'monthly',
        priority: 0.3,
      },
      {
        loc: `${this.baseUrl}/privacy`,
        lastmod: nowStr,
        changefreq: 'monthly',
        priority: 0.3,
      },
    ];

    // 1. Published Products
    const products = await this.prisma.product.findMany({
      where: {
        publicationState: PublicationState.PUBLISHED,
      },
      select: {
        slug: true,
        updatedAt: true,
      },
    });

    for (const product of products) {
      entries.push({
        loc: `${this.baseUrl}/products/${product.slug}`,
        lastmod: product.updatedAt.toISOString().split('T')[0],
        changefreq: 'daily',
        priority: 0.8,
      });
    }

    // 2. Active Categories
    const categories = await this.prisma.category.findMany({
      select: {
        slug: true,
        createdAt: true,
      },
    });

    for (const cat of categories) {
      entries.push({
        loc: `${this.baseUrl}/category/${cat.slug}`,
        lastmod: cat.createdAt.toISOString().split('T')[0],
        changefreq: 'weekly',
        priority: 0.6,
      });
    }

    return entries;
  }

  /**
   * Serializes array of SitemapUrlEntry into well-formed XML string.
   */
  private buildXmlFromEntries(entries: SitemapUrlEntry[]): string {
    const urlElements = entries
      .map((entry) => {
        let block = `  <url>\n    <loc>${this.escapeXml(entry.loc)}</loc>\n`;
        if (entry.lastmod) {
          block += `    <lastmod>${entry.lastmod}</lastmod>\n`;
        }
        block += `    <changefreq>${entry.changefreq}</changefreq>\n`;
        block += `    <priority>${entry.priority.toFixed(1)}</priority>\n  </url>`;
        return block;
      })
      .join('\n');

    return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urlElements}\n</urlset>`;
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
