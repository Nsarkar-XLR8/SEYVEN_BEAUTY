'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Printer,
  PackageCheck,
  CheckCircle2,
  Barcode,
  ArrowRight,
  ExternalLink,
  Layers,
  MapPin,
  Clock,
} from 'lucide-react';
import { useAdmin } from '@/context/admin-context';
import { AdminOrder } from '@/types/admin';
import { formatBdt } from '@/lib/formatters';
import { ThermalShippingLabel } from '@/components/warehouse/thermal-shipping-label';

export default function AdminWarehouseDeskPage() {
  const { orders, updateOrderStatus } = useAdmin();

  const [selectedOrderForPrint, setSelectedOrderForPrint] = useState<AdminOrder | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const packQueue = orders.filter((o) => o.status === 'CONFIRMED' || o.status === 'PACKED');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handlePrint = (order: AdminOrder) => {
    setSelectedOrderForPrint(order);
    setTimeout(() => {
      window.print();
      updateOrderStatus(order.id, 'PACKED', 'Printed 4x6 thermal dispatch label and boxed item.');
      showToast(`4x6 Thermal label dispatched to printer for ${order.id}.`);
    }, 250);
  };

  return (
    <div className="space-y-6 sm:space-y-8 select-none">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 p-4 rounded bg-[#1C1917] text-[#C7A97B] font-mono text-xs font-bold shadow-2xl flex items-center gap-2 border border-[#C7A97B]/40 no-print">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-[#C7A97B]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E6DFD5] no-print">
        <div>
          <div className="flex items-center space-x-2 text-[10px] uppercase font-mono tracking-[0.25em] text-[#C7A97B] font-semibold mb-1">
            <Printer className="w-4 h-4 text-[#C7A97B]" />
            <span>Fulfillment & Packing Desk</span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl text-[#1C1917] tracking-wide font-light">
            4x6 Thermal Dispatch Labels & Packing Slips
          </h1>
          <p className="text-xs text-[#1C1917]/60 font-light mt-0.5">
            100mm × 150mm borderless adhesive shipping labels optimized for Xprinter, Zebra, and TSC thermal roll printers.
          </p>
        </div>

        <Link
          href="/dispatch"
          className="min-h-[44px] px-4 py-2 bg-[#1C1917] text-[#F9F6F0] text-xs font-mono uppercase tracking-wider rounded flex items-center gap-2 transition-colors shadow-md"
        >
          <span>Go to Dispatch Desk</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Warehouse Queue Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 no-print">
        {/* Left Column: Packing Queue (2 cols on laptop) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-lg text-[#1C1917] font-medium">
              Orders Ready for Packing & Labeling ({packQueue.length})
            </h2>
            <span className="text-xs font-mono text-[#1C1917]/60">
              Only Confirmed & Paid/Verified Orders
            </span>
          </div>

          <div className="space-y-3">
            {packQueue.map((order) => (
              <div
                key={order.id}
                className="p-5 bg-white border border-[#E6DFD5] rounded-lg space-y-3 shadow-xs hover:border-[#C7A97B] transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono font-bold text-[#1C1917]">{order.id}</span>
                    <span className="text-[10px] text-[#C7A97B] font-mono">({order.referenceNo})</span>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                      order.status === 'CONFIRMED'
                        ? 'bg-blue-100 text-blue-900 border border-blue-300'
                        : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                    }`}
                  >
                    {order.status}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div>
                    <div className="font-medium text-[#1C1917]">{order.customerName}</div>
                    <div className="text-[11px] text-[#1C1917]/70 font-mono">{order.customerPhone}</div>
                    <div className="text-[11px] text-[#1C1917]/60 truncate">{order.shippingAddress}</div>
                  </div>

                  <div className="text-right sm:text-right font-mono">
                    <div className="font-bold text-[#1C1917] text-sm">{formatBdt(order.totalAmount)}</div>
                    <div className="text-[10px] text-[#C7A97B] uppercase">{order.paymentMethod}</div>
                    <div className="text-[10px] text-emerald-800">COD Verified</div>
                  </div>
                </div>

                <div className="pt-2 border-t border-[#E6DFD5] flex items-center justify-between text-xs">
                  <span className="text-[#1C1917]/60 font-mono">{order.items.length} items packed</span>
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => setSelectedOrderForPrint(order)}
                      className="px-3 py-1.5 bg-[#F9F6F0] hover:bg-[#E6DFD5] border border-[#E6DFD5] text-[#1C1917] text-xs font-mono rounded"
                    >
                      Preview Label
                    </button>
                    <button
                      type="button"
                      onClick={() => handlePrint(order)}
                      className="px-3.5 py-1.5 bg-[#1C1917] hover:bg-[#2A2623] text-[#F9F6F0] text-xs font-mono font-semibold rounded flex items-center space-x-1.5 shadow-xs"
                    >
                      <Printer className="w-3.5 h-3.5 text-[#C7A97B]" />
                      <span>Print 4x6 Label</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: 4x6 Live Label Preview Container */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-lg text-[#1C1917] font-medium">
              4x6 Thermal Label Preview
            </h2>
            <span className="text-[10px] font-mono text-[#C7A97B] font-bold">100mm × 150mm (4×6")</span>
          </div>

          {selectedOrderForPrint ? (
            <div className="p-4 bg-white border border-[#1C1917] shadow-xl rounded-lg space-y-4">
              {/* Official SEYVEN 4x6 Thermal Label Live Preview */}
              <div className="flex justify-center bg-[#F9F6F0] p-3 rounded border border-[#E6DFD5]">
                <ThermalShippingLabel order={selectedOrderForPrint} />
              </div>

              <button
                type="button"
                onClick={() => handlePrint(selectedOrderForPrint)}
                className="w-full py-3 bg-[#1C1917] hover:bg-[#2A2623] text-[#F9F6F0] text-xs font-mono uppercase font-bold rounded flex items-center justify-center space-x-2 shadow-lg transition-colors"
              >
                <Printer className="w-4 h-4 text-[#C7A97B]" />
                <span>Trigger Thermal Print (100mm × 150mm)</span>
              </button>
            </div>
          ) : (
            <div className="p-8 bg-white border border-[#E6DFD5] rounded-lg text-center text-xs text-[#1C1917]/50 font-mono space-y-2">
              <Printer className="w-8 h-8 text-[#C7A97B] mx-auto opacity-40" />
              <p>Select any order from the packing queue to preview its 4x6 thermal shipping label.</p>
            </div>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4x6 THERMAL PRINT STAGE (RENDERED ONLY FOR PHYSICAL PRINTING)              */}
      {/* ========================================================================= */}
      {selectedOrderForPrint && (
        <div id="thermal-print-stage">
          <ThermalShippingLabel order={selectedOrderForPrint} isPrintOnly />
        </div>
      )}
    </div>
  );
}
