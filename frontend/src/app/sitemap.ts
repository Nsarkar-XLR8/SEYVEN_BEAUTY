import { MetadataRoute } from 'next';
import { getAllProducts } from '@/data/products';

const BASE_URL = 'https://www.theseyven.com';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const currentDate = new Date();

  // 1. Static high-value routes (Home, Catalog, Free Consultation, Loyalty, Tracking)
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${BASE_URL}/`,
      lastModified: currentDate,
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/catalog`,
      lastModified: currentDate,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/care`,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 0.85,
    },
    {
      url: `${BASE_URL}/about`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/track-order`,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/support/returns`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${BASE_URL}/support/grievance`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
  ];

  // 2. Dynamic Product routes (Existing products + Future products from database)
  let products = getAllProducts();
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

  const productRoutes: MetadataRoute.Sitemap = products
    .filter((p) => p && p.slug)
    .map((p) => ({
      url: `${BASE_URL}/products/${p.slug}`,
      lastModified: (p as any).updatedAt ? new Date((p as any).updatedAt) : currentDate,
      changeFrequency: 'daily',
      priority: 0.9,
    }));

  return [...staticRoutes, ...productRoutes];
}

