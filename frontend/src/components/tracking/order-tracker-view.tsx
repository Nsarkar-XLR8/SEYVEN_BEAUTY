'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Search, Package, Truck, CheckCircle2, Clock, ShieldCheck, ExternalLink, AlertCircle, Phone, ArrowRight, RotateCcw } from 'lucide-react';
import { useLanguage } from '@/context/language-context';
import { useCart } from '@/context/cart-context';
import { BRAND } from '@/lib/constants';
import { buildWhatsAppUrl } from '@/lib/concierge';
import { formatBdt } from '@/lib/formatters';
import { apiFetch } from '@/lib/api-client';

interface TrackingResult {
  orderId: string;
  phone: string;
  customerName: string;
  recipientAddress: string;
  district: string;
  totalBdt: number;
  paymentMethod: string;
  courierName: string;
  consignmentId: string;
  courierTrackingUrl: string;
  currentState: 'PLACED' | 'CONFIRMED' | 'PACKED' | 'DISPATCHED' | 'DELIVERED';
  timeline: {
    state: string;
    labelEn: string;
    labelBn?: string;
    timestamp: string;
    completed: boolean;
    current: boolean;
  }[];
  items: {
    titleEn: string;
    titleBn?: string;
    volume: string;
    quantity: number;
    priceBdt: number;
  }[];
}

export function OrderTrackerView() {
  const searchParams = useSearchParams();
  const urlOrderId = searchParams.get('id') || '';
  const urlPhone = searchParams.get('phone') || '';

  const { lang, t } = useLanguage();
  const { settings } = useCart();
  const [orderIdInput, setOrderIdInput] = useState(urlOrderId);
  const [phoneInput, setPhoneInput] = useState(urlPhone);
  const [isSearching, setIsSearching] = useState(false);
  const [trackingResult, setTrackingResult] = useState<TrackingResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Auto-search if URL orderId is present
  useEffect(() => {
    if (urlOrderId) {
      performSearch(urlOrderId, urlPhone || '');
    }
  }, [urlOrderId]);

  const performSearch = async (orderId: string, phone: string) => {
    setIsSearching(true);
    setErrorMessage(null);
    const cleanId = orderId.trim().toUpperCase();
    const cleanPhone = phone.trim();

    try {
      // 1. Try live backend quick-track endpoint
      const queryParam = cleanPhone
        ? `orderNumber=${encodeURIComponent(cleanId)}&phone=${encodeURIComponent(cleanPhone)}`
        : `orderNumber=${encodeURIComponent(cleanId)}`;

      const res = await apiFetch<any>(`/tracking/quick-track?${queryParam}`);
      if (res && res.orderNumber) {
        const mappedResult: TrackingResult = {
          orderId: res.orderNumber,
          phone: cleanPhone || res.shippingAddressMasked?.phone || '',
          customerName: res.shippingAddressMasked?.fullName || 'Valued Client',
          recipientAddress: res.shippingAddressMasked?.streetAddressMasked || 'Sanctuary Address',
          district: res.shippingAddressMasked?.district || 'Bangladesh',
          totalBdt: res.totalPayableBdt || 0,
          paymentMethod: res.paymentGateway === 'COD' ? 'Cash on Delivery (Doorstep)' : res.paymentGateway || 'Card / Mobile Banking',
          courierName: res.courierName || 'Pathao Courier',
          consignmentId: res.trackingCode || res.courierBookingId || 'Assigned on Dispatch',
          courierTrackingUrl:
            res.trackingCode || res.courierBookingId
              ? (res.trackingUrl && !res.trackingUrl.includes('merchant.pathao.com')
                  ? res.trackingUrl
                  : `https://pathao.com/track/?consignment_id=${encodeURIComponent(res.trackingCode || res.courierBookingId)}`)
              : '',
          currentState: (['PLACED', 'CONFIRMED', 'PACKED', 'DISPATCHED', 'DELIVERED'].includes(res.status)
            ? res.status
            : res.status === 'BOOKED' || res.status === 'SHIPPED'
            ? 'DISPATCHED'
            : 'PLACED') as any,
          timeline: (res.milestones || []).map((m: any) => ({
            state: m.step,
            labelEn: m.label,
            labelBn: m.labelBn,
            timestamp: m.timestamp
              ? new Date(m.timestamp).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })
              : (m.isCompleted ? 'Completed' : 'Pending'),
            completed: !!m.isCompleted,
            current: !!m.isCurrent,
          })),
          items: Array.isArray(res.items)
            ? res.items.map((it: any) => ({
                titleEn: it.title || it.titleEn || 'Bespoke Formulation',
                volume: it.variant || it.volume || 'Standard',
                quantity: it.quantity || 1,
                priceBdt: Number(it.unitPriceBdt || it.priceBdt || 0),
              }))
            : [],
        };
        setTrackingResult(mappedResult);
        setIsSearching(false);
        return;
      }
    } catch {
      // Backend check did not return match, fallback to browser storage
    }

    // 2. Check browser local storage for direct guest / authorized client orders
    try {
      const rawAdmin = typeof window !== 'undefined' ? localStorage.getItem('seyven_admin_orders_v2') : null;
      const adminOrders = rawAdmin ? JSON.parse(rawAdmin) : [];
      const match = adminOrders.find(
        (o: any) =>
          o.id === cleanId ||
          o.referenceNo === cleanId ||
          (cleanPhone && o.customerPhone && o.customerPhone.includes(cleanPhone.slice(-8)))
      );

      if (match) {
        const mappedResult: TrackingResult = {
          orderId: match.id || cleanId,
          phone: match.customerPhone || cleanPhone,
          customerName: match.customerName || 'Valued Client',
          recipientAddress: match.shippingAddress || 'Sanctuary Address',
          district: match.district || match.zone || 'Dhaka',
          totalBdt: Number(match.totalAmount || match.totalBdt || 0),
          paymentMethod: match.paymentMethod === 'COD' ? 'Cash on Delivery (Doorstep)' : match.paymentMethod,
          courierName: match.courier || 'Pathao Courier Express',
          consignmentId: match.consignmentId || 'Assigned on Dispatch',
          courierTrackingUrl:
            match.consignmentId && match.consignmentId !== 'Assigned on Dispatch'
              ? (match.courierTrackingUrl || `https://pathao.com/track/?consignment_id=${encodeURIComponent(match.consignmentId)}`)
              : '',
          currentState: (match.status as any) || 'PLACED',
          timeline: [
            {
              state: 'PLACED',
              labelEn: 'Order Received & Digitally Logged',
              timestamp: match.createdAt
                ? new Date(match.createdAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                : 'Just now',
              completed: true,
              current: match.status === 'PLACED',
            },
            {
              state: 'CONFIRMED',
              labelEn: 'Clinical Authenticity & Lot Verified',
              timestamp: match.status === 'CONFIRMED' ? 'Completed' : 'Pending',
              completed: match.status === 'CONFIRMED' || match.status === 'PACKED' || match.status === 'DISPATCHED' || match.status === 'DELIVERED',
              current: match.status === 'CONFIRMED',
            },
            {
              state: 'PACKED',
              labelEn: 'Sanctuary Sealed with Tamper-Proof Tape',
              timestamp: match.status === 'PACKED' ? 'Completed' : 'Pending',
              completed: match.status === 'PACKED' || match.status === 'DISPATCHED' || match.status === 'DELIVERED',
              current: match.status === 'PACKED',
            },
            {
              state: 'DISPATCHED',
              labelEn: 'Handed Over to Courier Hub',
              timestamp: match.status === 'DISPATCHED' ? 'Completed' : 'Pending',
              completed: match.status === 'DISPATCHED' || match.status === 'DELIVERED',
              current: match.status === 'DISPATCHED',
            },
            {
              state: 'DELIVERED',
              labelEn: 'Out for Doorstep Delivery & Handover',
              timestamp: 'Pending',
              completed: match.status === 'DELIVERED',
              current: match.status === 'DELIVERED',
            },
          ],
          items: Array.isArray(match.items)
            ? match.items.map((it: any) => ({
                titleEn: it.title || it.titleEn || 'Bespoke Formulation',
                volume: it.variant || it.volume || 'Standard',
                quantity: it.quantity || 1,
                priceBdt: Number(it.unitPrice || it.priceBdt || 0),
              }))
            : [],
        };
        setTrackingResult(mappedResult);
        setIsSearching(false);
        return;
      }
    } catch {}

    // If order was not found anywhere, show error message instead of fake mock data
    setErrorMessage(
      'No order found matching this tracking ID. Please verify your order ID or contact concierge.'
    );
    setTrackingResult(null);
    setIsSearching(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderIdInput.trim()) {
      setErrorMessage('Please enter your SEYVEN Order Tracking ID.');
      return;
    }
    performSearch(orderIdInput, phoneInput);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-10 pb-28 lg:pb-16">
      {/* Header Banner */}
      <div className="text-center space-y-3 max-w-xl mx-auto">
        <div className="inline-flex items-center space-x-2 px-3 py-1 bg-[#E6DFD5]/40 border border-[#E6DFD5] text-[9px] uppercase tracking-[0.3em] font-medium text-[#C7A97B]">
          <Truck className="w-3.5 h-3.5" />
          <span>{'LIVE ORDER TRACKING'}</span>
        </div>

        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-serif uppercase tracking-[0.18em] font-light text-[#1C1917]">
          {'TRACK YOUR SANCTUARY PARCEL'}
        </h1>

        <p className="text-xs sm:text-sm text-[#1C1917]/70 font-light leading-relaxed">
          {'Enter your Order ID (from your confirmation SMS/Email) to monitor fulfillment and live courier transit.'}
        </p>
      </div>

      {/* Search Bar Form */}
      <div className="p-5 sm:p-6 bg-[#F9F6F0] border border-[#E6DFD5] shadow-xs">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label htmlFor="search-order-id" className="text-[10px] uppercase tracking-[0.2em] text-[#1C1917]/70 block font-medium">
                {'ORDER TRACKING ID (REQUIRED)'}
              </label>
              <input
                id="search-order-id"
                type="text"
                required
                value={orderIdInput}
                onChange={(e) => {
                  setOrderIdInput(e.target.value);
                  setErrorMessage(null);
                }}
                placeholder="e.g. SYV-202610-A9F4"
                className="w-full bg-[#F9F6F0] border border-[#E6DFD5] px-3.5 py-2.5 text-xs font-mono uppercase text-[#1C1917] focus:outline-hidden focus:border-[#C7A97B] transition-colors"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="search-phone" className="text-[10px] uppercase tracking-[0.2em] text-[#1C1917]/70 block font-medium">
                {'MOBILE PHONE NUMBER (OPTIONAL)'}
              </label>
              <input
                id="search-phone"
                type="tel"
                inputMode="tel"
                value={phoneInput}
                onChange={(e) => setPhoneInput(e.target.value)}
                placeholder="01700 000000"
                className="w-full bg-[#F9F6F0] border border-[#E6DFD5] px-3.5 py-2.5 text-xs font-mono text-[#1C1917] focus:outline-hidden focus:border-[#C7A97B] transition-colors"
              />
            </div>
          </div>

          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              disabled={isSearching}
              className="w-full sm:w-auto px-8 py-3 bg-[#1C1917] hover:bg-[#1C1917]/90 disabled:opacity-50 text-[#F9F6F0] text-xs uppercase tracking-[0.25em] font-medium transition-colors flex items-center justify-center space-x-2 cursor-pointer shadow-xs"
            >
              <Search className="w-3.5 h-3.5 text-[#C7A97B]" />
              <span>{isSearching ? 'LOCATING PARCEL...' : 'LOCATE PARCEL'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Tracking Results View */}
      {trackingResult && (
        <div className="space-y-6 animate-in fade-in duration-300">
          
          {/* Status Header Box */}
          <div className="p-5 sm:p-6 bg-[#F9F6F0] border border-[#E6DFD5] space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E6DFD5] pb-4">
              <div className="space-y-0.5">
                <span className="text-[9px] uppercase tracking-[0.2em] text-[#C7A97B] font-semibold">
                  STATUS: {trackingResult.currentState}
                </span>
                <h2 className="text-lg sm:text-xl font-serif text-[#1C1917] tracking-wider">
                  {trackingResult.orderId}
                </h2>
              </div>

              {/* Courier link */}
              <div className="flex items-center space-x-2 text-xs">
                {trackingResult.courierTrackingUrl &&
                trackingResult.consignmentId &&
                trackingResult.consignmentId !== 'Assigned on Dispatch' ? (
                  <div className="flex items-center space-x-2">
                    <span className="text-[#1C1917]/70 font-medium font-mono text-[11px]">
                      {trackingResult.courierName}: #{trackingResult.consignmentId}
                    </span>
                    <a
                      href={trackingResult.courierTrackingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center space-x-1 px-3 py-1 bg-[#1C1917] text-[#F9F6F0] text-[9px] uppercase tracking-wider hover:bg-[#C7A97B] transition-colors"
                    >
                      <span>LIVE COURIER LINK</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                ) : (
                  <div className="flex flex-col sm:items-end text-left sm:text-right">
                    <span className="text-[#C7A97B] font-medium text-[10px] uppercase tracking-wider">
                      {trackingResult.courierName} (DOORSTEP)
                    </span>
                    <span className="text-[9px] text-[#1C1917]/50 font-mono">
                      Live tracking activates upon warehouse dispatch
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Visual Timeline Rail */}
            <div className="space-y-4 pt-2">
              <h3 className="text-xs font-serif uppercase tracking-[0.2em] text-[#1C1917] font-medium">
                {'CHAIN OF CUSTODY TIMELINE'}
              </h3>

              <div className="relative border-l-2 border-[#E6DFD5] ml-3 sm:ml-4 pl-6 space-y-6">
                {trackingResult.timeline.map((step, idx) => (
                  <div key={idx} className="relative">
                    {/* Circle icon */}
                    <div
                      className={`absolute -left-[31px] top-0 w-4 h-4 rounded-full border-2 ${
                        step.completed
                          ? 'bg-emerald-600 border-emerald-600'
                          : step.current
                          ? 'bg-[#C7A97B] border-[#C7A97B] animate-pulse'
                          : 'bg-[#F9F6F0] border-[#E6DFD5]'
                      }`}
                    />

                    <div className="space-y-0.5">
                      <div className="flex items-baseline space-x-2">
                        <h4
                          className={`text-xs font-medium ${
                            step.completed || step.current ? 'text-[#1C1917]' : 'text-[#1C1917]/40'
                          }`}
                        >
                          {step.labelEn}
                        </h4>
                        {step.current && (
                          <span className="text-[8px] uppercase tracking-widest text-amber-800 bg-amber-50 px-1.5 py-0.2 border border-amber-200">
                            IN TRANSIT
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] font-mono text-[#1C1917]/60">
                        {step.timestamp}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Delivery Destination */}
            <div className="p-4 sm:p-5 bg-[#F9F6F0] border border-[#E6DFD5] space-y-2 text-xs">
              <div className="flex items-center space-x-1.5 text-[10px] uppercase tracking-[0.2em] text-[#C7A97B] font-semibold">
                <Truck className="w-3.5 h-3.5" />
                <span>{'DELIVERY DESTINATION'}</span>
              </div>
              <p className="font-serif font-medium text-[#1C1917] text-sm">
                {trackingResult.customerName}
              </p>
              <p className="text-[#1C1917]/80 leading-relaxed font-light">
                {trackingResult.recipientAddress}, {trackingResult.district}
              </p>
              <p className="text-[#1C1917]/60 font-mono text-[11px] pt-1">
                {trackingResult.phone}
              </p>
            </div>

            {/* Financial Settlement */}
            <div className="p-4 sm:p-5 bg-[#F9F6F0] border border-[#E6DFD5] space-y-2 text-xs">
              <div className="flex items-center space-x-1.5 text-[10px] uppercase tracking-[0.2em] text-[#C7A97B] font-semibold">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>{'SETTLEMENT DETAILS'}</span>
              </div>
              <p className="font-serif font-medium text-[#1C1917] text-sm">
                {trackingResult.paymentMethod}
              </p>
              <p className="text-base font-sans font-semibold text-[#1C1917] tabular-nums pt-1">
                {formatBdt(trackingResult.totalBdt)}
              </p>
              <span className="text-[9px] uppercase tracking-wider text-emerald-800 block">
                {'AUTHENTIC FORMULATION IMPORT & SANCTUARY CARE'}
              </span>
            </div>

          </div>

          {/* Formulations inside this order */}
          <div className="p-5 bg-[#F9F6F0] border border-[#E6DFD5] space-y-3">
            <h3 className="text-xs font-serif uppercase tracking-[0.2em] text-[#1C1917] font-medium">
              {'ENCLOSED FORMULATIONS'}
            </h3>

            <div className="divide-y divide-[#E6DFD5]">
              {trackingResult.items.map((it, idx) => (
                <div key={idx} className="py-2.5 flex items-center justify-between text-xs">
                  <div className="space-y-0.5">
                    <p className="font-serif uppercase tracking-wider text-[#1C1917] font-medium">
                      {it.titleEn}
                    </p>
                    <p className="text-[10px] text-[#1C1917]/60 font-mono">
                      {it.volume} • QTY: {it.quantity}
                    </p>
                  </div>
                  <span className="font-sans font-medium text-[#1C1917] tabular-nums">
                    {formatBdt(it.priceBdt * it.quantity)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Help & Self-Serve Actions */}
          <div className="p-4 sm:p-5 bg-[#E6DFD5]/25 border border-[#E6DFD5] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex items-center space-x-2 text-[#1C1917]/80">
              <RotateCcw className="w-4 h-4 text-[#C7A97B] shrink-0" />
              <span>
                {'Need an exchange, return, or reporting a delivery issue?'}
              </span>
            </div>

            <Link
              href={`/support/returns?orderId=${trackingResult.orderId}`}
              className="px-4 py-2 bg-[#1C1917] text-[#F9F6F0] text-[10px] uppercase tracking-[0.2em] font-medium hover:bg-[#1C1917]/90 transition-colors shrink-0"
            >
              {'START SELF-SERVE RETURN (RMA)'}
            </Link>
          </div>

        </div>
      )}

      {/* Support Strip */}
      <div className="text-center pt-2">
        {(() => {
          const rawPhone = settings?.supportWhatsApp || BRAND.supportWhatsApp;
          const inquiryUrl = buildWhatsAppUrl(
            rawPhone,
            trackingResult
              ? `Hi SEYVEN Concierge! I have a tracking inquiry regarding Order #${trackingResult.orderId}.`
              : 'Hi SEYVEN Concierge! I have an inquiry about my parcel delivery.'
          );
          if (rawPhone && inquiryUrl) {
            return (
              <p className="text-xs text-[#1C1917]/70 flex items-center justify-center space-x-1.5">
                <Phone className="w-3.5 h-3.5 text-[#C7A97B]" />
                <a
                  href={inquiryUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline hover:text-[#C7A97B] transition-colors"
                >
                  {`Urgent Delivery Inquiry? WhatsApp SEYVEN Concierge: ${rawPhone} ↗`}
                </a>
              </p>
            );
          }
          return (
            <p className="text-xs text-[#1C1917]/70 flex items-center justify-center space-x-1.5">
              <a
                href={`mailto:${BRAND.supportEmail}`}
                className="hover:underline hover:text-[#C7A97B] transition-colors"
              >
                {`Urgent Delivery Inquiry? Contact SEYVEN Concierge: ${BRAND.supportEmail} ↗`}
              </a>
            </p>
          );
        })()}
      </div>
    </div>
  );
}
