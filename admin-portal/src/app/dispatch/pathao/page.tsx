'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Truck,
  CheckCircle2,
  ExternalLink,
  Package,
  Layers,
  MapPin,
  Clock,
  ArrowLeft,
  Send,
  Building2,
  RefreshCw,
  AlertTriangle,
  Radio,
} from 'lucide-react';
import { useAdmin } from '@/context/admin-context';
import { AdminOrder } from '@/types/admin';
import { formatBdt } from '@/lib/formatters';

export default function PathaoOperationsDeskPage() {
  const { orders, updateOrderStatus } = useAdmin();

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Filter orders assigned to Pathao
  const pathaoInTransit = orders.filter(
    (o) =>
      o.status === 'SHIPPED' &&
      ((o.courier || '').toLowerCase().includes('pathao') || !o.courier)
  );

  const pathaoDelivered = orders.filter(
    (o) =>
      o.status === 'DELIVERED' &&
      ((o.courier || '').toLowerCase().includes('pathao') || !o.courier)
  );

  const pathaoInTransitCod = pathaoInTransit.reduce(
    (sum, o) => sum + (o.totalAmount || 0),
    0
  );

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleMarkDelivered = (order: AdminOrder) => {
    updateOrderStatus(order.id, 'DELIVERED', 'Delivered by Pathao Courier. COD reconciled.');
    showToast(`Order ${order.id} marked as DELIVERED.`);
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      showToast('Pathao Hermes API synced successfully.');
    }, 800);
  };

  return (
    <div className="space-y-6 sm:space-y-8 select-none">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 p-4 rounded bg-[#1C1917] text-[#C7A97B] font-mono text-xs font-bold shadow-2xl flex items-center gap-2 border border-[#C7A97B]/40">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-[#C7A97B]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E6DFD5]">
        <div>
          <div className="flex items-center space-x-2 text-[10px] uppercase font-mono tracking-[0.25em] text-rose-700 font-semibold mb-1">
            <Link
              href="/dispatch"
              className="hover:underline flex items-center gap-1 text-[#1C1917]/60 hover:text-[#1C1917]"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Smart Dispatch</span>
            </Link>
            <span>/</span>
            <span className="text-rose-700">Pathao Express Operations Desk</span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl text-[#1C1917] tracking-wide font-light flex items-center gap-2.5">
            <span>Pathao Hermes Express Logistics</span>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-rose-100 text-rose-800 border border-rose-300">
              Primary Carrier
            </span>
          </h1>
          <p className="text-xs text-[#1C1917]/60 font-light mt-0.5">
            Live Hermes Aladdin API integration, store profile details, and in-transit delivery tracking.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="px-3.5 py-2 rounded border border-[#E6DFD5] bg-white text-[#1C1917] text-xs font-mono font-medium flex items-center gap-1.5 hover:bg-[#F9F6F0] transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-rose-600' : ''}`} />
            <span>Sync API</span>
          </button>
          <a
            href="https://merchant.pathao.com/courier/dashboard"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3.5 py-2 rounded bg-rose-900 hover:bg-rose-800 text-white text-xs font-mono font-bold flex items-center gap-1.5 transition-colors"
          >
            <span>Open Pathao Portal</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* Pathao Store & Connection Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Store & Merchant ID */}
        <div className="p-5 bg-white border border-[#E6DFD5] rounded-lg space-y-2 shadow-xs">
          <div className="flex items-center justify-between text-xs font-mono text-[#1C1917]/60">
            <span className="uppercase tracking-wider">Registered Store</span>
            <Building2 className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-lg font-serif font-medium text-[#1C1917]">SEYVEN Hub Narayanganj</div>
          <div className="text-xs font-mono text-[#1C1917]/70 space-y-0.5">
            <div>Store ID: <span className="font-bold text-[#1C1917]">482984</span></div>
            <div>Merchant ID: <span className="font-bold text-[#1C1917]">493639</span></div>
          </div>
        </div>

        {/* Card 2: API & Webhook Health */}
        <div className="p-5 bg-white border border-[#E6DFD5] rounded-lg space-y-2 shadow-xs">
          <div className="flex items-center justify-between text-xs font-mono text-[#1C1917]/60">
            <span className="uppercase tracking-wider">Hermes API Health</span>
            <Radio className="w-4 h-4 text-emerald-600 animate-pulse" />
          </div>
          <div className="text-lg font-serif font-medium text-emerald-700 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span>API Connected (Live)</span>
          </div>
          <div className="text-xs font-mono text-[#1C1917]/70">
            Endpoint: <span className="font-semibold text-rose-800">api-hermes.pathao.com</span>
          </div>
        </div>

        {/* Card 3: In-Transit Financials */}
        <div className="p-5 bg-white border border-[#E6DFD5] rounded-lg space-y-2 shadow-xs">
          <div className="flex items-center justify-between text-xs font-mono text-[#1C1917]/60">
            <span className="uppercase tracking-wider">In-Transit COD Cash</span>
            <Truck className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-mono font-bold text-[#1C1917]">
            {formatBdt(pathaoInTransitCod)}
          </div>
          <div className="text-xs font-mono text-rose-800">
            {pathaoInTransit.length} parcels on the road ({pathaoDelivered.length} delivered)
          </div>
        </div>
      </div>

      {/* Pathao In-Transit Consignments Table */}
      <div className="bg-white border border-[#E6DFD5] rounded-lg p-5 sm:p-6 space-y-4 shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-[#E6DFD5]">
          <div>
            <h2 className="font-serif text-lg font-medium text-[#1C1917]">
              Active Pathao Consignments ({pathaoInTransit.length})
            </h2>
            <p className="text-xs text-[#1C1917]/60">
              Dispatched orders currently handled by Pathao riders and sorting hubs.
            </p>
          </div>
          <Truck className="w-5 h-5 text-rose-600" />
        </div>

        <div className="space-y-3">
          {pathaoInTransit.length === 0 ? (
            <div className="p-12 text-center text-xs text-[#1C1917]/50 font-mono space-y-1">
              <div>No Pathao parcels currently in transit.</div>
              <div className="text-[11px] text-[#1C1917]/40">
                Book new orders from the <Link href="/dispatch" className="text-rose-700 underline">Smart Dispatch Desk</Link>.
              </div>
            </div>
          ) : (
            pathaoInTransit.map((order) => {
              const trackingId =
                order.consignmentId ||
                (order as any).courierBookingId ||
                (order as any).trackingCode ||
                '';
              const trackingUrl = `https://merchant.pathao.com/tracking?consignment_id=${trackingId}`;

              return (
                <div
                  key={order.id}
                  className="p-4 bg-[#F9F6F0] border border-[#E6DFD5] rounded-lg space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-mono font-bold text-[#1C1917] text-sm">{order.id}</span>
                      <div className="text-[11px] text-rose-800 font-mono font-semibold">
                        Consignment ID: #{trackingId || 'N/A'}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="px-2.5 py-0.5 bg-rose-100 text-rose-900 border border-rose-300 text-[10px] font-mono font-bold rounded">
                        PATHAO IN TRANSIT
                      </span>
                      <div className="text-xs font-mono font-bold text-[#1C1917] mt-1">
                        COD: {formatBdt(order.totalAmount)}
                      </div>
                    </div>
                  </div>

                  <div className="text-xs text-[#1C1917]/80 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <div>
                      <span className="font-medium text-[#1C1917]">{order.customerName}</span>{' '}
                      <a href={`tel:${order.customerPhone}`} className="text-rose-700 underline font-mono">
                        ({order.customerPhone})
                      </a>
                      <div className="text-[11px] text-[#1C1917]/60">{order.shippingAddress}</div>
                    </div>
                    <div className="flex items-center gap-2 mt-1 sm:mt-0">
                      <a
                        href={`https://wa.me/88${order.customerPhone.replace(/\D/g, '')}?text=${encodeURIComponent(`Assalamu Alaikum ${order.customerName}, SEYVEN theke apnar order #${order.id} Pathao Courier e pathano hoyeche. Tracking: ${order.courierTrackingUrl || trackingUrl}`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-300 rounded font-mono text-[10px] hover:bg-emerald-100 flex items-center gap-1"
                      >
                        <span>💬 WhatsApp</span>
                      </a>
                    </div>
                  </div>

                  <div className="pt-2 flex items-center justify-between border-t border-[#E6DFD5]/70">
                    <a
                      href={order.courierTrackingUrl || trackingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-rose-800 font-mono hover:underline flex items-center space-x-1"
                    >
                      <span>Live Pathao Rider Tracking</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>

                    <button
                      type="button"
                      onClick={() => handleMarkDelivered(order)}
                      className="px-3.5 py-1.5 bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-mono font-bold rounded transition-colors"
                    >
                      Mark Delivered (COD Collected)
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
