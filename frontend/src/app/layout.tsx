import type { Metadata, Viewport } from 'next';
import './globals.css';
import { AppProviders } from '@/components/layout/app-providers';

export const viewport: Viewport = {
  themeColor: '#F9F6F0',
  width: 'device-width',
  initialScale: 1,
};

export const metadata: Metadata = {
  title: 'SEYVEN — The Sanctuary of Beauty',
  description:
    'Curated International Skincare for Bangladeshi Women. Authentic, brand-sealed skincare with express nationwide delivery.',
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
    title: 'SEYVEN — The Sanctuary of Beauty',
    description: 'Curated International Skincare for Bangladeshi Women.',
    siteName: 'SEYVEN',
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
