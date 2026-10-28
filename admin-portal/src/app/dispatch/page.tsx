'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Truck,
  CheckCircle2,
  ExternalLink,
  Search,
  Package,
  Layers,
  MapPin,
  Clock,
  ArrowRight,
  Send,
} from 'lucide-react';
import { useAdmin } from '@/context/admin-context';
import { AdminOrder } from '@/types/admin';
import { formatBdt } from '@/lib/formatters';

export default function AdminDispatchDeskPage() {
  const { orders, assignCourier, updateOrderStatus } = useAdmin();

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [selectedCourier, setSelectedCourier] = useState<'Pathao' | 'Steadfast'>('Pathao');
  const [bookingOrder, setBookingOrder] = useState<AdminOrder | null>(null);
  const [isBookingId, setIsBookingId] = useState<string | null>(null);

  const readyForDispatch = orders.filter((o) => o.status === 'PACKED');
  const inTransitOrders = orders.filter((o) => o.status === 'SHIPPED');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4500);
  };

  const handleBookConsignment = async (order: AdminOrder) => {
    setIsBookingId(order.id);
    try {
      const res = await assignCourier(order.id, selectedCourier);
      if (res && !res.success) {
        showToast(`⚠️ ${res.message || 'Booking failed'}`);
      } else {
        showToast(`✅ ${selectedCourier} Consignment Booked: #${res?.consignmentId || ''}`);
      }
    } catch (err: any) {
      showToast(`⚠️ Booking Error: ${err?.message || 'Failed'}`);
    } finally {
      setIsBookingId(null);
      setBookingOrder(null);
    }
  };

  const handleMarkDelivered = (order: AdminOrder) => {
    updateOrderStatus(order.id, 'DELIVERED', 'Delivered by courier. COD collected.');
    showToast(`Order ${order.id} marked as DELIVERED. Customer lifetime spend updated.`);
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
          <div className="flex items-center space-x-2 text-[10px] uppercase font-mono tracking-[0.25em] text-[#C7A97B] font-semibold mb-1">
            <Truck className="w-4 h-4 text-[#C7A97B]" />
            <span>Logistics & Courier Desk</span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl text-[#1C1917] tracking-wide font-light">
            Smart Dispatch & Courier Booking
          </h1>
          <p className="text-xs text-[#1C1917]/60 font-light mt-0.5">
            Pathao Merchant API automated consignment booking & Steadfast Courier live tracking webhooks.
          </p>
        </div>

        <div className="flex items-center space-x-2 text-xs font-mono">
          <span className="text-[#1C1917]/60">Default Carrier:</span>
          <div className="inline-flex rounded border border-[#E6DFD5] bg-white p-0.5">
            <button
              type="button"
              onClick={() => setSelectedCourier('Pathao')}
              className={`px-3 py-1 rounded text-xs font-semibold ${
                selectedCourier === 'Pathao' ? 'bg-[#1C1917] text-[#F9F6F0]' : 'text-[#1C1917]'
              }`}
            >
              Pathao
            </button>
            <button
              type="button"
              onClick={() => setSelectedCourier('Steadfast')}
              className={`px-3 py-1 rounded text-xs font-semibold ${
                selectedCourier === 'Steadfast' ? 'bg-[#1C1917] text-[#F9F6F0]' : 'text-[#1C1917]'
              }`}
            >
              Steadfast
            </button>
          </div>
        </div>
      </div>

      {/* Dispatch Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Section 1: Awaiting Courier Booking */}
        <div className="bg-white border border-[#E6DFD5] rounded-lg p-5 sm:p-6 space-y-4 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-[#E6DFD5]">
            <div>
              <h2 className="font-serif text-lg font-medium text-[#1C1917]">
                Packed & Ready for Courier Booking ({readyForDispatch.length})
              </h2>
              <p className="text-xs text-[#1C1917]/60">
                Boxed orders with printed 4x6 labels awaiting courier pickup.
              </p>
            </div>
            <Package className="w-5 h-5 text-[#C7A97B]" />
          </div>

          <div className="space-y-3">
            {readyForDispatch.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#1C1917]/50 font-mono">
                No orders waiting for courier assignment.
              </div>
            ) : (
              readyForDispatch.map((order) => (
                <div key={order.id} className="p-4 bg-[#F9F6F0] border border-[#E6DFD5] rounded space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-[#1C1917]">{order.id}</span>
                    <span className="font-mono font-semibold">{formatBdt(order.totalAmount)}</span>
                  </div>
                  <div>
                    <div className="font-medium">{order.customerName}</div>
                    <div className="text-[11px] text-[#1C1917]/60 truncate">{order.shippingAddress}</div>
                  </div>
                  <div className="pt-2 flex justify-end">
                    <button
                      type="button"
                      disabled={isBookingId === order.id}
                      onClick={() => handleBookConsignment(order)}
                      className={`px-4 py-2 text-xs font-mono font-bold uppercase rounded flex items-center space-x-1.5 transition-colors ${
                        isBookingId === order.id
                          ? 'bg-[#1C1917]/50 text-[#F9F6F0]/60 cursor-not-allowed'
                          : 'bg-[#1C1917] hover:bg-[#2A2623] text-[#F9F6F0]'
                      }`}
                    >
                      <Send className={`w-3.5 h-3.5 text-[#C7A97B] ${isBookingId === order.id ? 'animate-pulse' : ''}`} />
                      <span>{isBookingId === order.id ? 'Connecting Pathao...' : `Book with ${selectedCourier}`}</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Section 2: In-Transit Parcels */}
        <div className="bg-white border border-[#E6DFD5] rounded-lg p-5 sm:p-6 space-y-4 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-[#E6DFD5]">
            <div>
              <h2 className="font-serif text-lg font-medium text-[#1C1917]">
                In-Transit Shipments ({inTransitOrders.length})
              </h2>
              <p className="text-xs text-[#1C1917]/60">
                Parcels with active courier tracking codes.
              </p>
            </div>
            <Truck className="w-5 h-5 text-purple-600" />
          </div>

          <div className="space-y-3">
            {inTransitOrders.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#1C1917]/50 font-mono">
                No parcels currently in transit.
              </div>
            ) : (
              inTransitOrders.map((order) => (
                <div key={order.id} className="p-4 bg-[#F9F6F0] border border-[#E6DFD5] rounded space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-mono font-bold text-[#1C1917]">{order.id}</span>
                      <div className="text-[10px] text-[#C7A97B] font-mono">
                        Consignment: {order.consignmentId || (order as any).courierBookingId || (order as any).trackingCode || 'N/A'} ({order.courier || 'Pathao'})
                      </div>
                    </div>
                    <span className="px-2 py-0.5 bg-purple-100 text-purple-900 border border-purple-300 text-[10px] font-mono font-bold rounded">
                      IN TRANSIT
                    </span>
                  </div>

                  <div>
                    <div className="font-medium">{order.customerName} ({order.customerPhone})</div>
                    <div className="text-[11px] text-[#1C1917]/60">{order.shippingAddress}</div>
                  </div>

                  <div className="pt-2 flex items-center justify-between border-t border-[#E6DFD5]">
                    <a
                      href={order.courierTrackingUrl || `https://merchant.pathao.com/tracking?consignment_id=${order.consignmentId || (order as any).courierBookingId || (order as any).trackingCode || ''}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-[#C7A97B] font-mono hover:underline flex items-center space-x-1"
                    >
                      <span>Live Courier Tracking</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>

                    <button
                      type="button"
                      onClick={() => handleMarkDelivered(order)}
                      className="px-3 py-1 bg-emerald-800 hover:bg-emerald-700 text-white text-[11px] font-mono font-bold rounded"
                    >
                      Mark Delivered (COD Collected)
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
