import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'All Products & International Brands | 100% Authentic — SEYVEN',
  description:
    'Browse 100% authentic international imported skincare in Bangladesh. CeraVe, COSRX, The Ordinary, Anua, Beauty of Joseon with free Facebook Messenger skin consultation and Cash on Delivery nationwide.',
  keywords: [
    'authentic skincare brands Bangladesh',
    'buy Korean skincare online Dhaka',
    'original imported cosmetics BD',
    'CeraVe COSRX The Ordinary Bangladesh',
    'free Messenger skincare consultation',
    'Cash on delivery skincare Bangladesh',
  ],
  alternates: {
    canonical: 'https://theseyven.com/catalog',
  },
  openGraph: {
    title: 'All Products & International Brands | 100% Authentic SEYVEN',
    description: 'Explore authentic imported skincare in Bangladesh. 100% genuine formulations with Cash on Delivery nationwide.',
    url: 'https://theseyven.com/catalog',
    siteName: 'SEYVEN — The Sanctuary of Beauty',
  },
};

export default function CatalogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
