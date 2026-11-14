import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Authentic Imported Skincare Brands in Bangladesh',
  description:
    'Shop 100% authentic imported skincare in Bangladesh from Korea, Japan, USA, India & France via official distributors. Free Messenger consultation with Cash on Delivery.',
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
    title: 'Authentic Imported Skincare Brands in Bangladesh | SEYVEN',
    description: 'Shop 100% authentic imported skincare in Bangladesh from Korea, USA & France via official distributors with free skin consultation and Cash on Delivery.',
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
