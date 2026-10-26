import React, { Suspense } from 'react';
import { Metadata } from 'next';
import { RmaRequestView } from '@/components/support/rma-request-view';

export const metadata: Metadata = {
  title: 'Return & Exchange Policy — SEYVEN Sanctuary',
  description: 'Complimentary 7-day parcel exchange and client care support for your SEYVEN order.',
};

export default function LegalReturnRefundPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[70vh] flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-[#C7A97B] border-t-transparent animate-spin rounded-full" />
        </div>
      }
    >
      <RmaRequestView />
    </Suspense>
  );
}
