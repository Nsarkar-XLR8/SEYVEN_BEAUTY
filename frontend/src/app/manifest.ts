import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'SEYVEN — The Sanctuary of Beauty',
    short_name: 'SEYVEN',
    description:
      'Curated International Skincare for Bangladeshi Women. Genuine brand-sealed skincare with express nationwide delivery.',
    start_url: '/',
    display: 'standalone',
    background_color: '#1C1917',
    theme_color: '#F9F6F0',
    orientation: 'portrait',
    icons: [
      {
        src: '/images/seyven-monogram-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/images/seyven-monogram-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
    ],
  };
}
