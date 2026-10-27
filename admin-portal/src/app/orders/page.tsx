'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ShoppingBag,
  Search,
  Filter,
  PhoneCall,
  CheckCircle2,
  Clock,
  Printer,
  Truck,
  ArrowRight,
  X,
  FileText,
  User,
  MapPin,
  AlertCircle,
  Plus,
  RefreshCw,
  MessageCircle,
  Send,
  ExternalLink,
} from 'lucide-react';
import { useAdmin } from '@/context/admin-context';
import { AdminOrder, OrderStatus, CODVerificationStatus } from '@/types/admin';
import { formatBdt } from '@/lib/formatters';
import { ManualOrderModal } from '@/components/orders/manual-order-modal';

export default function AdminOrdersDeskPage() {
  const { orders, updateOrderStatus, updateCODVerification, assignCourier, refreshOrders, isSyncingOrders } = useAdmin();

  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<AdminOrder | null>(null);
  const [isManualOrderOpen, setIsManualOrderOpen] = useState(false);
  const [isBookingPathao, setIsBookingPathao] = useState(false);

  // COD Phone Verification Modal State
  const [verifyingOrder, setVerifyingOrder] = useState<AdminOrder | null>(null);
  const [callNotes, setCallNotes] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4500);
  };

  const handleBookWithPathao = async (order: AdminOrder) => {
    setIsBookingPathao(true);
    try {
      const res = await assignCourier(order.id, 'Pathao');
      if (res && !res.success) {
        showToast(`⚠️ ${res.message || 'Pathao booking failed'}`);
      } else {
        showToast(`✅ Pathao Consignment Created: #${res?.consignmentId || ''}`);
        setSelectedOrder((prev) =>
          prev
            ? {
                ...prev,
                courier: 'Pathao',
                consignmentId: res?.consignmentId,
                status: 'SHIPPED',
                courierTrackingUrl: `https://merchant.pathao.com/tracking?consignment_id=${res?.consignmentId}`,
              }
            : null
        );
      }
    } catch (err: any) {
      showToast(`⚠️ Error: ${err?.message || 'Booking failed'}`);
    } finally {
      setIsBookingPathao(false);
    }
  };

  const statusTabs: { label: string; value: string; count: number }[] = [
    { label: 'All Orders', value: 'ALL', count: orders.length },
    { label: 'Placed', value: 'PLACED', count: orders.filter((o) => o.status === 'PLACED').length },
    { label: 'Confirmed', value: 'CONFIRMED', count: orders.filter((o) => o.status === 'CONFIRMED').length },
    { label: 'Packed', value: 'PACKED', count: orders.filter((o) => o.status === 'PACKED').length },
    { label: 'Shipped', value: 'SHIPPED', count: orders.filter((o) => o.status === 'SHIPPED').length },
    { label: 'Delivered', value: 'DELIVERED', count: orders.filter((o) => o.status === 'DELIVERED').length },
  ];

  const filteredOrders = orders.filter((o) => {
    const matchesStatus = selectedStatus === 'ALL' || o.status === selectedStatus;
    const matchesSearch =
      o.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.customerPhone.includes(searchQuery) ||
      (o.consignmentId && o.consignmentId.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesStatus && matchesSearch;
  });

  const handleAdvanceStatus = (order: AdminOrder, nextStatus: OrderStatus) => {
    updateOrderStatus(order.id, nextStatus, `Advanced stage to ${nextStatus}`);
    if (selectedOrder?.id === order.id) {
      setSelectedOrder((prev) => (prev ? { ...prev, status: nextStatus } : null));
    }
    showToast(`Order ${order.id} transitioned to [${nextStatus}].`);
  };

  const handleConfirmVerification = (status: CODVerificationStatus) => {
    if (!verifyingOrder) return;
    updateCODVerification(verifyingOrder.id, status, callNotes || `COD call marked ${status}`);
    if (status === 'VERIFIED') {
      updateOrderStatus(verifyingOrder.id, 'CONFIRMED', 'Customer confirmed order by phone.');
    }
    setVerifyingOrder(null);
    setCallNotes('');
    showToast(`COD Phone verification updated for ${verifyingOrder.id}.`);
  };

  return (
    <div className="space-y-6 sm:space-y-8 select-none">
      {/* Toast Alert */}
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
            <ShoppingBag className="w-4 h-4 text-[#C7A97B]" />
            <span>Orders Governance Desk</span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl text-[#1C1917] tracking-wide font-light">
            Monotonic Fulfillment Pipeline
          </h1>
          <p className="text-xs text-[#1C1917]/60 font-light mt-0.5">
            Strict pipeline state machine: Placed → Confirmed → Packed → Shipped → Delivered.
          </p>
        </div>

        {/* Header Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Refresh Button */}
          <button
            type="button"
            onClick={() => {
              refreshOrders();
              showToast('Syncing orders with live engine...');
            }}
            disabled={isSyncingOrders}
            className="min-h-[44px] px-3 py-2 bg-white hover:bg-[#F9F6F0] border border-[#E6DFD5] text-[#1C1917] text-xs font-mono uppercase tracking-wider rounded flex items-center gap-1.5 transition-colors shadow-xs"
            title="Refresh orders from server"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#C7A97B] ${isSyncingOrders ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">{isSyncingOrders ? 'Syncing...' : 'Live Sync'}</span>
          </button>

          {/* Book Manual Order (F-Commerce) */}
          <button
            type="button"
            onClick={() => setIsManualOrderOpen(true)}
            className="min-h-[44px] px-4 py-2 bg-[#1C1917] hover:bg-[#2C2724] text-[#C7A97B] border border-[#C7A97B]/50 text-xs font-mono font-bold uppercase tracking-wider rounded flex items-center gap-2 transition-all shadow-md active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4 text-[#C7A97B]" />
            <span>+ Book F-Commerce Order</span>
          </button>

          {/* Quick Link to Warehouse */}
          <Link
            href="/warehouse"
            className="min-h-[44px] px-4 py-2 bg-white hover:bg-[#F9F6F0] border border-[#E6DFD5] text-[#1C1917] text-xs font-mono uppercase tracking-wider rounded flex items-center gap-2 transition-colors shadow-xs"
          >
            <Printer className="w-4 h-4 text-[#C7A97B]" />
            <span className="hidden md:inline">Warehouse 4x6</span>
          </Link>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-2 border-b border-[#E6DFD5] text-xs font-mono">
        {statusTabs.map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => setSelectedStatus(tab.value)}
            className={`min-h-[38px] px-3.5 py-1.5 rounded-full whitespace-nowrap transition-all flex items-center space-x-1.5 ${
              selectedStatus === tab.value
                ? 'bg-[#1C1917] text-[#F9F6F0] font-semibold shadow-xs'
                : 'bg-white border border-[#E6DFD5] text-[#1C1917]/70 hover:text-[#1C1917]'
            }`}
          >
            <span>{tab.label}</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                selectedStatus === tab.value ? 'bg-[#C7A97B] text-[#141211] font-bold' : 'bg-[#F9F6F0]'
              }`}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Search Input */}
      <div className="relative w-full sm:w-80">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#1C1917]/40" />
        <input
          type="text"
          placeholder="Search by order ID, customer, phone..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-3 py-2 bg-white border border-[#E6DFD5] text-xs font-mono text-[#1C1917] rounded focus:border-[#C7A97B] focus:outline-none"
        />
      </div>

      {/* ========================================================================= */}
      {/* 1. MOBILE CARD VIEW (<640px)                                              */}
      {/* ========================================================================= */}
      <div className="block lg:hidden space-y-3">
        {filteredOrders.map((o) => (
          <div key={o.id} className="p-4 bg-white border border-[#E6DFD5] rounded-lg space-y-3 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="font-mono font-bold text-[#1C1917] text-sm">{o.id}</span>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                  o.status === 'PLACED'
                    ? 'bg-amber-100 text-amber-900 border border-amber-300'
                    : o.status === 'CONFIRMED'
                    ? 'bg-blue-100 text-blue-900 border border-blue-300'
                    : o.status === 'SHIPPED'
                    ? 'bg-purple-100 text-purple-900 border border-purple-300'
                    : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                }`}
              >
                {o.status}
              </span>
            </div>

            <div>
              <div className="font-medium text-[#1C1917]">{o.customerName}</div>
              <div className="text-[11px] text-[#1C1917]/60 truncate">{o.shippingAddress}</div>
              {/* 1-Tap Mobile Call */}
              <a
                href={`tel:${o.customerPhone}`}
                className="mt-1 inline-flex items-center space-x-1 text-[#C7A97B] font-mono font-semibold text-xs py-1"
              >
                <PhoneCall className="w-3.5 h-3.5" />
                <span>Call {o.customerPhone}</span>
              </a>
            </div>

            <div className="flex items-center justify-between text-xs pt-2 border-t border-[#E6DFD5] font-mono">
              <span className="text-[#1C1917]/60">{o.paymentMethod} · {o.items.length} items</span>
              <span className="font-bold text-[#1C1917]">{formatBdt(o.totalAmount)}</span>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              {o.status === 'PLACED' && (
                <button
                  type="button"
                  onClick={() => setVerifyingOrder(o)}
                  className="min-h-[40px] px-3 py-1.5 bg-[#C7A97B] hover:bg-[#D4B98D] text-[#141211] text-[11px] font-mono font-bold rounded flex items-center justify-center space-x-1"
                >
                  <PhoneCall className="w-3.5 h-3.5" />
                  <span>Verify Call</span>
                </button>
              )}
              {o.status === 'CONFIRMED' && (
                <button
                  type="button"
                  onClick={() => handleAdvanceStatus(o, 'PACKED')}
                  className="min-h-[40px] px-3 py-1.5 bg-[#1C1917] text-[#F9F6F0] text-[11px] font-mono rounded flex items-center justify-center space-x-1"
                >
                  <Printer className="w-3.5 h-3.5 text-[#C7A97B]" />
                  <span>Pack & Label</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setSelectedOrder(o)}
                className="min-h-[40px] px-3 py-1.5 bg-[#F9F6F0] border border-[#E6DFD5] text-[#1C1917] text-[11px] font-mono rounded flex items-center justify-center"
              >
                Inspect
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* ========================================================================= */}
      {/* 2. DESKTOP / LAPTOP TABLE VIEW (>=1024px)                                 */}
      {/* ========================================================================= */}
      <div className="hidden lg:block overflow-x-auto border border-[#E6DFD5] rounded-lg bg-white shadow-xs">
        <table className="w-full text-left text-xs text-[#1C1917]">
          <thead className="bg-[#F9F6F0] text-[#1C1917]/70 uppercase font-mono text-[10px] tracking-wider border-b border-[#E6DFD5]">
            <tr>
              <th className="p-3.5">Order ID</th>
              <th className="p-3.5">Customer & Phone</th>
              <th className="p-3.5">Items Summary</th>
              <th className="p-3.5">Total (BDT)</th>
              <th className="p-3.5">Payment</th>
              <th className="p-3.5">Pipeline Stage</th>
              <th className="p-3.5">COD Status</th>
              <th className="p-3.5 text-right">Fulfillment Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E6DFD5]">
            {filteredOrders.map((o) => (
              <tr key={o.id} className="hover:bg-[#F9F6F0]/60 transition-colors">
                <td className="p-3.5 font-mono font-semibold text-[#1C1917]">
                  <button
                    type="button"
                    onClick={() => setSelectedOrder(o)}
                    className="hover:text-[#C7A97B] text-left"
                  >
                    {o.id}
                  </button>
                </td>
                <td className="p-3.5">
                  <div className="font-medium text-[#1C1917]">{o.customerName}</div>
                  <a href={`tel:${o.customerPhone}`} className="text-[10px] text-[#C7A97B] font-mono hover:underline">
                    {o.customerPhone}
                  </a>
                </td>
                <td className="p-3.5">
                  <div className="truncate max-w-xs">{o.items[0]?.title}</div>
                  <span className="text-[10px] text-[#1C1917]/50 font-mono">
                    {o.items.length > 1 ? `+${o.items.length - 1} more items` : o.items[0]?.variant}
                  </span>
                </td>
                <td className="p-3.5 font-mono font-semibold">
                  {formatBdt(o.totalAmount)}
                </td>
                <td className="p-3.5 font-mono">{o.paymentMethod}</td>
                <td className="p-3.5">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                      o.status === 'PLACED'
                        ? 'bg-amber-100 text-amber-900 border border-amber-300'
                        : o.status === 'CONFIRMED'
                        ? 'bg-blue-100 text-blue-900 border border-blue-300'
                        : o.status === 'SHIPPED'
                        ? 'bg-purple-100 text-purple-900 border border-purple-300'
                        : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                    }`}
                  >
                    {o.status}
                  </span>
                </td>
                <td className="p-3.5">
                  {o.codVerification === 'PENDING' ? (
                    <button
                      type="button"
                      onClick={() => setVerifyingOrder(o)}
                      className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-[10px] font-mono rounded flex items-center space-x-1"
                    >
                      <PhoneCall className="w-3 h-3 text-amber-600" />
                      <span>Verify Call</span>
                    </button>
                  ) : (
                    <span className="text-[10px] font-mono text-emerald-800 font-bold">
                      {o.codVerification}
                    </span>
                  )}
                </td>
                <td className="p-3.5 text-right space-x-1.5">
                  {o.status === 'PLACED' && (
                    <button
                      type="button"
                      onClick={() => handleAdvanceStatus(o, 'CONFIRMED')}
                      className="px-2.5 py-1 bg-[#1C1917] hover:bg-[#2A2623] text-[#F9F6F0] text-[10px] font-mono uppercase rounded transition-colors"
                    >
                      Confirm Order
                    </button>
                  )}
                  {o.status === 'CONFIRMED' && (
                    <button
                      type="button"
                      onClick={() => handleAdvanceStatus(o, 'PACKED')}
                      className="px-2.5 py-1 bg-[#1C1917] hover:bg-[#2A2623] text-[#F9F6F0] text-[10px] font-mono uppercase rounded transition-colors"
                    >
                      Pack & Box
                    </button>
                  )}
                  {o.status === 'PACKED' && (
                    <Link
                      href="/dispatch"
                      className="px-2.5 py-1 bg-[#C7A97B] hover:bg-[#D4B98D] text-[#141211] text-[10px] font-mono font-bold uppercase rounded transition-colors inline-block"
                    >
                      Dispatch
                    </Link>
                  )}
                  <button
                    type="button"
                    onClick={() => setSelectedOrder(o)}
                    className="px-2 py-1 bg-[#F9F6F0] hover:bg-[#E6DFD5] border border-[#E6DFD5] text-[#1C1917] text-[10px] font-mono rounded"
                  >
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ========================================================================= */}
      {/* 3. SLIDE-OVER INSPECTION DRAWER (LAPTOP & MOBILE ADAPTIVE)                */}
      {/* ========================================================================= */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
            onClick={() => setSelectedOrder(null)}
          />
          <div className="relative w-full max-w-lg bg-white border-l border-[#E6DFD5] shadow-2xl p-6 overflow-y-auto space-y-6 z-10 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#E6DFD5]">
                <div>
                  <span className="text-[10px] uppercase font-mono tracking-wider text-[#C7A97B]">
                    Order Inspection Desk
                  </span>
                  <h2 className="font-serif text-xl font-bold text-[#1C1917]">
                    {selectedOrder.id}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedOrder(null)}
                  className="p-1.5 text-[#1C1917]/50 hover:text-[#1C1917]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Customer Card */}
              <div className="p-4 bg-[#F9F6F0] border border-[#E6DFD5] rounded space-y-2 text-xs">
                <div className="flex items-center space-x-2 text-[10px] uppercase font-mono text-[#1C1917]/60 font-semibold">
                  <User className="w-3.5 h-3.5 text-[#C7A97B]" />
                  <span>Recipient & Delivery Address</span>
                </div>
                <div className="font-semibold text-[#1C1917]">{selectedOrder.customerName}</div>
                <a href={`tel:${selectedOrder.customerPhone}`} className="text-[#C7A97B] font-mono block">
                  {selectedOrder.customerPhone}
                </a>
                <div className="text-[11px] text-[#1C1917]/70 leading-relaxed">
                  {selectedOrder.shippingAddress} · {selectedOrder.district}
                </div>
              </div>

              {/* Courier Consignment Tracking Badge */}
              {selectedOrder.consignmentId && (
                <div className="p-3 bg-emerald-50/80 border border-emerald-200 rounded flex items-center justify-between text-xs font-mono">
                  <div>
                    <span className="text-[10px] text-emerald-800 uppercase block font-bold">
                      {selectedOrder.courier || 'Pathao'} Consignment
                    </span>
                    <span className="font-bold text-emerald-950">#{selectedOrder.consignmentId}</span>
                  </div>
                  <a
                    href={selectedOrder.courierTrackingUrl || `https://merchant.pathao.com/tracking?consignment_id=${selectedOrder.consignmentId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded text-[11px] font-semibold flex items-center gap-1 transition-colors"
                  >
                    <span>Track</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}

              {/* Items List */}
              <div className="space-y-2">
                <span className="text-[10px] uppercase font-mono text-[#1C1917]/60 font-semibold block">
                  Curation Items ({selectedOrder.items.length})
                </span>
                <div className="border border-[#E6DFD5] rounded divide-y divide-[#E6DFD5] text-xs">
                  {selectedOrder.items.map((it) => (
                    <div key={it.id} className="p-3 flex items-center justify-between">
                      <div>
                        <div className="font-medium text-[#1C1917]">{it.title}</div>
                        <div className="text-[10px] text-[#1C1917]/60 font-mono">
                          SKU: {it.sku} · Qty: {it.quantity}
                        </div>
                      </div>
                      <div className="font-mono font-semibold">{formatBdt(it.totalPrice)}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Financial Breakdown */}
              <div className="p-4 bg-[#F9F6F0] border border-[#E6DFD5] rounded text-xs font-mono space-y-1.5">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>{formatBdt(selectedOrder.subtotal)}</span>
                </div>
                {selectedOrder.discount > 0 && (
                  <div className="flex justify-between text-emerald-800 font-bold">
                    <span>Privilege Courtesy Discount:</span>
                    <span>-{formatBdt(selectedOrder.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Delivery Fee:</span>
                  <span>{formatBdt(selectedOrder.deliveryFee)}</span>
                </div>
                <div className="flex justify-between font-bold text-sm text-[#1C1917] pt-2 border-t border-[#E6DFD5]">
                  <span>Collectible Total:</span>
                  <span>{formatBdt(selectedOrder.totalAmount)}</span>
                </div>
              </div>
            </div>

            {/* Advance Status Controls */}
            <div className="pt-4 border-t border-[#E6DFD5] space-y-2">
              <span className="text-[10px] uppercase font-mono text-[#1C1917]/50 block">
                Advance Pipeline State
              </span>
              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                {selectedOrder.status === 'PLACED' && (
                  <button
                    type="button"
                    onClick={() => handleAdvanceStatus(selectedOrder, 'CONFIRMED')}
                    className="w-full py-2.5 bg-[#1C1917] text-[#F9F6F0] rounded font-semibold"
                  >
                    Confirm Order
                  </button>
                )}
                {selectedOrder.status === 'CONFIRMED' && (
                  <button
                    type="button"
                    onClick={() => handleAdvanceStatus(selectedOrder, 'PACKED')}
                    className="w-full py-2.5 bg-[#1C1917] text-[#F9F6F0] rounded font-semibold"
                  >
                    Pack in Warehouse
                  </button>
                )}
                {selectedOrder.status === 'PACKED' && (
                  <>
                    <button
                      type="button"
                      disabled={isBookingPathao}
                      onClick={() => handleBookWithPathao(selectedOrder)}
                      className="w-full py-2.5 bg-[#1C1917] hover:bg-[#2A2623] text-[#F9F6F0] rounded font-semibold flex items-center justify-center space-x-1.5 transition-colors disabled:opacity-50"
                    >
                      <Send className={`w-3.5 h-3.5 text-[#C7A97B] ${isBookingPathao ? 'animate-pulse' : ''}`} />
                      <span>{isBookingPathao ? 'Connecting Pathao...' : 'Book with Pathao'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAdvanceStatus(selectedOrder, 'SHIPPED')}
                      className="w-full py-2.5 bg-[#C7A97B]/20 hover:bg-[#C7A97B]/30 border border-[#C7A97B] text-[#141211] font-semibold rounded text-xs"
                    >
                      Manual Mark Shipped
                    </button>
                  </>
                )}
                {selectedOrder.status === 'SHIPPED' && (
                  <button
                    type="button"
                    onClick={() => handleAdvanceStatus(selectedOrder, 'DELIVERED')}
                    className="w-full py-2.5 bg-emerald-800 text-white font-bold rounded"
                  >
                    Mark Delivered
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. COD PHONE VERIFICATION MODAL                                           */}
      {/* ========================================================================= */}
      {verifyingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white border border-[#E6DFD5] max-w-md w-full p-6 rounded-lg space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-[#E6DFD5]">
              <div className="flex items-center space-x-2">
                <PhoneCall className="w-4 h-4 text-amber-500" />
                <h3 className="font-serif text-base font-bold text-[#1C1917]">
                  COD Customer Call Verification
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setVerifyingOrder(null)}
                className="p-1 text-[#1C1917]/50"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 bg-[#F9F6F0] border border-[#E6DFD5] rounded text-xs space-y-1">
              <div>Customer: <span className="font-semibold">{verifyingOrder.customerName}</span></div>
              <div>Phone: <a href={`tel:${verifyingOrder.customerPhone}`} className="text-[#C7A97B] font-mono font-bold hover:underline">{verifyingOrder.customerPhone} (Click to Call)</a></div>
              <div>Collectible: <span className="font-mono font-bold">{formatBdt(verifyingOrder.totalAmount)}</span></div>
              <div className="text-[11px] text-[#1C1917]/70">{verifyingOrder.shippingAddress}</div>
            </div>

            <div className="space-y-1 text-xs font-mono">
              <label className="text-[10px] uppercase text-[#1C1917]/60 block">Operator Call Log Notes</label>
              <textarea
                rows={3}
                value={callNotes}
                onChange={(e) => setCallNotes(e.target.value)}
                placeholder="e.g. Customer acknowledged order and confirmed evening delivery at Gulshan residence."
                className="w-full p-2 bg-[#F9F6F0] border border-[#E6DFD5] rounded focus:border-[#C7A97B] focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs font-mono pt-2">
              <button
                type="button"
                onClick={() => handleConfirmVerification('FAILED')}
                className="py-2.5 bg-rose-50 text-rose-800 border border-rose-200 rounded font-semibold"
              >
                Call Unreachable
              </button>
              <button
                type="button"
                onClick={() => handleConfirmVerification('VERIFIED')}
                className="py-2.5 bg-[#1C1917] text-[#F9F6F0] rounded font-bold uppercase tracking-wider"
              >
                Confirm Order
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manual Assisted Order Booking Desk (F-Commerce / WhatsApp / Phone) */}
      <ManualOrderModal
        isOpen={isManualOrderOpen}
        onClose={() => setIsManualOrderOpen(false)}
        onOrderCreated={(orderId, consignmentId) => {
          if (consignmentId) {
            showToast(`✅ Order ${orderId} created & dispatched with Pathao (Consignment: #${consignmentId})!`);
          } else {
            showToast(`✅ Order ${orderId} booked & confirmed!`);
          }
          refreshOrders();
        }}
      />
    </div>
  );
}
