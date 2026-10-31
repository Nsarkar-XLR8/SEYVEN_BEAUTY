import type { Metadata, Viewport } from 'next';
import './globals.css';
import { AppProviders } from '@/components/layout/app-providers';
import { MetaPixel } from '@/components/analytics/meta-pixel';

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
    'authentic international skincare brands BD',
    'original imported cosmetics Dhaka',
    'Korean skincare Bangladesh',
    'USA skincare brands online Bangladesh',
    'French pharmacy skincare Dhaka',
    'UK skincare authentic Bangladesh',
    'Japanese skincare authentic BD',
    'all imported skincare brands price in BD',
    'Cash on delivery skincare BD',
    'skin problem advice Facebook Messenger',
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
  verification: {
    google: 'AH5hXxhOmon4hXqP9yEqSM2gexxkxkT2thyXdFTmho4',
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

const organizationJsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebSite',
      '@id': 'https://theseyven.com/#website',
      url: 'https://theseyven.com',
      name: 'SEYVEN — The Sanctuary of Beauty',
      description:
        'The digital sanctuary of SEYVEN — dedicated to helping women and beauty seekers across Bangladesh solve their real skin and beauty concerns through 100% complimentary private Messenger consultations, alongside unconditionally authentic, sealed international skincare curations.',
      inLanguage: ['en-BD', 'bn-BD'],
      potentialAction: {
        '@type': 'SearchAction',
        target: 'https://theseyven.com/catalog?q={search_term_string}',
        'query-input': 'required name=search_term_string',
      },
    },
    {
      '@type': 'Organization',
      '@id': 'https://theseyven.com/#organization',
      name: 'SEYVEN — The Sanctuary of Beauty',
      alternateName: 'SEYVEN Beauty',
      url: 'https://theseyven.com',
      logo: 'https://theseyven.com/images/seyven-monogram.png',
      slogan: 'Helping You Solve Real Skin Concerns First. Uncompromising Global Authenticity.',
      description:
        'A purpose-driven luxury beauty house and skincare sanctuary in Bangladesh. Built on the conviction that helping women solve their real skin and beauty challenges comes before commercial selling — delivered through 100% complimentary, empathetic 1-on-1 consultations and guaranteed authentic international formulations imported direct from certified supply hubs in South Korea, the United States, and Europe.',
      sameAs: [
        'https://www.facebook.com/seyvenofficial',
        'https://www.instagram.com/seyven_beauty/',
        'https://m.me/seyvenofficial',
      ],
      founder: {
        '@type': 'Person',
        '@id': 'https://theseyven.com/#founder',
        name: 'Nayem Sarkar',
        jobTitle: 'Founder & CEO',
        url: 'https://www.linkedin.com/in/nayemsarkar',
        sameAs: [
          'https://www.linkedin.com/in/nayemsarkar',
          'https://tyrand.dev/',
        ],
        hasOccupation: [
          {
            '@type': 'Role',
            roleName: 'Founder & CEO',
            affiliation: {
              '@type': 'Organization',
              name: 'SEYVEN — The Sanctuary of Beauty',
              url: 'https://theseyven.com',
            },
            description:
              'Founder & CEO steering SEYVEN with a vision to help women across Bangladesh solve real skin concerns through complimentary guidance and 100% authentic international curation.',
          },
          {
            '@type': 'Role',
            roleName: 'Co-Founder',
            affiliation: {
              '@type': 'Organization',
              name: 'Tyrand',
              url: 'https://tyrand.dev/',
              description: 'Software Engineering & Technology Agency',
            },
            description:
              'Co-Founder at Tyrand, helping businesses scale through robust engineering and AI driven software solutions. I partner with business leaders to build reliable technical infrastructure, optimize digital strategy and accelerate growth in the modern AI era.',
          },
        ],
        knowsAbout: [
          'International Luxury Skincare',
          'Curated Products',
          'Software Architecture & Engineering',
          'Digital Commerce & Technology',
        ],
      },
      contactPoint: {
        '@type': 'ContactPoint',
        contactType: 'SEYVEN Skincare Problem-Solving & Advisory Team via Facebook Messenger',
        areaServed: 'BD',
        availableLanguage: ['English', 'Bengali'],
        url: 'https://m.me/seyvenofficial',
      },
    },
  ],
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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
      </head>
      <body className="min-h-screen flex flex-col bg-[#F9F6F0] text-[#1C1917]">
        <MetaPixel />
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
