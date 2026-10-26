'use client';

import React, { useState, useEffect } from 'react';
import { MapPin, Clock, Truck, CheckCircle2 } from 'lucide-react';
import { useLanguage } from '@/context/language-context';
import { formatBdt } from '@/lib/formatters';
import { BD_DISTRICTS, getDeliveryEstimate } from '@/lib/delivery-calculator';

interface PdpDeliveryEstimatorProps {
  productPriceBdt: number;
}

export function PdpDeliveryEstimator({ productPriceBdt }: PdpDeliveryEstimatorProps) {
  const { lang, t } = useLanguage();
  const [selectedDistrictId, setSelectedDistrictId] = useState('dhaka');

  const estimate = getDeliveryEstimate(selectedDistrictId, productPriceBdt);

  return (
    <div className="p-4 sm:p-5 bg-[#F9F6F0] border border-[#E6DFD5] space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2 text-xs uppercase tracking-[0.2em] font-medium text-[#1C1917]">
          <MapPin className="w-3.5 h-3.5 text-[#C7A97B]" />
          <span>{t('BANGLADESH DELIVERY ESTIMATOR', 'ডেলিভারি সময় ও চার্জ')}</span>
        </div>
        <span className="text-[9px] uppercase tracking-wider text-[#C7A97B] font-medium">
          64 DISTRICTS COVERAGE
        </span>
      </div>

      {/* District Dropdown Selector */}
      <div className="space-y-1.5">
        <label
          htmlFor="district-select"
          className="text-[10px] uppercase tracking-[0.2em] text-[#1C1917]/70 block"
        >
          {t('SELECT YOUR DESTINATION DISTRICT', 'আপনার জেলা নির্বাচন করুন')}
        </label>
        <div className="relative">
          <select
            id="district-select"
            value={selectedDistrictId}
            onChange={(e) => setSelectedDistrictId(e.target.value)}
            className="w-full bg-[#F9F6F0] border border-[#E6DFD5] text-xs font-serif text-[#1C1917] px-3 py-2.5 appearance-none focus:outline-hidden focus:border-[#C7A97B] transition-colors cursor-pointer"
          >
            {BD_DISTRICTS.map((district) => (
              <option key={district.id} value={district.id}>
                {lang === 'bn' ? `${district.nameBn} (${district.division})` : `${district.nameEn} District (${district.division})`}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[9px] text-[#1C1917]/60">
            ▼
          </div>
        </div>
      </div>

      {/* Estimated Output Card */}
      <div className="grid grid-cols-2 gap-3 pt-1 border-t border-[#E6DFD5]/70">
        {/* Estimated Transit Time */}
        <div className="space-y-1">
          <div className="flex items-center space-x-1.5 text-[10px] uppercase tracking-wider text-[#1C1917]/60">
            <Clock className="w-3 h-3 text-[#C7A97B]" />
            <span>{t('ESTIMATED ARRIVAL', 'সম্ভাব্য সময়')}</span>
          </div>
          <p className="text-xs font-medium text-[#1C1917]">
            {lang === 'bn' ? estimate.estimatedDaysBn : estimate.estimatedDaysEn}
          </p>
        </div>

        {/* Shipping Fee */}
        <div className="space-y-1">
          <div className="flex items-center space-x-1.5 text-[10px] uppercase tracking-wider text-[#1C1917]/60">
            <Truck className="w-3 h-3 text-[#C7A97B]" />
            <span>{t('DELIVERY FEE', 'ডেলিভারি চার্জ')}</span>
          </div>
          <p className="text-xs font-medium">
            {estimate.isFreeDelivery ? (
              <span className="text-emerald-700 font-semibold tracking-wide">
                {t('FREE (QUALIFIED)', 'ফ্রি ডেলিভারি')}
              </span>
            ) : (
              <span className="text-[#1C1917]">
                {formatBdt(estimate.deliveryFeeBdt)}
              </span>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
