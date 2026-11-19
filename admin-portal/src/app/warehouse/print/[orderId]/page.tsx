'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { useSearchParams, useParams } from 'next/navigation';
import { Printer, ArrowLeft, Smartphone, CheckCircle2 } from 'lucide-react';
import { useAdmin } from '@/context/admin-context';
import { ThermalShippingLabel } from '@/components/warehouse/thermal-shipping-label';
import { AdminOrder } from '@/types/admin';

export default function StandaloneThermalPrintPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const { orders, updateOrderStatus } = useAdmin();

  const rawOrderId = params?.orderId as string;
  const initialCourier = (searchParams.get('courier') as 'Pathao' | 'Steadfast') || 'Pathao';
  const initialSize = (searchParams.get('size') as '80mm' | '4x6') || '80mm';
  const shouldAutoPrint = searchParams.get('auto') === 'true';

  const [courier, setCourier] = useState<'Pathao' | 'Steadfast'>(initialCourier);
  const [paperPreset, setPaperPreset] = useState<'80mm' | '4x6'>(initialSize);
  const [hasAutoPrinted, setHasAutoPrinted] = useState(false);

  // Find order in context
  const order = orders.find(
    (o) =>
      o.id.toLowerCase() === rawOrderId?.toLowerCase() ||
      (o.referenceNo && o.referenceNo.toLowerCase() === rawOrderId?.toLowerCase())
  );

  // Fallback demo order if direct URL navigated without cache
  const effectiveOrder: AdminOrder = order || {
    id: rawOrderId || 'SYV-20261118-124I',
    referenceNo: 'ORD-124I',
    customerName: 'Samira Hossain',
    customerPhone: '01712345678',
    customerEmail: 'samira@example.com',
    shippingAddress: 'House 14, Road 7, Sector 3, Uttara, Dhaka 1230',
    district: 'Dhaka',
    zone: 'Uttara',
    subtotal: 3450,
    deliveryFee: 0,
    discount: 0,
    totalAmount: 3450,
    paymentMethod: 'COD',
    codVerification: 'VERIFIED',
    status: 'CONFIRMED',
    items: [
      { id: '1', sku: 'SKU-001', brand: 'SEYVEN', title: 'Centella Purifying Cleansing Oil', variant: '200ml', quantity: 1, unitPrice: 1850, totalPrice: 1850 },
      { id: '2', sku: 'SKU-002', brand: 'SEYVEN', title: 'Niacinamide Glow Serum', variant: '50ml', quantity: 1, unitPrice: 1600, totalPrice: 1600 },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  useEffect(() => {
    if (shouldAutoPrint && !hasAutoPrinted) {
      setHasAutoPrinted(true);
      setTimeout(() => {
        window.print();
        if (effectiveOrder.id) {
          updateOrderStatus(effectiveOrder.id, 'PACKED', 'Printed via standalone thermal route.');
        }
      }, 400);
    }
  }, [shouldAutoPrint, hasAutoPrinted, effectiveOrder.id, updateOrderStatus]);

  const handleManualPrint = () => {
    window.print();
    if (effectiveOrder.id) {
      updateOrderStatus(effectiveOrder.id, 'PACKED', 'Printed via standalone thermal route.');
    }
  };

  return (
    <div className="min-h-screen bg-[#F0EDE6] print:bg-white flex flex-col items-center">
      {/* Action Control Bar (Hidden when printed) */}
      <div className="w-full bg-[#1C1917] text-white p-3 border-b border-[#292524] no-print sticky top-0 z-50 shadow-md">
        <div className="max-w-4xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <Link
              href="/warehouse"
              className="p-1.5 rounded hover:bg-[#2A2623] text-[#C7A97B] transition-colors flex items-center space-x-1 text-xs font-mono"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Warehouse</span>
            </Link>
            <span className="text-[#C7A97B]/40">|</span>
            <span className="font-mono text-xs font-bold text-[#F9F6F0]">
              {effectiveOrder.id}
            </span>
          </div>

          {/* Quick Roll Size & Courier Selectors */}
          <div className="flex items-center space-x-2">
            <div className="flex bg-[#201D1A] p-0.5 rounded border border-[#292524]">
              <button
                type="button"
                onClick={() => setPaperPreset('80mm')}
                className={`px-2.5 py-1 text-xs font-mono font-bold rounded cursor-pointer ${
                  paperPreset === '80mm' ? 'bg-[#C7A97B] text-[#141211]' : 'text-stone-400 hover:text-white'
                }`}
              >
                📱 80mm Mobile
              </button>
              <button
                type="button"
                onClick={() => setPaperPreset('4x6')}
                className={`px-2.5 py-1 text-xs font-mono font-bold rounded cursor-pointer ${
                  paperPreset === '4x6' ? 'bg-[#C7A97B] text-[#141211]' : 'text-stone-400 hover:text-white'
                }`}
              >
                🏷️ 4×6&quot; Desktop
              </button>
            </div>

            <div className="flex bg-[#201D1A] p-0.5 rounded border border-[#292524]">
              <button
                type="button"
                onClick={() => setCourier('Pathao')}
                className={`px-2 py-1 text-xs font-mono font-bold rounded cursor-pointer ${
                  courier === 'Pathao' ? 'bg-red-800 text-white' : 'text-stone-400 hover:text-white'
                }`}
              >
                Pathao
              </button>
              <button
                type="button"
                onClick={() => setCourier('Steadfast')}
                className={`px-2 py-1 text-xs font-mono font-bold rounded cursor-pointer ${
                  courier === 'Steadfast' ? 'bg-emerald-800 text-white' : 'text-stone-400 hover:text-white'
                }`}
              >
                Steadfast
              </button>
            </div>

            <button
              type="button"
              onClick={handleManualPrint}
              className="px-4 py-1.5 bg-[#C7A97B] hover:bg-[#B5986A] text-[#141211] text-xs font-mono font-bold rounded flex items-center space-x-1.5 shadow-sm cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Now</span>
            </button>
          </div>
        </div>
      </div>

      {/* Printable Stage */}
      <div className="py-8 px-4 print:p-0 flex justify-center w-full">
        <div className="bg-white p-2 border border-black shadow-2xl print:shadow-none print:border-none">
          <ThermalShippingLabel
            order={effectiveOrder}
            courierOverride={courier}
            paperPreset={paperPreset}
            isPrintOnly
          />
        </div>
      </div>
    </div>
  );
}
