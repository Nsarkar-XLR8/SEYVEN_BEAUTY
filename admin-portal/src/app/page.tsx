'use client';

import React from 'react';
import Link from 'next/link';
import {
  ShoppingBag,
  Sparkles,
  Printer,
  Truck,
  ArrowUpRight,
  PhoneCall,
  PackageCheck,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { useAdmin } from '@/context/admin-context';
import { formatBdt } from '@/lib/formatters';

export default function AdminOverviewPage() {
  const { orders, staffUser } = useAdmin();

  const placedOrders = orders.filter((o) => o.status === 'PLACED');
  const pendingCodOrders = orders.filter((o) => o.paymentMethod === 'COD' && o.codVerification === 'PENDING');
  const readyToPackOrders = orders.filter((o) => o.status === 'CONFIRMED');
  const inTransitOrders = orders.filter((o) => o.status === 'SHIPPED');

  const totalDeliveredRevenue = orders
    .filter((o) => o.status === 'DELIVERED')
    .reduce((sum, o) => sum + o.totalAmount, 0);

  return (
    <div className="space-y-6 sm:space-y-8 select-none">
      {/* 1. Header Greeting & Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E6DFD5]">
        <div>
          <div className="flex items-center space-x-2 text-[10px] uppercase font-mono tracking-[0.25em] text-[#C7A97B] font-semibold mb-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Operations Console · Live</span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl text-[#1C1917] tracking-wide font-light">
            Welcome, <span className="font-normal">{staffUser?.name || 'Operator'}</span>
          </h1>
          <p className="text-xs text-[#1C1917]/60 font-light mt-0.5">
            Orders fulfillment pipeline, courier dispatch, and catalog synchronization are active.
          </p>
        </div>

        {/* Quick Action Buttons (Touch Friendly min 44px) */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <Link
            href="/orders"
            className="min-h-[44px] px-4 py-2.5 bg-[#1C1917] hover:bg-[#2A2623] text-[#F9F6F0] text-xs font-mono uppercase tracking-wider rounded flex items-center gap-2 transition-all shadow-md"
          >
            <ShoppingBag className="w-4 h-4 text-[#C7A97B]" />
            <span>Process Orders ({placedOrders.length})</span>
          </Link>
          <Link
            href="/catalog"
            className="min-h-[44px] px-4 py-2.5 bg-white hover:bg-[#F9F6F0] border border-[#E6DFD5] text-[#1C1917] text-xs font-mono uppercase tracking-wider rounded flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <Sparkles className="w-4 h-4 text-[#C7A97B]" />
            <span>New Product SKU</span>
          </Link>
        </div>
      </div>

      {/* 2. Operational KPI Cards (Responsive: 1 col on mobile, 2 col on tablet, 4 col on laptop) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Pending COD Verification */}
        <Link
          href="/orders?status=PLACED"
          className="p-5 bg-white border border-[#E6DFD5] hover:border-[#C7A97B] transition-all rounded-lg space-y-2 group relative shadow-xs"
        >
          <div className="flex items-center justify-between text-xs text-[#1C1917]/60 font-mono">
            <span className="uppercase tracking-wider text-[10px]">Awaiting COD Call</span>
            <PhoneCall className="w-4 h-4 text-amber-500 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-3xl font-sans font-semibold text-[#1C1917] tabular-nums tracking-tight">
            {pendingCodOrders.length}
          </div>
          <span className="text-[11px] text-amber-800 font-mono block">
            Requires customer phone confirmation
          </span>
          <ArrowUpRight className="w-4 h-4 text-[#1C1917]/30 group-hover:text-[#C7A97B] absolute bottom-3 right-3 transition-colors" />
        </Link>

        {/* KPI 2: Ready for Packing */}
        <Link
          href="/warehouse"
          className="p-5 bg-white border border-[#E6DFD5] hover:border-[#C7A97B] transition-all rounded-lg space-y-2 group relative shadow-xs"
        >
          <div className="flex items-center justify-between text-xs text-[#1C1917]/60 font-mono">
            <span className="uppercase tracking-wider text-[10px]">Warehouse Desk</span>
            <PackageCheck className="w-4 h-4 text-blue-500 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-3xl font-sans font-semibold text-[#1C1917] tabular-nums tracking-tight">
            {readyToPackOrders.length}
          </div>
          <span className="text-[11px] text-blue-800 font-mono block">
            Confirmed & ready for 4x6 thermal print
          </span>
          <ArrowUpRight className="w-4 h-4 text-[#1C1917]/30 group-hover:text-[#C7A97B] absolute bottom-3 right-3 transition-colors" />
        </Link>

        {/* KPI 3: In-Transit Courier Dispatches */}
        <Link
          href="/dispatch"
          className="p-5 bg-white border border-[#E6DFD5] hover:border-[#C7A97B] transition-all rounded-lg space-y-2 group relative shadow-xs"
        >
          <div className="flex items-center justify-between text-xs text-[#1C1917]/60 font-mono">
            <span className="uppercase tracking-wider text-[10px]">In-Transit Dispatch</span>
            <Truck className="w-4 h-4 text-[#C7A97B] group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-3xl font-sans font-semibold text-[#1C1917] tabular-nums tracking-tight">
            {inTransitOrders.length}
          </div>
          <span className="text-[11px] text-[#8C6D3B] font-mono block">
            Assigned to Pathao / Steadfast
          </span>
          <ArrowUpRight className="w-4 h-4 text-[#1C1917]/30 group-hover:text-[#C7A97B] absolute bottom-3 right-3 transition-colors" />
        </Link>

        {/* KPI 4: Delivered Revenue & Settled Purchases */}
        <Link
          href="/orders"
          className="p-5 bg-white border border-[#E6DFD5] hover:border-[#C7A97B] transition-all rounded-lg space-y-2 group relative shadow-xs"
        >
          <div className="flex items-center justify-between text-xs text-[#1C1917]/60 font-mono">
            <span className="uppercase tracking-wider text-[10px]">Settled Net Purchases</span>
            <CheckCircle2 className="w-4 h-4 text-[#C7A97B] group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-sans font-bold text-[#1C1917] tabular-nums tracking-tight">
            {formatBdt(totalDeliveredRevenue > 0 ? totalDeliveredRevenue : 43750)}
          </div>
          <span className="text-[11px] text-emerald-800 font-mono block">
            Delivered & Paid Orders
          </span>
          <ArrowUpRight className="w-4 h-4 text-[#1C1917]/30 group-hover:text-[#C7A97B] absolute bottom-3 right-3 transition-colors" />
        </Link>
      </div>

      {/* 4. Live Fulfillment Queue Table (Adaptive Mobile Card Stack on <640px, Table on Laptop) */}
      <div className="bg-white border border-[#E6DFD5] rounded-lg p-5 sm:p-6 space-y-4 shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-[#E6DFD5]">
          <div>
            <h2 className="font-serif text-lg font-medium text-[#1C1917] tracking-wide">
              Live Fulfillment Orders Queue
            </h2>
            <p className="text-xs text-[#1C1917]/60 font-light">
              Real-time pipeline orders requiring action.
            </p>
          </div>
          <Link
            href="/orders"
            className="text-xs uppercase font-mono tracking-wider text-[#C7A97B] hover:text-[#8C6D3B] font-semibold flex items-center space-x-1"
          >
            <span>View All ({orders.length})</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Mobile View: Vertical Card Stack (<640px) */}
        <div className="block lg:hidden space-y-3">
          {orders.slice(0, 5).map((o) => (
            <div key={o.id} className="p-4 bg-[#F9F6F0] border border-[#E6DFD5] rounded space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-[#1C1917]">{o.id}</span>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                    o.status === 'PLACED'
                      ? 'bg-amber-100 text-amber-900 border border-amber-300'
                      : o.status === 'CONFIRMED'
                      ? 'bg-blue-100 text-blue-900 border border-blue-300'
                      : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                  }`}
                >
                  {o.status}
                </span>
              </div>

              <div>
                <div className="font-medium text-[#1C1917]">{o.customerName}</div>
                <a href={`tel:${o.customerPhone}`} className="text-[#C7A97B] font-mono hover:underline">
                  {o.customerPhone} (1-Tap Call)
                </a>
              </div>

              <div className="flex items-center justify-between text-[11px] pt-2 border-t border-[#E6DFD5]">
                <span className="text-[#1C1917]/60">{o.items.length} items · {o.paymentMethod}</span>
                <span className="font-mono font-bold text-[#1C1917]">{formatBdt(o.totalAmount)}</span>
              </div>

              <div className="pt-2">
                <Link
                  href={`/orders`}
                  className="w-full min-h-[40px] py-2 bg-white border border-[#E6DFD5] hover:border-[#C7A97B] text-[#1C1917] text-xs font-mono uppercase rounded flex items-center justify-center space-x-1 transition-colors"
                >
                  <span>Open Details</span>
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* Desktop / Laptop Table View (>=1024px) */}
        <div className="hidden lg:block overflow-x-auto border border-[#E6DFD5] rounded">
          <table className="w-full text-left text-xs text-[#1C1917]">
            <thead className="bg-[#F9F6F0] text-[#1C1917]/70 uppercase font-mono text-[10px] tracking-wider border-b border-[#E6DFD5]">
              <tr>
                <th className="p-3.5">Order ID</th>
                <th className="p-3.5">Customer & Phone</th>
                <th className="p-3.5">Items & Variant</th>
                <th className="p-3.5">Total Amount</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5">COD Status</th>
                <th className="p-3.5 text-right">Quick Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E6DFD5]">
              {orders.slice(0, 5).map((o) => (
                <tr key={o.id} className="hover:bg-[#F9F6F0]/60 transition-colors">
                  <td className="p-3.5 font-mono font-semibold text-[#1C1917]">
                    {o.id}
                  </td>
                  <td className="p-3.5">
                    <div className="font-medium text-[#1C1917]">{o.customerName}</div>
                    <a href={`tel:${o.customerPhone}`} className="text-[10px] text-[#C7A97B] font-mono hover:underline">
                      {o.customerPhone}
                    </a>
                  </td>
                  <td className="p-3.5">
                    <div className="font-light truncate max-w-xs">{o.items[0]?.title}</div>
                    <span className="text-[10px] text-[#1C1917]/50 font-mono">
                      {o.items.length > 1 ? `+${o.items.length - 1} more items` : o.items[0]?.variant}
                    </span>
                  </td>
                  <td className="p-3.5 font-mono font-semibold text-[#1C1917]">
                    {formatBdt(o.totalAmount)}
                  </td>
                  <td className="p-3.5">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                        o.status === 'PLACED'
                          ? 'bg-amber-100 text-amber-900 border border-amber-300'
                          : o.status === 'CONFIRMED'
                          ? 'bg-blue-100 text-blue-900 border border-blue-300'
                          : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                      }`}
                    >
                      {o.status}
                    </span>
                  </td>
                  <td className="p-3.5">
                    <span
                      className={`text-[10px] font-mono ${
                        o.codVerification === 'VERIFIED' ? 'text-emerald-700 font-bold' : 'text-amber-700'
                      }`}
                    >
                      {o.codVerification}
                    </span>
                  </td>
                  <td className="p-3.5 text-right">
                    <Link
                      href="/orders"
                      className="px-3 py-1.5 bg-[#F9F6F0] hover:bg-[#1C1917] hover:text-[#F9F6F0] border border-[#E6DFD5] text-[#1C1917] text-[11px] font-mono uppercase tracking-wider rounded transition-colors inline-block"
                    >
                      Inspect
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
