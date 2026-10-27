import React from 'react';
import { BRAND } from '@/lib/constants';

export interface OrderReceiptItem {
  id: string;
  titleEn: string;
  volume: string;
  priceBdt: number;
  quantity: number;
}

export interface OrderReceiptData {
  orderId: string;
  customerName: string;
  phone: string;
  address: string;
  districtName: string;
  paymentMethod: string;
  totalBdt: number;
  subtotalBdt?: number;
  deliveryFeeBdt?: number;
  discountBdt?: number;
  items?: OrderReceiptItem[];
  createdAt?: string;
  estimatedDays?: string;
  supportPhone?: string;
  supportWhatsApp?: string;
}

interface OrderReceiptDocumentProps {
  orderData: OrderReceiptData;
}

export function OrderReceiptDocument({ orderData }: OrderReceiptDocumentProps) {
  const formattedDate = orderData.createdAt
    ? new Date(orderData.createdAt).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : new Date().toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });

  const subtotal = orderData.subtotalBdt || orderData.totalBdt;
  const delivery = orderData.deliveryFeeBdt ?? 0;
  const discount = orderData.discountBdt ?? 0;

  const items = orderData.items && orderData.items.length > 0
    ? orderData.items
    : [
        {
          id: 'primary-selection',
          titleEn: 'Skincare Item',
          volume: 'Standard',
          priceBdt: subtotal,
          quantity: 1,
        },
      ];

  return (
    <div
      id="seyven-order-receipt-document"
      className="hidden print:block bg-white text-[#1C1917] p-8 max-w-[210mm] mx-auto text-[11px] leading-relaxed font-sans"
      style={{ minHeight: '260mm', maxHeight: '272mm', boxSizing: 'border-box' }}
    >
      {/* 1. SEYVEN Header */}
      <div className="border-b border-[#1C1917] pb-5 mb-5 flex justify-between items-start">
        <div className="space-y-1">
          <span className="font-serif text-3xl tracking-[0.28em] font-normal uppercase text-[#1C1917]">
            S E Y V E N
          </span>
          <p className="text-[9px] uppercase tracking-[0.25em] text-[#C7A97B] font-medium">
            THE SANCTUARY OF BEAUTY
          </p>
          <p className="text-[9px] text-[#1C1917]/70 font-light tracking-wide">
            Dhaka, Bangladesh
          </p>
        </div>

        <div className="text-right space-y-1">
          <span className="inline-block px-2.5 py-1 bg-[#1C1917] text-[#F9F6F0] text-[9px] uppercase tracking-[0.25em] font-medium">
            ORDER RECEIPT
          </span>
          <p className="font-mono text-xs font-semibold text-[#1C1917] tracking-wider pt-1">
            {orderData.orderId}
          </p>
          <p className="text-[9px] text-[#1C1917]/70 tracking-wider">
            Date: {formattedDate}
          </p>
        </div>
      </div>

      {/* 2. Customer & Delivery Info */}
      <div className="grid grid-cols-2 gap-6 p-4 bg-[#F9F6F0] border border-[#E6DFD5] mb-5">
        <div className="space-y-1">
          <span className="text-[9px] uppercase tracking-[0.2em] font-semibold text-[#C7A97B] block">
            DELIVER TO
          </span>
          <p className="font-serif text-sm font-medium text-[#1C1917]">
            {orderData.customerName}
          </p>
          <p className="text-[#1C1917]/80 text-[10px] leading-snug">
            {orderData.address}
          </p>
          <p className="text-[#1C1917]/80 text-[10px] uppercase tracking-wider font-medium">
            {orderData.districtName}, Bangladesh
          </p>
          <p className="font-mono text-[10px] text-[#1C1917]/70 pt-0.5">
            Phone: {orderData.phone}
          </p>
        </div>

        <div className="space-y-1 text-right">
          <span className="text-[9px] uppercase tracking-[0.2em] font-semibold text-[#C7A97B] block">
            PAYMENT &amp; DISPATCH
          </span>
          <p className="font-serif text-sm font-medium text-[#1C1917]">
            {orderData.paymentMethod === 'COD'
              ? 'Cash on Delivery'
              : orderData.paymentMethod === 'BKASH'
              ? 'bKash Online'
              : 'Online Payment'}
          </p>
          {orderData.estimatedDays && (
            <p className="text-[9px] uppercase tracking-wider text-[#C7A97B] pt-0.5">
              Estimated Transit: {orderData.estimatedDays}
            </p>
          )}
        </div>
      </div>

      {/* 3. Products Table */}
      <div className="mb-5">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[#1C1917] text-[9px] uppercase tracking-[0.2em] text-[#1C1917]/70">
              <th className="py-2 font-medium w-8">#</th>
              <th className="py-2 font-medium">PRODUCT</th>
              <th className="py-2 font-medium text-center w-24">SIZE</th>
              <th className="py-2 font-medium text-center w-16">QTY</th>
              <th className="py-2 font-medium text-right w-28">PRICE (BDT)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E6DFD5] text-[10px]">
            {items.map((item, idx) => (
              <tr key={item.id || idx}>
                <td className="py-2.5 font-mono text-[#C7A97B] text-[9px]">
                  0{idx + 1}
                </td>
                <td className="py-2.5 font-medium text-[#1C1917]">
                  {item.titleEn}
                </td>
                <td className="py-2.5 text-center text-[#1C1917]/70 font-mono text-[9px]">
                  {item.volume || 'Standard'}
                </td>
                <td className="py-2.5 text-center font-mono text-[#1C1917]">
                  {item.quantity}
                </td>
                <td className="py-2.5 text-right font-mono font-medium text-[#1C1917]">
                  ৳{Math.round(item.priceBdt * item.quantity).toLocaleString('en-IN')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 4. Financial Summary */}
      <div className="flex justify-end pt-3 border-t border-[#1C1917] mb-6">
        <div className="w-64 space-y-1.5 text-[10px]">
          <div className="flex justify-between py-1 border-b border-[#E6DFD5]">
            <span className="text-[#1C1917]/70 uppercase tracking-wider text-[9px]">Subtotal</span>
            <span className="font-mono text-[#1C1917]">৳{Math.round(subtotal).toLocaleString('en-IN')}</span>
          </div>
          <div className="flex justify-between py-1 border-b border-[#E6DFD5]">
            <span className="text-[#1C1917]/70 uppercase tracking-wider text-[9px]">Delivery</span>
            <span className="font-mono text-[#1C1917]">
              {delivery === 0 ? 'Free Delivery' : `৳${delivery}`}
            </span>
          </div>
          {discount > 0 && (
            <div className="flex justify-between py-1 border-b border-[#E6DFD5] text-emerald-800">
              <span className="uppercase tracking-wider text-[9px]">Discount</span>
              <span className="font-mono">-৳{Math.round(discount).toLocaleString('en-IN')}</span>
            </div>
          )}
          <div className="flex justify-between pt-2 text-sm font-medium">
            <span className="font-serif uppercase tracking-[0.2em] text-[#1C1917]">Total</span>
            <span className="font-sans font-semibold text-[#1C1917] tabular-nums tracking-tight">
              <span className="text-xs text-[#C7A97B] mr-0.5">৳</span>
              {Math.round(orderData.totalBdt).toLocaleString('en-IN')}
            </span>
          </div>
        </div>
      </div>

      {/* 5. Simple Footer */}
      <div className="pt-4 border-t border-[#E6DFD5] flex items-center justify-between text-[9px] text-[#1C1917]/70">
        <div className="space-y-0.5">
          <p className="font-serif uppercase tracking-widest text-[#1C1917] font-medium text-[10px]">
            SEYVEN
          </p>
          <p className="text-[8.5px]">
            Customer Care: {BRAND.supportEmail} &bull; {orderData.supportWhatsApp || orderData.supportPhone || BRAND.supportWhatsApp}
          </p>
          <p className="text-[8px] text-[#1C1917]/50">
            {BRAND.registeredAddress} &bull; www.theseyven.com
          </p>
        </div>

        <div className="text-right space-y-0.5">
          <p className="font-mono text-[8px] text-[#1C1917]/60">
            Order Ref: {orderData.orderId}
          </p>
          <p className="text-[8px] uppercase tracking-wider text-[#C7A97B] font-medium">
            SEYVEN • THE SANCTUARY OF BEAUTY
          </p>
        </div>
      </div>
    </div>
  );
}
