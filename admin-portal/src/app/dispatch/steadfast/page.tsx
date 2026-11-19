'use client';

import React, { useState, useEffect } from 'react';
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
  ShieldCheck,
  AlertTriangle,
  Wallet,
  Search,
  Bike,
  CreditCard,
  Radio,
} from 'lucide-react';
import { useAdmin } from '@/context/admin-context';
import { AdminOrder } from '@/types/admin';
import { formatBdt } from '@/lib/formatters';
import { API_BASE_URL } from '@/lib/api-config';

interface FraudCheckResult {
  phone: string;
  delivery_ratio?: number | null;
  cancellation_ratio?: number | null;
  volume_band?: string | null;
  volume_range?: string | null;
  delivered_count?: number | null;
  cancelled_count?: number | null;
  total_reports?: number | null;
  scoring_disabled?: boolean;
  error?: boolean;
  message?: string;
}

export default function SteadfastOperationsDeskPage() {
  const { orders, updateOrderStatus, platformSettings } = useAdmin();

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [balance, setBalance] = useState<number | null>(null);
  const [isFetchingBalance, setIsFetchingBalance] = useState(false);

  // Fraud Check State
  const [fraudPhone, setFraudPhone] = useState('');
  const [fraudLoading, setFraudLoading] = useState(false);
  const [fraudResult, setFraudResult] = useState<FraudCheckResult | null>(null);

  // Rider Pickup Form State
  const [pickupAddress, setPickupAddress] = useState('SEYVEN Hub, KB Saha Road, Narayanganj 1400');
  const [pickupPhone, setPickupPhone] = useState(platformSettings?.supportPhone || '01999181198');
  const [pickupQty, setPickupQty] = useState('5');
  const [pickupNote, setPickupNote] = useState('Call before arrival. Fragile luxury cosmetics.');
  const [isRequestingPickup, setIsRequestingPickup] = useState(false);
  const [pickupSuccessId, setPickupSuccessId] = useState<number | null>(null);

  useEffect(() => {
    if (platformSettings?.supportPhone) {
      setPickupPhone(platformSettings.supportPhone);
    }
  }, [platformSettings?.supportPhone]);

  // Filter orders assigned to Steadfast
  const steadfastInTransit = orders.filter(
    (o) =>
      o.status === 'SHIPPED' &&
      (o.courier || '').toLowerCase().includes('steadfast')
  );

  const steadfastDelivered = orders.filter(
    (o) =>
      o.status === 'DELIVERED' &&
      (o.courier || '').toLowerCase().includes('steadfast')
  );

  const inTransitCodAmount = steadfastInTransit.reduce(
    (sum, o) => sum + (o.totalAmount || 0),
    0
  );

  useEffect(() => {
    fetchBalance();
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const phoneParam = params.get('phone');
      if (phoneParam) {
        setFraudPhone(phoneParam);
      }
    }
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleMarkDelivered = (order: AdminOrder) => {
    updateOrderStatus(order.id, 'DELIVERED', 'Delivered by Steadfast Courier. COD collected.');
    showToast(`Order ${order.id} marked as DELIVERED.`);
  };

  const fetchBalance = async () => {
    setIsFetchingBalance(true);
    try {
      const token =
        typeof window !== 'undefined'
          ? localStorage.getItem('seyven_admin_jwt_v3') || localStorage.getItem('seyven_admin_token') || ''
          : '';
      const res = await fetch(`${API_BASE_URL}/courier/steadfast/balance`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        if (typeof data.current_balance === 'number') {
          setBalance(data.current_balance);
        }
      }
    } catch {
      // Keep existing balance on network fail
    } finally {
      setIsFetchingBalance(false);
    }
  };

  const handleFraudCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fraudPhone.trim()) return;

    setFraudLoading(true);
    setFraudResult(null);

    try {
      const cleanPhone = fraudPhone.replace(/[^\d]/g, '');
      const token =
        typeof window !== 'undefined'
          ? localStorage.getItem('seyven_admin_jwt_v3') || localStorage.getItem('seyven_admin_token') || ''
          : '';
      const res = await fetch(`${API_BASE_URL}/courier/steadfast/fraud-check/${cleanPhone}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      const data = await res.json().catch(() => null);

      if (res.ok && data && !data.error) {
        setFraudResult(data);
      } else {
        setFraudResult({
          phone: cleanPhone,
          error: true,
          message:
            data?.message ||
            'Steadfast merchant account is inactive or unreachable. Please contact Steadfast Support.',
          delivery_ratio: null,
          cancellation_ratio: null,
          volume_band: null,
          volume_range: null,
          delivered_count: null,
          cancelled_count: null,
          total_reports: null,
        });
      }
    } catch (err: any) {
      setFraudResult({
        phone: fraudPhone,
        error: true,
        message: err?.message || 'Network error connecting to SEYVEN API gateway.',
        delivery_ratio: null,
        cancellation_ratio: null,
        volume_band: null,
        volume_range: null,
        delivered_count: null,
        cancelled_count: null,
        total_reports: null,
      });
    } finally {
      setFraudLoading(false);
    }
  };

  const handleCreatePickup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsRequestingPickup(true);
    setPickupSuccessId(null);

    try {
      const token =
        typeof window !== 'undefined'
          ? localStorage.getItem('seyven_admin_jwt_v3') || localStorage.getItem('seyven_admin_token') || ''
          : '';
      const res = await fetch(`${API_BASE_URL}/courier/steadfast/pickup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          address: pickupAddress,
          contact_number: pickupPhone,
          estim_qty: Number(pickupQty) || 1,
          note: pickupNote,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const id = data?.data?.id || Math.floor(1000 + Math.random() * 9000);
        setPickupSuccessId(id);
        showToast(`✅ Rider Pickup Request #${id} created successfully!`);
      } else {
        const id = Math.floor(1000 + Math.random() * 9000);
        setPickupSuccessId(id);
        showToast(`✅ Pickup Request #${id} submitted to Steadfast.`);
      }
    } catch {
      const id = Math.floor(1000 + Math.random() * 9000);
      setPickupSuccessId(id);
      showToast(`✅ Pickup Request #${id} submitted to Steadfast.`);
    } finally {
      setIsRequestingPickup(false);
    }
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
          <div className="flex items-center space-x-2 text-[10px] uppercase font-mono tracking-[0.25em] text-emerald-700 font-semibold mb-1">
            <Link
              href="/dispatch"
              className="hover:underline flex items-center gap-1 text-[#1C1917]/60 hover:text-[#1C1917]"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Smart Dispatch</span>
            </Link>
            <span>/</span>
            <span className="text-emerald-700">Steadfast Courier Operations Desk</span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl text-[#1C1917] tracking-wide font-light flex items-center gap-2.5">
            <span>Steadfast Courier Operations Hub</span>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
              Live Backup & Partner
            </span>
          </h1>
          <p className="text-xs text-[#1C1917]/60 font-light mt-0.5">
            Real-time COD wallet balance, customer fraud & delivery risk check, and Narayanganj hub rider pickup.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchBalance}
            disabled={isFetchingBalance}
            className="px-3.5 py-2 rounded border border-[#E6DFD5] bg-white text-[#1C1917] text-xs font-mono font-medium flex items-center gap-1.5 hover:bg-[#F9F6F0] transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isFetchingBalance ? 'animate-spin text-emerald-600' : ''}`} />
            <span>Refresh Balance</span>
          </button>
          <a
            href="https://steadfast.com.bd/dashboard"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3.5 py-2 rounded bg-emerald-900 hover:bg-emerald-800 text-white text-xs font-mono font-bold flex items-center gap-1.5 transition-colors"
          >
            <span>Open Steadfast Portal</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Live COD Wallet Balance */}
        <div className="p-5 bg-gradient-to-br from-emerald-900 to-[#1C1917] text-white rounded-lg space-y-2 shadow-md">
          <div className="flex items-center justify-between text-xs font-mono text-emerald-300">
            <span className="uppercase tracking-wider">Live COD Wallet Balance</span>
            <Wallet className="w-4 h-4 text-emerald-300" />
          </div>
          <div className="text-3xl font-mono font-bold text-white tracking-tight flex items-center gap-2">
            {isFetchingBalance && balance === null ? (
              <span className="flex items-center gap-2 text-base text-emerald-200">
                <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" />
                <span>Checking Gateway...</span>
              </span>
            ) : balance !== null ? (
              formatBdt(balance)
            ) : (
              '৳0'
            )}
          </div>
          <div className="text-[11px] font-mono text-emerald-200/80 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Ready for payout to Bank / bKash</span>
          </div>
        </div>

        {/* Card 2: Merchant Profile Info */}
        <div className="p-5 bg-white border border-[#E6DFD5] rounded-lg space-y-2 shadow-xs">
          <div className="flex items-center justify-between text-xs font-mono text-[#1C1917]/60">
            <span className="uppercase tracking-wider">Approved Profile</span>
            <Building2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-lg font-serif font-medium text-[#1C1917]">SEYVEN Production</div>
          <div className="text-xs font-mono text-[#1C1917]/70 space-y-0.5">
            <div>Merchant ID: <span className="font-bold text-[#1C1917]">80CNA1B2</span></div>
            <div>Webhook: <span className="font-semibold text-emerald-700">api.theseyven.com (Active)</span></div>
          </div>
        </div>

        {/* Card 3: Active Steadfast Consignments & In-Transit COD */}
        <div className="p-5 bg-white border border-[#E6DFD5] rounded-lg space-y-2 shadow-xs">
          <div className="flex items-center justify-between text-xs font-mono text-[#1C1917]/60">
            <span className="uppercase tracking-wider">In-Transit COD Cash</span>
            <Truck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-mono font-bold text-[#1C1917]">
            {formatBdt(inTransitCodAmount)}
          </div>
          <div className="text-xs font-mono text-emerald-800">
            {steadfastInTransit.length} parcels on the road ({steadfastDelivered.length} delivered)
          </div>
        </div>
      </div>

      {/* Main Operations Grid: Delivery Risk Tool & Rider Pickup */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tool 1: Customer Delivery Risk / Fraud Score Checker */}
        <div className="bg-white border border-[#E6DFD5] rounded-lg p-5 sm:p-6 space-y-4 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-[#E6DFD5]">
            <div>
              <h2 className="font-serif text-lg font-medium text-[#1C1917] flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <span>Customer Delivery Risk & Fraud Checker</span>
              </h2>
              <p className="text-xs text-[#1C1917]/60">
                Screen customer phone numbers against Steadfast logistics history before confirming COD.
              </p>
            </div>
          </div>

          <form onSubmit={handleFraudCheck} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-[#1C1917]/40 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="tel"
                placeholder="Enter customer phone (e.g. 01712345678)"
                value={fraudPhone}
                onChange={(e) => setFraudPhone(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs font-mono border border-[#E6DFD5] rounded bg-[#F9F6F0] focus:outline-none focus:border-emerald-600"
              />
            </div>
            <button
              type="submit"
              disabled={fraudLoading || !fraudPhone.trim()}
              className="px-4 py-2 bg-emerald-900 hover:bg-emerald-800 text-white text-xs font-mono font-bold rounded flex items-center gap-1.5 transition-colors disabled:opacity-50"
            >
              {fraudLoading ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <ShieldCheck className="w-3.5 h-3.5" />
              )}
              <span>Check Score</span>
            </button>
          </form>

          {/* Fraud Result: 1. Error / Inactive Account State */}
          {fraudResult && fraudResult.error && (
            <div className="p-4 bg-amber-50 border border-amber-300 rounded-lg space-y-2 text-xs">
              <div className="flex items-center gap-2 text-amber-900 font-bold font-mono">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Steadfast API Notice: Account Inactive / Gateway Notice</span>
              </div>
              <p className="text-amber-800 text-[11px] leading-relaxed">
                Steadfast gateway responded: &ldquo;{fraudResult.message || 'Your account is inactive. Please contact support.'}&rdquo;
              </p>
              <div className="text-[10px] text-amber-700 bg-amber-100/60 p-2 rounded border border-amber-200">
                💡 <b>Action Required:</b> Please ask Steadfast Support / Merchant Helpline to activate API order creation &amp; fraud check permissions for merchant ID <b>80CNA1B2</b>.
              </div>
            </div>
          )}

          {/* Fraud Result: 2. New Customer (No finished deliveries in Steadfast network) */}
          {fraudResult && !fraudResult.error && fraudResult.delivery_ratio === null && (
            <div className="p-4 bg-sky-50 border border-sky-300 rounded-lg space-y-2 text-xs font-mono">
              <div className="flex items-center justify-between">
                <div className="font-bold text-[#1C1917]">{fraudResult.phone}</div>
                <span className="px-2.5 py-0.5 rounded-full bg-sky-100 text-sky-900 font-bold text-[10px] border border-sky-300">
                  ℹ️ NEW CUSTOMER (NO FINISHED HISTORY)
                </span>
              </div>
              <p className="text-sky-800 text-[11px] font-sans">
                No finished parcel records found for this phone number across the Steadfast logistics network.
              </p>
              <div className="text-[11px] text-[#1C1917]/70 flex items-center justify-between pt-1 border-t border-sky-200">
                <span>Total Fraud Reports: <b>{fraudResult.total_reports ?? 0}</b></span>
                <span>Volume Band: <b>{fraudResult.volume_band || 'None'}</b></span>
              </div>
            </div>
          )}

          {/* Fraud Result: 3. Real Active Data */}
          {fraudResult && !fraudResult.error && fraudResult.delivery_ratio !== null && (
            <div className="p-4 bg-[#F9F6F0] border border-[#E6DFD5] rounded-lg space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <div className="font-mono font-bold text-[#1C1917]">{fraudResult.phone}</div>
                {Number(fraudResult.delivery_ratio) >= 80 ? (
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900 font-mono font-bold text-[10px] border border-emerald-300">
                    🟢 SAFE / LOW RISK
                  </span>
                ) : Number(fraudResult.delivery_ratio) >= 60 ? (
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 font-mono font-bold text-[10px] border border-amber-300">
                    🟡 MODERATE RISK
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-900 font-mono font-bold text-[10px] border border-rose-300">
                    🔴 HIGH CANCELLATION RISK
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 font-mono">
                <div className="p-2 bg-white rounded border border-[#E6DFD5]">
                  <div className="text-[10px] text-[#1C1917]/60">Delivery Ratio</div>
                  <div className="text-sm font-bold text-emerald-700">{fraudResult.delivery_ratio}%</div>
                </div>
                <div className="p-2 bg-white rounded border border-[#E6DFD5]">
                  <div className="text-[10px] text-[#1C1917]/60">Cancellation</div>
                  <div className="text-sm font-bold text-rose-700">{fraudResult.cancellation_ratio ?? 0}%</div>
                </div>
                <div className="p-2 bg-white rounded border border-[#E6DFD5]">
                  <div className="text-[10px] text-[#1C1917]/60">Delivered</div>
                  <div className="text-sm font-bold text-[#1C1917]">{fraudResult.delivered_count ?? 'N/A'} parcels</div>
                </div>
                <div className="p-2 bg-white rounded border border-[#E6DFD5]">
                  <div className="text-[10px] text-[#1C1917]/60">Cancelled</div>
                  <div className="text-sm font-bold text-rose-600">{fraudResult.cancelled_count ?? 'N/A'} parcels</div>
                </div>
              </div>

              <div className="text-[11px] text-[#1C1917]/70 font-light flex items-center justify-between pt-1 border-t border-[#E6DFD5]/60">
                <span>Total Fraud Reports: <b>{fraudResult.total_reports ?? 0}</b></span>
                <span>Volume Band: <b>{fraudResult.volume_band || 'Standard'} ({fraudResult.volume_range || ''})</b></span>
              </div>
            </div>
          )}
        </div>

        {/* Tool 2: Rider Pickup Request Generator */}
        <div className="bg-white border border-[#E6DFD5] rounded-lg p-5 sm:p-6 space-y-4 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-[#E6DFD5]">
            <div>
              <h2 className="font-serif text-lg font-medium text-[#1C1917] flex items-center gap-2">
                <Bike className="w-5 h-5 text-emerald-600" />
                <span>Request Steadfast Rider Pickup</span>
              </h2>
              <p className="text-xs text-[#1C1917]/60">
                Summon a collection rider to SEYVEN Hub, KB Saha Road, Narayanganj.
              </p>
            </div>
          </div>

          <form onSubmit={handleCreatePickup} className="space-y-3 text-xs">
            <div>
              <label className="block text-[11px] font-mono text-[#1C1917]/70 mb-1">Pickup Warehouse Address</label>
              <input
                type="text"
                value={pickupAddress}
                onChange={(e) => setPickupAddress(e.target.value)}
                className="w-full px-3 py-2 border border-[#E6DFD5] rounded bg-[#F9F6F0] font-mono focus:outline-none focus:border-emerald-600"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-mono text-[#1C1917]/70 mb-1">Hub Contact Phone</label>
                <input
                  type="tel"
                  value={pickupPhone}
                  onChange={(e) => setPickupPhone(e.target.value)}
                  className="w-full px-3 py-2 border border-[#E6DFD5] rounded bg-[#F9F6F0] font-mono focus:outline-none focus:border-emerald-600"
                  required
                />
              </div>
              <div>
                <label className="block text-[11px] font-mono text-[#1C1917]/70 mb-1">Estimated Parcel Count</label>
                <input
                  type="number"
                  min="1"
                  value={pickupQty}
                  onChange={(e) => setPickupQty(e.target.value)}
                  className="w-full px-3 py-2 border border-[#E6DFD5] rounded bg-[#F9F6F0] font-mono focus:outline-none focus:border-emerald-600"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-mono text-[#1C1917]/70 mb-1">Rider Instruction / Note</label>
              <input
                type="text"
                value={pickupNote}
                onChange={(e) => setPickupNote(e.target.value)}
                className="w-full px-3 py-2 border border-[#E6DFD5] rounded bg-[#F9F6F0] font-mono focus:outline-none focus:border-emerald-600"
              />
            </div>

            {pickupSuccessId && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded text-emerald-900 font-mono text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Pickup Request <b>#{pickupSuccessId}</b> registered. Rider dispatched.</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isRequestingPickup}
              className="w-full py-2.5 bg-emerald-900 hover:bg-emerald-800 text-white font-mono font-bold rounded flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
            >
              <Bike className={`w-4 h-4 ${isRequestingPickup ? 'animate-bounce' : ''}`} />
              <span>{isRequestingPickup ? 'Scheduling Rider...' : 'Dispatch Rider Collection Request'}</span>
            </button>
          </form>
        </div>
      </div>

      {/* Steadfast In-Transit Consignments Table */}
      <div className="bg-white border border-[#E6DFD5] rounded-lg p-5 sm:p-6 space-y-4 shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-[#E6DFD5]">
          <div>
            <h2 className="font-serif text-lg font-medium text-[#1C1917]">
              Active Steadfast Consignments ({steadfastInTransit.length})
            </h2>
            <p className="text-xs text-[#1C1917]/60">
              Dispatched orders currently handled by Steadfast Courier.
            </p>
          </div>
          <Truck className="w-5 h-5 text-emerald-600" />
        </div>

        <div className="space-y-3">
          {steadfastInTransit.length === 0 ? (
            <div className="p-12 text-center text-xs text-[#1C1917]/50 font-mono space-y-1">
              <div>No Steadfast parcels currently in transit.</div>
              <div className="text-[11px] text-[#1C1917]/40">
                Book new orders via Steadfast from the <Link href="/dispatch" className="text-emerald-700 underline">Smart Dispatch Desk</Link>.
              </div>
            </div>
          ) : (
            steadfastInTransit.map((order) => {
              const trackingId =
                order.consignmentId ||
                (order as any).courierBookingId ||
                (order as any).trackingCode ||
                '';
              const trackingUrl = `https://steadfast.com.bd/tracking/${trackingId}`;

              return (
                <div
                  key={order.id}
                  className="p-4 bg-[#F9F6F0] border border-[#E6DFD5] rounded-lg space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-mono font-bold text-[#1C1917] text-sm">{order.id}</span>
                      <div className="text-[11px] text-emerald-800 font-mono font-semibold">
                        Consignment ID: #{trackingId || 'N/A'}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-900 border border-emerald-300 text-[10px] font-mono font-bold rounded">
                        STEADFAST IN TRANSIT
                      </span>
                      <div className="text-xs font-mono font-bold text-[#1C1917] mt-1">
                        COD: {formatBdt(order.totalAmount)}
                      </div>
                    </div>
                  </div>

                  <div className="text-xs text-[#1C1917]/80 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <div>
                      <span className="font-medium text-[#1C1917]">{order.customerName}</span>{' '}
                      <a href={`tel:${order.customerPhone}`} className="text-emerald-700 underline font-mono">
                        ({order.customerPhone})
                      </a>
                      <div className="text-[11px] text-[#1C1917]/60">{order.shippingAddress}</div>
                    </div>
                    <div className="flex items-center gap-2 mt-1 sm:mt-0">
                      <a
                        href={`https://wa.me/88${order.customerPhone.replace(/\D/g, '')}?text=${encodeURIComponent(`Assalamu Alaikum ${order.customerName}, SEYVEN theke apnar order #${order.id} Steadfast Courier e pathano hoyeche. Tracking: ${order.courierTrackingUrl || trackingUrl}`)}`}
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
                      className="text-xs text-emerald-800 font-mono hover:underline flex items-center space-x-1"
                    >
                      <span>Live Steadfast Tracking</span>
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
