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
  ArrowRight,
  Send,
  ShieldCheck,
  Wallet,
  Building2,
  ChevronRight,
  Edit2,
  Check,
  X,
  PlusCircle,
} from 'lucide-react';
import { useAdmin } from '@/context/admin-context';
import { AdminOrder } from '@/types/admin';
import { formatBdt } from '@/lib/formatters';

export default function AdminDispatchDeskPage() {
  const { orders, assignCourier, updateOrderStatus } = useAdmin();

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [selectedCourier, setSelectedCourier] = useState<'Pathao' | 'Steadfast'>('Pathao');
  const [isBookingId, setIsBookingId] = useState<string | null>(null);

  // Manual Consignment Attachment State (for orders booked externally)
  const [attachModalOrderId, setAttachModalOrderId] = useState<string | null>(null);
  const [manualCourier, setManualCourier] = useState<'Pathao' | 'Steadfast'>('Pathao');
  const [manualConsignmentId, setManualConsignmentId] = useState('');
  const [isSavingManual, setIsSavingManual] = useState(false);

  // In-Transit Consignment Edit State
  const [editingTransitOrderId, setEditingTransitOrderId] = useState<string | null>(null);
  const [editingConsignmentId, setEditingConsignmentId] = useState('');

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
    }
  };

  const handleSaveManualConsignment = async (order: AdminOrder) => {
    const trimmed = manualConsignmentId.trim();
    setIsSavingManual(true);
    try {
      const res = await assignCourier(order.id, manualCourier, trimmed || undefined);
      if (res && !res.success) {
        showToast(`⚠️ ${res.message || 'Failed to save'}`);
      } else {
        showToast(`✅ Saved! ${order.id} marked as SHIPPED with ${manualCourier} (#${res?.consignmentId || trimmed}).`);
        setAttachModalOrderId(null);
        setManualConsignmentId('');
      }
    } catch (err: any) {
      showToast(`⚠️ Error: ${err?.message || 'Failed to save'}`);
    } finally {
      setIsSavingManual(false);
    }
  };

  const handleUpdateInTransitConsignment = (order: AdminOrder) => {
    const trimmed = editingConsignmentId.trim();
    if (!trimmed) {
      setEditingTransitOrderId(null);
      return;
    }
    const currentCourier = (order.courier?.toLowerCase().includes('steadfast') ? 'Steadfast' : 'Pathao') as 'Pathao' | 'Steadfast';
    updateOrderStatus(order.id, 'SHIPPED', `Updated Consignment ID to ${trimmed}`, trimmed, currentCourier);
    showToast(`✓ Updated Consignment ID to #${trimmed} for ${order.id}.`);
    setEditingTransitOrderId(null);
    setEditingConsignmentId('');
  };

  const handleMarkDelivered = (order: AdminOrder) => {
    updateOrderStatus(order.id, 'DELIVERED', 'Delivered by courier. COD collected.');
    showToast(`Order ${order.id} marked as DELIVERED. Customer lifetime spend updated.`);
  };

  return (
    <div className="space-y-6 sm:space-y-8 select-none">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 p-4 rounded bg-[#1C1917] text-[#C7A97B] font-mono text-xs font-bold shadow-2xl flex items-center gap-2 border border-[#C7A97B]/40 animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-[#C7A97B]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E6DFD5]">
        <div>
          <div className="flex items-center space-x-2 text-[10px] uppercase font-mono tracking-[0.25em] text-[#C7A97B] font-semibold mb-1">
            <Truck className="w-4 h-4 text-[#C7A97B]" />
            <span>Smart Dispatch & Logistics Desk</span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl text-[#1C1917] tracking-wide font-light">
            Smart Dispatch & Courier Booking
          </h1>
          <p className="text-xs text-[#1C1917]/60 font-light mt-0.5">
            1-Click consignment creation for Pathao Hermes and Steadfast Courier. Choose carrier per parcel or attach existing tracking IDs.
          </p>
        </div>

        {/* Courier Direct Hubs */}
        <div className="flex items-center gap-2">
          <Link
            href="/dispatch/pathao"
            className="px-3 py-1.5 bg-[#FAF8F5] hover:bg-rose-50 border border-rose-200 text-rose-900 rounded text-xs font-mono font-semibold flex items-center gap-1.5 transition-colors"
          >
            <span className="w-2 h-2 rounded-full bg-rose-600" />
            <span>Pathao Operations</span>
            <ChevronRight className="w-3 h-3" />
          </Link>
          <Link
            href="/dispatch/steadfast"
            className="px-3 py-1.5 bg-[#FAF8F5] hover:bg-emerald-50 border border-emerald-200 text-emerald-900 rounded text-xs font-mono font-semibold flex items-center gap-1.5 transition-colors"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-600" />
            <span>Steadfast Operations</span>
            <ChevronRight className="w-3 h-3" />
          </Link>
        </div>
      </div>

      {/* Primary Carrier Selection Banner */}
      <div className="p-4 bg-white border border-[#E6DFD5] rounded-lg shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded bg-[#F9F6F0] border border-[#E6DFD5] flex items-center justify-center text-[#C7A97B]">
            <Truck className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-[#1C1917]">
              Selected Carrier for Booking:
            </div>
            <div className="text-[11px] text-[#1C1917]/60">
              Switching courier here updates the active booking target button below.
            </div>
          </div>
        </div>

        <div className="inline-flex rounded-md border border-[#E6DFD5] bg-[#F9F6F0] p-1 font-mono text-xs">
          <button
            type="button"
            onClick={() => setSelectedCourier('Pathao')}
            className={`px-4 py-1.5 rounded font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
              selectedCourier === 'Pathao'
                ? 'bg-rose-900 text-white shadow-xs'
                : 'text-[#1C1917]/70 hover:text-[#1C1917]'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-rose-400" />
            <span>Pathao Express</span>
          </button>
          <button
            type="button"
            onClick={() => setSelectedCourier('Steadfast')}
            className={`px-4 py-1.5 rounded font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
              selectedCourier === 'Steadfast'
                ? 'bg-emerald-900 text-white shadow-xs'
                : 'text-[#1C1917]/70 hover:text-[#1C1917]'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>Steadfast Courier</span>
          </button>
        </div>
      </div>

      {/* Dispatch Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Section 1: Awaiting Courier Booking */}
        <div className="bg-white border border-[#E6DFD5] rounded-lg p-5 sm:p-6 space-y-4 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-[#E6DFD5]">
            <div>
              <h2 className="font-serif text-lg font-medium text-[#1C1917]">
                Packed & Ready for Dispatch ({readyForDispatch.length})
              </h2>
              <p className="text-xs text-[#1C1917]/60">
                Boxed orders with printed 4x6 labels awaiting courier booking.
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
              readyForDispatch.map((order) => {
                const isAttaching = attachModalOrderId === order.id;

                return (
                  <div key={order.id} className="p-4 bg-[#F9F6F0] border border-[#E6DFD5] rounded space-y-2.5 text-xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-[#1C1917]">{order.id}</span>
                        {(order.isReplacement || order.id.endsWith('-REP')) && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
                            REPLACEMENT
                          </span>
                        )}
                      </div>
                      <span className="font-mono font-bold text-[#1C1917]">
                        {Number(order.totalAmount || 0) <= 0 ? 'PREPAID (৳0)' : `COD: ${formatBdt(order.totalAmount)}`}
                      </span>
                    </div>

                    <div>
                      <div className="font-medium text-[#1C1917]">{order.customerName} ({order.customerPhone})</div>
                      <div className="text-[11px] text-[#1C1917]/60 truncate">{order.shippingAddress}</div>
                    </div>

                    {/* Inline Manual Consignment ID Attachment Panel */}
                    {isAttaching ? (
                      <div className="p-3 bg-white border border-[#C7A97B] rounded space-y-2 mt-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-[#1C1917] uppercase tracking-wider">
                            Attach External Consignment ID:
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setAttachModalOrderId(null);
                              setManualConsignmentId('');
                            }}
                            className="p-1 text-stone-400 hover:text-stone-700 cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => setManualCourier('Pathao')}
                            className={`py-1 px-2 text-[10px] font-mono font-bold rounded cursor-pointer ${
                              manualCourier === 'Pathao'
                                ? 'bg-rose-900 text-white'
                                : 'bg-stone-100 text-stone-700'
                            }`}
                          >
                            Pathao
                          </button>
                          <button
                            type="button"
                            onClick={() => setManualCourier('Steadfast')}
                            className={`py-1 px-2 text-[10px] font-mono font-bold rounded cursor-pointer ${
                              manualCourier === 'Steadfast'
                                ? 'bg-emerald-900 text-white'
                                : 'bg-stone-100 text-stone-700'
                            }`}
                          >
                            Steadfast
                          </button>
                        </div>

                        <input
                          type="text"
                          value={manualConsignmentId}
                          onChange={(e) => setManualConsignmentId(e.target.value)}
                          placeholder="Paste Pathao/Steadfast Consignment ID (e.g. 68XXXXXX)"
                          className="w-full px-2.5 py-1.5 border border-[#E6DFD5] rounded text-xs font-mono focus:outline-none focus:border-[#C7A97B]"
                          autoFocus
                        />

                        <div className="flex justify-end gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => setAttachModalOrderId(null)}
                            className="px-3 py-1 bg-stone-100 hover:bg-stone-200 text-stone-700 text-[11px] font-mono rounded cursor-pointer"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            disabled={isSavingManual}
                            onClick={() => handleSaveManualConsignment(order)}
                            className="px-3.5 py-1 bg-[#1C1917] hover:bg-[#2A2623] text-[#C7A97B] text-[11px] font-mono font-bold rounded cursor-pointer disabled:opacity-50 flex items-center gap-1"
                          >
                            <Check className="w-3 h-3" />
                            <span>{isSavingManual ? 'Saving...' : 'Save as Shipped'}</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-t border-[#E6DFD5]/60">
                        <span className="text-[10px] font-mono text-[#1C1917]/60">
                          Destination: {order.district || 'Dhaka'}
                        </span>

                        <div className="flex items-center gap-1.5">
                          {/* Already Dispatched / Attach Tracking Button */}
                          <button
                            type="button"
                            onClick={() => {
                              setAttachModalOrderId(order.id);
                              setManualCourier(selectedCourier);
                              setManualConsignmentId('');
                            }}
                            className="px-2.5 py-2 text-[11px] font-mono font-semibold bg-white hover:bg-stone-100 border border-[#E6DFD5] text-[#1C1917] rounded flex items-center space-x-1 cursor-pointer transition-colors"
                          >
                            <Edit2 className="w-3 h-3 text-[#C7A97B]" />
                            <span>Attach Tracking ID</span>
                          </button>

                          {/* 1-Click Automated API Booking Button */}
                          <button
                            type="button"
                            disabled={isBookingId === order.id}
                            onClick={() => handleBookConsignment(order)}
                            className={`px-3.5 py-2 text-xs font-mono font-bold uppercase rounded flex items-center space-x-1.5 transition-colors cursor-pointer ${
                              isBookingId === order.id
                                ? 'bg-[#1C1917]/50 text-[#F9F6F0]/60 cursor-not-allowed'
                                : selectedCourier === 'Pathao'
                                ? 'bg-rose-900 hover:bg-rose-800 text-white'
                                : 'bg-emerald-900 hover:bg-emerald-800 text-white'
                            }`}
                          >
                            <Send className={`w-3.5 h-3.5 text-[#C7A97B] ${isBookingId === order.id ? 'animate-pulse' : ''}`} />
                            <span>
                              {isBookingId === order.id
                                ? `Connecting ${selectedCourier}...`
                                : `Book with ${selectedCourier}`}
                            </span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
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
                Parcels with active courier tracking codes out for delivery.
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
              inTransitOrders.map((order) => {
                const isPathao = (order.courier || '').toLowerCase().includes('pathao');
                const trackingId = order.consignmentId || (order as any).courierBookingId || (order as any).trackingCode || '';
                const trackingLink = isPathao
                  ? `https://merchant.pathao.com/tracking?consignment_id=${trackingId}`
                  : `https://steadfast.com.bd/tracking/${trackingId}`;
                const isEditingThis = editingTransitOrderId === order.id;

                return (
                  <div key={order.id} className="p-4 bg-[#F9F6F0] border border-[#E6DFD5] rounded space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-mono font-bold text-[#1C1917]">{order.id}</span>
                        
                        {/* Consignment ID display & Quick Edit */}
                        {isEditingThis ? (
                          <div className="flex items-center gap-1.5 mt-1">
                            <input
                              type="text"
                              value={editingConsignmentId}
                              onChange={(e) => setEditingConsignmentId(e.target.value)}
                              placeholder="New Consignment ID"
                              className="px-2 py-0.5 border border-[#C7A97B] rounded text-[11px] font-mono bg-white"
                              autoFocus
                            />
                            <button
                              type="button"
                              onClick={() => handleUpdateInTransitConsignment(order)}
                              className="px-2 py-0.5 bg-emerald-700 text-white text-[10px] font-mono font-bold rounded cursor-pointer"
                            >
                              Save
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingTransitOrderId(null)}
                              className="px-1.5 py-0.5 text-stone-500 hover:text-stone-800 text-[10px] font-mono cursor-pointer"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <div className="text-[10px] text-[#C7A97B] font-mono flex items-center gap-1">
                            <span>Consignment: #{trackingId || 'N/A'} ({order.courier || 'Pathao'})</span>
                            <button
                              type="button"
                              onClick={() => {
                                setEditingTransitOrderId(order.id);
                                setEditingConsignmentId(trackingId);
                              }}
                              className="text-stone-400 hover:text-[#1C1917] p-0.5 cursor-pointer"
                              title="Update Consignment ID"
                            >
                              <Edit2 className="w-2.5 h-2.5" />
                            </button>
                          </div>
                        )}
                      </div>

                      <span className="px-2 py-0.5 bg-purple-100 text-purple-900 border border-purple-300 text-[10px] font-mono font-bold rounded">
                        IN TRANSIT
                      </span>
                    </div>

                    <div>
                      <div className="font-medium text-[#1C1917]">{order.customerName} ({order.customerPhone})</div>
                      <div className="text-[11px] text-[#1C1917]/60">{order.shippingAddress}</div>
                    </div>

                    <div className="pt-2 flex items-center justify-between border-t border-[#E6DFD5]">
                      <a
                        href={order.courierTrackingUrl || trackingLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] text-[#C7A97B] font-mono hover:underline flex items-center space-x-1"
                      >
                        <span>Live Tracking</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>

                      <button
                        type="button"
                        onClick={() => handleMarkDelivered(order)}
                        className="px-3 py-1 bg-emerald-800 hover:bg-emerald-700 text-white text-[11px] font-mono font-bold rounded cursor-pointer"
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
    </div>
  );
}
