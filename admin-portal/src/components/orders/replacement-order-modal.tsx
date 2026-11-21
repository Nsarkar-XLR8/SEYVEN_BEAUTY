'use client';

import React, { useState } from 'react';
import {
  X,
  RotateCcw,
  Gift,
  ShieldCheck,
  AlertCircle,
  Truck,
  CheckCircle2,
  Package,
  Plus,
  Trash2,
} from 'lucide-react';
import { useAdmin } from '@/context/admin-context';
import { AdminOrder, OrderItem } from '@/types/admin';
import { formatBdt } from '@/lib/formatters';

interface ReplacementOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  sourceOrder: AdminOrder;
  onSuccess?: (replacementOrder: AdminOrder) => void;
}

const DEFECT_REASONS = [
  { id: 'FACTORY_SEALED_DEFECT', label: 'Factory Defect inside Seal (Broken/Molten Stick/Mechanism)' },
  { id: 'TRANSIT_DAMAGE', label: 'Transit Damage / Leakage in Parcel' },
  { id: 'WRONG_ITEM', label: 'Wrong Item / Formulation Dispatched' },
  { id: 'VIP_COURTESY', label: 'VIP Executive Courtesy Reshipment' },
];

export function ReplacementOrderModal({
  isOpen,
  onClose,
  sourceOrder,
  onSuccess,
}: ReplacementOrderModalProps) {
  const { createReplacementOrder, products } = useAdmin();

  // Selection of items from source order
  const [selectedItemIds, setSelectedItemIds] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    // Pre-select items (if WishCare or any, let admin pick)
    sourceOrder.items.forEach((it, idx) => {
      // If title includes wishcare or lip balm, pre-select it
      if (it.title.toLowerCase().includes('wishcare') || it.title.toLowerCase().includes('lip balm') || idx === 0) {
        initial[it.id] = true;
      }
    });
    return initial;
  });

  const [quantities, setQuantities] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    sourceOrder.items.forEach((it) => {
      initial[it.id] = 1;
    });
    return initial;
  });

  // Complimentary Gift State
  const [includeMarsGift, setIncludeMarsGift] = useState<boolean>(true);
  const [customGiftTitle, setCustomGiftTitle] = useState<string>('');
  const [extraGifts, setExtraGifts] = useState<Array<{ id: string; title: string; quantity: number }>>([]);

  // Defect details
  const [defectReason, setDefectReason] = useState<string>(
    'Factory Defect inside Seal (Broken/Molten Stick/Mechanism)',
  );
  const [staffNote, setStaffNote] = useState<string>(
    'Customer informed of factory lip balm defect. Customer keeps defective unit. Replacement unsealed and QA-inspected with customer consent before packing.',
  );
  const [qaInspectionAgreed, setQaInspectionAgreed] = useState<boolean>(true);

  // Address (default to original order address, editable)
  const [shippingAddress, setShippingAddress] = useState<string>(sourceOrder.shippingAddress || '');
  const [customerPhone, setCustomerPhone] = useState<string>(sourceOrder.customerPhone || '');
  const [district, setDistrict] = useState<string>(sourceOrder.district || 'Dhaka');

  // Auto courier booking toggle
  const [autoBookPathao, setAutoBookPathao] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const toggleItem = (id: string) => {
    setSelectedItemIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleAddExtraGift = () => {
    if (!customGiftTitle.trim()) return;
    setExtraGifts((prev) => [
      ...prev,
      { id: `gift-${Date.now()}`, title: customGiftTitle.trim(), quantity: 1 },
    ]);
    setCustomGiftTitle('');
  };

  const handleRemoveExtraGift = (giftId: string) => {
    setExtraGifts((prev) => prev.filter((g) => g.id !== giftId));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate that at least one replacement item or gift is selected
    const replacementItems: OrderItem[] = [];

    sourceOrder.items.forEach((it) => {
      if (selectedItemIds[it.id]) {
        replacementItems.push({
          ...it,
          quantity: quantities[it.id] || 1,
          unitPrice: 0,
          totalPrice: 0,
        });
      }
    });

    if (includeMarsGift) {
      replacementItems.push({
        id: `gift-mars-eyeliner-${Date.now()}`,
        sku: 'GIFT-MARS-EYELINER',
        title: 'MARS Eyeliner (Complimentary Apology Gift)',
        brand: 'MARS',
        variant: 'Black',
        quantity: 1,
        unitPrice: 0,
        totalPrice: 0,
        isGwp: true,
      });
    }

    extraGifts.forEach((g, idx) => {
      replacementItems.push({
        id: g.id || `extra-gift-${idx}`,
        sku: `GIFT-EXTRA-${idx + 1}`,
        title: `${g.title} (Complimentary Gift)`,
        brand: 'SEYVEN Courtesy',
        variant: 'Standard',
        quantity: g.quantity || 1,
        unitPrice: 0,
        totalPrice: 0,
        isGwp: true,
      });
    });

    if (replacementItems.length === 0) {
      setError('Please select at least one item or gift to dispatch.');
      return;
    }

    if (!shippingAddress.trim()) {
      setError('Shipping address is required for dispatch.');
      return;
    }

    setIsSubmitting(true);
    try {
      const combinedNotes = [
        staffNote.trim(),
        qaInspectionAgreed ? '[QA: Seal inspected per client agreement]' : null,
      ]
        .filter(Boolean)
        .join(' | ');

      const newOrder = await createReplacementOrder({
        sourceOrderId: sourceOrder.id,
        items: replacementItems,
        customerName: sourceOrder.customerName,
        customerPhone: customerPhone.trim(),
        customerEmail: sourceOrder.customerEmail,
        shippingAddress: shippingAddress.trim(),
        zone: district,
        district: district,
        defectReason,
        agentNotes: combinedNotes,
        autoBookPathao,
      });

      if (onSuccess) {
        onSuccess(newOrder);
      }
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to issue replacement order');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white border border-[#E6DFD5] rounded-xl shadow-2xl overflow-hidden my-6 flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-[#1C1917] text-[#F9F6F0] flex items-center justify-between border-b border-[#C7A97B]/30">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-full bg-[#C7A97B]/20 border border-[#C7A97B]/40 flex items-center justify-center text-[#C7A97B]">
              <RotateCcw className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-mono tracking-widest text-[#C7A97B]">
                Luxury Brand Recovery Desk
              </span>
              <h3 className="font-serif text-lg font-bold">Issue Complimentary Replacement</h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded text-[#F9F6F0]/70 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1 text-[#1C1917]">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg text-xs flex items-center gap-2 font-mono">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {/* Service Recovery Paradox Banner */}
          <div className="p-3.5 bg-[#FAF8F5] border border-[#C7A97B]/40 rounded-lg flex items-start space-x-3 text-xs">
            <ShieldCheck className="w-5 h-5 text-[#C7A97B] shrink-0 mt-0.5" />
            <div className="space-y-1">
              <strong className="text-[#1C1917] font-semibold block">
                White-Glove Customer Recovery Protocol
              </strong>
              <p className="text-[#1C1917]/70 text-[11px] leading-relaxed">
                Replacement parcel will be created at <strong>৳0 COD</strong> with immediate warehouse priority.
                Customer keeps the defective product. Zero delivery fees applied to customer.
              </p>
            </div>
          </div>

          {/* Source Order & Customer Overview */}
          <div className="grid grid-cols-2 gap-3 p-3 bg-[#F9F6F0] border border-[#E6DFD5] rounded-lg text-xs font-mono">
            <div>
              <span className="text-[9px] uppercase text-[#1C1917]/50 block">Source Order Ref</span>
              <span className="font-bold text-[#1C1917]">#{sourceOrder.id}</span>
            </div>
            <div>
              <span className="text-[9px] uppercase text-[#1C1917]/50 block">Customer</span>
              <span className="font-bold text-[#1C1917]">{sourceOrder.customerName}</span>
            </div>
          </div>

          {/* Select Items from Original Order to Replace */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-[#1C1917] block font-mono">
              1. Select Defective Product(s) to Replace:
            </label>
            <div className="border border-[#E6DFD5] rounded-lg divide-y divide-[#E6DFD5] bg-white">
              {sourceOrder.items.map((it) => {
                const isSelected = !!selectedItemIds[it.id];
                return (
                  <div
                    key={it.id}
                    onClick={() => toggleItem(it.id)}
                    className={`p-3 flex items-center justify-between cursor-pointer transition-colors ${
                      isSelected ? 'bg-amber-50/50' : 'hover:bg-stone-50'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {}}
                        className="w-4 h-4 accent-[#C7A97B] rounded"
                      />
                      <div>
                        <div className="font-medium text-xs text-[#1C1917]">{it.title}</div>
                        <div className="text-[10px] text-[#1C1917]/50 font-mono">
                          Original Qty: {it.quantity} · Normal Price: {formatBdt(it.unitPrice)}
                        </div>
                      </div>
                    </div>

                    {isSelected && (
                      <div className="flex items-center space-x-2" onClick={(e) => e.stopPropagation()}>
                        <span className="text-[10px] font-mono text-[#1C1917]/60">Reship Qty:</span>
                        <input
                          type="number"
                          min={1}
                          max={5}
                          value={quantities[it.id] || 1}
                          onChange={(e) =>
                            setQuantities({ ...quantities, [it.id]: Math.max(1, parseInt(e.target.value) || 1) })
                          }
                          className="w-12 px-2 py-1 border border-[#E6DFD5] rounded text-xs text-center font-mono"
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Complimentary Apology Gift Card */}
          <div className="p-3.5 bg-gradient-to-r from-emerald-50/60 to-amber-50/60 border border-emerald-300/60 rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Gift className="w-4 h-4 text-emerald-700" />
                <span className="text-xs font-bold text-[#1C1917]">
                  2. Complimentary Goodwill / Apology Gift
                </span>
              </div>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                100% SEYVEN Courtesy (৳0)
              </span>
            </div>

            {/* MARS Eyeliner Quick Toggle */}
            <label className="flex items-start space-x-3 p-2.5 bg-white border border-emerald-200 rounded-md cursor-pointer hover:bg-emerald-50/30 transition-colors">
              <input
                type="checkbox"
                checked={includeMarsGift}
                onChange={(e) => setIncludeMarsGift(e.target.checked)}
                className="w-4 h-4 accent-emerald-700 rounded mt-0.5"
              />
              <div className="flex-1 text-xs">
                <div className="font-semibold text-emerald-950 flex items-center justify-between">
                  <span>MARS Eyeliner (Waterproof Deep Black)</span>
                  <span className="font-mono text-emerald-800 line-through text-[11px]">৳80</span>
                </div>
                <div className="text-[11px] text-stone-600">
                  Complimentary brand recovery gift placed inside parcel with luxury tissue wrap.
                </div>
              </div>
            </label>

            {/* Additional custom gifts */}
            {extraGifts.map((gift) => (
              <div
                key={gift.id}
                className="flex items-center justify-between p-2 bg-white border border-[#E6DFD5] rounded text-xs font-mono"
              >
                <span>🎁 {gift.title}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveExtraGift(gift.id)}
                  className="text-stone-400 hover:text-rose-600"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}

            <div className="flex items-center gap-2 pt-1">
              <input
                type="text"
                placeholder="Or add other gift item (e.g. Lip Scrub, Sheet Mask)..."
                value={customGiftTitle}
                onChange={(e) => setCustomGiftTitle(e.target.value)}
                className="flex-1 px-3 py-1.5 text-xs border border-[#E6DFD5] rounded bg-white focus:outline-none focus:border-[#C7A97B]"
              />
              <button
                type="button"
                onClick={handleAddExtraGift}
                className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-medium rounded flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </button>
            </div>
          </div>

          {/* Defect Reason & Pre-Dispatch QA Agreement */}
          <div className="space-y-3 p-3 bg-[#FAF8F5] border border-[#E6DFD5] rounded-lg text-xs">
            <div>
              <label className="text-[10px] uppercase font-mono font-bold text-[#1C1917]/70 block mb-1">
                Defect Category (For Audit & Supplier Claim)
              </label>
              <select
                value={defectReason}
                onChange={(e) => setDefectReason(e.target.value)}
                className="w-full p-2 bg-white border border-[#E6DFD5] rounded text-xs font-sans focus:outline-none focus:border-[#C7A97B]"
              >
                {DEFECT_REASONS.map((r) => (
                  <option key={r.id} value={r.label}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Consent Checkbox */}
            <label className="flex items-start space-x-2.5 pt-1 cursor-pointer">
              <input
                type="checkbox"
                checked={qaInspectionAgreed}
                onChange={(e) => setQaInspectionAgreed(e.target.checked)}
                className="w-4 h-4 accent-[#C7A97B] rounded mt-0.5"
              />
              <div className="text-[11px] leading-snug">
                <strong className="text-[#1C1917] block">
                  Customer consented to pre-dispatch seal inspection by SEYVEN Concierge
                </strong>
                <span className="text-stone-500">
                  Ensures zero defect on the replacement stick while maintaining complete customer transparency.
                </span>
              </div>
            </label>
          </div>

          {/* Delivery Destination Address */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-[#1C1917] block font-mono">
              Delivery Destination (Bangladeshi Address)
            </label>
            <textarea
              rows={2}
              value={shippingAddress}
              onChange={(e) => setShippingAddress(e.target.value)}
              className="w-full p-2.5 text-xs bg-[#FAF8F5] border border-[#E6DFD5] rounded focus:border-[#C7A97B] focus:outline-none font-sans"
              placeholder="Full village/house/street address..."
            />
            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <div>
                <span className="text-[10px] text-[#1C1917]/50 block">Recipient Phone</span>
                <input
                  type="text"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full p-2 bg-[#FAF8F5] border border-[#E6DFD5] rounded text-xs"
                />
              </div>
              <div>
                <span className="text-[10px] text-[#1C1917]/50 block">District / Zone</span>
                <input
                  type="text"
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  className="w-full p-2 bg-[#FAF8F5] border border-[#E6DFD5] rounded text-xs"
                />
              </div>
            </div>
          </div>

          {/* Auto Pathao Booking Checkbox */}
          <label className="flex items-center space-x-2.5 p-3 bg-stone-50 border border-stone-200 rounded-lg cursor-pointer">
            <input
              type="checkbox"
              checked={autoBookPathao}
              onChange={(e) => setAutoBookPathao(e.target.checked)}
              className="w-4 h-4 accent-rose-900 rounded"
            />
            <div className="text-xs">
              <span className="font-semibold text-[#1C1917]">Auto-Book with Pathao Express immediately</span>
              <span className="block text-[10px] text-stone-500 font-mono">
                Will create consignment with COD: ৳0 and print-ready label in Smart Dispatch.
              </span>
            </div>
          </label>

          {/* Zero-Charge Financial Summary */}
          <div className="p-3.5 bg-[#1C1917] text-[#F9F6F0] rounded-lg text-xs font-mono space-y-1.5 border border-[#C7A97B]/40">
            <div className="flex justify-between text-[#F9F6F0]/70 text-[11px]">
              <span>Product Replacement Cost:</span>
              <span>৳0 (SEYVEN Warranty)</span>
            </div>
            <div className="flex justify-between text-[#F9F6F0]/70 text-[11px]">
              <span>Complimentary Gift(s):</span>
              <span>৳0 (Courtesy)</span>
            </div>
            <div className="flex justify-between text-[#F9F6F0]/70 text-[11px]">
              <span>Courier Delivery Fee:</span>
              <span>৳0 (Free Reshipment)</span>
            </div>
            <div className="flex justify-between font-bold text-sm text-[#C7A97B] pt-1.5 border-t border-white/10">
              <span>Customer Cash Collectible (COD):</span>
              <span>৳0 (DO NOT COLLECT CASH)</span>
            </div>
          </div>
        </form>

        {/* Modal Footer */}
        <div className="p-4 bg-[#FAF8F5] border-t border-[#E6DFD5] flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-stone-600 hover:text-stone-900 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-5 py-2.5 bg-[#1C1917] hover:bg-[#2C2724] text-[#C7A97B] text-xs font-bold rounded-lg flex items-center space-x-2 transition-all shadow-md disabled:opacity-50 cursor-pointer"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${isSubmitting ? 'animate-spin' : ''}`} />
            <span>{isSubmitting ? 'Issuing Replacement...' : 'Dispatch ৳0 Replacement Parcel'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
