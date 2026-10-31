'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Truck } from 'lucide-react';
import { useCart } from '@/context/cart-context';

export default function ShippingDeliveryPage() {
  const { settings } = useCart();
  const threshold = Number(settings?.freeDeliveryThresholdBdt) || 3000;
  const dhakaFee = Number(settings?.standardDeliveryDhakaBdt) || 70;
  const outsideFee = Number(settings?.standardDeliveryOutsideBdt) || 130;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-14 space-y-8 pb-28 lg:pb-16 text-[#1C1917]">
      <div>
        <Link
          href="/"
          className="inline-flex items-center space-x-1.5 text-xs text-[#1C1917]/60 hover:text-[#1C1917] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Sanctuary</span>
        </Link>
      </div>

      <div className="space-y-3 pb-6 border-b border-[#E6DFD5]">
        <div className="inline-flex items-center space-x-2 text-[9px] uppercase tracking-[0.25em] text-[#C7A97B] font-medium">
          <Truck className="w-3.5 h-3.5" />
          <span>DOORSTEP LOGISTICS // SEYVEN SANCTUARY</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-serif uppercase tracking-[0.18em] font-light">
          SHIPPING & DELIVERY PROTOCOL
        </h1>
        <p className="text-xs text-[#1C1917]/60 font-mono">
          Nationwide 64 districts coverage with Pathao Express Courier
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-5 bg-[#F9F6F0] border border-[#E6DFD5] space-y-2">
          <span className="text-[10px] uppercase tracking-[0.2em] font-medium text-[#C7A97B] block">
            INSIDE DHAKA METRO
          </span>
          <p className="text-xl font-serif font-medium text-[#1C1917]">৳{dhakaFee}</p>
          <p className="text-xs text-[#1C1917]/70 font-light">
            1–2 Business Days Express Delivery via Pathao directly to your doorstep.
          </p>
        </div>

        <div className="p-5 bg-[#F9F6F0] border border-[#E6DFD5] space-y-2">
          <span className="text-[10px] uppercase tracking-[0.2em] font-medium text-[#C7A97B] block">
            OUTSIDE DHAKA (ALL 64 DISTRICTS)
          </span>
          <p className="text-xl font-serif font-medium text-[#1C1917]">৳{outsideFee}</p>
          <p className="text-xs text-[#1C1917]/70 font-light">
            2–3 Business Days Doorstep Courier via Pathao Courier Express.
          </p>
        </div>
      </div>

      <div className="p-4 bg-[#F9F6F0] border-l-2 border-[#C7A97B] text-xs text-[#1C1917]/85 space-y-1">
        <strong className="block text-[#1C1917]">
          Complimentary Free Delivery on Orders ৳{threshold.toLocaleString()}+
        </strong>
        <p className="font-light">
          Whenever your shopping bag total reaches ৳{threshold.toLocaleString()} or more, delivery fees are completely waived across Bangladesh.
        </p>
      </div>

      <div className="space-y-4 text-xs text-[#1C1917]/80 font-light leading-relaxed">
        <h2 className="text-sm font-serif uppercase tracking-wider font-medium text-[#1C1917]">
          Delivery Guidelines
        </h2>
        <ul className="list-disc pl-5 space-y-1.5">
          <li>Courier riders will call your phone prior to delivery.</li>
          <li>Please inspect the outer packaging seals upon arrival.</li>
          <li>For Cash on Delivery, please keep the exact cash amount ready for the rider.</li>
        </ul>
      </div>
    </div>
  );
}
