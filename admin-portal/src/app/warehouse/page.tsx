'use client';

import React, { useState, useEffect, useRef } from 'react';
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
  Smartphone,
  Sparkles,
  Download,
} from 'lucide-react';
import { useAdmin } from '@/context/admin-context';
import { AdminOrder } from '@/types/admin';
import { formatBdt } from '@/lib/formatters';
import { ThermalShippingLabel } from '@/components/warehouse/thermal-shipping-label';

export default function AdminWarehouseDeskPage() {
  const { orders, updateOrderStatus, platformSettings } = useAdmin();

  const [selectedOrderForPrint, setSelectedOrderForPrint] = useState<AdminOrder | null>(null);
  const [selectedCourier, setSelectedCourier] = useState<'Pathao' | 'Steadfast'>('Pathao');
  const [paperPreset, setPaperPreset] = useState<'80mm' | '4x6'>('80mm');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isPrinting, setIsPrinting] = useState(false);

  const packQueue = orders.filter((o) => o.status === 'CONFIRMED' || o.status === 'PACKED');

  // Automatically select the first order in queue if none selected
  useEffect(() => {
    if (!selectedOrderForPrint && packQueue.length > 0) {
      setSelectedOrderForPrint(packQueue[0]);
    }
  }, [packQueue, selectedOrderForPrint]);

  // Sync active courier with selected order preference
  useEffect(() => {
    if (selectedOrderForPrint?.courier?.toLowerCase() === 'steadfast') {
      setSelectedCourier('Steadfast');
    } else {
      setSelectedCourier('Pathao');
    }
  }, [selectedOrderForPrint?.id]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  /**
   * Enterprise Isolated Iframe Print Engine.
   * Eliminates 100% of dashboard CSS interference, sidebar overflow clipping,
   * and blank page issues across Chrome, Edge, and Android Bluetooth print spoolers.
   */
  const handlePrint = (order: AdminOrder) => {
    setSelectedOrderForPrint(order);
    setIsPrinting(true);

    setTimeout(() => {
      try {
        const printStageEl = document.getElementById('thermal-print-stage');
        if (!printStageEl) {
          // Fallback to standard window.print if stage missing
          document.body.classList.add('printing-thermal-label');
          window.print();
          document.body.classList.remove('printing-thermal-label');
          updateOrderStatus(order.id, 'PACKED', `Printed thermal dispatch label and boxed item.`);
          showToast(`✓ Thermal label dispatched to printer for ${order.id}.`);
          setIsPrinting(false);
          return;
        }

        // Clean up any stale iframe
        const staleIframe = document.getElementById('thermal-print-iframe');
        if (staleIframe) {
          staleIframe.remove();
        }

        const iframe = document.createElement('iframe');
        iframe.id = 'thermal-print-iframe';
        iframe.style.position = 'fixed';
        iframe.style.right = '0';
        iframe.style.bottom = '0';
        iframe.style.width = '0';
        iframe.style.height = '0';
        iframe.style.border = '0';
        document.body.appendChild(iframe);

        const doc = iframe.contentWindow?.document;
        if (!doc) {
          document.body.classList.add('printing-thermal-label');
          window.print();
          document.body.classList.remove('printing-thermal-label');
          updateOrderStatus(order.id, 'PACKED', `Printed thermal dispatch label and boxed item.`);
          showToast(`✓ Thermal label dispatched to printer for ${order.id}.`);
          setIsPrinting(false);
          return;
        }

        const is80mm = paperPreset === '80mm';
        const pageSize = is80mm ? '80mm auto' : '100mm 150mm';
        const targetWidth = is80mm ? '80mm' : '100mm';

        // Collect all global stylesheets & fonts for high fidelity rendering
        const styles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
          .map((el) => el.outerHTML)
          .join('\n');

        doc.open();
        doc.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>SEYVEN Shipping Label - ${order.id}</title>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1">
              ${styles}
              <style>
                @page {
                  size: ${pageSize};
                  margin: 0mm;
                }
                * {
                  box-sizing: border-box !important;
                  -webkit-print-color-adjust: exact !important;
                  print-color-adjust: exact !important;
                }
                html, body {
                  margin: 0 !important;
                  padding: 0 !important;
                  width: ${targetWidth} !important;
                  background: #ffffff !important;
                  color: #000000 !important;
                }
              </style>
            </head>
            <body style="background:#ffffff;margin:0;padding:0;">
              <div style="width:${targetWidth};margin:0;padding:2mm;box-sizing:border-box;">
                ${printStageEl.innerHTML}
              </div>
            </body>
          </html>
        `);
        doc.close();

        setTimeout(() => {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
          updateOrderStatus(order.id, 'PACKED', `Printed ${is80mm ? '80mm Mobile' : '4x6'} thermal dispatch label and boxed item.`);
          showToast(`✓ Label sent to printer for ${order.id}. Order marked as PACKED.`);
          setIsPrinting(false);
          setTimeout(() => {
            iframe.remove();
          }, 3000);
        }, 300);
      } catch (err) {
        console.warn('Iframe print error, falling back to window.print:', err);
        document.body.classList.add('printing-thermal-label');
        window.print();
        document.body.classList.remove('printing-thermal-label');
        updateOrderStatus(order.id, 'PACKED', `Printed thermal dispatch label and boxed item.`);
        showToast(`✓ Dispatched to printer for ${order.id}.`);
        setIsPrinting(false);
      }
    }, 150);
  };

  return (
    <div className="space-y-6 sm:space-y-8 select-none">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 p-4 rounded bg-[#1C1917] text-[#C7A97B] font-mono text-xs font-bold shadow-2xl flex items-center gap-2 border border-[#C7A97B]/40 no-print animate-in fade-in duration-200">
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
            Thermal Dispatch Labels & Packing Slips
          </h1>
          <p className="text-xs text-[#1C1917]/60 font-light mt-0.5">
            Optimized for <strong>15K Mobile POS Handhelds (80mm)</strong>, Bluetooth Portable rolls, and Desktop Xprinter/Zebra (4×6&quot;).
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
            {packQueue.length === 0 ? (
              <div className="p-8 bg-white border border-[#E6DFD5] rounded-lg text-center text-xs text-[#1C1917]/50 font-mono space-y-2">
                <PackageCheck className="w-8 h-8 text-emerald-600 mx-auto opacity-40" />
                <p>No orders awaiting packing. All confirmed shipments have been dispatched.</p>
              </div>
            ) : (
              packQueue.map((order) => (
                <div
                  key={order.id}
                  className={`p-5 bg-white border rounded-lg space-y-3 shadow-xs transition-colors cursor-pointer ${
                    selectedOrderForPrint?.id === order.id
                      ? 'border-[#C7A97B] ring-1 ring-[#C7A97B]/50'
                      : 'border-[#E6DFD5] hover:border-[#C7A97B]'
                  }`}
                  onClick={() => setSelectedOrderForPrint(order)}
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
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedOrderForPrint(order);
                        }}
                        className="px-3 py-1.5 bg-[#F9F6F0] hover:bg-[#E6DFD5] border border-[#E6DFD5] text-[#1C1917] text-xs font-mono rounded cursor-pointer"
                      >
                        Preview
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePrint(order);
                        }}
                        disabled={isPrinting}
                        className="px-3.5 py-1.5 bg-[#1C1917] hover:bg-[#2A2623] text-[#F9F6F0] text-xs font-mono font-semibold rounded flex items-center space-x-1.5 shadow-xs cursor-pointer"
                      >
                        <Printer className="w-3.5 h-3.5 text-[#C7A97B]" />
                        <span>Print Label</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Column: Live Label Preview & Universal Hardware Controls */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-lg text-[#1C1917] font-medium">
              Live Label Preview
            </h2>
            <span className="text-[10px] font-mono text-[#C7A97B] font-bold">
              {paperPreset === '80mm' ? '80mm (Mobile POS)' : '100mm × 150mm (4×6")'}
            </span>
          </div>

          {selectedOrderForPrint ? (
            <div className="p-4 bg-white border border-[#1C1917] shadow-xl rounded-lg space-y-4">
              {/* 1. Paper Preset Selector (80mm Mobile POS vs 100mm 4x6" Desktop) */}
              <div className="p-2.5 bg-[#FAF8F5] border border-[#E6DFD5] rounded-md space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="text-[11px] font-bold text-[#1C1917] uppercase tracking-wider flex items-center gap-1.5">
                    <Smartphone className="w-3.5 h-3.5 text-[#C7A97B]" />
                    <span>Printer Roll Size:</span>
                  </div>
                  <span className="text-[9px] font-mono text-[#C7A97B] font-bold">
                    {paperPreset === '80mm' ? '★ Active for 15K Mobile' : 'Active for Desktop'}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setPaperPreset('80mm')}
                    className={`py-2 px-2 text-xs font-mono font-bold rounded flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      paperPreset === '80mm'
                        ? 'bg-[#1C1917] text-[#C7A97B] shadow-xs'
                        : 'bg-white border border-[#E6DFD5] text-[#1C1917]/70 hover:bg-[#F2ECE1]'
                    }`}
                  >
                    <span>📱 80mm Mobile POS</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaperPreset('4x6')}
                    className={`py-2 px-2 text-xs font-mono font-bold rounded flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      paperPreset === '4x6'
                        ? 'bg-[#1C1917] text-[#C7A97B] shadow-xs'
                        : 'bg-white border border-[#E6DFD5] text-[#1C1917]/70 hover:bg-[#F2ECE1]'
                    }`}
                  >
                    <span>🏷️ 100mm 4×6&quot; Sticker</span>
                  </button>
                </div>
              </div>

              {/* 2. Courier Failover Switcher (Pathao ⇄ Steadfast) */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 bg-[#FAF8F5] border border-[#E6DFD5] rounded-md">
                <div>
                  <div className="text-[11px] font-bold text-[#1C1917] uppercase tracking-wider">
                    Dispatch Courier:
                  </div>
                  <div className="text-[9px] text-[#1C1917]/60">
                    Switch courier instantly if server is down
                  </div>
                </div>
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => setSelectedCourier('Pathao')}
                    className={`px-3 py-1.5 text-xs font-mono font-bold rounded cursor-pointer transition-all ${
                      selectedCourier === 'Pathao'
                        ? 'bg-[#1C1917] text-[#C7A97B] shadow-xs'
                        : 'bg-white border border-[#E6DFD5] text-[#1C1917]/70 hover:bg-[#F2ECE1]'
                    }`}
                  >
                    Pathao
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedCourier('Steadfast')}
                    className={`px-3 py-1.5 text-xs font-mono font-bold rounded cursor-pointer transition-all ${
                      selectedCourier === 'Steadfast'
                        ? 'bg-[#006A4E] text-white shadow-xs'
                        : 'bg-white border border-[#E6DFD5] text-[#1C1917]/70 hover:bg-[#F2ECE1]'
                    }`}
                  >
                    Steadfast
                  </button>
                </div>
              </div>

              {/* 3. Official SEYVEN Live Thermal Label Component */}
              <div className="flex justify-center bg-[#F9F6F0] p-3 rounded border border-[#E6DFD5] overflow-x-auto">
                <ThermalShippingLabel
                  order={selectedOrderForPrint}
                  courierOverride={selectedCourier}
                  paperPreset={paperPreset}
                />
              </div>

              {/* 4. Action Buttons (Print & Clean View) */}
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => handlePrint(selectedOrderForPrint)}
                  disabled={isPrinting}
                  className="w-full py-3.5 bg-[#1C1917] hover:bg-[#2A2623] text-[#F9F6F0] text-xs font-mono uppercase font-bold rounded flex items-center justify-center space-x-2 shadow-lg transition-colors cursor-pointer disabled:opacity-50"
                >
                  <Printer className="w-4 h-4 text-[#C7A97B]" />
                  <span>
                    {isPrinting
                      ? 'Dispatching to Printer...'
                      : `Trigger Thermal Print (${paperPreset === '80mm' ? '80mm Mobile' : '100mm 4x6'})`}
                  </span>
                </button>

                <div className="grid grid-cols-2 gap-2">
                  <Link
                    href={`/warehouse/print/${selectedOrderForPrint.id}?courier=${selectedCourier}&size=${paperPreset}`}
                    target="_blank"
                    className="py-2 px-2 bg-white hover:bg-[#F9F6F0] border border-[#1C1917] text-[#1C1917] text-[11px] font-mono rounded flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <ExternalLink className="w-3 h-3 text-[#C7A97B]" />
                    <span>Open Standalone View</span>
                  </Link>

                  <Link
                    href={`/warehouse/print/${selectedOrderForPrint.id}?courier=${selectedCourier}&size=${paperPreset}&auto=true`}
                    target="_blank"
                    className="py-2 px-2 bg-white hover:bg-[#F9F6F0] border border-[#1C1917] text-[#1C1917] text-[11px] font-mono rounded flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Download className="w-3 h-3 text-[#C7A97B]" />
                    <span>Save / Print Tab</span>
                  </Link>
                </div>
              </div>

              {/* 5. Mobile & Bluetooth Printer Guidance */}
              <div className="p-3 bg-[#FAF8F5] border border-[#E6DFD5] rounded text-[10px] text-[#1C1917]/75 font-mono space-y-1">
                <div className="font-bold text-[#8C6D3B] flex items-center gap-1.5">
                  <Printer className="w-3.5 h-3.5" />
                  <span>Printer Setup Guidelines:</span>
                </div>
                <p>• <strong>15K Mobile POS / Bluetooth:</strong> Select <em>80mm Mobile POS</em> above. In print dialog Destination, select your Bluetooth device.</p>
                <p>• <strong>Desktop 4×6 Rolls:</strong> Select <em>100mm 4×6&quot;</em>. Paper size: 100×150mm.</p>
                <p>• <strong>Margins:</strong> None (Zero margins prevent shrinking).</p>
                <p>• <strong>Options:</strong> Uncheck &ldquo;Headers and footers&rdquo; to remove browser URL / date.</p>
              </div>
            </div>
          ) : (
            <div className="p-8 bg-white border border-[#E6DFD5] rounded-lg text-center text-xs text-[#1C1917]/50 font-mono space-y-2">
              <Printer className="w-8 h-8 text-[#C7A97B] mx-auto opacity-40" />
              <p>Select any order from the packing queue to preview its thermal shipping label.</p>
            </div>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* THERMAL PRINT STAGE (RENDERED ONLY FOR PHYSICAL PRINTING)                  */}
      {/* ========================================================================= */}
      {selectedOrderForPrint && (
        <div id="thermal-print-stage" className="hidden print:block">
          <ThermalShippingLabel
            order={selectedOrderForPrint}
            courierOverride={selectedCourier}
            paperPreset={paperPreset}
            isPrintOnly
          />
        </div>
      )}
    </div>
  );
}
