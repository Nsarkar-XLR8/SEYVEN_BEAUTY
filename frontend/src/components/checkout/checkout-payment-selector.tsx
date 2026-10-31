'use client';

import React from 'react';
import { Banknote, ShieldCheck, Check } from 'lucide-react';

interface CheckoutPaymentSelectorProps {
  selectedMethod: 'COD' | 'BKASH' | 'SSLCOMMERZ';
  onChangeMethod: (method: 'COD' | 'BKASH' | 'SSLCOMMERZ') => void;
}

export function CheckoutPaymentSelector({
  selectedMethod,
  onChangeMethod,
}: CheckoutPaymentSelectorProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2 text-xs uppercase tracking-[0.2em] font-medium text-[#1C1917]">
        <span className="w-5 h-5 rounded-full bg-[#1C1917] text-[#F9F6F0] flex items-center justify-center text-[10px] font-mono">
          3
        </span>
        <span>SELECT SETTLEMENT METHOD</span>
      </div>

      <div className="space-y-3">
        {/* Cash On Delivery Tile */}
        <div
          onClick={() => onChangeMethod('COD')}
          className={`p-4 sm:p-5 border transition-all cursor-pointer rounded-xs relative ${
            selectedMethod === 'COD'
              ? 'border-[#C7A97B] bg-[#FAF8F5] ring-1 ring-[#C7A97B]'
              : 'border-[#E6DFD5] bg-[#F9F6F0] hover:border-[#1C1917]/30'
          }`}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-full bg-[#1C1917] text-[#C7A97B] flex items-center justify-center shrink-0">
                <Banknote className="w-5 h-5 stroke-[1.5]" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="font-serif text-sm uppercase tracking-wider text-[#1C1917] font-medium">
                    CASH ON DELIVERY (COD)
                  </h3>
                  <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 text-[9px] font-mono uppercase font-bold tracking-wider rounded-xs">
                    ZERO ADVANCE REQUIRED
                  </span>
                </div>
                <p className="text-xs text-[#1C1917]/70 font-light mt-1 max-w-lg leading-relaxed">
                  Inspect your sealed package upon doorstep arrival before settling payment with the courier rider. Zero upfront fees or hidden charges.
                </p>
              </div>
            </div>

            <div className="w-5 h-5 rounded-full border border-[#C7A97B] flex items-center justify-center shrink-0 text-[#C7A97B]">
              <Check className="w-3.5 h-3.5 stroke-[2.5]" />
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-[#E6DFD5]/80 flex flex-wrap items-center gap-4 text-[10px] uppercase tracking-wider text-[#1C1917]/70 font-medium">
            <span className="flex items-center gap-1.5 text-emerald-800">
              <Check className="w-3 h-3 text-emerald-600" />
              Pay after inspection
            </span>
            <span className="flex items-center gap-1.5 text-[#C7A97B]">
              <ShieldCheck className="w-3.5 h-3.5" />
              Guaranteed Authentic Direct Import
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
