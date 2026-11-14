import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'All International Authentic Skincare Brands in Bangladesh | SEYVEN',
  description:
    'Browse 100% authentic international imported skincare in Bangladesh sourced through official brand distributors. Curating top icons from Korea, USA, France, UK & Japan with free Facebook Messenger skin consultation and express Cash on Delivery nationwide.',
  keywords: [
    'all international skincare brands Bangladesh',
    'authentic imported cosmetics Dhaka',
    'original Korean skincare Bangladesh',
    'USA skincare brands online BD',
    'French pharmacy skincare Bangladesh',
    'Japanese skincare authentic BD',
    'free Messenger skincare consultation',
    'Cash on delivery skincare Bangladesh',
  ],
  alternates: {
    canonical: 'https://www.theseyven.com/catalog',
  },
  openGraph: {
    title: 'All International Authentic Skincare Brands in Bangladesh | SEYVEN',
    description: 'Explore 100% original imported skincare brands from Korea, USA, France & UK sourced via official brand distributors with free skin consultation and Cash on Delivery across Bangladesh.',
    url: 'https://www.theseyven.com/catalog',
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
