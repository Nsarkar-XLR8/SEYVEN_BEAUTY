'use client';

import { Truck } from 'lucide-react';
import { formatBdt } from '@/lib/formatters';
import { useCart } from '@/context/cart-context';
import { BRAND } from '@/lib/constants';

interface PdpDeliveryEstimatorProps {
  productPriceBdt: number;
}

export function PdpDeliveryEstimator({ productPriceBdt }: PdpDeliveryEstimatorProps) {
  const { settings } = useCart();

  const insideDhakaFee = settings?.standardDeliveryDhakaBdt ?? BRAND.thresholds.standardDeliveryDhakaBdt;
  const outsideDhakaFee = settings?.standardDeliveryOutsideBdt ?? BRAND.thresholds.standardDeliveryOutsideBdt;

  return (
    <div className="p-4 sm:p-5 bg-[#F9F6F0] border border-[#E6DFD5] space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2 text-xs uppercase tracking-[0.2em] font-medium text-[#1C1917]">
          <Truck className="w-3.5 h-3.5 text-[#C7A97B]" />
          <span>NATIONWIDE DELIVERY // ALL OVER BANGLADESH</span>
        </div>
        <span className="text-[9px] uppercase tracking-wider text-[#C7A97B] font-medium border border-[#C7A97B]/40 px-2 py-0.5 rounded-full">
          64 Districts Covered
        </span>
      </div>

      {/* Dynamic Rates Grid (Inside Dhaka vs All Over Bangladesh) */}
      <div className="grid grid-cols-2 gap-3 pt-1">
        {/* Inside Dhaka */}
        <div className="p-3 bg-white border border-[#E6DFD5] rounded-sm space-y-1">
          <span className="text-[10px] uppercase tracking-wider text-[#1C1917]/70 font-semibold block">
            Inside Dhaka
          </span>
          <p className="text-xs font-serif font-bold text-[#1C1917]">
            {formatBdt(insideDhakaFee)}
          </p>
          <span className="text-[10px] text-[#1C1917]/60 block">
            1–2 Days (Next Day Available)
          </span>
        </div>

        {/* Outside Dhaka / All Over Bangladesh */}
        <div className="p-3 bg-white border border-[#E6DFD5] rounded-sm space-y-1">
          <span className="text-[10px] uppercase tracking-wider text-[#1C1917]/70 font-semibold block">
            Outside Dhaka (All Over BD)
          </span>
          <p className="text-xs font-serif font-bold text-[#1C1917]">
            {formatBdt(outsideDhakaFee)}
          </p>
          <span className="text-[10px] text-[#1C1917]/60 block">
            2–3 Days (Doorstep Transit)
          </span>
        </div>
      </div>
    </div>
  );
}
