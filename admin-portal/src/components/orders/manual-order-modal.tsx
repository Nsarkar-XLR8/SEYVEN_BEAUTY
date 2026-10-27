'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
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
  Sparkles,
  ClipboardPaste,
  Check,
  Send,
} from 'lucide-react';
import { useAdmin } from '@/context/admin-context';
import { AdminProduct, OrderItem } from '@/types/admin';
import { formatBdt } from '@/lib/formatters';

interface ManualOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOrderCreated: (orderId: string, consignmentId?: string) => void;
}

const CHANNELS = [
  { id: 'Facebook Messenger', label: 'Messenger', icon: '💬' },
  { id: 'WhatsApp', label: 'WhatsApp', icon: '📱' },
  { id: 'Instagram DM', label: 'Instagram', icon: '📸' },
  { id: 'Phone Call', label: 'Phone', icon: '📞' },
];

const DELIVERY_ZONES = [
  { id: 'dhaka-city', label: 'Dhaka City', fee: 70, tag: '৳70 (Inside Dhaka)' },
  { id: 'dhaka-suburbs', label: 'Suburbs', fee: 100, tag: '৳100 (Savar, Gazipur, Narayanganj)' },
  { id: 'outside-dhaka', label: 'Outside Dhaka', fee: 130, tag: '৳130 (All Other Districts)' },
  { id: 'free', label: 'Free Delivery', fee: 0, tag: '৳0 (Special Offer)' },
];

export function ManualOrderModal({ isOpen, onClose, onOrderCreated }: ManualOrderModalProps) {
  const { products, addManualOrder, assignCourier } = useAdmin();

  // Smart Paste State
  const [showSmartPaste, setShowSmartPaste] = useState(false);
  const [pastedText, setPastedText] = useState('');
  const [pasteSuccessNotice, setPasteSuccessNotice] = useState<string | null>(null);

  // Form states
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [source, setSource] = useState('Facebook Messenger');

  // Delivery zone & fee
  const [selectedZoneId, setSelectedZoneId] = useState<string>('dhaka-city');
  const [customFee, setCustomFee] = useState<number>(70);

  // Order items
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [searchProductQuery, setSearchProductQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Payment & Advance
  const [paymentMethod, setPaymentMethod] = useState<'COD' | 'BKASH' | 'NAGAD' | 'CARD'>('COD');
  const [hasAdvanceFee, setHasAdvanceFee] = useState(false);
  const [advanceAmount, setAdvanceAmount] = useState<number>(70);
  const [advanceTrxId, setAdvanceTrxId] = useState('');
  const [discountBdt, setDiscountBdt] = useState<number>(0);
  const [notes, setNotes] = useState('');

  // Pathao Auto-Ship Toggle
  const [autoBookPathao, setAutoBookPathao] = useState(true);

  // Submission state
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Close search dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setIsSearchOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter products for live autocomplete
  const filteredProducts = useMemo(() => {
    if (!searchProductQuery.trim()) return products.slice(0, 8);
    const q = searchProductQuery.toLowerCase().trim();
    return products.filter(
      (p) =>
        p.titleEn.toLowerCase().includes(q) ||
        (p.brand && p.brand.toLowerCase().includes(q)) ||
        (p.slug && p.slug.toLowerCase().includes(q))
    ).slice(0, 10);
  }, [products, searchProductQuery]);

  // Quick pick items (popular skincare staples)
  const quickPickProducts = useMemo(() => {
    return products.slice(0, 4);
  }, [products]);

  // Calculations
  const subtotal = useMemo(() => {
    return orderItems.reduce((acc, it) => acc + it.totalPrice, 0);
  }, [orderItems]);

  const deliveryFee = customFee;
  const advanceDeduction = hasAdvanceFee ? advanceAmount : 0;
  const totalAmount = Math.max(0, subtotal + deliveryFee - discountBdt);
  const codDueAtDoorstep = Math.max(0, totalAmount - advanceDeduction);

  if (!isOpen) return null;

  // Smart Paste Parser
  const handleSmartParse = () => {
    if (!pastedText.trim()) return;

    let parsedName = '';
    let parsedPhone = '';
    let parsedAddress = '';

    // Extract BD phone (013 - 019 followed by 8 digits)
    const phoneMatch = pastedText.match(/(?:\+?8801|01)[3-9]\d{8}/);
    if (phoneMatch) {
      let clean = phoneMatch[0].replace(/\D/g, '');
      if (clean.length > 11) clean = clean.slice(-11);
      parsedPhone = clean;
    }

    // Lines parsing
    const lines = pastedText
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);

    for (const line of lines) {
      const lower = line.toLowerCase();
      if (lower.startsWith('name:') || lower.startsWith('নাম:') || lower.startsWith('client:')) {
        parsedName = line.replace(/^(name:|নাম:|client:)\s*/i, '').trim();
      } else if (
        lower.startsWith('address:') ||
        lower.startsWith('ঠিকানা:') ||
        lower.startsWith('addr:') ||
        lower.startsWith('location:')
      ) {
        parsedAddress = line.replace(/^(address:|ঠিকানা:|addr:|location:)\s*/i, '').trim();
      }
    }

    // Fallbacks if tags not found
    if (!parsedName && lines.length > 0) {
      const candidate = lines[0];
      if (!candidate.match(/\d{5,}/) && candidate.length < 40) {
        parsedName = candidate;
      }
    }

    if (!parsedAddress) {
      const candidates = lines.filter(
        (l) => l !== parsedName && !l.includes(parsedPhone) && l.length > 8
      );
      if (candidates.length > 0) {
        parsedAddress = candidates.join(', ');
      }
    }

    if (parsedName) setCustomerName(parsedName);
    if (parsedPhone) setPhone(parsedPhone);
    if (parsedAddress) setAddress(parsedAddress);

    // Auto-detect Zone based on address keywords
    const lowerAddr = (parsedAddress + ' ' + pastedText).toLowerCase();
    if (
      lowerAddr.includes('savar') ||
      lowerAddr.includes('সাভার') ||
      lowerAddr.includes('gazipur') ||
      lowerAddr.includes('গাজীপুর') ||
      lowerAddr.includes('narayanganj') ||
      lowerAddr.includes('নারায়ণগঞ্জ') ||
      lowerAddr.includes('keraniganj') ||
      lowerAddr.includes('কেরানীগঞ্জ')
    ) {
      setSelectedZoneId('dhaka-suburbs');
      setCustomFee(100);
      if (hasAdvanceFee) setAdvanceAmount(100);
    } else if (
      lowerAddr.includes('dhaka') ||
      lowerAddr.includes('ঢাকা') ||
      lowerAddr.includes('uttara') ||
      lowerAddr.includes('উত্তরা') ||
      lowerAddr.includes('mirpur') ||
      lowerAddr.includes('মিরপুর') ||
      lowerAddr.includes('dhanmondi') ||
      lowerAddr.includes('ধানমন্ডি') ||
      lowerAddr.includes('gulshan') ||
      lowerAddr.includes('গুলশান') ||
      lowerAddr.includes('banani') ||
      lowerAddr.includes('বনানী') ||
      lowerAddr.includes('mohammadpur') ||
      lowerAddr.includes('মোহাম্মদপুর') ||
      lowerAddr.includes('badda') ||
      lowerAddr.includes('বাড্ডা')
    ) {
      setSelectedZoneId('dhaka-city');
      setCustomFee(70);
      if (hasAdvanceFee) setAdvanceAmount(70);
    } else if (parsedAddress.length > 10) {
      setSelectedZoneId('outside-dhaka');
      setCustomFee(130);
      if (hasAdvanceFee) setAdvanceAmount(130);
    }

    setPasteSuccessNotice('Extracted customer details successfully!');
    setShowSmartPaste(false);
    setTimeout(() => setPasteSuccessNotice(null), 4000);
  };

  // Add product to order
  const handleAddProduct = (prod: AdminProduct) => {
    const unitPrice = prod.priceBdt || 1850;
    const existingIndex = orderItems.findIndex((it) => it.id === prod.id);

    if (existingIndex >= 0) {
      const updated = [...orderItems];
      updated[existingIndex].quantity += 1;
      updated[existingIndex].totalPrice = updated[existingIndex].quantity * updated[existingIndex].unitPrice;
      setOrderItems(updated);
    } else {
      const newItem: OrderItem = {
        id: prod.id,
        sku: (prod.slug || prod.id || 'SKU').toUpperCase().substring(0, 14),
        title: prod.titleEn,
        brand: prod.brand || 'SEYVEN',
        variant: prod.volume || 'Standard',
        quantity: 1,
        unitPrice,
        totalPrice: unitPrice,
        image: prod.imageUrl,
      };
      setOrderItems([...orderItems, newItem]);
    }

    setSearchProductQuery('');
    setIsSearchOpen(false);
  };

  // Update item quantity
  const handleUpdateQuantity = (index: number, newQty: number) => {
    if (newQty <= 0) {
      handleRemoveItem(index);
      return;
    }
    const updated = [...orderItems];
    updated[index].quantity = newQty;
    updated[index].totalPrice = newQty * updated[index].unitPrice;
    setOrderItems(updated);
  };

  // Update item unit price (for custom negotiated customer discounts)
  const handleUpdateUnitPrice = (index: number, newPrice: number) => {
    const updated = [...orderItems];
    updated[index].unitPrice = Math.max(0, newPrice);
    updated[index].totalPrice = updated[index].quantity * Math.max(0, newPrice);
    setOrderItems(updated);
  };

  const handleRemoveItem = (index: number) => {
    setOrderItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleZoneSelect = (zone: typeof DELIVERY_ZONES[0]) => {
    setSelectedZoneId(zone.id);
    setCustomFee(zone.fee);
    if (hasAdvanceFee && zone.fee > 0) {
      setAdvanceAmount(zone.fee);
    }
  };

  // Submit Order
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!customerName.trim()) {
      setError('Please enter the customer full name.');
      return;
    }

    const cleanPhone = phone.trim().replace(/\D/g, '');
    const isBdPhone = /^(?:\+?8801|01)[3-9]\d{8}$/.test(cleanPhone);
    if (!isBdPhone) {
      setError('Please enter a valid 11-digit Bangladeshi mobile number (01XXXXXXXXX).');
      return;
    }

    if (!address.trim() || address.trim().length < 5) {
      setError('Please enter the delivery address (House, Road, Area, City).');
      return;
    }

    if (orderItems.length === 0) {
      setError('Please add at least one product to the order.');
      return;
    }

    setIsSubmitting(true);
    try {
      const activeZone = DELIVERY_ZONES.find((z) => z.id === selectedZoneId);
      const districtLabel =
        selectedZoneId === 'dhaka-city'
          ? 'Dhaka'
          : selectedZoneId === 'dhaka-suburbs'
          ? 'Dhaka Suburbs'
          : 'Outside Dhaka';

      const combinedNotes = [
        `Social Desk: ${source}`,
        `Zone: ${activeZone?.label || districtLabel}`,
        hasAdvanceFee ? `Advance Delivery Paid: ৳${advanceAmount} (${advanceTrxId || 'No TrxID'})` : null,
        notes.trim() || null,
      ]
        .filter(Boolean)
        .join(' | ');

      // 1. Create order in context and backend
      const newOrder = await addManualOrder({
        customerName: customerName.trim(),
        customerPhone: cleanPhone.startsWith('01') ? cleanPhone : cleanPhone.slice(-11),
        shippingAddress: address.trim(),
        zone: districtLabel,
        district: districtLabel,
        items: orderItems,
        subtotal,
        deliveryFee,
        discount: discountBdt,
        totalAmount,
        paymentMethod,
        source,
        status: 'CONFIRMED',
        advancePaid: hasAdvanceFee ? advanceAmount : 0,
        agentNotes: combinedNotes,
      });

      // 2. If Auto-Book with Pathao is selected, book consignment immediately!
      let bookedConsignmentId: string | undefined;
      if (autoBookPathao) {
        try {
          const courierRes = await assignCourier(newOrder.id, 'Pathao');
          if (courierRes?.success && courierRes?.consignmentId) {
            bookedConsignmentId = courierRes.consignmentId;
          }
        } catch (cErr) {
          console.error('Auto-Pathao booking error:', cErr);
        }
      }

      onOrderCreated(newOrder.id, bookedConsignmentId);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to place manual order. Please check inputs.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-[#1C1917]/75 backdrop-blur-xs select-text overflow-y-auto">
      <div className="w-full max-w-3xl bg-[#FDFBF7] rounded-xl border border-[#C7A97B]/40 shadow-2xl overflow-hidden my-4 flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-[#1C1917] text-[#F9F6F0] shrink-0 border-b border-[#C7A97B]/30">
          <div className="flex items-center space-x-2.5">
            <div className="p-1.5 rounded-lg bg-[#C7A97B]/20 text-[#C7A97B]">
              <MessageCircle className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-serif text-base text-[#F9F6F0] tracking-wide font-semibold flex items-center gap-2">
                <span>Fast Manual Order Desk</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#C7A97B]/20 text-[#C7A97B] font-normal border border-[#C7A97B]/30">
                  Social Commerce
                </span>
              </h2>
              <p className="text-[11px] text-[#F9F6F0]/70 font-sans">
                Book Messenger, WhatsApp & Instagram orders directly with 1-click Pathao dispatch
              </p>
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

        {/* Modal Scrollable Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto flex-1 text-[#1C1917]">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg text-xs flex items-center gap-2 font-mono">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {pasteSuccessNotice && (
            <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs flex items-center gap-2 font-sans font-medium">
              <Check className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{pasteSuccessNotice}</span>
            </div>
          )}

          {/* Quick Smart Paste Bar */}
          <div className="bg-white border border-[#E6DFD5] rounded-lg p-3 shadow-xs">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setShowSmartPaste(!showSmartPaste)}
                className="text-xs font-semibold text-[#1C1917] flex items-center gap-1.5 hover:text-[#C7A97B] transition-colors"
              >
                <ClipboardPaste className="w-3.5 h-3.5 text-[#C7A97B]" />
                <span>Smart Paste (চ্যাট মেসেজ থেকে এক ক্লিকে ফর্ম পূরণ)</span>
                <span className="text-[10px] font-mono font-normal text-[#1C1917]/50 ml-1">
                  {showSmartPaste ? '▲ Hide' : '▼ Click to paste customer text'}
                </span>
              </button>
            </div>

            {showSmartPaste && (
              <div className="mt-2.5 space-y-2 pt-2 border-t border-[#F2ECE1]">
                <textarea
                  rows={3}
                  value={pastedText}
                  onChange={(e) => setPastedText(e.target.value)}
                  placeholder="মেসেঞ্জারের মেসেজ পেস্ট করুন, যেমন:&#10;তানজিলা আহমেদ&#10;01712345678&#10;বাড়ি ১২, রোড ৪, সেক্টর ৭, উত্তরা, ঢাকা"
                  className="w-full p-2.5 text-xs bg-[#FAF8F5] border border-[#E6DFD5] rounded-md focus:border-[#C7A97B] focus:outline-none font-sans"
                />
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleSmartParse}
                    className="px-3 py-1.5 bg-[#1C1917] hover:bg-[#2C2724] text-[#C7A97B] text-xs font-medium rounded-md flex items-center gap-1.5 transition-colors shadow-xs"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Auto-Extract & Fill Fields</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Section 1: Customer Details & Channel */}
          <div className="bg-white border border-[#E6DFD5] rounded-lg p-4 shadow-xs space-y-3">
            {/* Channel Source Selector */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#F2ECE1] pb-2.5">
              <span className="text-xs font-semibold text-[#1C1917]/80 flex items-center gap-1.5">
                <Send className="w-3.5 h-3.5 text-[#C7A97B]" />
                Order Source:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {CHANNELS.map((ch) => (
                  <button
                    key={ch.id}
                    type="button"
                    onClick={() => setSource(ch.id)}
                    className={`px-2.5 py-1 text-xs rounded-full border transition-all flex items-center gap-1 ${
                      source === ch.id
                        ? 'bg-[#1C1917] text-[#C7A97B] border-[#1C1917] font-semibold shadow-xs'
                        : 'bg-[#F9F6F0] border-[#E6DFD5] text-[#1C1917]/70 hover:bg-[#EAE4D9]'
                    }`}
                  >
                    <span>{ch.icon}</span>
                    <span>{ch.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Name & Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="text-xs font-medium text-[#1C1917]/80 block mb-1">
                  Customer Name *
                </label>
                <div className="relative">
                  <User className="w-3.5 h-3.5 text-[#1C1917]/40 absolute left-2.5 top-2.5" />
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="e.g. Tanzila Ahmed"
                    className="w-full pl-8 pr-3 py-2 text-xs bg-[#FAF8F5] border border-[#E6DFD5] rounded-md focus:border-[#C7A97B] focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-[#1C1917]/80 block mb-1">
                  Mobile Number (BD 11-Digit) *
                </label>
                <div className="relative">
                  <Phone className="w-3.5 h-3.5 text-[#1C1917]/40 absolute left-2.5 top-2.5" />
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="017XXXXXXXX"
                    className="w-full pl-8 pr-3 py-2 text-xs font-mono bg-[#FAF8F5] border border-[#E6DFD5] rounded-md focus:border-[#C7A97B] focus:bg-white focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Address */}
            <div>
              <label className="text-xs font-medium text-[#1C1917]/80 block mb-1">
                Full Delivery Address (House, Road, Area, District) *
              </label>
              <div className="relative">
                <MapPin className="w-3.5 h-3.5 text-[#1C1917]/40 absolute left-2.5 top-2.5" />
                <textarea
                  rows={2}
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="e.g. House 14, Road 5, Block C, Banani, Dhaka"
                  className="w-full pl-8 pr-3 py-2 text-xs bg-[#FAF8F5] border border-[#E6DFD5] rounded-md focus:border-[#C7A97B] focus:bg-white focus:outline-none"
                />
              </div>
            </div>

            {/* Delivery Zone Pills & Fee */}
            <div className="space-y-1.5 pt-1 border-t border-[#F2ECE1]">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-[#1C1917]/80">
                  Delivery Destination & Fee:
                </label>
                <div className="flex items-center gap-1.5 text-xs font-mono">
                  <span className="text-[#1C1917]/60">Fee:</span>
                  <span className="font-bold text-[#1C1917]">৳</span>
                  <input
                    type="number"
                    min="0"
                    value={customFee}
                    onChange={(e) => setCustomFee(Number(e.target.value) || 0)}
                    className="w-16 px-1.5 py-0.5 text-xs font-mono font-bold text-center bg-[#FAF8F5] border border-[#E6DFD5] rounded focus:border-[#C7A97B] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {DELIVERY_ZONES.map((zone) => {
                  const isSelected = selectedZoneId === zone.id && customFee === zone.fee;
                  return (
                    <button
                      key={zone.id}
                      type="button"
                      onClick={() => handleZoneSelect(zone)}
                      className={`p-2 text-left rounded-lg border transition-all ${
                        isSelected
                          ? 'bg-[#1C1917] text-white border-[#1C1917] shadow-xs'
                          : 'bg-[#FAF8F5] border-[#E6DFD5] text-[#1C1917]/80 hover:bg-[#EAE4D9]'
                      }`}
                    >
                      <div className="text-[11px] font-semibold">{zone.label}</div>
                      <div
                        className={`text-[10px] font-mono ${
                          isSelected ? 'text-[#C7A97B]' : 'text-[#1C1917]/60'
                        }`}
                      >
                        ৳{zone.fee}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Section 2: Products & Order Items */}
          <div className="bg-white border border-[#E6DFD5] rounded-lg p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#1C1917] flex items-center gap-1.5">
                <ShoppingBag className="w-3.5 h-3.5 text-[#C7A97B]" />
                Products & Formulations ({orderItems.length} items)
              </span>
              {orderItems.length > 0 && (
                <button
                  type="button"
                  onClick={() => setOrderItems([])}
                  className="text-[11px] text-rose-600 hover:underline"
                >
                  Clear all
                </button>
              )}
            </div>

            {/* Live Search Autocomplete */}
            <div ref={searchContainerRef} className="relative">
              <div className="relative">
                <Search className="w-4 h-4 text-[#1C1917]/40 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchProductQuery}
                  onFocus={() => setIsSearchOpen(true)}
                  onChange={(e) => {
                    setSearchProductQuery(e.target.value);
                    setIsSearchOpen(true);
                  }}
                  placeholder="🔍 Type product name or brand to quick-add (e.g. CeraVe, Serum, COSRX)..."
                  className="w-full pl-9 pr-3 py-2 text-xs bg-[#FAF8F5] border border-[#E6DFD5] rounded-md focus:border-[#C7A97B] focus:bg-white focus:outline-none"
                />
              </div>

              {/* Autocomplete Dropdown List */}
              {isSearchOpen && filteredProducts.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-[#C7A97B]/40 rounded-lg shadow-xl z-20 max-h-56 overflow-y-auto divide-y divide-[#F2ECE1]">
                  {filteredProducts.map((p) => (
                    <div
                      key={p.id}
                      onClick={() => handleAddProduct(p)}
                      className="p-2.5 flex items-center justify-between hover:bg-[#FAF8F5] cursor-pointer transition-colors"
                    >
                      <div className="flex items-center space-x-2.5">
                        {p.imageUrl ? (
                          <img
                            src={p.imageUrl}
                            alt={p.titleEn}
                            className="w-8 h-8 rounded object-cover border border-[#E6DFD5]"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded bg-[#F2ECE1] flex items-center justify-center text-[10px] text-[#1C1917]/50 font-mono">
                            SKU
                          </div>
                        )}
                        <div>
                          <div className="text-xs font-semibold text-[#1C1917]">{p.titleEn}</div>
                          <div className="text-[10px] text-[#C7A97B] font-mono">
                            {p.brand} {p.volume ? `• ${p.volume}` : ''}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-mono font-bold text-[#1C1917]">
                          {formatBdt(p.priceBdt || 1850)}
                        </span>
                        <button
                          type="button"
                          className="px-2 py-1 bg-[#1C1917] text-[#C7A97B] rounded text-[10px] font-mono font-semibold"
                        >
                          + Add
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Pick Chips */}
            {quickPickProducts.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[10px] font-mono uppercase text-[#1C1917]/50">Quick Add:</span>
                {quickPickProducts.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleAddProduct(p)}
                    className="px-2.5 py-1 text-[11px] bg-[#FAF8F5] hover:bg-[#EAE4D9] text-[#1C1917] rounded-full border border-[#E6DFD5] transition-colors flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3 text-[#C7A97B]" />
                    <span className="truncate max-w-[140px]">{p.titleEn}</span>
                    <span className="text-[10px] font-mono text-[#C7A97B]">({formatBdt(p.priceBdt || 1850)})</span>
                  </button>
                ))}
              </div>
            )}

            {/* Selected Items List */}
            {orderItems.length === 0 ? (
              <div className="py-6 text-center border border-dashed border-[#E6DFD5] rounded-lg bg-[#FAF8F5]/50">
                <ShoppingBag className="w-6 h-6 mx-auto text-[#1C1917]/30 mb-1" />
                <p className="text-xs text-[#1C1917]/60">
                  No products added yet. Type in search bar above or click quick-picks.
                </p>
              </div>
            ) : (
              <div className="border border-[#E6DFD5] rounded-lg overflow-hidden bg-white">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#FAF8F5] border-b border-[#E6DFD5] text-[10px] font-mono uppercase text-[#1C1917]/60">
                    <tr>
                      <th className="p-2.5">Item</th>
                      <th className="p-2.5 w-24">Unit Price (৳)</th>
                      <th className="p-2.5 w-24 text-center">Qty</th>
                      <th className="p-2.5 text-right w-24">Subtotal</th>
                      <th className="p-2.5 w-8"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F2ECE1]">
                    {orderItems.map((item, idx) => (
                      <tr key={item.id + idx} className="hover:bg-[#FDFBF7]">
                        <td className="p-2.5">
                          <div className="font-medium text-[#1C1917]">{item.title}</div>
                          <div className="text-[10px] font-mono text-[#C7A97B]">
                            {item.brand} • {item.variant}
                          </div>
                        </td>
                        <td className="p-2.5">
                          <input
                            type="number"
                            min="0"
                            value={item.unitPrice}
                            onChange={(e) => handleUpdateUnitPrice(idx, Number(e.target.value) || 0)}
                            className="w-20 px-1.5 py-1 text-xs font-mono font-bold bg-[#FAF8F5] border border-[#E6DFD5] rounded focus:border-[#C7A97B] focus:outline-none"
                          />
                        </td>
                        <td className="p-2.5">
                          <div className="flex items-center justify-center border border-[#E6DFD5] bg-[#FAF8F5] rounded">
                            <button
                              type="button"
                              onClick={() => handleUpdateQuantity(idx, item.quantity - 1)}
                              className="px-2 py-1 text-xs text-[#1C1917]/70 hover:text-[#1C1917] hover:bg-white"
                            >
                              -
                            </button>
                            <span className="px-2 text-xs font-mono font-bold">{item.quantity}</span>
                            <button
                              type="button"
                              onClick={() => handleUpdateQuantity(idx, item.quantity + 1)}
                              className="px-2 py-1 text-xs text-[#1C1917]/70 hover:text-[#1C1917] hover:bg-white"
                            >
                              +
                            </button>
                          </div>
                        </td>
                        <td className="p-2.5 text-right font-mono font-bold text-[#1C1917]">
                          {formatBdt(item.totalPrice)}
                        </td>
                        <td className="p-2.5 text-center">
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

          {/* Section 3: Payment, Discount & Advance Protection */}
          <div className="bg-white border border-[#E6DFD5] rounded-lg p-4 shadow-xs space-y-3">
            <span className="text-xs font-semibold text-[#1C1917] flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5 text-[#C7A97B]" />
              Payment & Advance Delivery Fee
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Payment Method pill */}
              <div>
                <label className="text-xs font-medium text-[#1C1917]/80 block mb-1">
                  Payment Mode
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('COD')}
                    className={`flex-1 py-1.5 px-3 rounded-md text-xs font-semibold border transition-all ${
                      paymentMethod === 'COD'
                        ? 'bg-[#1C1917] text-white border-[#1C1917]'
                        : 'bg-[#FAF8F5] border-[#E6DFD5] text-[#1C1917]/70'
                    }`}
                  >
                    Cash on Delivery (COD)
                  </button>
                </div>
              </div>

              {/* Special Discount */}
              <div>
                <label className="text-xs font-medium text-[#1C1917]/80 block mb-1">
                  Special Discount (৳ BDT)
                </label>
                <div className="relative">
                  <span className="absolute left-2.5 top-2 text-xs font-mono text-[#1C1917]/40">৳</span>
                  <input
                    type="number"
                    min="0"
                    value={discountBdt}
                    onChange={(e) => setDiscountBdt(Number(e.target.value) || 0)}
                    placeholder="0"
                    className="w-full pl-6 pr-3 py-1.5 text-xs font-mono font-bold bg-[#FAF8F5] border border-[#E6DFD5] rounded-md focus:border-[#C7A97B] focus:outline-none"
                  />
                </div>
              </div>

              {/* Advance Delivery Fee Checkbox */}
              <div className="sm:col-span-2 p-3 bg-[#FAF8F5] border border-[#E6DFD5] rounded-lg space-y-2">
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-[#E6DFD5]">
                    <div>
                      <label className="text-[10px] font-mono uppercase text-[#1C1917]/60 block mb-0.5">
                        Advance Paid (BDT)
                      </label>
                      <input
                        type="number"
                        value={advanceAmount}
                        onChange={(e) => setAdvanceAmount(Number(e.target.value) || 0)}
                        className="w-full px-2 py-1.5 text-xs font-mono bg-white border border-[#E6DFD5] rounded"
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
                        className="w-full px-2 py-1.5 text-xs font-mono uppercase bg-white border border-[#E6DFD5] rounded"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Staff Notes */}
              <div className="sm:col-span-2">
                <label className="text-xs font-medium text-[#1C1917]/80 block mb-1">
                  Delivery Instruction / Staff Note
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Deliver after 4 PM, Fragile glass bottle"
                  className="w-full px-3 py-1.5 text-xs bg-[#FAF8F5] border border-[#E6DFD5] rounded-md focus:border-[#C7A97B] focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Pathao One-Click Auto-Ship Checkbox */}
          <div className="p-3 bg-amber-50/60 border border-amber-200/80 rounded-lg flex items-start space-x-3">
            <input
              type="checkbox"
              id="autoBookPathao"
              checked={autoBookPathao}
              onChange={(e) => setAutoBookPathao(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded text-[#1C1917] focus:ring-[#C7A97B]"
            />
            <label htmlFor="autoBookPathao" className="cursor-pointer text-xs">
              <span className="font-bold text-[#1C1917] flex items-center gap-1.5">
                <Truck className="w-3.5 h-3.5 text-amber-700" />
                Book Consignment directly with Pathao Courier (Auto-Ship)
              </span>
              <p className="text-[11px] text-[#1C1917]/70 mt-0.5">
                Saves order & immediately connects to Pathao API to generate Consignment ID & tracking URL.
              </p>
            </label>
          </div>

          {/* Section 5: Order Financial Summary */}
          <div className="p-4 bg-[#1C1917] text-[#F9F6F0] rounded-xl font-mono text-xs space-y-1.5 border border-[#C7A97B]/40 shadow-lg">
            <div className="flex justify-between text-[#F9F6F0]/70">
              <span>Subtotal:</span>
              <span>{formatBdt(subtotal)}</span>
            </div>
            <div className="flex justify-between text-[#F9F6F0]/70">
              <span>Delivery Fee ({selectedZoneId}):</span>
              <span>{formatBdt(deliveryFee)}</span>
            </div>
            {discountBdt > 0 && (
              <div className="flex justify-between text-emerald-400">
                <span>Special Discount:</span>
                <span>-{formatBdt(discountBdt)}</span>
              </div>
            )}
            {hasAdvanceFee && advanceAmount > 0 && (
              <div className="flex justify-between text-amber-300">
                <span>Advance Paid (bKash/Nagad):</span>
                <span>-{formatBdt(advanceAmount)}</span>
              </div>
            )}
            <div className="flex justify-between items-baseline text-base font-bold text-[#C7A97B] pt-2 border-t border-white/10">
              <span className="font-serif">Cash to Collect at Doorstep:</span>
              <span className="text-lg font-mono text-white">{formatBdt(codDueAtDoorstep)}</span>
            </div>
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-mono uppercase tracking-wider rounded-lg border border-[#E6DFD5] bg-white text-[#1C1917]/70 hover:bg-[#FAF8F5]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-[#1C1917] hover:bg-[#2C2724] text-[#C7A97B] font-mono text-xs font-bold uppercase tracking-wider rounded-lg border border-[#C7A97B]/50 shadow-md flex items-center gap-2 transition-all cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-[#C7A97B] border-t-transparent rounded-full animate-spin" />
                  <span>Placing & Booking...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 text-[#C7A97B]" />
                  <span>{autoBookPathao ? 'Confirm & Ship with Pathao' : 'Confirm Order'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

