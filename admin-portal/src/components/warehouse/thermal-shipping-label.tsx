'use client';

import React from 'react';
import { AdminOrder } from '@/types/admin';
import { formatBdt } from '@/lib/formatters';
import { Barcode128 } from '../barcode/barcode-128';
import { useAdmin } from '@/context/admin-context';

export interface ThermalShippingLabelProps {
  order: AdminOrder;
  isPrintOnly?: boolean;
  courierOverride?: 'Pathao' | 'Steadfast';
  paperPreset?: '4x6' | '80mm' | 'auto';
}

const BD_DISTRICT_KEYWORDS: Array<{ en: string; bn: string; hub: string }> = [
  { en: 'manikganj', bn: 'মানিকগঞ্জ', hub: 'MANIKGANJ HUB' },
  { en: 'gazipur', bn: 'গাজীপুর', hub: 'GAZIPUR HUB' },
  { en: 'narayanganj', bn: 'নারায়ণগঞ্জ', hub: 'NARAYANGANJ HUB' },
  { en: 'chattogram', bn: 'চট্টগ্রাম', hub: 'CHATTOGRAM HUB' },
  { en: 'sylhet', bn: 'সিলেট', hub: 'SYLHET HUB' },
  { en: 'rajshahi', bn: 'রাজশাহী', hub: 'RAJSHAHI HUB' },
  { en: 'khulna', bn: 'খুলনা', hub: 'KHULNA HUB' },
  { en: 'barishal', bn: 'বরিশাল', hub: 'BARISHAL HUB' },
  { en: 'rangpur', bn: 'রংপুর', hub: 'RANGPUR HUB' },
  { en: 'mymensingh', bn: 'ময়মনসিংহ', hub: 'MYMENSINGH HUB' },
  { en: 'cumilla', bn: 'কুমিল্লা', hub: 'CUMILLA HUB' },
  { en: 'bogura', bn: 'বগুড়া', hub: 'BOGURA HUB' },
  { en: 'tangail', bn: 'টাঙ্গাইল', hub: 'TANGAIL HUB' },
  { en: 'faridpur', bn: 'ফরিদপুর', hub: 'FARIDPUR HUB' },
  { en: 'feni', bn: 'ফেনী', hub: 'FENI HUB' },
  { en: 'noakhali', bn: 'নোয়াখালী', hub: 'NOAKHALI HUB' },
  { en: 'pabna', bn: 'পাবনা', hub: 'PABNA HUB' },
  { en: 'jashore', bn: 'যশোর', hub: 'JASHORE HUB' },
  { en: 'kushtia', bn: 'কুষ্টিয়া', hub: 'KUSHTIA HUB' },
  { en: 'savar', bn: 'সাভার', hub: 'SAVAR HUB' },
  { en: 'keraniganj', bn: 'কেরানীগঞ্জ', hub: 'KERANIGANJ HUB' },
  { en: 'uttara', bn: 'উত্তরা', hub: 'DHAKA NORTH HUB' },
  { en: 'mirpur', bn: 'মিরপুর', hub: 'DHAKA NORTH HUB' },
  { en: 'gulshan', bn: 'গুলশান', hub: 'DHAKA NORTH HUB' },
  { en: 'banani', bn: 'বনানী', hub: 'DHAKA NORTH HUB' },
  { en: 'dhanmondi', bn: 'ধানমন্ডি', hub: 'DHAKA SOUTH HUB' },
  { en: 'badda', bn: 'বাড্ডা', hub: 'DHAKA NORTH HUB' },
  { en: 'mohammadpur', bn: 'মোহাম্মদপুর', hub: 'DHAKA WEST HUB' },
  { en: 'old dhaka', bn: 'পুরান ঢাকা', hub: 'DHAKA SOUTH HUB' },
];

/**
 * Intelligent Bangladesh Courier Routing Parser.
 * Formats authentic Hub & Area routing matching Pathao & Steadfast logistics hubs.
 */
function parseCourierRouting(district?: string, zone?: string, address?: string) {
  const d = (district || '').trim();
  const z = (zone || '').trim();
  const addr = (address || '').trim();
  const fullText = `${d} ${z} ${addr}`.toLowerCase();

  const isInsideDhaka = /inside\s*dhaka/i.test(d) || /inside\s*dhaka/i.test(z);

  // Check for specific BD district hub match
  let detectedDistrictHub = '';
  for (const item of BD_DISTRICT_KEYWORDS) {
    if (fullText.includes(item.en) || fullText.includes(item.bn)) {
      detectedDistrictHub = item.hub;
      break;
    }
  }

  let hub = detectedDistrictHub || (isInsideDhaka ? 'DHAKA METRO' : 'NATIONWIDE (ALL BD)');
  if (!detectedDistrictHub && d && !/inside|outside/i.test(d)) {
    hub = `${d.toUpperCase()} HUB`;
  }

  // Detect Sub-Zone / Thana
  let area = '';
  if (/সদর|sadar/i.test(fullText)) {
    const hubBase = hub.replace(/\s+HUB$/i, '');
    area = `${hubBase} SADAR`;
  } else if (z && !/inside|outside/i.test(z) && z.toUpperCase() !== hub) {
    area = z.toUpperCase();
  } else if (addr) {
    const segments = addr.split(',').map((s) => s.trim()).filter(Boolean);
    if (segments.length > 0) {
      area = segments[segments.length - 1].toUpperCase();
    }
  }

  return {
    hubBadge: hub,
    areaBadge: area || (isInsideDhaka ? 'DHAKA NORTH HUB' : 'OUTSTATION HUB'),
  };
}

export function ThermalShippingLabel({
  order,
  isPrintOnly = false,
  courierOverride,
  paperPreset = '80mm',
}: ThermalShippingLabelProps) {
  // Safe extraction of platform settings from AdminContext
  let adminCtx: any = null;
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    adminCtx = useAdmin();
  } catch {}

  const effectiveCourier =
    courierOverride || (order.courier?.toLowerCase() === 'steadfast' ? 'Steadfast' : 'Pathao');
  const isSteadfast = effectiveCourier.toLowerCase() === 'steadfast';
  const carrierName = isSteadfast ? 'STEADFAST COURIER' : 'PATHAO EXPRESS';

  const defaultPrefix = isSteadfast ? 'SF' : 'PT';
  const numericSuffix = order.id.replace(/[^0-9]/g, '').slice(-6) || '991204';
  const consignmentCode = order.consignmentId || `${defaultPrefix}-${numericSuffix}`;

  const isCod = order.paymentMethod === 'COD';
  const routing = parseCourierRouting(order.district, order.zone, order.shippingAddress);

  // Approximate weight calculation based on item quantity
  const totalQty = order.items.reduce((sum, item) => sum + (item.quantity || 1), 0);
  const estWeightKg = Math.max(0.5, +(totalQty * 0.25).toFixed(1));

  // Dynamic Helpline & RTO Address SSOT
  let supportPhone = adminCtx?.platformSettings?.supportPhone || '01577 071997';
  let returnAddress = adminCtx?.platformSettings?.registeredAddress || 'SEYVEN Hub, KB Saha Rd, Narayanganj 1400';

  if (typeof window !== 'undefined' && !adminCtx?.platformSettings?.supportPhone) {
    try {
      const cached = localStorage.getItem('seyven_platform_settings');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed.supportPhone && parsed.supportPhone.trim()) {
          supportPhone = parsed.supportPhone.trim();
        }
        if (parsed.registeredAddress && parsed.registeredAddress.trim()) {
          returnAddress = parsed.registeredAddress.trim();
        }
      }
    } catch {}
  }

  const is80mm = paperPreset === '80mm';

  return (
    <div
      className={`bg-white text-black font-mono select-none box-border flex flex-col justify-between ${
        isPrintOnly
          ? is80mm
            ? 'w-[80mm] max-w-[80mm] p-2 leading-tight'
            : 'w-[100mm] h-[150mm] p-2 leading-tight'
          : is80mm
            ? 'w-full max-w-[320px] min-h-[500px] p-2.5 border-2 border-black rounded shadow-md text-[11px]'
            : 'w-full max-w-[380px] min-h-[560px] p-3 border-2 border-black rounded shadow-md text-xs'
      }`}
      style={{
        width: isPrintOnly ? (is80mm ? '80mm' : '100mm') : undefined,
        height: isPrintOnly ? (is80mm ? 'auto' : '150mm') : undefined,
        maxWidth: isPrintOnly ? (is80mm ? '80mm' : '100mm') : undefined,
        fontFamily: 'var(--font-mono), monospace',
        color: '#000000',
        backgroundColor: '#ffffff',
      }}
    >
      {/* ========================================================================= */}
      {/* ZONE 1: BRAND HEADER & DYNAMIC COURIER ROUTING HUB                        */}
      {/* ========================================================================= */}
      <div className="border-b-2 border-black pb-1 mb-1 flex items-start justify-between">
        <div>
          <div className={`font-serif font-black ${is80mm ? 'text-lg' : 'text-xl'} tracking-[0.16em] leading-none`}>
            SEYVEN
          </div>
          <div className="text-[7.5px] uppercase tracking-wider font-sans font-semibold text-black/80 mt-0.5">
            The Sanctuary of Beauty
          </div>
        </div>
        <div className="text-right">
          <div className="text-[8.5px] font-black uppercase tracking-wider bg-black text-white px-2 py-0.5 rounded-xs inline-block">
            {carrierName}
          </div>
          <div className={`${is80mm ? 'text-[9px]' : 'text-[10px]'} font-black uppercase mt-0.5 text-black`}>
            {routing.hubBadge} · {routing.areaBadge}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* ZONE 2: PRIMARY COURIER CONSIGNMENT CODE-128 BARCODE                      */}
      {/* ========================================================================= */}
      <div className="border-b-2 border-black pb-1 mb-1 text-center bg-white">
        <div className="flex justify-center items-center py-1 px-1 overflow-hidden">
          <Barcode128
            value={consignmentCode}
            width={is80mm ? (isPrintOnly ? 1.3 : 1.2) : (isPrintOnly ? 1.7 : 1.5)}
            height={is80mm ? (isPrintOnly ? 32 : 28) : (isPrintOnly ? 42 : 36)}
            fontSize={is80mm ? 9 : 10}
            margin={0}
          />
        </div>
      </div>

      {/* ========================================================================= */}
      {/* ZONE 3: SHIP TO / RECIPIENT INFORMATION (HIGH CONTRAST FOR RIDER)         */}
      {/* ========================================================================= */}
      <div className="border-b-2 border-black pb-1 mb-1 text-[10.5px] space-y-0.5">
        <div className="flex items-center justify-between text-[7.5px] uppercase font-bold text-black/70 tracking-wider">
          <span>DELIVER TO (RECIPIENT):</span>
          <span className="font-mono text-black font-semibold">REF: {order.referenceNo || order.id}</span>
        </div>
        <div className={`${is80mm ? 'text-xs' : 'text-sm'} font-black uppercase tracking-wide leading-tight`}>
          {order.customerName}
        </div>
        <div className={`${is80mm ? 'text-xs' : 'text-sm'} font-black tracking-wider text-black bg-black/10 px-2 py-0.5 rounded border border-black/30 inline-block font-mono`}>
          ☎ {order.customerPhone}
        </div>
        <div className="text-[9.5px] font-medium leading-snug pt-0.5 break-words">
          {order.shippingAddress}
        </div>
        <div className="text-[8.5px] font-bold uppercase text-black/90">
          HUB ROUTE: <span className="font-black text-black">{routing.hubBadge}</span> · ZONE: <span className="font-black text-black">{routing.areaBadge}</span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* ZONE 4: COD FINANCIAL BANNER (CRISP HIGH-CONTRAST BOX)                    */}
      {/* ========================================================================= */}
      <div
        className={`border-2 border-black p-1 text-center mb-1 ${
          isCod ? 'bg-white' : 'bg-black text-white'
        }`}
      >
        <div className="text-[8.5px] font-black uppercase tracking-wider">
          {isCod ? '★ CASH ON DELIVERY (COD) ★' : '✓ 100% PREPAID SHIPMENT'}
        </div>
        <div className={`${is80mm ? 'text-xl' : 'text-2xl'} font-black tracking-tight leading-none my-1 font-mono`}>
          {isCod ? `COLLECT: ${formatBdt(order.totalAmount)}` : 'DO NOT COLLECT CASH (৳0)'}
        </div>
        <div className="text-[7.5px] font-bold uppercase tracking-wider">
          {isCod ? 'Rider: Collect exact cash in BDT before releasing parcel' : 'Payment verified online · Release sealed parcel to customer'}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* ZONE 5: ITEMIZED PACKAGE MANIFEST (PROVE CONTENTS TO CUSTOMER)            */}
      {/* ========================================================================= */}
      <div className="border-b border-black pb-1 mb-1 text-[8.5px] flex-1 min-h-[55px]">
        <div className="grid grid-cols-12 font-black uppercase text-[7.5px] border-b border-black/50 pb-0.5 mb-0.5">
          <span className="col-span-10">PACKAGE CONTENTS & MANIFEST</span>
          <span className="col-span-2 text-right">QTY</span>
        </div>
        <div className="space-y-0.5">
          {order.items.slice(0, 4).map((item, idx) => (
            <div key={idx} className="grid grid-cols-12 text-[8.5px] leading-tight items-start py-0.5">
              <span className="col-span-10 truncate pr-1 font-medium">
                {idx + 1}. {item.title} {item.variant ? `(${item.variant})` : ''}
              </span>
              <span className="col-span-2 text-right font-bold shrink-0">x{item.quantity}</span>
            </div>
          ))}
          {order.items.length > 4 && (
            <div className="text-[7.5px] italic text-black/70 pt-0.5">
              + {order.items.length - 4} more formulation(s)...
            </div>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* ZONE 6: INTERNAL ORDER BARCODE & OFFICIAL SEYVEN RETURN (RTO)             */}
      {/* ========================================================================= */}
      <div className="pt-0.5 text-center">
        <div className="flex items-center justify-between text-[7.5px] font-black uppercase px-1 border-b border-black/30 pb-0.5 mb-0.5">
          <span>ORDER ID: {order.id}</span>
          <span>EST. WEIGHT: {estWeightKg} KG</span>
        </div>
        <div className="flex justify-center items-center py-0.5 overflow-hidden">
          <Barcode128
            value={order.id}
            width={is80mm ? (isPrintOnly ? 1.0 : 0.95) : (isPrintOnly ? 1.3 : 1.1)}
            height={is80mm ? (isPrintOnly ? 20 : 16) : (isPrintOnly ? 24 : 20)}
            fontSize={is80mm ? 8 : 9}
            margin={0}
          />
        </div>
        <div className="text-[7.5px] uppercase font-bold tracking-tight text-black mt-0.5 leading-tight">
          RETURN (RTO): {returnAddress}
        </div>
        <div className="text-[7.5px] tracking-wider text-black/80 uppercase font-sans mt-0.5 font-bold">
          HELPLINE: {supportPhone} · SEYVEN — The Sanctuary of Beauty
        </div>
      </div>
    </div>
  );
}
