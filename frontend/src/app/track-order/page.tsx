import React, { Suspense } from 'react';
import { Metadata } from 'next';
import { OrderTrackerView } from '@/components/tracking/order-tracker-view';

export const metadata: Metadata = {
  title: 'Track Your Parcel — SEYVEN Sanctuary',
  description: 'Live delivery tracking for your SEYVEN order across Bangladesh.',
};

export default function TrackOrderPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[70vh] flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-[#C7A97B] border-t-transparent animate-spin rounded-full" />
        </div>
      }
    >
      <OrderTrackerView />
    </Suspense>
  );
}
