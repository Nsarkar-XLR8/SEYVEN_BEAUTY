'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  X,
  RotateCcw,
  Gift,
  ShieldCheck,
  AlertCircle,
  Package,
  Plus,
  Trash2,
  Box,
  CheckCircle,
  Search,
  Sparkles,
  Star,
  BookmarkPlus,
  Check,
  RotateCcw as ResetIcon,
} from 'lucide-react';
import { useAdmin } from '@/context/admin-context';
import { AdminOrder, OrderItem, AdminProduct } from '@/types/admin';
import { formatBdt } from '@/lib/formatters';
import { detectDistrictFromAddress, BD_ALL_DISTRICTS } from '@/data/bangladesh-districts';

interface ReplacementOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  sourceOrder: AdminOrder;
  onSuccess?: (replacementOrder: AdminOrder) => void;
}

const DEFECT_REASONS = [
  { id: 'FACTORY_SEALED_DEFECT', label: 'Factory Defect inside Seal (Damaged/Molten inside unopened packaging)' },
  { id: 'TRANSIT_DAMAGE', label: 'Transit Damage / Crushed / Leaked in Transit' },
  { id: 'WRONG_PRODUCT', label: 'Incorrect Product / Shade / Variant Dispatched' },
  { id: 'BATCH_QUALITY_ISSUE', label: 'Formula / Texture / Quality Discrepancy' },
  { id: 'VIP_COURTESY', label: 'VIP Executive Courtesy Reshipment' },
];

export interface GiftVaultItem {
  id: string;
  title: string;
  brand: string;
  regularPrice?: number;
  imageUrl?: string;
  isCustom?: boolean;
}

const DEFAULT_GIFT_VAULT: GiftVaultItem[] = [
  { id: 'vault-mars-eyeliner', title: 'MARS Eyeliner (Waterproof Deep Black)', brand: 'MARS', regularPrice: 80 },
  { id: 'vault-sheet-mask', title: 'Bio-Cellulose Hydrating Sheet Mask', brand: 'Curated K-Beauty', regularPrice: 120 },
  { id: 'vault-lip-scrub', title: 'Exfoliating Berry Lip Scrub', brand: 'SEYVEN Courtesy', regularPrice: 150 },
  { id: 'vault-blender-sponge', title: 'Soft Velvet Beauty Blender Sponge', brand: 'SEYVEN Courtesy', regularPrice: 90 },
];

const VAULT_STORAGE_KEY = 'seyven_owner_gift_vault';

export interface ActiveGift {
  id: string;
  title: string;
  brand: string;
  quantity: number;
  regularPrice?: number;
}

export function ReplacementOrderModal({
  isOpen,
  onClose,
  sourceOrder,
  onSuccess,
}: ReplacementOrderModalProps) {
  const { createReplacementOrder, platformSettings, products } = useAdmin();

  const dynamicFeeConfig = {
    insideDhakaFee: Number(platformSettings?.standardDeliveryDhakaBdt) || 70,
    outsideDhakaFee: Number(platformSettings?.standardDeliveryOutsideBdt) || 130,
    suburbsFee: 100,
  };

  // 1. Dynamic Item Selection from any order
  const [selectedItemIds, setSelectedItemIds] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    const items = sourceOrder?.items || [];
    items.forEach((it, idx) => {
      if (items.length === 1 || idx === 0) {
        initial[it.id] = true;
      }
    });
    return initial;
  });

  const [quantities, setQuantities] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    const items = sourceOrder?.items || [];
    items.forEach((it) => {
      initial[it.id] = it.quantity || 1;
    });
    return initial;
  });

  // 2. Persistent Owner Gift Vault & Active Gifts (100% Owner Freedom)
  const [giftVault, setGiftVault] = useState<GiftVaultItem[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(VAULT_STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch (err) {
        console.error('Failed to load gift vault from localStorage:', err);
      }
    }
    return DEFAULT_GIFT_VAULT;
  });

  const saveVault = (newVault: GiftVaultItem[]) => {
    setGiftVault(newVault);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(VAULT_STORAGE_KEY, JSON.stringify(newVault));
      } catch (err) {
        console.error('Failed to persist gift vault:', err);
      }
    }
  };

  const handleAddToVault = (item: Omit<GiftVaultItem, 'id'>) => {
    const exists = giftVault.some((v) => v.title.toLowerCase().trim() === item.title.toLowerCase().trim());
    if (exists) return;
    const newEntry: GiftVaultItem = {
      ...item,
      id: `vault-${Date.now()}`,
      isCustom: true,
    };
    saveVault([...giftVault, newEntry]);
  };

  const handleRemoveFromVault = (id: string) => {
    const next = giftVault.filter((v) => v.id !== id);
    saveVault(next.length > 0 ? next : DEFAULT_GIFT_VAULT);
  };

  const handleResetVault = () => {
    saveVault(DEFAULT_GIFT_VAULT);
  };

  // Active gifts to be dispatched with this replacement
  const [hasGift, setHasGift] = useState<boolean>(true);
  const [activeGifts, setActiveGifts] = useState<ActiveGift[]>([
    {
      id: `gift-${Date.now()}`,
      title: 'MARS Eyeliner (Waterproof Deep Black)',
      brand: 'MARS',
      quantity: 1,
      regularPrice: 80,
    },
  ]);

  const addGiftToActive = (gift: { title: string; brand: string; regularPrice?: number }) => {
    const cleanTitle = gift.title.trim();
    if (!cleanTitle) return;
    const existingIndex = activeGifts.findIndex((g) => g.title.toLowerCase() === cleanTitle.toLowerCase());
    if (existingIndex >= 0) {
      setActiveGifts((prev) =>
        prev.map((g, idx) => (idx === existingIndex ? { ...g, quantity: g.quantity + 1 } : g)),
      );
    } else {
      setActiveGifts((prev) => [
        ...prev,
        {
          id: `gift-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          title: cleanTitle,
          brand: gift.brand || 'SEYVEN Courtesy',
          quantity: 1,
          regularPrice: gift.regularPrice,
        },
      ]);
    }
    setHasGift(true);
  };

  const updateActiveGiftQuantity = (giftId: string, quantity: number) => {
    setActiveGifts((prev) =>
      prev.map((g) => (g.id === giftId ? { ...g, quantity: Math.max(1, quantity) } : g)),
    );
  };

  const removeActiveGift = (giftId: string) => {
    setActiveGifts((prev) => prev.filter((g) => g.id !== giftId));
  };

  // Live Catalog Search & Custom Gift Builder
  const [catalogSearch, setCatalogSearch] = useState<string>('');
  const [isSearchingCatalog, setIsSearchingCatalog] = useState<boolean>(false);
  const [customGiftTitle, setCustomGiftTitle] = useState<string>('');
  const [customGiftBrand, setCustomGiftBrand] = useState<string>('');
  const [saveCustomToVault, setSaveCustomToVault] = useState<boolean>(true);

  const filteredProducts = useMemo(() => {
    if (!catalogSearch.trim()) return [];
    const q = catalogSearch.toLowerCase().trim();
    return (products || [])
      .filter((p) => {
        const titleEn = (p.titleEn || '').toLowerCase();
        const titleBn = (p.titleBn || '').toLowerCase();
        const brand = (p.brand || '').toLowerCase();
        return titleEn.includes(q) || titleBn.includes(q) || brand.includes(q);
      })
      .slice(0, 6);
  }, [catalogSearch, products]);

  const handleSelectCatalogProduct = (p: AdminProduct) => {
    addGiftToActive({
      title: p.titleEn,
      brand: p.brand || 'SEYVEN',
      regularPrice: p.priceBdt || (p.variants?.[0]?.priceBdt) || 0,
    });
    setCatalogSearch('');
    setIsSearchingCatalog(false);
  };

  const handleAddCustomGift = () => {
    const title = customGiftTitle.trim();
    if (!title) return;
    const brand = customGiftBrand.trim() || 'SEYVEN Courtesy';
    addGiftToActive({
      title,
      brand,
    });
    if (saveCustomToVault) {
      handleAddToVault({
        title,
        brand,
      });
    }
    setCustomGiftTitle('');
    setCustomGiftBrand('');
  };

  // 3. Defect details & QA agreement
  const [defectReason, setDefectReason] = useState<string>(DEFECT_REASONS[0].label);
  const [staffNote, setStaffNote] = useState<string>(
    'Customer reported defect. Replacement approved. QA seal inspected per client consent before packing.',
  );
  const [qaInspectionAgreed, setQaInspectionAgreed] = useState<boolean>(true);

  // 4. Initial Pipeline Status Control
  const [initialStatus, setInitialStatus] = useState<'CONFIRMED' | 'PACKED'>('CONFIRMED');

  // 5. Address (defaults to original order address, editable, defensive against object/string)
  const [shippingAddress, setShippingAddress] = useState<string>(() => {
    if (typeof sourceOrder?.shippingAddress === 'string') return sourceOrder.shippingAddress;
    if (typeof sourceOrder?.shippingAddress === 'object' && sourceOrder?.shippingAddress) {
      const a = sourceOrder.shippingAddress as any;
      return a.address || a.streetAddress || a.fullAddress || '';
    }
    return '';
  });
  const [customerPhone, setCustomerPhone] = useState<string>(sourceOrder?.customerPhone || '');
  const [district, setDistrict] = useState<string>(() => {
    const rawAddr = (
      (typeof sourceOrder?.shippingAddress === 'string' ? sourceOrder.shippingAddress : '') ||
      (sourceOrder?.shippingAddress as any)?.address ||
      (sourceOrder?.shippingAddress as any)?.streetAddress ||
      (sourceOrder?.shippingAddress as any)?.fullAddress ||
      ''
    ).trim();

    // Prioritize 64-district NLP detection from the authentic address
    const detected = detectDistrictFromAddress(rawAddr, dynamicFeeConfig);
    if (detected) return detected.district;

    const origDistrict = (sourceOrder?.district || (sourceOrder?.shippingAddress as any)?.district || '').trim();
    if (
      origDistrict &&
      !['dhaka', 'dhaka city', 'inside dhaka', 'outside dhaka', 'dhaka metro'].includes(origDistrict.toLowerCase())
    ) {
      return origDistrict;
    }
    return 'Dhaka City';
  });

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate that at least one replacement item or gift is selected
    const replacementItems: OrderItem[] = [];

    (sourceOrder?.items || []).forEach((it) => {
      if (selectedItemIds[it.id]) {
        replacementItems.push({
          ...it,
          quantity: quantities[it.id] || 1,
          unitPrice: 0,
          totalPrice: 0,
        });
      }
    });

    // Add clean-titled complimentary gifts (NO administrative bracket clutter!)
    if (hasGift) {
      activeGifts.forEach((g, idx) => {
        if (!g.title.trim()) return;
        replacementItems.push({
          id: g.id || `gift-courtesy-${idx}-${Date.now()}`,
          sku: `GIFT-${idx + 1}`,
          title: g.title.trim(), // CLEAN PRODUCT NAME ONLY: Thermal labels print cleanly!
          brand: g.brand || 'SEYVEN Courtesy',
          variant: 'Courtesy',
          quantity: g.quantity || 1,
          unitPrice: 0,
          totalPrice: 0,
          isGwp: true,
        });
      });
    }

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
        initialStatus,
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
                Universal Brand Recovery Desk
              </span>
              <h3 className="font-serif text-lg font-bold">Issue Complimentary Replacement</h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded text-[#F9F6F0]/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
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
                Universal recovery engine for any product. Customer keeps defective unit with <strong>৳0 COD</strong> reshipment.
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

          {/* 1. Dynamic Product Selection from whatever the customer purchased */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-[#1C1917] font-mono">
                1. Select Defective Product(s) to Replace:
              </label>
              <span className="text-[10px] text-stone-500 font-mono">
                ({(sourceOrder?.items || []).length} items on file)
              </span>
            </div>
            <div className="border border-[#E6DFD5] rounded-lg divide-y divide-[#E6DFD5] bg-white">
              {(sourceOrder?.items || []).map((it) => {
                const isSelected = !!selectedItemIds[it.id];
                return (
                  <div
                    key={it.id}
                    onClick={() => toggleItem(it.id)}
                    className={`p-3 flex items-center justify-between cursor-pointer transition-colors ${
                      isSelected ? 'bg-amber-50/60 border-l-4 border-amber-600' : 'hover:bg-stone-50'
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
                        <div className="text-[10px] text-[#1C1917]/60 font-mono">
                          Purchased: {it.quantity} unit(s) {it.variant ? `(${it.variant})` : ''} · Original: {formatBdt(it.unitPrice)}
                        </div>
                      </div>
                    </div>

                    {isSelected && (
                      <div className="flex items-center space-x-2" onClick={(e) => e.stopPropagation()}>
                        <span className="text-[10px] font-mono text-[#1C1917]/60">Reship Qty:</span>
                        <input
                          type="number"
                          min={1}
                          max={10}
                          value={quantities[it.id] || 1}
                          onChange={(e) =>
                            setQuantities({ ...quantities, [it.id]: Math.max(1, parseInt(e.target.value) || 1) })
                          }
                          className="w-12 px-2 py-1 border border-[#E6DFD5] rounded text-xs text-center font-mono font-bold"
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* 2. DYNAMIC OWNER GIFT VAULT & CATALOG PICKER */}
          <div className="p-4 bg-gradient-to-r from-emerald-50/70 to-amber-50/70 border border-emerald-300/70 rounded-xl space-y-3.5">
            <div className="flex items-center justify-between">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasGift}
                  onChange={(e) => setHasGift(e.target.checked)}
                  className="w-4 h-4 accent-emerald-700 rounded"
                />
                <Gift className="w-4 h-4 text-emerald-700" />
                <span className="text-xs font-bold text-[#1C1917]">
                  2. Include Complimentary Courtesy Gift(s)
                </span>
              </label>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                  100% SEYVEN Courtesy (৳0)
                </span>
                <button
                  type="button"
                  onClick={handleResetVault}
                  title="Reset Quick-Pick Vault to defaults"
                  className="text-[10px] font-mono text-stone-500 hover:text-stone-800 p-1 rounded hover:bg-stone-200/60"
                >
                  <ResetIcon className="w-3 h-3" />
                </button>
              </div>
            </div>

            {hasGift && (
              <div className="space-y-3 pt-1">
                {/* Active Gift List (What will be packed and printed) */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-mono font-bold text-stone-700 flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-amber-600" />
                      Active Gifts for this Parcel ({activeGifts.length}):
                    </span>
                    <span className="text-[9px] text-stone-500 font-mono">
                      (Printed cleanly on label without ugly bracket suffixes)
                    </span>
                  </div>

                  {activeGifts.length === 0 ? (
                    <div className="p-3 bg-white/80 border border-dashed border-stone-300 rounded-lg text-center text-xs text-stone-500 font-mono">
                      No gift selected. Pick from quick-picks, store catalog, or type custom gift below.
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      {activeGifts.map((gift) => (
                        <div
                          key={gift.id}
                          className="flex items-center justify-between p-2.5 bg-white border border-emerald-200/80 rounded-lg text-xs shadow-xs"
                        >
                          <div className="flex items-center space-x-2.5 min-w-0">
                            <span className="text-base shrink-0">🎁</span>
                            <div className="min-w-0">
                              <div className="font-semibold text-[#1C1917] truncate text-xs">
                                {gift.title}
                              </div>
                              <div className="text-[10px] text-stone-500 font-mono flex items-center gap-2">
                                <span>{gift.brand}</span>
                                {gift.regularPrice ? (
                                  <span className="line-through text-emerald-700">৳{gift.regularPrice}</span>
                                ) : null}
                                <span className="text-emerald-700 font-bold">৳0 Courtesy</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center space-x-2 shrink-0">
                            <div className="flex items-center border border-stone-200 rounded bg-stone-50">
                              <button
                                type="button"
                                onClick={() => updateActiveGiftQuantity(gift.id, gift.quantity - 1)}
                                className="px-2 py-0.5 text-xs text-stone-600 hover:bg-stone-200"
                              >
                                -
                              </button>
                              <span className="px-2 text-xs font-mono font-bold text-[#1C1917]">
                                {gift.quantity}
                              </span>
                              <button
                                type="button"
                                onClick={() => updateActiveGiftQuantity(gift.id, gift.quantity + 1)}
                                className="px-2 py-0.5 text-xs text-stone-600 hover:bg-stone-200"
                              >
                                +
                              </button>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeActiveGift(gift.id)}
                              className="p-1 text-stone-400 hover:text-rose-600 transition-colors"
                              title="Remove gift"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Owner's Quick-Pick Gift Vault */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-mono font-bold text-stone-600 flex items-center gap-1">
                      <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                      Owner Quick-Picks Vault (Saved Presets):
                    </span>
                    <span className="text-[9px] text-stone-500 font-mono">
                      Click to add · Hover to delete
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {giftVault.map((g) => {
                      const isAlreadyActive = activeGifts.some(
                        (ag) => ag.title.toLowerCase() === g.title.toLowerCase(),
                      );
                      return (
                        <div
                          key={g.id}
                          className={`group relative p-2.5 rounded-lg border text-left text-xs transition-all flex items-center justify-between cursor-pointer ${
                            isAlreadyActive
                              ? 'bg-emerald-50/70 border-emerald-500 shadow-xs ring-1 ring-emerald-500'
                              : 'bg-white/90 border-stone-200 hover:border-emerald-400 hover:bg-white'
                          }`}
                          onClick={() => addGiftToActive(g)}
                        >
                          <div className="min-w-0 pr-2">
                            <div className="font-semibold text-[#1C1917] text-[11px] leading-tight truncate">
                              {g.title}
                            </div>
                            <div className="text-[10px] text-stone-500 font-mono">{g.brand}</div>
                          </div>
                          <div className="flex items-center space-x-1.5 shrink-0">
                            {g.regularPrice ? (
                              <span className="text-[10px] font-mono text-emerald-800 line-through">
                                ৳{g.regularPrice}
                              </span>
                            ) : null}
                            {isAlreadyActive ? (
                              <span className="w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center">
                                <Check className="w-2.5 h-2.5" />
                              </span>
                            ) : (
                              <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-100 px-1 rounded">
                                +Add
                              </span>
                            )}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveFromVault(g.id);
                              }}
                              className="opacity-0 group-hover:opacity-100 p-1 text-stone-400 hover:text-rose-600 transition-opacity ml-1"
                              title="Delete preset from vault"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Live Store Catalog Search & Picker */}
                <div className="relative pt-1">
                  <span className="text-[10px] uppercase font-mono font-bold text-stone-600 block mb-1">
                    Or Pick ANY Product from Live Store Catalog:
                  </span>
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-stone-400" />
                    <input
                      type="text"
                      placeholder="Search store inventory (e.g. Centella, Lip Balm, Serum, Cleanser)..."
                      value={catalogSearch}
                      onChange={(e) => {
                        setCatalogSearch(e.target.value);
                        setIsSearchingCatalog(true);
                      }}
                      onFocus={() => setIsSearchingCatalog(true)}
                      className="w-full pl-8 pr-3 py-1.5 text-xs border border-[#E6DFD5] rounded-lg bg-white focus:outline-none focus:border-[#C7A97B]"
                    />
                    {catalogSearch && (
                      <button
                        type="button"
                        onClick={() => {
                          setCatalogSearch('');
                          setIsSearchingCatalog(false);
                        }}
                        className="absolute right-2.5 top-2 text-stone-400 hover:text-stone-600 text-xs"
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  {/* Dropdown Results */}
                  {isSearchingCatalog && catalogSearch.trim().length > 0 && (
                    <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-[#E6DFD5] rounded-lg shadow-xl z-20 max-h-48 overflow-y-auto divide-y divide-stone-100">
                      {filteredProducts.length === 0 ? (
                        <div className="p-3 text-center text-xs text-stone-500 font-mono">
                          No products found matching &quot;{catalogSearch}&quot;
                        </div>
                      ) : (
                        filteredProducts.map((p) => (
                          <div
                            key={p.id}
                            onClick={() => handleSelectCatalogProduct(p)}
                            className="p-2.5 hover:bg-emerald-50/60 cursor-pointer flex items-center justify-between text-xs transition-colors"
                          >
                            <div className="min-w-0 pr-2">
                              <div className="font-semibold text-[#1C1917] truncate">{p.titleEn}</div>
                              <div className="text-[10px] text-stone-500 font-mono">
                                {p.brand} {p.category ? `· ${p.category}` : ''}
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              <span className="text-[11px] font-mono font-bold text-emerald-700 block">
                                + Pick as Gift
                              </span>
                              <span className="text-[9px] font-mono text-stone-400 line-through">
                                ৳{p.priceBdt || p.variants?.[0]?.priceBdt || 'Regular'}
                              </span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>

                {/* Custom Gift Builder (With Optional Save to Vault) */}
                <div className="pt-2 border-t border-emerald-200/50 space-y-2">
                  <span className="text-[10px] uppercase font-mono font-bold text-stone-600 block">
                    Or Type Free-Form Custom Gift:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
                    <input
                      type="text"
                      placeholder="Gift item name (e.g. Snail Essence Deluxe Sample)..."
                      value={customGiftTitle}
                      onChange={(e) => setCustomGiftTitle(e.target.value)}
                      className="sm:col-span-3 px-3 py-1.5 text-xs border border-[#E6DFD5] rounded bg-white focus:outline-none focus:border-[#C7A97B]"
                    />
                    <input
                      type="text"
                      placeholder="Brand (optional)"
                      value={customGiftBrand}
                      onChange={(e) => setCustomGiftBrand(e.target.value)}
                      className="sm:col-span-2 px-3 py-1.5 text-xs border border-[#E6DFD5] rounded bg-white focus:outline-none focus:border-[#C7A97B]"
                    />
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <label className="flex items-center space-x-1.5 text-[11px] text-stone-600 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={saveCustomToVault}
                        onChange={(e) => setSaveCustomToVault(e.target.checked)}
                        className="w-3.5 h-3.5 accent-amber-600 rounded"
                      />
                      <span>⭐ Save to my Quick-Picks Vault for future replacements</span>
                    </label>
                    <button
                      type="button"
                      onClick={handleAddCustomGift}
                      disabled={!customGiftTitle.trim()}
                      className="px-3 py-1.5 bg-[#1C1917] hover:bg-[#2C2724] text-[#C7A97B] text-xs font-semibold rounded flex items-center gap-1 cursor-pointer disabled:opacity-40"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Gift</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 3. Initial Pipeline Stage Selector */}
          <div className="p-3.5 bg-white border border-[#E6DFD5] rounded-lg space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-[#1C1917] font-mono block">
              3. Initial Fulfillment Pipeline Stage:
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label
                className={`p-3 rounded-lg border cursor-pointer transition-all flex items-start space-x-2.5 ${
                  initialStatus === 'CONFIRMED'
                    ? 'bg-amber-50/50 border-[#C7A97B] ring-1 ring-[#C7A97B]'
                    : 'bg-[#FAF8F5] border-[#E6DFD5] hover:bg-white'
                }`}
              >
                <input
                  type="radio"
                  name="initialStatus"
                  value="CONFIRMED"
                  checked={initialStatus === 'CONFIRMED'}
                  onChange={() => setInitialStatus('CONFIRMED')}
                  className="mt-0.5 accent-[#C7A97B]"
                />
                <div className="text-xs">
                  <strong className="block text-[#1C1917] font-semibold">
                    CONFIRMED (Recommended)
                  </strong>
                  <span className="text-[10px] text-stone-500 leading-tight block mt-0.5">
                    Queued for warehouse team to pick, unseal/inspect with customer consent, then click Pack.
                  </span>
                </div>
              </label>

              <label
                className={`p-3 rounded-lg border cursor-pointer transition-all flex items-start space-x-2.5 ${
                  initialStatus === 'PACKED'
                    ? 'bg-amber-50/50 border-[#C7A97B] ring-1 ring-[#C7A97B]'
                    : 'bg-[#FAF8F5] border-[#E6DFD5] hover:bg-white'
                }`}
              >
                <input
                  type="radio"
                  name="initialStatus"
                  value="PACKED"
                  checked={initialStatus === 'PACKED'}
                  onChange={() => setInitialStatus('PACKED')}
                  className="mt-0.5 accent-[#C7A97B]"
                />
                <div className="text-xs">
                  <strong className="block text-[#1C1917] font-semibold">
                    PACKED (Direct Boxed)
                  </strong>
                  <span className="text-[10px] text-stone-500 leading-tight block mt-0.5">
                    Already inspected and boxed up. Ready for immediate thermal label printing & dispatch.
                  </span>
                </div>
              </label>
            </div>
          </div>

          {/* 4. Defect Category & Pre-Dispatch QA Agreement */}
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
                  Ensures flawless product quality before packaging while respecting customer trust.
                </span>
              </div>
            </label>
          </div>

          {/* 5. Delivery Destination Address */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-[#1C1917] block font-mono">
                Delivery Destination (Bangladeshi Address)
              </label>
              {district && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#C7A97B]/20 text-[#8C6D3B] font-bold">
                  Detected: {district}
                </span>
              )}
            </div>
            <textarea
              rows={2}
              value={shippingAddress}
              onChange={(e) => {
                const val = e.target.value;
                setShippingAddress(val);
                const detected = detectDistrictFromAddress(val, dynamicFeeConfig);
                if (detected) {
                  setDistrict(detected.district);
                }
              }}
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
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-[10px] text-[#1C1917]/50 block">District / Zone</span>
                  <select
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    className="text-[9px] font-mono bg-white border border-[#E6DFD5] rounded px-1 text-stone-700"
                  >
                    <option value={district}>{district} (Selected)</option>
                    <optgroup label="All 64 BD Districts">
                      {BD_ALL_DISTRICTS.map((d) => (
                        <option key={d.nameEn} value={d.nameEn}>
                          {d.nameEn} ({d.nameBn})
                        </option>
                      ))}
                    </optgroup>
                  </select>
                </div>
                <input
                  type="text"
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  placeholder="e.g. Manikganj"
                  className="w-full p-2 bg-[#FAF8F5] border border-[#E6DFD5] rounded text-xs font-semibold text-[#1C1917]"
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
                Will book with Pathao API at COD: ৳0 with complimentary replacement instruction.
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
              <span>
                {hasGift && activeGifts.length > 0
                  ? `${activeGifts.map((g) => `${g.title} (x${g.quantity})`).join(', ')} — ৳0 (Courtesy)`
                  : 'None'}
              </span>
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
            className="px-4 py-2 text-xs font-semibold text-stone-600 hover:text-stone-900 transition-colors cursor-pointer"
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
            <span>
              {isSubmitting
                ? 'Issuing Replacement...'
                : initialStatus === 'CONFIRMED'
                ? 'Queue for Warehouse QA (CONFIRMED)'
                : 'Dispatch ৳0 Parcel (PACKED)'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
