'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, Copy, Check, Download, Truck, ArrowRight, Phone } from 'lucide-react';
import { useCart } from '@/context/cart-context';
import { BRAND } from '@/lib/constants';
import { buildWhatsAppUrl } from '@/lib/concierge';
import { OrderReceiptDocument, OrderReceiptData } from './order-receipt-document';
import { generateAndDownloadSeyvenReceipt } from '@/lib/pdf-generator';

interface CheckoutSuccessViewProps {
  orderData: OrderReceiptData;
  onOrderMore?: () => void;
}

export function CheckoutSuccessView({ orderData, onOrderMore }: CheckoutSuccessViewProps) {
  const { settings } = useCart();
  const [copied, setCopied] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const handleCopyId = () => {
    navigator.clipboard.writeText(orderData.orderId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadPdf = () => {
    setIsDownloading(true);
    try {
      generateAndDownloadSeyvenReceipt(orderData);
    } catch (e) {
      console.error('Direct PDF export error, fallback to print:', e);
      window.print();
    } finally {
      setTimeout(() => setIsDownloading(false), 600);
    }
  };

  const steps = [
    { label: 'ORDER PLACED', completed: true },
    { label: 'ORDER CONFIRMED', completed: true },
    { label: 'PRISTINE PACKING', completed: false },
    { label: 'EXPRESS DISPATCH', completed: false },
  ];

  return (
    <>
      {/* 1. Screen Interactive Confirmation View */}
      <div id="screen-checkout-view" className="max-w-3xl mx-auto py-8 sm:py-12 px-4 space-y-8 animate-in fade-in duration-300">
        {/* Top Banner */}
        <div className="text-center space-y-3">
          <div className="w-14 h-14 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <span className="text-[10px] uppercase tracking-[0.3em] font-medium text-[#C7A97B] block">
            THE SANCTUARY OF BEAUTY // ORDER COMMITTED
          </span>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-serif uppercase tracking-[0.16em] font-light text-[#1C1917]">
            YOUR REGIMEN IS BEING PREPARED
          </h1>

          <p className="text-xs sm:text-sm text-[#1C1917]/75 font-light max-w-lg mx-auto leading-relaxed">
            Thank you for your order. We are carefully preparing your selected skincare items for prompt delivery to your doorstep.
          </p>
        </div>

        {/* Order Tracking ID Card */}
        <div className="p-4 sm:p-6 bg-[#F9F6F0] border border-[#E6DFD5] space-y-4 text-center">
          <span className="text-[10px] uppercase tracking-[0.2em] text-[#1C1917]/60 block">
            OFFICIAL SEYVEN ORDER IDENTIFIER
          </span>

          <div className="inline-flex items-center space-x-3 bg-[#E6DFD5]/40 border border-[#E6DFD5] px-4 py-2">
            <span className="font-mono text-sm sm:text-base font-semibold text-[#1C1917] tracking-wider">
              {orderData.orderId}
            </span>
            <button
              type="button"
              onClick={handleCopyId}
              aria-label="Copy order ID"
              className="text-[#1C1917]/60 hover:text-[#C7A97B] transition-colors"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>

          <p className="text-[10px] text-[#1C1917]/60">
            Your order has been officially recorded. You can track parcel dispatch live below.
          </p>
        </div>

        {/* Visual Status Progress Rail */}
        <div className="p-6 bg-[#F9F6F0] border border-[#E6DFD5] space-y-4">
          <h3 className="text-xs font-serif uppercase tracking-[0.2em] text-[#1C1917] font-medium text-center sm:text-left">
            DISPATCH PROGRESSION TIMELINE
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
            {steps.map((st, i) => (
              <div key={i} className="text-center sm:text-left space-y-1.5">
                <div className="flex items-center justify-center sm:justify-start space-x-2">
                  <div
                    className={`w-3 h-3 rounded-full ${
                      st.completed ? 'bg-emerald-600' : 'bg-[#E6DFD5]'
                    }`}
                  />
                  <span className="text-[9px] font-mono text-[#C7A97B]">0{i + 1}</span>
                </div>
                <p
                  className={`text-[10px] uppercase tracking-wider font-medium ${
                    st.completed ? 'text-[#1C1917]' : 'text-[#1C1917]/40'
                  }`}
                >
                  {st.label}
                </p>
              </div>
            ))}
          </div>

          <div className="pt-3 border-t border-[#E6DFD5] flex items-center justify-between text-xs text-[#1C1917]/80">
            <div className="flex items-center space-x-2">
              <Truck className="w-4 h-4 text-[#C7A97B]" />
              <span>
                Estimated Arrival:{' '}
                <strong>{orderData.estimatedDays || '1-3 Days'}</strong>
              </span>
            </div>
            <span className="text-[10px] uppercase tracking-wider text-[#C7A97B] font-medium">
              VIA PATHAO EXPRESS (DOORSTEP)
            </span>
          </div>
        </div>

        {/* Recipient & Payment Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Recipient Card */}
          <div className="p-4 bg-[#F9F6F0] border border-[#E6DFD5] space-y-1.5 text-xs">
            <span className="text-[10px] uppercase tracking-[0.2em] text-[#1C1917]/60 block">
              DELIVERY DESTINATION
            </span>
            <p className="font-serif font-medium text-[#1C1917] text-sm">
              {orderData.customerName}
            </p>
            <p className="text-[#1C1917]/80 leading-relaxed font-light">
              {orderData.address}, {orderData.districtName}
            </p>
            <p className="text-[#1C1917]/70 font-mono text-[11px] pt-1">
              {orderData.phone}
            </p>
          </div>

          {/* Financial Card */}
          <div className="p-4 bg-[#F9F6F0] border border-[#E6DFD5] space-y-1.5 text-xs">
            <span className="text-[10px] uppercase tracking-[0.2em] text-[#1C1917]/60 block">
              PAYMENT COMMITMENT
            </span>
            <p className="font-serif font-medium text-[#1C1917] text-sm">
              {orderData.paymentMethod === 'COD'
                ? 'Cash on Delivery'
                : orderData.paymentMethod === 'BKASH'
                ? 'bKash Tokenized Checkout'
                : 'Credit / Debit Card (SSLCommerz)'}
            </p>
            <p className="text-base font-sans font-semibold text-[#1C1917] tabular-nums pt-1">
              <span className="text-xs font-normal text-[#C7A97B] mr-0.5">৳</span>
              {Math.round(orderData.totalBdt).toLocaleString('en-IN')}
            </p>
            <span className="text-[9px] uppercase tracking-wider text-emerald-800 block">
              Includes All Statutory Taxes & Packaging
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3 pt-4">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href={`/track-order?id=${orderData.orderId}&phone=${encodeURIComponent(orderData.phone || '')}`}
              className="w-full sm:w-auto px-7 py-3.5 bg-[#1C1917] text-[#F9F6F0] text-xs uppercase tracking-[0.22em] font-medium hover:bg-[#1C1917]/90 transition-colors flex items-center justify-center space-x-2 shadow-xs cursor-pointer"
            >
              <span>TRACK PARCEL LIVE</span>
              <ArrowRight className="w-3.5 h-3.5 text-[#C7A97B]" />
            </Link>

            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={isDownloading}
              className="w-full sm:w-auto px-6 py-3.5 border border-[#1C1917] text-[#1C1917] text-xs uppercase tracking-[0.22em] font-medium hover:bg-[#1C1917] hover:text-[#F9F6F0] transition-colors flex items-center justify-center space-x-2 group disabled:opacity-50 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-[#C7A97B] group-hover:scale-110 transition-transform" />
              <span>
                {isDownloading ? 'DOWNLOADING...' : 'DOWNLOAD RECEIPT'}
              </span>
            </button>

            {onOrderMore ? (
              <button
                type="button"
                onClick={onOrderMore}
                className="w-full sm:w-auto px-6 py-3.5 bg-[#C7A97B] hover:bg-[#B8986A] text-[#1C1917] text-xs uppercase tracking-[0.22em] font-semibold transition-colors flex items-center justify-center space-x-1.5 shadow-xs cursor-pointer"
              >
                <span>ORDER MORE</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#1C1917]" />
              </button>
            ) : (
              <Link
                href="/catalog"
                className="w-full sm:w-auto px-6 py-3.5 bg-[#C7A97B] hover:bg-[#B8986A] text-[#1C1917] text-xs uppercase tracking-[0.22em] font-semibold transition-colors flex items-center justify-center space-x-1.5 shadow-xs"
              >
                <span>ORDER MORE</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#1C1917]" />
              </Link>
            )}
          </div>
          <p className="text-[9px] uppercase tracking-[0.2em] text-[#1C1917]/50 text-center font-mono">
            Direct 1-page receipt download
          </p>
        </div>

        {/* Direct Concierge Help */}
        <div className="text-center pt-2">
          {(() => {
            const rawPhone = settings?.supportWhatsApp || BRAND.supportWhatsApp;
            const inquiryMsg = `Hi SEYVEN Concierge! I have an inquiry about my Order #${orderData.orderId}.`;
            const waUrl = buildWhatsAppUrl(rawPhone, inquiryMsg);
            if (rawPhone && waUrl) {
              return (
                <p className="text-xs text-[#1C1917]/70 flex items-center justify-center space-x-1.5">
                  <Phone className="w-3.5 h-3.5 text-[#C7A97B]" />
                  <a
                    href={waUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:underline hover:text-[#C7A97B] transition-colors"
                  >
                    Questions regarding delivery? WhatsApp Concierge: {rawPhone} ↗
                  </a>
                </p>
              );
            }
            return (
              <p className="text-xs text-[#1C1917]/70 flex items-center justify-center space-x-1.5">
                <a
                  href={`mailto:${BRAND.supportEmail}?subject=Inquiry regarding Order #${orderData.orderId}`}
                  className="hover:underline hover:text-[#C7A97B] transition-colors"
                >
                  Questions regarding delivery? Contact Concierge: {BRAND.supportEmail} ↗
                </a>
              </p>
            );
          })()}
        </div>
      </div>

      {/* 2. Pristine 1-Page Order Receipt Document (Exclusively Rendered on Print/PDF) */}
      <OrderReceiptDocument orderData={orderData} />
    </>
  );
}
