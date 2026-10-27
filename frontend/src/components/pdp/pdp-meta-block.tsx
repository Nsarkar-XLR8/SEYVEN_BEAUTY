import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ShoppingBag, Check, ShieldCheck, Truck, Sparkles, Bell, ArrowRight, MessageCircle } from 'lucide-react';
import { useCart } from '@/context/cart-context';
import { useLanguage } from '@/context/language-context';
import { formatBdt } from '@/lib/formatters';
import { ProductDetail, ProductVariant } from '@/data/products';

interface PdpMetaBlockProps {
  product: ProductDetail;
  onOpenWaitlist: () => void;
}

export function PdpMetaBlock({ product, onOpenWaitlist }: PdpMetaBlockProps) {
  const router = useRouter();
  const { lang, t } = useLanguage();
  const { addItem, openBag } = useCart();

  const [selectedVariant, setSelectedVariant] = useState<ProductVariant>(
    product.variants[0] || {
      id: 'default',
      sku: product.id,
      titleEn: product.volume,
      titleBn: product.volume,
      volume: product.volume,
      priceBdt: product.priceBdt,
      inStock: product.stockStatus !== 'OUT_OF_STOCK',
      stockCount: product.availableStock,
    }
  );

  const [quantity, setQuantity] = useState(1);
  const [isAddedRecently, setIsAddedRecently] = useState(false);

  const isCurrentVariantInStock = selectedVariant.inStock;
  const currentPrice = selectedVariant.priceBdt;
  const lineTotal = currentPrice * quantity;

  const handleAddToCart = () => {
    if (!isCurrentVariantInStock) {
      onOpenWaitlist();
      return;
    }

    addItem(
      {
        variantId: selectedVariant.id,
        productId: product.id,
        slug: product.slug,
        titleEn: product.titleEn,
        titleBn: product.titleBn,
        volume: selectedVariant.volume,
        priceBdt: currentPrice,
        image: product.images[0]?.url,
      },
      quantity
    );

    setIsAddedRecently(true);
    setTimeout(() => setIsAddedRecently(false), 2500);
  };

  const handleInstantBuy = () => {
    if (!isCurrentVariantInStock) {
      onOpenWaitlist();
      return;
    }

    addItem(
      {
        variantId: selectedVariant.id,
        productId: product.id,
        slug: product.slug,
        titleEn: product.titleEn,
        titleBn: product.titleBn,
        volume: selectedVariant.volume,
        priceBdt: currentPrice,
        image: product.images[0]?.url,
      },
      quantity
    );

    router.push('/checkout');
  };

  return (
    <div className="space-y-6 lg:max-w-xl">
      {/* 1. Purpose Tag & Brand Header */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.25em] text-[#C7A97B] font-medium">
          <span>{lang === 'bn' ? product.purposeTagBn : product.purposeTagEn}</span>
          <span className="text-[#1C1917]/50">{product.brand}</span>
        </div>

        {/* Product Title */}
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-serif uppercase tracking-[0.16em] font-light text-[#1C1917] leading-tight">
          {lang === 'bn' ? product.titleBn : product.titleEn}
        </h1>

        {/* Subtitle / Short description */}
        <p className="text-xs text-[#1C1917]/70 font-light leading-relaxed tracking-[0.03em] pt-1">
          {lang === 'bn' ? product.subtitleBn : product.subtitleEn}
        </p>
      </div>

      {/* 2. Brand & Volume */}
      <div className="flex flex-wrap items-center gap-3 sm:gap-4 py-2.5 border-y border-[#E6DFD5] text-xs">
        <div className="inline-flex items-center space-x-1.5 text-[#C7A97B]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#C7A97B]" />
          <span className="text-[10px] uppercase tracking-[0.22em] font-medium">
            {product.brand}
          </span>
        </div>
        <span className="text-[#E6DFD5] hidden sm:inline">•</span>
        <div className="text-[10px] uppercase tracking-[0.2em] text-[#1C1917]/70 font-medium">
          {product.volume}
        </div>
        <span className="text-[#E6DFD5] hidden sm:inline">•</span>
        <div className="text-[10px] uppercase tracking-[0.2em] text-[#1C1917]/60">
          {t('ROUTINE STEP', 'রুটিন ধাপ')}: {product.routineStep}
        </div>
      </div>

      {/* 3. Pricing & Stock Badge */}
      <div className="flex items-baseline justify-between">
        <div className="space-y-0.5">
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl sm:text-3xl font-sans font-semibold text-[#1C1917] tabular-nums tracking-tight">
              <span className="text-lg font-normal text-[#C7A97B] mr-1 select-none">৳</span>
              {Math.round(currentPrice).toLocaleString('en-IN')}
            </span>
          </div>
          <span className="text-[9px] uppercase tracking-[0.2em] text-[#1C1917]/50 block">
            {t('INCLUSIVE OF ALL STATUTORY TAXES', 'সকল ট্যাক্স অন্তর্ভুক্ত')}
          </span>
        </div>

        {/* Stock Badge */}
        <div>
          {isCurrentVariantInStock ? (
            <div className="inline-flex items-center space-x-1.5 px-3 py-1 bg-[#F9F6F0] border border-[#C7A97B]/40 text-[9px] uppercase tracking-[0.2em] text-[#1C1917] font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
              <span>{t('[ IN STOCK ]', '[ স্টকে আছে ]')}</span>
            </div>
          ) : (
            <div className="inline-flex items-center space-x-1.5 px-3 py-1 bg-[#1C1917]/5 border border-[#1C1917]/20 text-[9px] uppercase tracking-[0.2em] text-[#1C1917]/70">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
              <span>{t('[ RESTOCKING SOON ]', '[ শীঘ্রই পুনরায় আসছে ]')}</span>
            </div>
          )}
        </div>
      </div>

      {/* 4. Variant Selector */}
      {product.variants.length > 1 && (
        <div className="space-y-2 pt-2">
          <label className="text-[10px] uppercase tracking-[0.25em] text-[#1C1917]/70 font-medium block">
            SELECT EDITION / SIZE
          </label>
          <div className="grid grid-cols-2 gap-3">
            {product.variants.map((v) => {
              const isSelected = v.id === selectedVariant.id;
              const displayLabel = v.volume || v.titleEn;
              return (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => setSelectedVariant(v)}
                  className={`p-3 text-left border transition-all duration-200 relative ${
                    isSelected
                      ? 'border-[#C7A97B] bg-[#F9F6F0] ring-1 ring-[#C7A97B]'
                      : 'border-[#E6DFD5] bg-transparent hover:border-[#1C1917]/30'
                  }`}
                >
                  <p className="text-[11px] uppercase tracking-[0.14em] font-sans text-[#1C1917] font-medium">
                    {displayLabel}
                  </p>
                  <p className="text-[11px] font-sans font-semibold tracking-wide text-[#8C6D3B] tabular-nums mt-0.5">
                    {formatBdt(v.priceBdt)}
                  </p>
                  {!v.inStock && (
                    <span className="absolute top-2 right-2 text-[7px] uppercase tracking-wider text-amber-700 bg-amber-50 px-1 border border-amber-200">
                      RESTOCKING
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 5. Quantity & Purchasing Actions */}
      <div className="pt-2 space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch gap-3">
          {/* Quantity Selector */}
          <div className="flex items-center justify-between sm:justify-start border border-[#E6DFD5] bg-[#F9F6F0]">
            <button
              type="button"
              aria-label="Decrease quantity"
              disabled={quantity <= 1 || !isCurrentVariantInStock}
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              className="w-10 h-12 flex items-center justify-center text-sm text-[#1C1917] hover:text-[#C7A97B] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              —
            </button>
            <span className="w-10 text-center font-sans text-sm text-[#1C1917] font-semibold tabular-nums select-none">
              {quantity}
            </span>
            <button
              type="button"
              aria-label="Increase quantity"
              disabled={!isCurrentVariantInStock || quantity >= (selectedVariant.stockCount || 10)}
              onClick={() => setQuantity((q) => q + 1)}
              className="w-10 h-12 flex items-center justify-center text-sm text-[#1C1917] hover:text-[#C7A97B] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              +
            </button>
          </div>

          {/* Add to Bag & Buy Now Buttons */}
          {isCurrentVariantInStock ? (
            <div className="flex-1 flex flex-col sm:flex-row items-stretch gap-2.5">
              <button
                type="button"
                onClick={handleAddToCart}
                className="group flex-1 px-5 py-3.5 bg-[#1C1917] hover:bg-[#8C6D3B] text-[#FAF8F5] text-xs uppercase tracking-[0.22em] font-medium transition-all duration-300 shadow-sm flex items-center justify-center space-x-2 rounded-none cursor-pointer"
              >
                {isAddedRecently ? (
                  <>
                    <Check className="w-4 h-4 text-[#FAF8F5] transition-transform duration-300 group-hover:scale-110" />
                    <span>{t('ADDED TO BAG', 'ব্যাগ-এ যোগ হয়েছে')}</span>
                  </>
                ) : (
                  <>
                    <ShoppingBag className="w-4 h-4 text-[#C7A97B] group-hover:text-[#FAF8F5] transition-all duration-300 group-hover:scale-110" />
                    <span>{t('ADD TO BAG', 'ব্যাগ-এ যোগ করুন')}</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleInstantBuy}
                className="group px-6 py-3.5 bg-transparent hover:bg-[#1C1917] text-[#1C1917] hover:text-[#FAF8F5] border border-[#1C1917]/30 hover:border-[#1C1917] text-xs uppercase tracking-[0.22em] font-medium transition-all duration-300 flex items-center justify-center space-x-2 shrink-0 rounded-none cursor-pointer"
              >
                <span>{t('BUY NOW', 'এখনই কিনুন')}</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#C7A97B] group-hover:text-[#FAF8F5] transition-all duration-300 group-hover:translate-x-1" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={onOpenWaitlist}
              className="group flex-1 px-6 py-3.5 border border-[#1C1917]/30 hover:border-[#8C6D3B] bg-transparent hover:bg-[#8C6D3B] text-[#1C1917] hover:text-[#FAF8F5] text-xs uppercase tracking-[0.22em] font-medium transition-all duration-300 flex items-center justify-center space-x-2 rounded-none cursor-pointer"
            >
              <Bell className="w-4 h-4 text-[#C7A97B] group-hover:text-[#FAF8F5] transition-all duration-300 group-hover:scale-110" />
              <span>{t('NOTIFY WHEN RESTOCKED', 'স্টকে আসলে আমাকে জানান')}</span>
            </button>
          )}
        </div>

        {/* WhatsApp 1-Tap Direct Order for Meta (Instagram/Facebook) community */}
        {isCurrentVariantInStock && (
          <a
            href={`https://wa.me/8801700000000?text=${encodeURIComponent(
              `Hi SEYVEN! I saw this on Instagram/Facebook and would like to order:\n\n• Product: ${product.titleEn} (${selectedVariant.volume})\n• Price: ৳${Math.round(currentPrice).toLocaleString('en-IN')}\n• Quantity: ${quantity}\n\nPlease confirm my delivery details.`
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="group w-full py-3.5 px-4 bg-transparent hover:bg-[#1C1917] text-[#1C1917] hover:text-[#FAF8F5] border border-[#1C1917]/30 hover:border-[#1C1917] text-xs uppercase tracking-[0.22em] font-medium transition-all duration-300 flex items-center justify-center space-x-2.5 text-center rounded-none shadow-xs cursor-pointer"
          >
            <MessageCircle className="w-4 h-4 text-[#C7A97B] group-hover:text-[#FAF8F5] transition-all duration-300 group-hover:scale-110" />
            <span>{t('ORDER VIA WHATSAPP CONCIERGE', 'হোয়াটসঅ্যাপে সরাসরি অর্ডার করুন')}</span>
          </a>
        )}

        {/* Subtle, non-intrusive feedback toast when item is added */}
        {isAddedRecently && (
          <div className="flex items-center justify-between p-3 bg-[#F9F6F0] border border-[#C7A97B]/40 text-xs animate-in fade-in duration-200">
            <div className="flex items-center space-x-2 text-[11px] text-[#1C1917]">
              <Check className="w-3.5 h-3.5 text-emerald-700" />
              <span>{t('Placed in your Sanctuary Bag.', 'পণ্যটি আপনার ব্যাগে যুক্ত হয়েছে।')}</span>
            </div>
            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={() => openBag()}
                className="text-[10px] uppercase tracking-wider text-[#C7A97B] font-semibold hover:underline"
              >
                {t('VIEW BAG', 'ব্যাগ দেখুন')}
              </button>
              <Link
                href="/checkout"
                className="text-[10px] uppercase tracking-wider bg-[#1C1917] text-[#F9F6F0] px-3 py-1 font-medium hover:bg-[#1C1917]/90"
              >
                {t('CHECKOUT', 'চেকআউট')}
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* 6. SEYVEN Client Care Notes */}
      <div className="pt-4 border-t border-[#E6DFD5] space-y-2.5">
        <div className="flex items-center space-x-2.5 text-[11px] text-[#1C1917]/80">
          <ShieldCheck className="w-3.5 h-3.5 text-[#C7A97B] shrink-0" />
          <span>
            {t(
              `Curated authentic formulation directly imported from ${product.originCountry || 'brand partners'}`,
              `${product.originCountry || 'আন্তর্জাতিক ব্র্যান্ড'} থেকে সরাসরি সংগৃহীত শতভাগ আসল পণ্য`
            )}
          </span>
        </div>
        <div className="flex items-center space-x-2.5 text-[11px] text-[#1C1917]/80">
          <Sparkles className="w-3.5 h-3.5 text-[#C7A97B] shrink-0" />
          <span>
            {t(
              'Cash on Delivery (COD) supported nationwide with open box inspection',
              'সারাদেশে ক্যাশ অন ডেলিভারি (COD) ও পণ্য দেখে নেওয়ার সুবিধা'
            )}
          </span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MOBILE FLOATING STICKY PURCHASING BAR (Crucial for 50%+ Mobile Conversion) */}
      {/* ========================================================================= */}
      {isCurrentVariantInStock && (
        <div className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-[#F9F6F0]/95 backdrop-blur-md border-t border-[#E6DFD5] p-3 px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))] shadow-2xl flex items-center justify-between gap-2.5">
          <div className="space-y-0.5 min-w-0 pr-1">
            <span className="text-[9px] uppercase tracking-wider text-[#1C1917]/60 block truncate font-medium">
              {product.brand} • {selectedVariant.volume}
            </span>
            <span className="text-base font-sans font-semibold text-[#1C1917] tabular-nums block">
              ৳{Math.round(currentPrice).toLocaleString('en-IN')}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={`https://wa.me/8801700000000?text=${encodeURIComponent(
                `Hi SEYVEN! I want to order this product:\n\n• Product: ${product.titleEn} (${selectedVariant.volume})\n• Price: ৳${Math.round(currentPrice).toLocaleString('en-IN')}\n\nPlease take my delivery address.`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="group p-3 bg-transparent hover:bg-[#1C1917] border border-[#1C1917]/30 hover:border-[#1C1917] text-[#1C1917] hover:text-[#FAF8F5] transition-all duration-300 flex items-center justify-center shrink-0 rounded-none cursor-pointer"
              aria-label="Order on WhatsApp"
              title="Order on WhatsApp"
            >
              <MessageCircle className="w-4 h-4 text-[#C7A97B] group-hover:text-[#FAF8F5] transition-all duration-300 group-hover:scale-110" />
            </a>

            <button
              type="button"
              onClick={handleInstantBuy}
              className="group py-3 px-5 bg-[#1C1917] hover:bg-[#8C6D3B] text-[#FAF8F5] text-xs uppercase tracking-[0.2em] font-medium transition-all duration-300 flex items-center justify-center space-x-2 shadow-sm rounded-none cursor-pointer"
            >
              <span>{t('BUY NOW', 'এখনই কিনুন')}</span>
              <ArrowRight className="w-3.5 h-3.5 text-[#C7A97B] group-hover:text-[#FAF8F5] transition-all duration-300 group-hover:translate-x-1" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
