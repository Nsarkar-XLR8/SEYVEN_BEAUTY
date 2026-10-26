'use client';

import React from 'react';
import { AdminOrder } from '@/types/admin';
import { formatBdt } from '@/lib/formatters';
import { Barcode128 } from '../barcode/barcode-128';

interface ThermalShippingLabelProps {
  order: AdminOrder;
  isPrintOnly?: boolean;
}

export function ThermalShippingLabel({ order, isPrintOnly = false }: ThermalShippingLabelProps) {
  const carrierName = (order.courier || 'Pathao').toUpperCase();
  const consignmentCode =
    order.consignmentId ||
    `${carrierName === 'STEADFAST' ? 'SF' : 'PT'}-${order.id.replace(/[^0-9]/g, '').slice(-6) || '991204'}`;
  const isCod = order.paymentMethod === 'COD';

  return (
    <div
      className={`bg-white text-black font-mono select-none box-border flex flex-col justify-between ${
        isPrintOnly
          ? 'w-[100mm] h-[150mm] p-2 leading-tight'
          : 'w-full max-w-[380px] min-h-[540px] p-3 border-2 border-black rounded shadow-md text-xs'
      }`}
      style={{
        width: isPrintOnly ? '100mm' : undefined,
        height: isPrintOnly ? '150mm' : undefined,
        fontFamily: 'var(--font-mono), monospace',
        color: '#000000',
      }}
    >
      {/* ========================================================================= */}
      {/* ZONE 1: BRAND HEADER & COURIER ROUTING HUB                                */}
      {/* ========================================================================= */}
      <div className="border-b-2 border-black pb-1.5 mb-1.5 flex items-start justify-between">
        <div>
          <div className="font-serif font-black text-xl tracking-[0.18em] leading-none">SEYVEN</div>
          <div className="text-[8px] uppercase tracking-wider font-sans font-semibold text-black/90 mt-0.5">
            The Sanctuary of Beauty
          </div>
        </div>
        <div className="text-right">
          <div className="text-[9px] font-bold uppercase tracking-wider bg-black text-white px-1.5 py-0.5 rounded-xs inline-block">
            {carrierName} EXPRESS
          </div>
          <div className="text-[10px] font-black uppercase mt-0.5">
            {order.district || 'DHAKA'} · {order.zone || 'METRO'}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* ZONE 2: PRIMARY COURIER CONSIGNMENT CODE-128 BARCODE                      */}
      {/* ========================================================================= */}
      <div className="border-b border-black pb-1 mb-1 text-center">
        <div className="flex justify-center items-center py-0.5 overflow-hidden">
          <Barcode128
            value={consignmentCode}
            width={isPrintOnly ? 1.7 : 1.5}
            height={isPrintOnly ? 44 : 36}
            fontSize={10}
            margin={0}
          />
        </div>
      </div>

      {/* ========================================================================= */}
      {/* ZONE 3: SHIP TO / RECIPIENT INFORMATION (HIGH-CONTRAST FOR RIDER)         */}
      {/* ========================================================================= */}
      <div className="border-b-2 border-black pb-1.5 mb-1 text-[11px] space-y-0.5">
        <div className="text-[8px] uppercase font-bold text-black/70 tracking-wider">
          SHIP TO (RECIPIENT):
        </div>
        <div className="text-sm font-black uppercase tracking-wide leading-tight">
          {order.customerName}
        </div>
        <div className="text-sm font-black tracking-wider text-black bg-black/5 px-1 py-0.5 rounded-xs inline-block font-mono">
          ☎ {order.customerPhone}
        </div>
        <div className="text-[10px] font-medium leading-snug pt-0.5">
          {order.shippingAddress}
        </div>
        <div className="text-[9px] font-bold uppercase">
          DESTINATION: <span className="font-black">{order.district || 'DHAKA'}</span> ({order.zone || 'METRO'})
        </div>
      </div>

      {/* ========================================================================= */}
      {/* ZONE 4: COD FINANCIAL BANNER (CRISP HIGH-CONTRAST BOX)                    */}
      {/* ========================================================================= */}
      <div
        className={`border-2 border-black p-1.5 text-center mb-1 ${
          isCod ? 'bg-white' : 'bg-black text-white'
        }`}
      >
        <div className="text-[9px] font-black uppercase tracking-wider">
          {isCod ? '★ CASH ON DELIVERY (COD) ★' : '✓ 100% PREPAID SHIPMENT'}
        </div>
        <div className="text-xl font-black tracking-tight leading-none my-0.5">
          {isCod ? `COLLECT: ${formatBdt(order.totalAmount)}` : 'DO NOT COLLECT CASH (৳0)'}
        </div>
        <div className="text-[8px] font-bold uppercase tracking-wider">
          {isCod ? 'Rider: Collect exact BDT before handing over sealed parcel' : 'Payment verified online · Release to customer'}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* ZONE 5: ITEMIZED PACKAGE MANIFEST (PROVE CONTENTS TO CUSTOMER)            */}
      {/* ========================================================================= */}
      <div className="border-b border-black pb-1 mb-1 text-[9px] flex-1">
        <div className="flex items-center justify-between font-black uppercase text-[8px] border-b border-black/40 pb-0.5 mb-0.5">
          <span>ITEM / FORMULATION</span>
          <span>QTY</span>
        </div>
        <div className="space-y-0.5 max-h-[85px] overflow-hidden">
          {order.items.slice(0, 3).map((item, idx) => (
            <div key={idx} className="flex items-start justify-between text-[9px] leading-tight">
              <span className="truncate pr-2 font-medium">
                {idx + 1}. {item.title} {item.variant ? `(${item.variant})` : ''}
              </span>
              <span className="font-bold shrink-0">x{item.quantity}</span>
            </div>
          ))}
          {order.items.length > 3 && (
            <div className="text-[8px] italic text-black/70">
              + {order.items.length - 3} more formulation(s)...
            </div>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* ZONE 6: INTERNAL ORDER BARCODE & RETURN-TO-ORIGIN (RTO)                   */}
      {/* ========================================================================= */}
      <div className="pt-0.5 text-center">
        <div className="flex justify-center items-center py-0.5 overflow-hidden">
          <Barcode128
            value={order.id}
            width={isPrintOnly ? 1.3 : 1.1}
            height={isPrintOnly ? 26 : 22}
            fontSize={9}
            margin={0}
          />
        </div>
        <div className="text-[7.5px] uppercase font-bold tracking-tight text-black/80 mt-0.5">
          Return: SEYVEN Hub, Road 11, Tejgaon I/A, Dhaka-1208 · Helpline: 01700-000000
        </div>
        <div className="text-[7px] tracking-wider text-black/60 uppercase font-sans">
          SEYVEN · The Sanctuary of Beauty
        </div>
      </div>
    </div>
  );
}
