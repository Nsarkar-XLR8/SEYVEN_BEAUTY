import type { Metadata, Viewport } from 'next';
import './globals.css';
import { AppProviders } from '@/components/layout/app-providers';

export const viewport: Viewport = {
  themeColor: '#F9F6F0',
  width: 'device-width',
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL('https://theseyven.com'),
  title: {
    default: 'SEYVEN — Free Skincare Consultation & 100% Authentic Imported Skincare in Bangladesh',
    template: '%s | SEYVEN',
  },
  description:
    'Receive 100% free skin consultation for acne, pigmentation, barrier repair & dry skin via Facebook Messenger. Curating genuine, brand-sealed international imported skincare with express Cash on Delivery across Bangladesh.',
  keywords: [
    'free skincare consultation Bangladesh',
    'authentic international skincare bd',
    'original imported cosmetics Dhaka',
    'Korean skincare Bangladesh',
    'CeraVe Bangladesh',
    'The Ordinary price in BD',
    'COSRX Bangladesh',
    'Cash on delivery skincare BD',
    'skin problem advice Messenger',
  ],
  authors: [{ name: 'SEYVEN — The Sanctuary of Beauty', url: 'https://theseyven.com' }],
  creator: 'SEYVEN',
  publisher: 'SEYVEN',
  formatDetection: {
    email: false,
    address: true,
    telephone: true,
  },
  alternates: {
    canonical: 'https://theseyven.com',
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icon.png', type: 'image/png', sizes: '512x512' },
    ],
    apple: [
      { url: '/apple-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    shortcut: '/favicon.ico',
  },
  openGraph: {
    title: 'SEYVEN — Free Skincare Consultation & 100% Authentic Imported Skincare in Bangladesh',
    description: 'Receive 100% free skin consultation via Facebook Messenger. Curating only genuine, brand-sealed international imported formulations with Cash on Delivery across Bangladesh.',
    url: 'https://theseyven.com',
    siteName: 'SEYVEN — The Sanctuary of Beauty',
    locale: 'en_BD',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-scroll-behavior="smooth" className="antialiased">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,400&family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen flex flex-col bg-[#F9F6F0] text-[#1C1917]">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
