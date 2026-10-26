import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'SEYVEN Operations Desk',
    short_name: 'SEYVEN Ops',
    description: 'Enterprise Fulfillment, Catalog Governance & Courier Operations.',
    start_url: '/',
    display: 'standalone',
    background_color: '#1C1917',
    theme_color: '#1C1917',
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
