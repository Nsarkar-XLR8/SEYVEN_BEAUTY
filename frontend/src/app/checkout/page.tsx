'use client';

import React, { useState, useEffect, useId } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ShieldCheck, Lock, MapPin, Truck, AlertCircle, ShoppingBag, Sparkles, MessageCircle } from 'lucide-react';
import { useCart } from '@/context/cart-context';
import { useLanguage } from '@/context/language-context';
import { useAuth } from '@/context/auth-context';
import { formatBdt } from '@/lib/formatters';
import { buildWhatsAppUrl, sanitizeMessengerUrl } from '@/lib/concierge';
import { BRAND } from '@/lib/constants';
import { CheckoutOrderSummary } from '@/components/checkout/checkout-order-summary';
import { CheckoutPaymentSelector, PaymentMethod } from '@/components/checkout/checkout-payment-selector';
import { CheckoutLoyaltySlider } from '@/components/checkout/checkout-loyalty-slider';
import { CheckoutSuccessView } from '@/components/checkout/checkout-success-view';

export default function CheckoutPage() {
  const router = useRouter();
  const { lang, t } = useLanguage();
  const { user, isAuthenticated } = useAuth();
  const { items, subtotalBdt, discountBdt, clearCart, settings, refreshSettings } = useCart();

  // Always refresh settings when entering checkout
  useEffect(() => {
    refreshSettings();
  }, [refreshSettings]);

  // Form states
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [email, setEmail] = useState(user?.email || '');
  const [isInsideDhaka, setIsInsideDhaka] = useState(true);
  const [streetAddress, setStreetAddress] = useState('');
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('COD');
  const [loyaltyDiscountBdt, setLoyaltyDiscountBdt] = useState(0);

  // Submitting & success states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [orderSuccessData, setOrderSuccessData] = useState<any | null>(null);

  // Auto-generate Idempotency Key per session
  const [idempotencyKey, setIdempotencyKey] = useState('');
  useEffect(() => {
    setIdempotencyKey(`idemp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`);
  }, []);

  // Delivery Destination Zone Name
  const activeDistrictName = isInsideDhaka
    ? (lang === 'bn' ? 'ঢাকার ভেতরে' : 'Inside Dhaka')
    : (lang === 'bn' ? 'ঢাকার বাইরে / সারাদেশে' : 'Outside Dhaka (Nationwide)');

  // Dynamic Delivery Fee strictly matches selected destination & admin threshold
  const standardFeeDhaka = Number(settings?.standardDeliveryDhakaBdt) || 70;
  const standardFeeOutside = Number(settings?.standardDeliveryOutsideBdt) || 130;
  const freeThreshold = Number(settings?.freeDeliveryThresholdBdt) || 3000;
  const isFreeDeliveryEligible = Math.max(0, subtotalBdt - discountBdt) >= freeThreshold;
  const deliveryFeeBdt = isFreeDeliveryEligible ? 0 : (isInsideDhaka ? standardFeeDhaka : standardFeeOutside);

  // Business rule: Campaign discount (7%) and repeat client loyalty (5%) do not stack
  const effectiveLoyaltyDiscount = discountBdt > 0 ? 0 : loyaltyDiscountBdt;
  const netPayableBdt = Math.max(0, subtotalBdt - discountBdt - effectiveLoyaltyDiscount + deliveryFeeBdt);

  const isMessengerConcierge = settings?.primaryConciergeChannel === 'MESSENGER';
  const conciergeMessage = `Hi SEYVEN Concierge! I want to confirm my order:\n\n• Items: ${items.map((i) => `${i.titleEn} (x${i.quantity})`).join(', ')}\n• Total: ${formatBdt(netPayableBdt)}\n• Area: ${activeDistrictName}\n\nPlease take my address.`;
  const conciergeCheckoutUrl = isMessengerConcierge
    ? sanitizeMessengerUrl(settings?.supportMessenger || BRAND.supportMessenger)
    : buildWhatsAppUrl(settings?.supportWhatsApp || BRAND.supportWhatsApp, conciergeMessage);

  // Handle Order Placement
  const handleCommitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Form validations
    if (!fullName.trim()) {
      setErrorMessage(t('Please enter your full name.', 'অনুগ্রহ করে আপনার পুরো নাম লিখুন।'));
      return;
    }

    const cleanPhone = phone.trim().replace(/\s+/g, '');
    const isBdPhone = /^(\+?8801|01)[3-9]\d{8}$/.test(cleanPhone);
    if (!isBdPhone) {
      setErrorMessage(
        t(
          'Please enter a valid 11-digit Bangladeshi mobile number (e.g. 01700 000000).',
          'অনুগ্রহ করে সঠিক ১১ ডিজিটের মোবাইল নম্বর লিখুন (যেমন: ০১৭১২ ৩৪৫৬৭৮)।'
        )
      );
      return;
    }

    if (!streetAddress.trim() || streetAddress.trim().length < 8) {
      setErrorMessage(
        t(
          'Please provide your full detailed address (House, Road, Area).',
          'অনুগ্রহ করে আপনার বিস্তারিত ঠিকানা (বাড়ি নম্বর, রোড নম্বর, এলাকা) লিখুন।'
        )
      );
      return;
    }

    setIsSubmitting(true);

    // Simulate order placement commit with server idempotency key
    try {
      await new Promise((resolve) => setTimeout(resolve, 800));

      const now = new Date();
      const orderTrackingId = `SYV-${now.getFullYear()}${(now.getMonth() + 1)
        .toString()
        .padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}-${Math.random()
        .toString(36)
        .substring(2, 6)
        .toUpperCase()}`;

      const successPayload = {
        orderId: orderTrackingId,
        customerName: fullName.trim(),
        phone: cleanPhone,
        email: email.trim(),
        address: streetAddress.trim(),
        districtName: isInsideDhaka ? 'Inside Dhaka' : 'Outside Dhaka',
        zone: isInsideDhaka ? 'Dhaka Metro' : 'Outside Dhaka (Nationwide)',
        paymentMethod,
        totalBdt: netPayableBdt,
        subtotalBdt,
        deliveryFeeBdt,
        discountBdt: discountBdt + effectiveLoyaltyDiscount,
        items: items.map((it) => ({
          id: it.id,
          titleEn: it.titleEn,
          volume: it.volume,
          priceBdt: it.priceBdt,
          quantity: it.quantity,
        })),
        createdAt: now.toISOString(),
        estimatedDays: isInsideDhaka
          ? (lang === 'bn' ? '১-২ কর্মদিবস' : '1-2 Days')
          : (lang === 'bn' ? '২-৩ কর্মদিবস' : '2-3 Days'),
        supportPhone: settings?.supportPhone || '',
        supportWhatsApp: settings?.supportWhatsApp || '',
      };

      // Dispatch live order to backend & database & trigger admin email
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://seyven-beauty-backend.onrender.com/api/v1';
      try {
        await fetch(`${apiUrl}/orders/direct`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(successPayload),
        });
      } catch (err) {
        console.warn('Backend order dispatch notice:', err);
      }

      // Immediately sync to Admin Portal localStorage for instantaneous visibility
      try {
        const rawAdminOrders = localStorage.getItem('seyven_admin_orders_v2');
        const adminOrders = rawAdminOrders ? JSON.parse(rawAdminOrders) : [];
        const existingIdx = adminOrders.findIndex((o: any) => o.id === orderTrackingId);
        if (existingIdx === -1) {
          adminOrders.unshift({
            id: orderTrackingId,
            referenceNo: `ORD-${orderTrackingId.slice(-4)}`,
            customerName: fullName.trim(),
            customerPhone: cleanPhone,
            customerEmail: email.trim(),
            shippingAddress: streetAddress.trim(),
            zone: isInsideDhaka ? 'Dhaka Metro' : 'Outside Dhaka (Nationwide)',
            district: isInsideDhaka ? 'Inside Dhaka' : 'Outside Dhaka',
            items: items.map((it) => ({
              id: it.id,
              sku: `SKU-${it.id.slice(0, 6)}`,
              title: it.titleEn,
              brand: 'SEYVEN',
              variant: it.volume || 'Standard',
              quantity: it.quantity,
              unitPrice: it.priceBdt,
              totalPrice: it.priceBdt * it.quantity,
            })),
            subtotal: subtotalBdt,
            deliveryFee: deliveryFeeBdt,
            discount: discountBdt + loyaltyDiscountBdt,
            totalAmount: netPayableBdt,
            paymentMethod: 'COD',
            status: 'PLACED',
            codVerification: 'PENDING',
            createdAt: now.toISOString(),
            updatedAt: now.toISOString(),
          });
          localStorage.setItem('seyven_admin_orders_v2', JSON.stringify(adminOrders.slice(0, 100)));
        }
      } catch {}

      // Save client order to local recognition history for automatic repeat client courtesy
      try {
        const rawHistory = localStorage.getItem('seyven_client_order_history');
        const history: any[] = rawHistory ? JSON.parse(rawHistory) : [];
        history.unshift({
          orderId: orderTrackingId,
          phone: cleanPhone,
          email: email.trim(),
          name: fullName.trim(),
          date: now.toISOString(),
        });
        localStorage.setItem('seyven_client_order_history', JSON.stringify(history.slice(0, 10)));
      } catch {
        // ignore
      }

      setOrderSuccessData(successPayload);
      clearCart();
    } catch {
      setErrorMessage(
        t('Order placement was interrupted. Please try again.', 'অর্ডার প্রক্রিয়াকরণে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।')
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render Order Confirmation if placed
  if (orderSuccessData) {
    return <CheckoutSuccessView orderData={orderSuccessData} />;
  }

  // Render Empty State if cart is empty
  if (items.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4 py-20 space-y-4">
        <div className="w-14 h-14 rounded-full bg-[#E6DFD5]/40 flex items-center justify-center text-[#C7A97B]">
          <ShoppingBag className="w-7 h-7" />
        </div>
        <h1 className="text-2xl font-serif uppercase tracking-[0.2em] text-[#1C1917] font-light">
          {t('YOUR SANCTUARY BAG IS EMPTY', 'আপনার ব্যাগ খালি')}
        </h1>
        <p className="text-xs text-[#1C1917]/70 max-w-md font-light leading-relaxed">
          {t(
            'Explore our curated collection of genuine international skincare to illuminate your daily routine.',
            'আপনার ত্বকের উপযোগী আন্তর্জাতিক স্কিনকেয়ার প্রোডাক্ট বেছে নিতে কালেকশন ঘুরে দেখুন।'
          )}
        </p>
        <Link
          href="/catalog"
          className="mt-2 px-8 py-3.5 bg-[#1C1917] text-[#F9F6F0] text-xs uppercase tracking-[0.25em] font-medium hover:bg-[#1C1917]/90 transition-colors"
        >
          {t('EXPLORE COLLECTION', 'প্রোডাক্ট কালেকশন')}
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-8 pb-40 lg:pb-16 touch-auto">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-[#E6DFD5] pb-4">
        <div className="flex items-center space-x-3">
          <Link
            href="/catalog"
            className="text-xs uppercase tracking-wider text-[#1C1917]/60 hover:text-[#1C1917] flex items-center space-x-1"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">{t('CONTINUE SHOPPING', 'শপিং চালু রাখুন')}</span>
          </Link>
          <span className="text-[#E6DFD5]">•</span>
          <span className="text-xs font-serif uppercase tracking-[0.2em] font-medium text-[#1C1917]">
            {t('EXPRESS 1-PAGE CHECKOUT', '১-পেজ এক্সপ্রেস চেকআউট')}
          </span>
        </div>

        <div className="flex items-center space-x-1.5 text-[9px] uppercase tracking-wider text-[#C7A97B] font-medium">
          <Lock className="w-3.5 h-3.5" />
          <span>{t('CONFIDENTIAL & SECURE', 'নিরাপদ চেকআউট')}</span>
        </div>
      </div>

      <form onSubmit={handleCommitOrder} className="w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          
          {/* ========================================================================= */}
          {/* LEFT COLUMN: CONTACT, ZONE RESOLVER, PAYMENT (7 cols) */}
          {/* ========================================================================= */}
          <div className="lg:col-span-7 space-y-8">
            
            {/* 1. Recipient Identity Section */}
            <section className="space-y-4">
              <div className="flex items-center space-x-2 text-xs uppercase tracking-[0.2em] font-medium text-[#1C1917]">
                <span className="w-5 h-5 rounded-full bg-[#1C1917] text-[#F9F6F0] flex items-center justify-center text-[10px] font-mono">
                  1
                </span>
                <span>{t('RECIPIENT & CONTACT DETAILS', 'গ্রাহকের নাম ও মোবাইল নম্বর')}</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Full Name */}
                <div className="space-y-1 sm:col-span-2">
                  <label htmlFor="full-name" className="text-[10px] uppercase tracking-[0.2em] text-[#1C1917]/70 block font-medium">
                    {t('FULL NAME (REQUIRED)', 'পুরো নাম (বাধ্যতামূলক)')}
                  </label>
                  <input
                    id="full-name"
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder={t('Enter your full name', 'আপনার পুরো নাম লিখুন')}
                    className="w-full bg-[#F9F6F0] border-b border-[#E6DFD5] focus:border-[#C7A97B] py-2.5 text-base sm:text-xs text-[#1C1917] placeholder:text-[#1C1917]/35 focus:outline-hidden transition-colors"
                  />
                </div>

                {/* Mobile Phone (E.164 Bangladeshi) */}
                <div className="space-y-1">
                  <label htmlFor="phone" className="text-[10px] uppercase tracking-[0.2em] text-[#1C1917]/70 block font-medium">
                    {t('BANGLADESHI MOBILE PHONE (REQUIRED)', 'মোবাইল নম্বর (বাধ্যতামূলক)')}
                  </label>
                  <input
                    id="phone"
                    type="tel"
                    inputMode="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="01700 000000"
                    className="w-full bg-[#F9F6F0] border-b border-[#E6DFD5] focus:border-[#C7A97B] py-2.5 text-base sm:text-xs font-mono text-[#1C1917] placeholder:text-[#1C1917]/35 focus:outline-hidden transition-colors"
                  />
                  <span className="text-[9px] text-[#1C1917]/50 block">
                    {t('Used for courier SMS & delivery confirmation.', 'ডেলিভারি কল ও এসএমএস কনফার্মেশনের জন্য।')}
                  </span>
                </div>

                {/* Optional Email */}
                <div className="space-y-1">
                  <label htmlFor="email" className="text-[10px] uppercase tracking-[0.2em] text-[#1C1917]/70 block font-medium">
                    {t('EMAIL (OPTIONAL — FOR ORDER RECEIPT)', 'ইমেইল (ঐচ্ছিক — রসিদ ও ট্র্যাকিংয়ের জন্য)')}
                  </label>
                  <input
                    id="email"
                    type="email"
                    inputMode="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@gmail.com"
                    className="w-full bg-[#F9F6F0] border-b border-[#E6DFD5] focus:border-[#C7A97B] py-2.5 text-base sm:text-xs text-[#1C1917] placeholder:text-[#1C1917]/35 focus:outline-hidden transition-colors"
                  />
                  <span className="text-[9px] text-[#1C1917]/50 block">
                    {t(
                      'Order receipt and courier tracking link will be sent here.',
                      'অর্ডার রসিদ ও ট্র্যাকিং লিংক ইমেইলে পাঠানো হবে।'
                    )}
                  </span>
                </div>
              </div>
            </section>

            {/* 2. Simplified Delivery Destination & Address */}
            <section className="space-y-4 pt-4 border-t border-[#E6DFD5]">
              <div className="flex items-center space-x-2 text-xs uppercase tracking-[0.2em] font-medium text-[#1C1917]">
                <span className="w-5 h-5 rounded-full bg-[#1C1917] text-[#F9F6F0] flex items-center justify-center text-[10px] font-mono">
                  2
                </span>
                <span>{t('DELIVERY DESTINATION & ADDRESS', 'ডেলিভারি এলাকা ও ঠিকানা')}</span>
              </div>

              {/* 1-Tap Inside / Outside Dhaka Selector */}
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setIsInsideDhaka(true)}
                    className={`p-3.5 text-left border transition-all cursor-pointer ${
                      isInsideDhaka
                        ? 'border-[#C7A97B] bg-[#F9F6F0] ring-1 ring-[#C7A97B]'
                        : 'border-[#E6DFD5] bg-transparent hover:border-[#1C1917]/30'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-serif uppercase tracking-wider text-[#1C1917] font-medium">
                        {t('INSIDE DHAKA', 'ঢাকার ভেতরে')}
                      </span>
                      <span className="text-xs font-mono font-medium text-[#C7A97B]">৳{standardFeeDhaka}</span>
                    </div>
                    <p className="text-[10px] text-[#1C1917]/55 mt-1 font-light">
                      {t('1–2 Days Express Delivery', '১-২ দিনে দ্রুত ডেলিভারি')}
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsInsideDhaka(false)}
                    className={`p-3.5 text-left border transition-all cursor-pointer ${
                      !isInsideDhaka
                        ? 'border-[#C7A97B] bg-[#F9F6F0] ring-1 ring-[#C7A97B]'
                        : 'border-[#E6DFD5] bg-transparent hover:border-[#1C1917]/30'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-serif uppercase tracking-wider text-[#1C1917] font-medium">
                        {t('OUTSIDE DHAKA', 'ঢাকার বাইরে')}
                      </span>
                      <span className="text-xs font-mono font-medium text-[#C7A97B]">৳{standardFeeOutside}</span>
                    </div>
                    <p className="text-[10px] text-[#1C1917]/55 mt-1 font-light">
                      {t('2–3 Days Nationwide Courier', '২-৩ দিনে সারাদেশে ডেলিভারি')}
                    </p>
                  </button>
                </div>
              </div>

              {/* Detailed Street Address */}
              <div className="space-y-1 pt-1">
                <label htmlFor="street-address" className="text-[10px] uppercase tracking-[0.2em] text-[#1C1917]/70 block font-medium">
                  {t('FULL DELIVERY ADDRESS (HOUSE, ROAD, AREA, THANA, DISTRICT)', 'সম্পূর্ণ ডেলিভারি ঠিকানা (বাড়ি, রোড, এলাকা/থানা ও জেলা)')}
                </label>
                <textarea
                  id="street-address"
                  required
                  rows={2}
                  value={streetAddress}
                  onChange={(e) => setStreetAddress(e.target.value)}
                  placeholder={
                    isInsideDhaka
                      ? 'e.g. House 24, Road 11, Block D, Banani, Dhaka'
                      : 'e.g. House 15, Nasirabad Housing Society, Chattogram (বা আপনার সম্পূর্ণ ঠিকানা, থানা ও জেলা)'
                  }
                  className="w-full bg-[#F9F6F0] border border-[#E6DFD5] p-3 text-base sm:text-xs text-[#1C1917] placeholder:text-[#1C1917]/35 focus:outline-hidden focus:border-[#C7A97B] transition-colors resize-none"
                />
              </div>

              {/* Special Delivery Notes */}
              <div className="space-y-1">
                <label htmlFor="delivery-notes" className="text-[10px] uppercase tracking-[0.2em] text-[#1C1917]/70 block">
                  {t('SPECIAL INSTRUCTIONS FOR COURIER (OPTIONAL)', 'ডেলিভারি ম্যানের জন্য বিশেষ নির্দেশনা (ঐচ্ছিক)')}
                </label>
                <input
                  id="delivery-notes"
                  type="text"
                  value={deliveryNotes}
                  onChange={(e) => setDeliveryNotes(e.target.value)}
                  placeholder="e.g. Call before arrival or leave with lobby reception"
                  className="w-full bg-[#F9F6F0] border-b border-[#E6DFD5] focus:border-[#C7A97B] py-2 text-base sm:text-xs text-[#1C1917] placeholder:text-[#1C1917]/35 focus:outline-hidden transition-colors"
                />
              </div>
            </section>

            {/* 3. Esteemed Client Privilege (Hidden if festival campaign code is applied) */}
            {discountBdt === 0 && (
              <section className="pt-2">
                <CheckoutLoyaltySlider
                  maxSubtotalBdt={subtotalBdt}
                  phone={phone}
                  email={email}
                  onClientRecognized={(recognizedName) => {
                    if (!fullName.trim() && recognizedName) {
                      setFullName(recognizedName);
                    }
                  }}
                  onRedeemChange={(val) => setLoyaltyDiscountBdt(val)}
                />
              </section>
            )}

            {/* 4. Payment Selection */}
            <section className="pt-4 border-t border-[#E6DFD5]">
              <CheckoutPaymentSelector
                selectedMethod={paymentMethod}
                onChangeMethod={(m) => setPaymentMethod(m)}
              />
            </section>

            {/* Reassuring Guarantee Notice (No mandatory checkboxes) */}
            <section className="pt-2">
              <p className="text-[10px] text-[#1C1917]/65 text-center leading-relaxed">
                {t(
                  'By placing your order, you enjoy SEYVEN complimentary 7-day exchange and direct parcel tracking.',
                  'অর্ডার করলেই পাচ্ছেন সেভেনের ৭ দিনের সহজ এক্সচেঞ্জ ও সার্বক্ষণিক ট্র্যাকিং সুবিধা।'
                )}
              </p>

              {errorMessage && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center space-x-2 mt-3">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}
            </section>

            {/* Desktop Action Button */}
            <div className="hidden lg:block pt-4 space-y-3">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 bg-[#1C1917] hover:bg-[#1C1917]/90 disabled:opacity-50 text-[#F9F6F0] text-xs uppercase tracking-[0.25em] font-medium transition-all duration-300 shadow-sm flex items-center justify-center space-x-2 cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4 text-[#C7A97B]" />
                <span>
                  {isSubmitting
                    ? t('PLACING YOUR ORDER...', 'অর্ডার সম্পন্ন হচ্ছে...')
                    : `${t('COMPLETE SECURE ORDER — ', 'অর্ডার নিশ্চিত করুন — ')} ${formatBdt(netPayableBdt)}`}
                </span>
              </button>

              <div className="text-center pt-1">
                <a
                  href={conciergeCheckoutUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-1.5 text-[11px] uppercase tracking-[0.18em] text-[#1C1917]/70 hover:text-[#C7A97B] transition-colors"
                >
                  <MessageCircle className="w-3.5 h-3.5 text-[#C7A97B]" />
                  <span>
                    {isMessengerConcierge
                      ? t('PREFER ASSISTED MESSENGER CHECKOUT? TAP HERE', 'অথবা মেসেঞ্জার কনসিয়ার্জে অর্ডার করুন')
                      : t('PREFER ASSISTED WHATSAPP CHECKOUT? TAP HERE', 'অথবা হোয়াটসঅ্যাপ কনসিয়ার্জে অর্ডার করুন')}
                  </span>
                </a>
              </div>
            </div>

          </div>

          {/* ========================================================================= */}
          {/* RIGHT COLUMN: REAL-TIME FINANCIAL SUMMARY (5 cols) */}
          {/* ========================================================================= */}
          <div className="lg:col-span-5 lg:sticky lg:top-28">
            <CheckoutOrderSummary
              deliveryFeeBdt={deliveryFeeBdt}
              loyaltyDiscountBdt={effectiveLoyaltyDiscount}
            />

            {/* Reassurance Badge Block */}
            <div className="mt-4 p-4 bg-[#F9F6F0] border border-[#E6DFD5] space-y-2.5 text-[11px] text-[#1C1917]/80">
              <div className="flex items-center space-x-2">
                <Truck className="w-3.5 h-3.5 text-[#C7A97B] shrink-0" />
                <span>
                  <strong>{isInsideDhaka ? t('Inside Dhaka', 'ঢাকার ভেতরে') : t('Outside Dhaka (Nationwide)', 'ঢাকার বাইরে / সারাদেশে')}:</strong>{' '}
                  {isInsideDhaka
                    ? (lang === 'bn' ? '১-২ কর্মদিবসে এক্সপ্রেস ডেলিভারি' : '1-2 Days Express Delivery')
                    : (lang === 'bn' ? '২-৩ কর্মদিবসে সারাদেশে কুরিয়ার ডেলিভারি' : '2-3 Days Nationwide Courier')}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-3.5 h-3.5 text-[#C7A97B] shrink-0" />
                <span>
                  {t(
                    'Direct brand imports in original sealed packaging.',
                    'আন্তর্জাতিক ব্র্যান্ড থেকে সরাসরি আমদানিকৃত ও সিলযুক্ত আসল পণ্য।'
                  )}
                </span>
              </div>
            </div>
          </div>

        </div>

        {/* ========================================================================= */}
        {/* MOBILE STICKY BOTTOM CHECKOUT ACTION BAR (100% Mobile Optimized) */}
        {/* ========================================================================= */}
        <div className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-[#F9F6F0]/95 backdrop-blur-md border-t border-[#E6DFD5] p-3 px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))] shadow-2xl flex items-center justify-between gap-3">
          <div className="space-y-0.5 min-w-0 pr-1">
            <span className="text-[9px] uppercase tracking-wider text-[#1C1917]/60 block">
              {t('NET TOTAL', 'মোট প্রদেয়')}
            </span>
            <span className="text-base font-serif font-medium text-[#1C1917]">
              {formatBdt(netPayableBdt)}
            </span>
          </div>

          <div className="flex items-center gap-2 flex-1 max-w-[240px]">
            <a
              href={conciergeCheckoutUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-3 bg-[#F9F6F0] border border-[#C7A97B]/70 hover:bg-[#E6DFD5]/40 text-[#1C1917] transition-all flex items-center justify-center shrink-0 cursor-pointer"
              aria-label={isMessengerConcierge ? 'Order on Messenger' : 'Order on WhatsApp'}
              title={isMessengerConcierge ? 'Order on Messenger' : 'Order on WhatsApp'}
            >
              <MessageCircle className="w-4 h-4 text-[#C7A97B]" />
            </a>

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-3 px-3 bg-[#1C1917] active:bg-[#1C1917]/80 disabled:opacity-50 text-[#F9F6F0] text-xs uppercase tracking-[0.18em] font-medium transition-colors flex items-center justify-center space-x-1.5 shadow-sm cursor-pointer"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-[#C7A97B]" />
              <span>{isSubmitting ? t('COMMITTING...', 'অর্ডার হচ্ছে...') : t('CONFIRM', 'কনফার্ম')}</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
