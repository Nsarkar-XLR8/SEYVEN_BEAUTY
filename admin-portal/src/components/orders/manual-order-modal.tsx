'use client';

import React, { useState, useMemo } from 'react';
import {
  X,
  Plus,
  Trash2,
  Phone,
  User,
  MapPin,
  ShoppingBag,
  DollarSign,
  MessageCircle,
  Truck,
  CheckCircle2,
  AlertCircle,
  Search,
} from 'lucide-react';
import { useAdmin } from '@/context/admin-context';
import { AdminProduct, OrderItem, OrderStatus } from '@/types/admin';
import { formatBdt } from '@/lib/formatters';
import { BD_ALL_DISTRICTS, DistrictItem } from '@/data/bangladesh-districts';

interface ManualOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOrderCreated: (orderId: string) => void;
}

const CHANNELS = [
  'Facebook Messenger',
  'WhatsApp',
  'Phone Call',
  'Instagram DM',
  'Direct Inquiry',
];

export function ManualOrderModal({ isOpen, onClose, onOrderCreated }: ManualOrderModalProps) {
  const { products, addManualOrder } = useAdmin();

  // Form states
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [source, setSource] = useState('Facebook Messenger');

  // District selector state
  const [selectedDistrictId, setSelectedDistrictId] = useState<string>('dhaka-city');
  const [districtSearch, setDistrictSearch] = useState('');
  const [customDeliveryFee, setCustomDeliveryFee] = useState<number | null>(null);

  const [address, setAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'COD' | 'BKASH' | 'NAGAD' | 'CARD'>('COD');
  const [hasAdvanceFee, setHasAdvanceFee] = useState(false);
  const [advanceAmount, setAdvanceAmount] = useState(70);
  const [advanceTrxId, setAdvanceTrxId] = useState('');
  const [notes, setNotes] = useState('');
  const [initialStatus, setInitialStatus] = useState<OrderStatus>('CONFIRMED');

  // Items in the manual order
  const [selectedProductId, setSelectedProductId] = useState<string>(products[0]?.id || '');
  const [selectedQuantity, setSelectedQuantity] = useState<number>(1);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [discountBdt, setDiscountBdt] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Active district item
  const activeDistrict = useMemo(() => {
    return BD_ALL_DISTRICTS.find((d) => d.id === selectedDistrictId) || BD_ALL_DISTRICTS[0];
  }, [selectedDistrictId]);

  // Filtered districts by search term
  const filteredDistricts = useMemo(() => {
    if (!districtSearch.trim()) return BD_ALL_DISTRICTS;
    const q = districtSearch.toLowerCase().trim();
    return BD_ALL_DISTRICTS.filter(
      (d) =>
        d.nameEn.toLowerCase().includes(q) ||
        d.nameBn.includes(q) ||
        d.division.toLowerCase().includes(q)
    );
  }, [districtSearch]);

  // Delivery fee logic (allows operator custom override)
  const deliveryFee = customDeliveryFee !== null ? customDeliveryFee : activeDistrict.standardFee;
  const subtotal = orderItems.reduce((acc, it) => acc + it.totalPrice, 0);
  const totalAmount = Math.max(0, subtotal + deliveryFee - discountBdt);

  if (!isOpen) return null;

  const handleSelectDistrict = (dist: DistrictItem) => {
    setSelectedDistrictId(dist.id);
    setCustomDeliveryFee(null); // Reset custom override to default
    if (hasAdvanceFee) {
      setAdvanceAmount(dist.standardFee);
    }
  };

  const handleAddItem = () => {
    const prod = products.find((p) => p.id === selectedProductId);
    if (!prod) return;

    const unitPrice = prod.priceBdt || 1850;
    const existingIndex = orderItems.findIndex((it) => it.id === prod.id);

    if (existingIndex >= 0) {
      const updated = [...orderItems];
      updated[existingIndex].quantity += selectedQuantity;
      updated[existingIndex].totalPrice = updated[existingIndex].quantity * unitPrice;
      setOrderItems(updated);
    } else {
      const newItem: OrderItem = {
        id: prod.id,
        sku: (prod.slug || prod.id || 'SKU').toUpperCase().substring(0, 12),
        title: prod.titleEn,
        brand: prod.brand,
        variant: prod.volume || 'Standard',
        quantity: selectedQuantity,
        unitPrice,
        totalPrice: unitPrice * selectedQuantity,
        image: prod.imageUrl,
      };
      setOrderItems([...orderItems, newItem]);
    }

    setSelectedQuantity(1);
  };

  const handleRemoveItem = (index: number) => {
    setOrderItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!customerName.trim()) {
      setError('Please enter the customer full name.');
      return;
    }

    const cleanPhone = phone.trim().replace(/\s+/g, '');
    const isBdPhone = /^(\+?8801|01)[3-9]\d{8}$/.test(cleanPhone);
    if (!isBdPhone) {
      setError('Please enter a valid 11-digit Bangladeshi mobile number (e.g. 017XXXXXXXX).');
      return;
    }

    if (!address.trim() || address.trim().length < 5) {
      setError('Please enter full delivery address (House, Road, Area).');
      return;
    }

    if (orderItems.length === 0) {
      setError('Please add at least one product to the order.');
      return;
    }

    setIsSubmitting(true);
    try {
      const combinedNotes = [
        `Booked via ${source}`,
        `District: ${activeDistrict.nameEn} (${activeDistrict.nameBn})`,
        hasAdvanceFee ? `Advance fee paid: ৳${advanceAmount} (TrxID: ${advanceTrxId || 'N/A'})` : null,
        notes.trim() || null,
      ]
        .filter(Boolean)
        .join(' | ');

      const newOrder = await addManualOrder({
        customerName: customerName.trim(),
        customerPhone: cleanPhone,
        customerEmail: email.trim() || undefined,
        shippingAddress: address.trim(),
        zone: `${activeDistrict.nameEn} Zone`,
        district: activeDistrict.nameEn,
        items: orderItems,
        subtotal,
        deliveryFee,
        discount: discountBdt,
        totalAmount,
        paymentMethod,
        source,
        status: initialStatus,
        advancePaid: hasAdvanceFee ? advanceAmount : 0,
        agentNotes: combinedNotes,
      });

      onOrderCreated(newOrder.id);
      onClose();
    } catch {
      setError('Failed to book manual order. Please check inputs.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#1C1917]/70 backdrop-blur-xs select-text overflow-y-auto">
      <div className="w-full max-w-2xl bg-[#F9F6F0] rounded-xl border border-[#C7A97B]/40 shadow-2xl overflow-hidden my-6">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#1C1917] text-[#F9F6F0]">
          <div className="flex items-center space-x-2">
            <MessageCircle className="w-5 h-5 text-[#C7A97B]" />
            <div>
              <h2 className="font-serif text-lg text-[#F9F6F0] tracking-wide">
                Book Assisted Order (F-Commerce / Social Desk)
              </h2>
              <p className="text-[11px] text-[#F9F6F0]/60 font-mono">
                Manual order booking across all 65 districts of Bangladesh
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded text-[#F9F6F0]/70 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[82vh] overflow-y-auto">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded text-xs flex items-center gap-2 font-mono">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {/* Section 1: Customer Details */}
          <div className="space-y-3">
            <div className="text-[10px] uppercase font-mono tracking-[0.2em] text-[#C7A97B] font-bold border-b border-[#E6DFD5] pb-1 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5" />
              <span>1. Client & Channel Information</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-mono uppercase text-[#1C1917]/70 block mb-1">
                  Customer Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="e.g. Nusrat Jahan"
                  className="w-full px-3 py-2 text-xs bg-white border border-[#E6DFD5] rounded focus:border-[#C7A97B] focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-mono uppercase text-[#1C1917]/70 block mb-1">
                  Mobile Number (BD 11-Digit) *
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="017XXXXXXXX"
                  className="w-full px-3 py-2 text-xs font-mono bg-white border border-[#E6DFD5] rounded focus:border-[#C7A97B] focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-mono uppercase text-[#1C1917]/70 block mb-1">
                  Inquiry Channel
                </label>
                <select
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-[#E6DFD5] rounded focus:border-[#C7A97B] focus:outline-none"
                >
                  {CHANNELS.map((ch) => (
                    <option key={ch} value={ch}>
                      {ch}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-mono uppercase text-[#1C1917]/70 block mb-1">
                  Email (Optional)
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="client@gmail.com"
                  className="w-full px-3 py-2 text-xs bg-white border border-[#E6DFD5] rounded focus:border-[#C7A97B] focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Shipping Destination (65 Districts of Bangladesh) */}
          <div className="space-y-3">
            <div className="text-[10px] uppercase font-mono tracking-[0.2em] text-[#C7A97B] font-bold border-b border-[#E6DFD5] pb-1 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5" />
                <span>2. Delivery Destination (65 Bangladesh Districts)</span>
              </div>
              <span className="text-[10px] text-[#C7A97B] font-mono font-bold">
                Selected: {activeDistrict.nameEn} ({activeDistrict.nameBn})
              </span>
            </div>

            {/* Quick 1-Tap Frequent District Pills */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-mono uppercase text-[#1C1917]/50 block">
                Quick Select Frequent Zones:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { id: 'dhaka-city', label: 'Dhaka City (৳70)' },
                  { id: 'dhaka-suburbs', label: 'Dhaka Suburbs (৳100)' },
                  { id: 'chattogram', label: 'Chattogram (৳130)' },
                  { id: 'gazipur', label: 'Gazipur (৳130)' },
                  { id: 'sylhet', label: 'Sylhet (৳130)' },
                  { id: 'bogura', label: 'Bogura (৳130)' },
                  { id: 'cumilla', label: 'Cumilla (৳130)' },
                ].map((pill) => (
                  <button
                    key={pill.id}
                    type="button"
                    onClick={() => {
                      const found = BD_ALL_DISTRICTS.find((d) => d.id === pill.id);
                      if (found) handleSelectDistrict(found);
                    }}
                    className={`px-2.5 py-1 text-[11px] font-mono rounded border transition-colors ${
                      selectedDistrictId === pill.id
                        ? 'bg-[#1C1917] text-[#C7A97B] border-[#1C1917] font-bold'
                        : 'bg-white border-[#E6DFD5] text-[#1C1917]/70 hover:bg-[#E6DFD5]/40'
                    }`}
                  >
                    {pill.label}
                  </button>
                ))}
              </div>
            </div>

            {/* District Search & Dropdown Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {/* Searchable All 65 Districts Dropdown */}
              <div>
                <label className="text-[11px] font-mono uppercase text-[#1C1917]/70 block mb-1">
                  All 65 Districts & Zones ({BD_ALL_DISTRICTS.length})
                </label>
                <select
                  value={selectedDistrictId}
                  onChange={(e) => {
                    const found = BD_ALL_DISTRICTS.find((d) => d.id === e.target.value);
                    if (found) handleSelectDistrict(found);
                  }}
                  className="w-full px-3 py-2 text-xs bg-white border border-[#E6DFD5] rounded focus:border-[#C7A97B] focus:outline-none font-medium"
                >
                  {/* Grouped by Division */}
                  {['Dhaka', 'Chattogram', 'Sylhet', 'Rajshahi', 'Khulna', 'Barishal', 'Rangpur', 'Mymensingh'].map(
                    (divName) => {
                      const inDiv = BD_ALL_DISTRICTS.filter((d) => d.division === divName);
                      return (
                        <optgroup key={divName} label={`--- ${divName} Division (${inDiv.length}) ---`}>
                          {inDiv.map((dist) => (
                            <option key={dist.id} value={dist.id}>
                              {dist.nameEn} ({dist.nameBn}) — ৳{dist.standardFee}
                            </option>
                          ))}
                        </optgroup>
                      );
                    }
                  )}
                </select>
              </div>

              {/* Delivery Fee with Custom Override option */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-mono uppercase text-[#1C1917]/70 block">
                    Delivery Fee (BDT) — আপনি নিজে বসাতে পারেন
                  </label>
                  {customDeliveryFee !== null && (
                    <button
                      type="button"
                      onClick={() => setCustomDeliveryFee(null)}
                      className="text-[10px] font-mono text-[#C7A97B] hover:underline"
                    >
                      Reset (৳{activeDistrict.standardFee})
                    </button>
                  )}
                </div>
                <div className="space-y-1.5">
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-xs font-mono font-bold text-[#1C1917]/40">৳</span>
                    <input
                      type="number"
                      min="0"
                      value={deliveryFee}
                      onChange={(e) => setCustomDeliveryFee(Number(e.target.value) || 0)}
                      placeholder="0"
                      className="w-full pl-7 pr-3 py-2 text-xs font-mono font-bold bg-white border border-[#E6DFD5] rounded focus:border-[#C7A97B] focus:outline-none"
                    />
                  </div>
                  {/* Quick Preset Buttons for Delivery Fee */}
                  <div className="flex flex-wrap items-center gap-1 text-[10px] font-mono">
                    <span className="text-[#1C1917]/50 mr-0.5">Preset:</span>
                    {[
                      { label: 'Free (৳0)', value: 0 },
                      { label: '৳60', value: 60 },
                      { label: '৳70 (Dhaka)', value: 70 },
                      { label: '৳100 (Suburb)', value: 100 },
                      { label: '৳130 (Outside)', value: 130 },
                      { label: '৳150 (Urgent)', value: 150 },
                    ].map((preset) => (
                      <button
                        key={preset.value}
                        type="button"
                        onClick={() => setCustomDeliveryFee(preset.value)}
                        className={`px-2 py-0.5 rounded border transition-colors ${
                          deliveryFee === preset.value
                            ? 'bg-[#1C1917] text-[#C7A97B] border-[#1C1917] font-bold'
                            : 'bg-white border-[#E6DFD5] text-[#1C1917]/70 hover:bg-[#E6DFD5]/40'
                        }`}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Full Address */}
              <div className="sm:col-span-2">
                <label className="text-[11px] font-mono uppercase text-[#1C1917]/70 block mb-1">
                  Detailed Address (House, Road, Block, Thana / Area) *
                </label>
                <textarea
                  rows={2}
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder={`e.g. House 42, Road 11, Block D, ${activeDistrict.nameEn}`}
                  className="w-full px-3 py-2 text-xs bg-white border border-[#E6DFD5] rounded focus:border-[#C7A97B] focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Add Items */}
          <div className="space-y-3">
            <div className="text-[10px] uppercase font-mono tracking-[0.2em] text-[#C7A97B] font-bold border-b border-[#E6DFD5] pb-1 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>3. Formulations & Routine Items</span>
              </div>
              <span className="text-[10px] text-[#1C1917]/60">
                {orderItems.length} {orderItems.length === 1 ? 'Item' : 'Items'} selected
              </span>
            </div>

            {/* Product Selector Row */}
            <div className="flex flex-col sm:flex-row gap-2">
              <select
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
                className="flex-1 px-3 py-2 text-xs bg-white border border-[#E6DFD5] rounded focus:border-[#C7A97B] focus:outline-none"
              >
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.brand} — {p.titleEn} ({formatBdt(p.priceBdt || 1850)})
                  </option>
                ))}
              </select>

              <div className="flex items-center space-x-2">
                <div className="flex items-center border border-[#E6DFD5] bg-white rounded">
                  <button
                    type="button"
                    onClick={() => setSelectedQuantity((q) => Math.max(1, q - 1))}
                    className="px-2.5 py-1.5 text-xs text-[#1C1917]/70 hover:text-[#1C1917]"
                  >
                    —
                  </button>
                  <span className="px-2 text-xs font-mono font-bold">{selectedQuantity}</span>
                  <button
                    type="button"
                    onClick={() => setSelectedQuantity((q) => q + 1)}
                    className="px-2.5 py-1.5 text-xs text-[#1C1917]/70 hover:text-[#1C1917]"
                  >
                    +
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleAddItem}
                  className="px-3 py-2 bg-[#1C1917] hover:bg-[#2C2724] text-[#C7A97B] text-xs font-mono font-semibold rounded flex items-center gap-1 transition-colors shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Line</span>
                </button>
              </div>
            </div>

            {/* Selected Items Table */}
            {orderItems.length > 0 && (
              <div className="border border-[#E6DFD5] rounded-lg overflow-hidden bg-white text-xs">
                <table className="w-full text-left">
                  <thead className="bg-[#F9F6F0] border-b border-[#E6DFD5] text-[10px] font-mono uppercase text-[#1C1917]/60">
                    <tr>
                      <th className="p-2">Item</th>
                      <th className="p-2">Qty</th>
                      <th className="p-2 text-right">Price</th>
                      <th className="p-2 text-right">Total</th>
                      <th className="p-2 text-center w-8"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E6DFD5]">
                    {orderItems.map((it, idx) => (
                      <tr key={it.id + idx}>
                        <td className="p-2">
                          <div className="font-semibold text-[#1C1917]">{it.title}</div>
                          <div className="text-[10px] font-mono text-[#C7A97B]">{it.brand} • {it.variant}</div>
                        </td>
                        <td className="p-2 font-mono">{it.quantity}</td>
                        <td className="p-2 text-right font-mono">{formatBdt(it.unitPrice)}</td>
                        <td className="p-2 text-right font-mono font-bold text-[#1C1917]">
                          {formatBdt(it.totalPrice)}
                        </td>
                        <td className="p-2 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(idx)}
                            className="text-rose-500 hover:text-rose-700 p-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Section 4: Payment & Advance Protection */}
          <div className="space-y-3">
            <div className="text-[10px] uppercase font-mono tracking-[0.2em] text-[#C7A97B] font-bold border-b border-[#E6DFD5] pb-1 flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5" />
              <span>4. Payment & Advance Delivery Fee</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-mono uppercase text-[#1C1917]/70 block mb-1">
                  Payment Method
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs bg-white border border-[#E6DFD5] rounded focus:border-[#C7A97B] focus:outline-none"
                >
                  <option value="COD">Cash on Delivery (COD) - Zero Advance</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-mono uppercase text-[#1C1917]/70 block mb-1">
                  Custom Discount (৳ BDT)
                </label>
                <input
                  type="number"
                  min="0"
                  value={discountBdt}
                  onChange={(e) => setDiscountBdt(Number(e.target.value) || 0)}
                  placeholder="0"
                  className="w-full px-3 py-2 text-xs font-mono bg-white border border-[#E6DFD5] rounded focus:border-[#C7A97B] focus:outline-none"
                />
              </div>

              {/* Advance Delivery Fee Checkbox */}
              <div className="sm:col-span-2 p-3 bg-white border border-[#E6DFD5] rounded-lg space-y-2">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hasAdvanceFee}
                    onChange={(e) => {
                      setHasAdvanceFee(e.target.checked);
                      if (e.target.checked) setAdvanceAmount(deliveryFee);
                    }}
                    className="w-4 h-4 rounded text-[#1C1917] focus:ring-[#C7A97B]"
                  />
                  <span className="text-xs font-semibold text-[#1C1917]">
                    Customer paid Advance Delivery Fee via bKash / Nagad (৳{deliveryFee})
                  </span>
                </label>

                {hasAdvanceFee && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-[#E6DFD5]">
                    <div>
                      <label className="text-[10px] font-mono uppercase text-[#1C1917]/60 block mb-0.5">
                        Advance Paid (BDT)
                      </label>
                      <input
                        type="number"
                        value={advanceAmount}
                        onChange={(e) => setAdvanceAmount(Number(e.target.value) || 0)}
                        className="w-full px-2 py-1.5 text-xs font-mono bg-[#F9F6F0] border border-[#E6DFD5] rounded"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-mono uppercase text-[#1C1917]/60 block mb-0.5">
                        Transaction ID (TrxID)
                      </label>
                      <input
                        type="text"
                        value={advanceTrxId}
                        onChange={(e) => setAdvanceTrxId(e.target.value)}
                        placeholder="e.g. BL9912AZX"
                        className="w-full px-2 py-1.5 text-xs font-mono uppercase bg-[#F9F6F0] border border-[#E6DFD5] rounded"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Section 5: Order Summary Pill */}
          <div className="p-4 bg-[#1C1917] text-[#F9F6F0] rounded-lg font-mono text-xs space-y-1.5 border border-[#C7A97B]/40">
            <div className="flex justify-between text-[#F9F6F0]/70">
              <span>Subtotal:</span>
              <span>{formatBdt(subtotal)}</span>
            </div>
            <div className="flex justify-between text-[#F9F6F0]/70">
              <span>Delivery Fee ({activeDistrict.nameEn}):</span>
              <span>{formatBdt(deliveryFee)}</span>
            </div>
            {discountBdt > 0 && (
              <div className="flex justify-between text-emerald-400">
                <span>Special Discount:</span>
                <span>-{formatBdt(discountBdt)}</span>
              </div>
            )}
            <div className="flex justify-between text-base font-bold text-[#C7A97B] pt-1.5 border-t border-white/10">
              <span>Total Payable:</span>
              <span>{formatBdt(totalAmount)}</span>
            </div>
            {hasAdvanceFee && (
              <div className="flex justify-between text-[11px] text-[#F9F6F0]/80 italic">
                <span>COD Balance due at doorstep:</span>
                <span>{formatBdt(Math.max(0, totalAmount - advanceAmount))}</span>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-[#E6DFD5]">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 text-xs font-mono uppercase tracking-wider rounded border border-[#E6DFD5] bg-white text-[#1C1917]/70 hover:bg-[#F9F6F0]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-[#1C1917] hover:bg-[#2C2724] text-[#C7A97B] font-mono text-xs font-bold uppercase tracking-wider rounded border border-[#C7A97B]/50 shadow-md flex items-center gap-2"
            >
              {isSubmitting ? (
                <span>Booking Order...</span>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 text-[#C7A97B]" />
                  <span>Book & Confirm Order</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
