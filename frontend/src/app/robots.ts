import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin/', '/checkout/success/', '/api/auth/'],
      },
      {
        userAgent: [
          'GPTBot',
          'ChatGPT-User',
          'PerplexityBot',
          'Google-Extended',
          'ClaudeBot',
          'Applebot',
        ],
        allow: '/',
        disallow: ['/admin/', '/checkout/success/', '/api/auth/'],
      },
    ],
    sitemap: 'https://www.theseyven.com/sitemap.xml',
  };
}

