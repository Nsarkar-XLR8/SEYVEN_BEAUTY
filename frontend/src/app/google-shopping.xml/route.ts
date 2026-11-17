import { NextResponse } from 'next/server';
import { getAllProducts, ProductDetail } from '@/data/products';

const BASE_URL = 'https://www.theseyven.com';

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export async function GET() {
  let products: ProductDetail[] = getAllProducts();

  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://seyven-beauty-backend.onrender.com/api/v1';
    const res = await fetch(`${apiUrl}/catalog/products?limit=1000`, {
      next: { revalidate: 3600 },
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        products = data;
      }
    }
  } catch {
    // Graceful fallback to static master products
  }

  const itemsXml = products
    .filter((p) => p && p.slug)
    .map((product) => {
      const productUrl = `${BASE_URL}/products/${product.slug}`;
      const title = `${product.brand} — ${product.titleEn}`;
      const description = `${product.shortDescriptionEn || product.titleEn} — 100% genuine imported formulation sourced via official authorized brand distributors in Bangladesh. Curated by SEYVEN with nationwide Cash on Delivery and complimentary skin consultation.`;

      const primaryImg =
        Array.isArray(product.images) && product.images[0]
          ? typeof product.images[0] === 'string'
            ? product.images[0]
            : product.images[0].url
          : `${BASE_URL}/images/seyven-monogram.png`;

      const availability = product.stockStatus === 'OUT_OF_STOCK' ? 'out_of_stock' : 'in_stock';
      const priceFormatted = `${Number(product.priceBdt || 0).toFixed(2)} BDT`;

      return `    <item>
      <g:id>${escapeXml(product.id || product.slug)}</g:id>
      <g:title>${escapeXml(title)}</g:title>
      <g:description>${escapeXml(description)}</g:description>
      <g:link>${escapeXml(productUrl)}</g:link>
      <g:image_link>${escapeXml(primaryImg)}</g:image_link>
      <g:condition>new</g:condition>
      <g:availability>${availability}</g:availability>
      <g:price>${priceFormatted}</g:price>
      <g:brand>${escapeXml(product.brand)}</g:brand>
      <g:identifier_exists>no</g:identifier_exists>
      <g:product_type>${escapeXml(product.category || 'Skincare')}</g:product_type>
      <g:shipping>
        <g:country>BD</g:country>
        <g:service>Express Courier Delivery</g:service>
        <g:price>70.00 BDT</g:price>
      </g:shipping>
    </item>`;
    })
    .join('\n');

  const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>SEYVEN — The Sanctuary of Beauty Product Feed</title>
    <link>${BASE_URL}</link>
    <description>Official Google Merchant Center Product Feed for SEYVEN — Authentic International Skincare House in Bangladesh</description>
${itemsXml}
  </channel>
</rss>`;

  return new NextResponse(xmlContent, {
    status: 200,
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400',
    },
  });
}
