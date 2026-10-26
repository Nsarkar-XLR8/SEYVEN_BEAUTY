import type { Metadata } from 'next';
import './globals.css';
import { AdminProvider } from '@/context/admin-context';
import { AdminLayoutShell } from '@/components/shell/admin-layout-shell';

export const metadata: Metadata = {
  title: 'SEYVEN — The Sanctuary of Beauty | Operations & Dispatch Desk',
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
  robots: {
    index: false,
    follow: false,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-[#F9F6F0] text-[#1C1917] antialiased">
        <AdminProvider>
          <AdminLayoutShell>{children}</AdminLayoutShell>
        </AdminProvider>
      </body>
    </html>
  );
}
