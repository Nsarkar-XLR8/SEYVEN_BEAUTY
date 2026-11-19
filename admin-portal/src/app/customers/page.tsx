'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Users,
  Search,
  Phone,
  MessageCircle,
  ShieldCheck,
  Crown,
  Repeat,
  Sparkles,
  AlertTriangle,
  ArrowUpRight,
  ChevronDown,
  ChevronUp,
  Package,
  Calendar,
  MapPin,
  CreditCard,
  Truck,
  ExternalLink,
} from 'lucide-react';
import { useAdmin } from '@/context/admin-context';
import { AdminOrder } from '@/types/admin';
import { formatBdt } from '@/lib/formatters';

export type CustomerTier = 'VIP' | 'REPEAT' | 'FIRST_TIME' | 'RISK';

export interface CustomerProfile {
  phone: string;
  name: string;
  email?: string;
  address: string;
  district?: string;
  totalOrders: number;
  deliveredOrders: number;
  cancelledOrders: number;
  inTransitOrders: number;
  totalSpent: number;
  aov: number;
  firstOrderDate: string;
  lastOrderDate: string;
  tier: CustomerTier;
  orders: AdminOrder[];
}

export default function CustomerIntelligencePage() {
  const { orders } = useAdmin();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTier, setSelectedTier] = useState<'ALL' | CustomerTier>('ALL');
  const [expandedCustomerId, setExpandedCustomerId] = useState<string | null>(null);

  // Group and aggregate all orders by normalized phone number
  const customerProfiles = useMemo<CustomerProfile[]>(() => {
    const map = new Map<string, { orders: AdminOrder[]; name: string; email?: string; address: string; district?: string }>();

    orders.forEach((order) => {
      const rawPhone = order.customerPhone || '';
      const cleanPhone = rawPhone.replace(/\D/g, '');
      if (!cleanPhone) return;

      const existing = map.get(cleanPhone);
      if (existing) {
        existing.orders.push(order);
        if (order.customerName && order.customerName !== 'Valued Customer') {
          existing.name = order.customerName;
        }
        if (order.customerEmail) {
          existing.email = order.customerEmail;
        }
        if (order.shippingAddress) {
          existing.address = order.shippingAddress;
        }
        if (order.district) {
          existing.district = order.district;
        }
      } else {
        map.set(cleanPhone, {
          orders: [order],
          name: order.customerName || 'Customer',
          email: order.customerEmail || undefined,
          address: order.shippingAddress || '',
          district: order.district || undefined,
        });
      }
    });

    const profiles: CustomerProfile[] = [];

    map.forEach((data, phone) => {
      // Sort orders descending by createdAt
      const sortedOrders = [...data.orders].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      const totalOrders = sortedOrders.length;
      const deliveredOrders = sortedOrders.filter((o) => o.status === 'DELIVERED').length;
      const cancelledOrders = sortedOrders.filter(
        (o) => o.status === 'CANCELLED' || (o.status as any) === 'RETURNED'
      ).length;
      const inTransitOrders = sortedOrders.filter((o) => o.status === 'SHIPPED').length;

      // Calculate total spend on delivered & confirmed orders
      const totalSpent = sortedOrders
        .filter((o) => o.status === 'DELIVERED' || o.status === 'SHIPPED' || o.status === 'CONFIRMED')
        .reduce((sum, o) => sum + (o.totalAmount || 0), 0);

      const aov = totalOrders > 0 ? Math.round(totalSpent / totalOrders) : 0;

      const firstOrderDate = sortedOrders[sortedOrders.length - 1].createdAt;
      const lastOrderDate = sortedOrders[0].createdAt;

      // Smart Customer Tiering
      let tier: CustomerTier = 'FIRST_TIME';
      if (cancelledOrders >= 2 || (cancelledOrders > 0 && cancelledOrders >= deliveredOrders)) {
        tier = 'RISK';
      } else if (deliveredOrders >= 3 || totalOrders >= 3 || totalSpent >= 8000) {
        tier = 'VIP';
      } else if (totalOrders >= 2) {
        tier = 'REPEAT';
      }

      profiles.push({
        phone,
        name: data.name,
        email: data.email,
        address: data.address,
        district: data.district,
        totalOrders,
        deliveredOrders,
        cancelledOrders,
        inTransitOrders,
        totalSpent,
        aov,
        firstOrderDate,
        lastOrderDate,
        tier,
        orders: sortedOrders,
      });
    });

    // Sort by repeat count (highest orders first, then latest order date)
    return profiles.sort((a, b) => {
      if (b.totalOrders !== a.totalOrders) {
        return b.totalOrders - a.totalOrders;
      }
      return new Date(b.lastOrderDate).getTime() - new Date(a.lastOrderDate).getTime();
    });
  }, [orders]);

  // Overall KPIs
  const totalCustomers = customerProfiles.length;
  const repeatBuyers = customerProfiles.filter((c) => c.totalOrders >= 2).length;
  const vipBuyers = customerProfiles.filter((c) => c.tier === 'VIP').length;
  const repeatRate = totalCustomers > 0 ? ((repeatBuyers / totalCustomers) * 100).toFixed(1) : '0';
  const totalLtvSum = customerProfiles.reduce((acc, c) => acc + c.totalSpent, 0);
  const avgLtv = totalCustomers > 0 ? Math.round(totalLtvSum / totalCustomers) : 0;

  // Filtered List based on Search and Selected Tier
  const filteredProfiles = useMemo(() => {
    return customerProfiles.filter((c) => {
      const q = searchTerm.trim().toLowerCase();
      const matchesSearch =
        !q ||
        c.phone.toLowerCase().includes(q) ||
        c.name.toLowerCase().includes(q) ||
        (c.email && c.email.toLowerCase().includes(q)) ||
        (c.district && c.district.toLowerCase().includes(q)) ||
        c.address.toLowerCase().includes(q);

      const matchesTier = selectedTier === 'ALL' || c.tier === selectedTier;

      return matchesSearch && matchesTier;
    });
  }, [customerProfiles, searchTerm, selectedTier]);

  const toggleExpand = (phone: string) => {
    setExpandedCustomerId((prev) => (prev === phone ? null : phone));
  };

  return (
    <div className="space-y-6 sm:space-y-8 select-none">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E6DFD5]">
        <div>
          <div className="flex items-center space-x-2 text-[10px] uppercase font-mono tracking-[0.25em] text-[#C7A97B] font-semibold mb-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Customer Intelligence · CRM Desk</span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl text-[#1C1917] tracking-wide font-light flex items-center gap-2.5">
            <span>Customer Profiles &amp; Repeat Buyers</span>
          </h1>
          <p className="text-xs text-[#1C1917]/60 font-light mt-0.5">
            Identify repeat buyers, VIP spenders, and cross-reference purchase history by phone, name, or email.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/orders"
            className="px-3.5 py-2 rounded border border-[#E6DFD5] bg-white text-[#1C1917] text-xs font-mono font-medium flex items-center gap-1.5 hover:bg-[#F9F6F0] transition-colors"
          >
            <Package className="w-3.5 h-3.5 text-[#C7A97B]" />
            <span>Orders Desk</span>
          </Link>
          <Link
            href="/dispatch/steadfast"
            className="px-3.5 py-2 rounded bg-[#1C1917] hover:bg-[#2A2623] text-[#F9F6F0] text-xs font-mono font-bold flex items-center gap-1.5 transition-colors"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Courier Risk Check</span>
          </Link>
        </div>
      </div>

      {/* 2. Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Total Unique Buyers */}
        <div className="p-5 bg-white border border-[#E6DFD5] rounded-lg space-y-2 shadow-xs">
          <div className="flex items-center justify-between text-xs text-[#1C1917]/60 font-mono">
            <span className="uppercase tracking-wider text-[10px]">Unique Customers</span>
            <Users className="w-4 h-4 text-[#C7A97B]" />
          </div>
          <div className="text-3xl font-sans font-semibold text-[#1C1917] tabular-nums tracking-tight">
            {totalCustomers}
          </div>
          <span className="text-[11px] text-[#1C1917]/60 font-mono block">
            Distinct buyers in database
          </span>
        </div>

        {/* KPI 2: Repeat Buyer Rate */}
        <div className="p-5 bg-white border border-[#E6DFD5] rounded-lg space-y-2 shadow-xs">
          <div className="flex items-center justify-between text-xs text-[#1C1917]/60 font-mono">
            <span className="uppercase tracking-wider text-[10px]">Repeat Buyer Rate</span>
            <Repeat className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-3xl font-sans font-semibold text-emerald-700 tabular-nums tracking-tight">
            {repeatRate}%
          </div>
          <span className="text-[11px] text-emerald-800 font-mono block">
            {repeatBuyers} repeat customers (2+ orders)
          </span>
        </div>

        {/* KPI 3: VIP Loyalists */}
        <div className="p-5 bg-white border border-[#E6DFD5] rounded-lg space-y-2 shadow-xs">
          <div className="flex items-center justify-between text-xs text-[#1C1917]/60 font-mono">
            <span className="uppercase tracking-wider text-[10px]">VIP Loyal Buyers</span>
            <Crown className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-3xl font-sans font-semibold text-amber-700 tabular-nums tracking-tight">
            {vipBuyers}
          </div>
          <span className="text-[11px] text-amber-800 font-mono block">
            Customers with 3+ orders or high LTV
          </span>
        </div>

        {/* KPI 4: Average Customer LTV */}
        <div className="p-5 bg-white border border-[#E6DFD5] rounded-lg space-y-2 shadow-xs">
          <div className="flex items-center justify-between text-xs text-[#1C1917]/60 font-mono">
            <span className="uppercase tracking-wider text-[10px]">Average Customer LTV</span>
            <CreditCard className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-sans font-bold text-[#1C1917] tabular-nums tracking-tight">
            {formatBdt(avgLtv)}
          </div>
          <span className="text-[11px] text-purple-800 font-mono block">
            Lifetime revenue per customer
          </span>
        </div>
      </div>

      {/* 3. Search Bar and Segment Filter Tabs */}
      <div className="bg-white border border-[#E6DFD5] rounded-lg p-4 sm:p-5 space-y-4 shadow-xs">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#1C1917]/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by customer phone (017...), full name, or email..."
              className="w-full pl-10 pr-4 py-2.5 rounded border border-[#E6DFD5] bg-[#F9F6F0] text-xs font-mono focus:outline-none focus:border-[#C7A97B] text-[#1C1917] transition-colors"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-mono text-[#1C1917]/40 hover:text-[#1C1917]"
              >
                Clear
              </button>
            )}
          </div>

          {/* Segment Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none text-xs font-mono">
            <button
              type="button"
              onClick={() => setSelectedTier('ALL')}
              className={`px-3 py-2 rounded transition-all whitespace-nowrap ${
                selectedTier === 'ALL'
                  ? 'bg-[#1C1917] text-[#C7A97B] font-bold shadow-xs'
                  : 'bg-[#F9F6F0] text-[#1C1917]/70 hover:text-[#1C1917]'
              }`}
            >
              All ({customerProfiles.length})
            </button>
            <button
              type="button"
              onClick={() => setSelectedTier('VIP')}
              className={`px-3 py-2 rounded transition-all whitespace-nowrap flex items-center gap-1 ${
                selectedTier === 'VIP'
                  ? 'bg-amber-800 text-white font-bold shadow-xs'
                  : 'bg-amber-50 text-amber-900 border border-amber-200 hover:bg-amber-100'
              }`}
            >
              <Crown className="w-3 h-3 text-amber-500" />
              <span>VIP Loyal ({customerProfiles.filter((c) => c.tier === 'VIP').length})</span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedTier('REPEAT')}
              className={`px-3 py-2 rounded transition-all whitespace-nowrap flex items-center gap-1 ${
                selectedTier === 'REPEAT'
                  ? 'bg-emerald-800 text-white font-bold shadow-xs'
                  : 'bg-emerald-50 text-emerald-900 border border-emerald-200 hover:bg-emerald-100'
              }`}
            >
              <Repeat className="w-3 h-3 text-emerald-600" />
              <span>Repeat ({customerProfiles.filter((c) => c.tier === 'REPEAT').length})</span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedTier('FIRST_TIME')}
              className={`px-3 py-2 rounded transition-all whitespace-nowrap flex items-center gap-1 ${
                selectedTier === 'FIRST_TIME'
                  ? 'bg-blue-800 text-white font-bold shadow-xs'
                  : 'bg-blue-50 text-blue-900 border border-blue-200 hover:bg-blue-100'
              }`}
            >
              <Sparkles className="w-3 h-3 text-blue-500" />
              <span>First-Time ({customerProfiles.filter((c) => c.tier === 'FIRST_TIME').length})</span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedTier('RISK')}
              className={`px-3 py-2 rounded transition-all whitespace-nowrap flex items-center gap-1 ${
                selectedTier === 'RISK'
                  ? 'bg-rose-900 text-white font-bold shadow-xs'
                  : 'bg-rose-50 text-rose-900 border border-rose-200 hover:bg-rose-100'
              }`}
            >
              <AlertTriangle className="w-3 h-3 text-rose-600" />
              <span>RTO Risk ({customerProfiles.filter((c) => c.tier === 'RISK').length})</span>
            </button>
          </div>
        </div>

        {/* Results Counter */}
        <div className="text-[11px] font-mono text-[#1C1917]/60 flex items-center justify-between pt-1 border-t border-[#E6DFD5]/60">
          <span>Showing {filteredProfiles.length} customer profiles</span>
          {searchTerm && <span>Filter applied: &ldquo;{searchTerm}&rdquo;</span>}
        </div>
      </div>

      {/* 4. Customer Profiles List */}
      <div className="space-y-4">
        {filteredProfiles.length === 0 ? (
          <div className="p-12 text-center text-xs text-[#1C1917]/50 font-mono space-y-2 bg-white rounded-lg border border-[#E6DFD5]">
            <Users className="w-8 h-8 text-[#1C1917]/20 mx-auto" />
            <div>No customer profiles found matching your search.</div>
            <div className="text-[11px] text-[#1C1917]/40">
              Try searching with another phone number, name, or clear the search filter.
            </div>
          </div>
        ) : (
          filteredProfiles.map((customer) => {
            const isExpanded = expandedCustomerId === customer.phone;

            return (
              <div
                key={customer.phone}
                className="bg-white border border-[#E6DFD5] hover:border-[#C7A97B]/60 transition-all rounded-lg overflow-hidden shadow-xs"
              >
                {/* Main Summary Card */}
                <div className="p-4 sm:p-5 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center space-x-3">
                      {/* Avatar / Monogram */}
                      <div className="w-10 h-10 rounded-full bg-[#1C1917] text-[#C7A97B] font-mono font-bold text-xs flex items-center justify-center shrink-0">
                        {customer.name
                          .split(' ')
                          .map((n) => n[0])
                          .join('')
                          .slice(0, 2)
                          .toUpperCase() || 'CU'}
                      </div>

                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-serif text-base sm:text-lg font-medium text-[#1C1917]">
                            {customer.name}
                          </span>

                          {/* Customer Tier Badges */}
                          {customer.tier === 'VIP' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-100 text-amber-900 border border-amber-300">
                              <Crown className="w-3 h-3 text-amber-600" />
                              <span>VIP LOYAL BUYER ({customer.totalOrders} ORDERS)</span>
                            </span>
                          )}
                          {customer.tier === 'REPEAT' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
                              <Repeat className="w-3 h-3 text-emerald-600" />
                              <span>REPEAT CUSTOMER (2 ORDERS)</span>
                            </span>
                          )}
                          {customer.tier === 'FIRST_TIME' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-medium bg-blue-50 text-blue-900 border border-blue-200">
                              <Sparkles className="w-3 h-3 text-blue-500" />
                              <span>FIRST-TIME BUYER (1 ORDER)</span>
                            </span>
                          )}
                          {customer.tier === 'RISK' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-rose-100 text-rose-900 border border-rose-300">
                              <AlertTriangle className="w-3 h-3 text-rose-600" />
                              <span>RTO CANCELLATION RISK</span>
                            </span>
                          )}
                        </div>

                        {/* Contact details */}
                        <div className="flex items-center gap-3 text-xs font-mono text-[#1C1917]/70 mt-1 flex-wrap">
                          <span className="font-bold text-[#1C1917]">{customer.phone}</span>
                          {customer.email && <span>· {customer.email}</span>}
                          {customer.district && (
                            <span className="flex items-center gap-1 text-[#1C1917]/60">
                              <MapPin className="w-3 h-3 text-[#C7A97B]" />
                              <span>{customer.district}</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Financial Snapshot */}
                    <div className="text-left sm:text-right font-mono">
                      <div className="text-sm sm:text-base font-bold text-[#1C1917]">
                        {formatBdt(customer.totalSpent)}{' '}
                        <span className="text-[10px] font-normal text-[#1C1917]/50">Lifetime Spend</span>
                      </div>
                      <div className="text-[11px] text-[#1C1917]/60">
                        {customer.totalOrders} Orders · AOV: {formatBdt(customer.aov)}
                      </div>
                    </div>
                  </div>

                  {/* Customer Quick Stats & Address */}
                  <div className="p-3 bg-[#F9F6F0] rounded border border-[#E6DFD5] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                    <div className="text-[11px] text-[#1C1917]/80">
                      <span className="font-mono text-[#1C1917]/50 uppercase text-[9px] block">Shipping Destination</span>
                      <span>{customer.address || 'Address on file'}</span>
                    </div>

                    <div className="flex items-center gap-4 font-mono text-[11px] text-[#1C1917]/70 shrink-0">
                      <div>
                        Delivered:{' '}
                        <b className="text-emerald-700">{customer.deliveredOrders}</b>
                      </div>
                      <div>
                        In Transit:{' '}
                        <b className="text-purple-700">{customer.inTransitOrders}</b>
                      </div>
                      <div>
                        Cancelled:{' '}
                        <b className={customer.cancelledOrders > 0 ? 'text-rose-700' : 'text-[#1C1917]/50'}>
                          {customer.cancelledOrders}
                        </b>
                      </div>
                    </div>
                  </div>

                  {/* Action Bar */}
                  <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-t border-[#E6DFD5]/70">
                    <div className="flex items-center gap-2 flex-wrap">
                      {/* 1. Direct Phone Call */}
                      <a
                        href={`tel:${customer.phone}`}
                        className="px-3 py-1.5 rounded bg-white hover:bg-[#F9F6F0] border border-[#E6DFD5] text-[#1C1917] font-mono text-xs flex items-center gap-1.5 transition-colors"
                      >
                        <Phone className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Call</span>
                      </a>

                      {/* 2. WhatsApp Direct Message */}
                      <a
                        href={`https://wa.me/88${customer.phone}?text=${encodeURIComponent(
                          `Assalamu Alaikum ${customer.name}, SEYVEN (The Sanctuary of Beauty) theke apnar shathe jogajog kora hocche. Apnar kono proyojon ba order related assistance lagbe ki?`
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 rounded bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-900 font-mono text-xs font-semibold flex items-center gap-1.5 transition-colors"
                      >
                        <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                        <span>WhatsApp</span>
                      </a>

                      {/* 3. Steadfast Courier Risk Check */}
                      <Link
                        href={`/dispatch/steadfast?phone=${customer.phone}`}
                        className="px-3 py-1.5 rounded bg-white hover:bg-[#F9F6F0] border border-[#E6DFD5] text-emerald-800 font-mono text-xs flex items-center gap-1.5 transition-colors"
                      >
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Courier Fraud Check</span>
                      </Link>
                    </div>

                    {/* Toggle Order History Button */}
                    <button
                      type="button"
                      onClick={() => toggleExpand(customer.phone)}
                      className="px-3 py-1.5 rounded border border-[#E6DFD5] hover:bg-[#F9F6F0] text-[#1C1917] font-mono text-xs flex items-center justify-between sm:justify-start gap-1.5 transition-colors"
                    >
                      <span>Purchase History ({customer.totalOrders} Orders)</span>
                      {isExpanded ? (
                        <ChevronUp className="w-3.5 h-3.5 text-[#C7A97B]" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5 text-[#C7A97B]" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Expanded Order History Drawer */}
                {isExpanded && (
                  <div className="bg-[#FAF7F2] border-t border-[#E6DFD5] p-4 sm:p-5 space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-[#E6DFD5]/80">
                      <span className="font-mono text-xs font-bold text-[#1C1917] uppercase tracking-wider">
                        Full Order History for {customer.name}
                      </span>
                      <span className="font-mono text-[10px] text-[#1C1917]/50">
                        First Order:{' '}
                        {new Date(customer.firstOrderDate).toLocaleDateString('en-GB', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                    </div>

                    <div className="space-y-2">
                      {customer.orders.map((order) => {
                        const isDelivered = order.status === 'DELIVERED';
                        const isShipped = order.status === 'SHIPPED';
                        const isCancelled = order.status === 'CANCELLED';

                        return (
                          <div
                            key={order.id}
                            className="p-3 bg-white rounded border border-[#E6DFD5] text-xs font-mono space-y-2"
                          >
                            <div className="flex items-center justify-between flex-wrap gap-2">
                              <div className="flex items-center space-x-2">
                                <span className="font-bold text-[#1C1917]">{order.id}</span>
                                <span className="text-[10px] text-[#1C1917]/50">
                                  {new Date(order.createdAt).toLocaleDateString('en-GB', {
                                    day: 'numeric',
                                    month: 'short',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </span>
                              </div>

                              <div className="flex items-center space-x-2">
                                <span
                                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                    isDelivered
                                      ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                                      : isShipped
                                      ? 'bg-purple-100 text-purple-900 border border-purple-300'
                                      : isCancelled
                                      ? 'bg-rose-100 text-rose-900 border border-rose-300'
                                      : 'bg-amber-100 text-amber-900 border border-amber-300'
                                  }`}
                                >
                                  {order.status}
                                </span>

                                <span className="font-bold text-[#1C1917]">
                                  {formatBdt(order.totalAmount)}
                                </span>
                              </div>
                            </div>

                            {/* Items in this order */}
                            <div className="text-[11px] text-[#1C1917]/80 pl-2 border-l-2 border-[#C7A97B]/40 space-y-0.5">
                              {order.items && order.items.length > 0 ? (
                                order.items.map((item, idx) => (
                                  <div key={idx} className="flex items-center justify-between">
                                    <span>
                                      • {item.title || (item as any).productName || 'Cosmetics Item'}{' '}
                                      {item.variant && !['standard', 'default', 'none', 'regular'].includes(item.variant.toLowerCase()) && !((item.title || '').toLowerCase().includes(item.variant.toLowerCase())) ? `(${item.variant}) ` : ''}× {item.quantity}
                                    </span>
                                    <span className="text-[#1C1917]/60">
                                      {formatBdt(item.totalPrice || item.unitPrice * item.quantity)}
                                    </span>
                                  </div>
                                ))
                              ) : (
                                <div className="text-[#1C1917]/50">Items details on file</div>
                              )}
                            </div>

                            {/* Delivery & Tracking Info */}
                            <div className="flex items-center justify-between pt-1 border-t border-[#E6DFD5]/40 text-[10px] text-[#1C1917]/60">
                              <div className="flex items-center gap-1.5">
                                <Truck className="w-3 h-3 text-[#C7A97B]" />
                                <span>Courier: {order.courier || 'Pending Assignment'}</span>
                                {order.consignmentId && <span>(CID: #{order.consignmentId})</span>}
                              </div>
                              <div>
                                Payment: <b className="text-[#1C1917]">{order.paymentMethod}</b>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
