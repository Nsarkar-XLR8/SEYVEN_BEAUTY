'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, Copy, Check, Download, Truck, ArrowRight, Phone } from 'lucide-react';
import { useLanguage } from '@/context/language-context';
import { OrderReceiptDocument, OrderReceiptData } from './order-receipt-document';
import { generateAndDownloadSeyvenReceipt } from '@/lib/pdf-generator';

interface CheckoutSuccessViewProps {
  orderData: OrderReceiptData;
}

export function CheckoutSuccessView({ orderData }: CheckoutSuccessViewProps) {
  const { lang, t } = useLanguage();
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
    { labelEn: 'ORDER PLACED', labelBn: 'অর্ডার গৃহিত', completed: true },
    { labelEn: 'ORDER CONFIRMED', labelBn: 'অর্ডার নিশ্চিত', completed: true },
    { labelEn: 'PRISTINE PACKING', labelBn: 'প্যাকিং', completed: false },
    { labelEn: 'EXPRESS DISPATCH', labelBn: 'ডেলিভারি', completed: false },
  ];

  return (
    <>
      {/* 1. Screen Interactive Confirmation View (Suppressed on Print) */}
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
            {t('YOUR REGIMEN IS BEING PREPARED', 'আপনার অর্ডারটি সফলভাবে গ্রহণ করা হয়েছে')}
          </h1>

          <p className="text-xs sm:text-sm text-[#1C1917]/75 font-light max-w-lg mx-auto leading-relaxed">
            {t(
              'Thank you for your order. We are carefully preparing your selected skincare items for prompt delivery to your doorstep.',
              'ধন্যবাদ! আপনার অর্ডারটি নিশ্চিত করা হয়েছে। আপনার পছন্দের স্কিনকেয়ার পণ্যগুলো যত্নের সাথে প্যাক করে দ্রুত পাঠিয়ে দেওয়া হচ্ছে।'
            )}
          </p>
        </div>

        {/* Order Tracking ID Card */}
        <div className="p-4 sm:p-6 bg-[#F9F6F0] border border-[#E6DFD5] space-y-4 text-center">
          <span className="text-[10px] uppercase tracking-[0.2em] text-[#1C1917]/60 block">
            {t('OFFICIAL SEYVEN ORDER IDENTIFIER', 'অর্ডার ট্র্যাকিং আইডি')}
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
            {t(
              'A confirmation SMS has been dispatched to your phone number.',
              'আপনার মোবাইল নম্বরে অর্ডার নিশ্চিতকরণ সংক্রান্ত একটি এসএমএস পাঠানো হয়েছে।'
            )}
          </p>
        </div>

        {/* Visual Status Progress Rail */}
        <div className="p-6 bg-[#F9F6F0] border border-[#E6DFD5] space-y-4">
          <h3 className="text-xs font-serif uppercase tracking-[0.2em] text-[#1C1917] font-medium text-center sm:text-left">
            {t('DISPATCH PROGRESSION TIMELINE', 'ডেলিভারি ট্র্যাকিং পর্যায়')}
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
                  {lang === 'bn' ? st.labelBn : st.labelEn}
                </p>
              </div>
            ))}
          </div>

          <div className="pt-3 border-t border-[#E6DFD5] flex items-center justify-between text-xs text-[#1C1917]/80">
            <div className="flex items-center space-x-2">
              <Truck className="w-4 h-4 text-[#C7A97B]" />
              <span>
                {t('Estimated Arrival: ', 'সম্ভাব্য পৌঁছানোর সময়: ')}
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
              {t('DELIVERY DESTINATION', 'ডেলিভারি ঠিকানা')}
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
              {t('PAYMENT COMMITMENT', 'পেমেন্ট ও বিল')}
            </span>
            <p className="font-serif font-medium text-[#1C1917] text-sm">
              {orderData.paymentMethod === 'COD'
                ? t('Cash on Delivery', 'ক্যাশ অন ডেলিভারি')
                : orderData.paymentMethod === 'BKASH'
                ? t('bKash Tokenized Checkout', 'বিকাশ অনলাইন পেমেন্ট')
                : t('Credit / Debit Card (SSLCommerz)', 'কার্ড পেমেন্ট')}
            </p>
            <p className="text-base font-sans font-semibold text-[#1C1917] tabular-nums pt-1">
              <span className="text-xs font-normal text-[#C7A97B] mr-0.5">৳</span>
              {Math.round(orderData.totalBdt).toLocaleString('en-IN')}
            </p>
            <span className="text-[9px] uppercase tracking-wider text-emerald-800 block">
              {t('Includes All Statutory Taxes & Packaging', 'সকল ট্যাক্স ও লাক্সারি প্যাকেজিং অন্তর্ভুক্ত')}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2 pt-4">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href={`/track-order?id=${orderData.orderId}&phone=${encodeURIComponent(orderData.phone || '')}`}
              className="w-full sm:w-auto px-8 py-3.5 bg-[#1C1917] text-[#F9F6F0] text-xs uppercase tracking-[0.25em] font-medium hover:bg-[#1C1917]/90 transition-colors flex items-center justify-center space-x-2"
            >
              <span>{t('TRACK PARCEL LIVE', 'অর্ডার ট্র্যাক করুন')}</span>
              <ArrowRight className="w-3.5 h-3.5 text-[#C7A97B]" />
            </Link>
            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={isDownloading}
              className="w-full sm:w-auto px-6 py-3.5 border border-[#1C1917] text-[#1C1917] text-xs uppercase tracking-[0.25em] font-medium hover:bg-[#1C1917] hover:text-[#F9F6F0] transition-colors flex items-center justify-center space-x-2 group disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5 text-[#C7A97B] group-hover:scale-110 transition-transform" />
              <span>
                {isDownloading
                  ? t('DOWNLOADING PDF...', 'ডাউনলোড হচ্ছে...')
                  : t('DOWNLOAD ORDER RECEIPT (PDF)', 'ডাউনলোড অর্ডার রসিদ (PDF)')}
              </span>
            </button>
          </div>
          <p className="text-[9px] uppercase tracking-[0.2em] text-[#1C1917]/50 text-center font-mono">
            {t('Direct 1-page receipt download', 'সহজ ১-পৃষ্ঠার রসিদ ডাউনলোড')}
          </p>
        </div>

        {/* Direct WhatsApp Concierge Help */}
        <div className="text-center pt-2">
          <p className="text-xs text-[#1C1917]/70 flex items-center justify-center space-x-1.5">
            <Phone className="w-3.5 h-3.5 text-[#C7A97B]" />
            <span>
              {t(
                'Questions regarding delivery? WhatsApp Concierge: +880 1700 000000',
                'ডেলিভারি সংক্রান্ত যেকোনো সহায়তায় হোয়াটসঅ্যাপ করুন: +৮৮০ ১৭০০ ০০০০০০'
              )}
            </span>
          </p>
        </div>
      </div>

      {/* 2. Pristine 1-Page Order Receipt Document (Exclusively Rendered on Print/PDF) */}
      <OrderReceiptDocument orderData={orderData} />
    </>
  );
}
