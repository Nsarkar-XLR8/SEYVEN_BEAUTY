'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { BRAND } from '@/lib/constants';

export interface CartItem {
  id: string;
  variantId: string;
  productId: string;
  slug: string;
  titleEn: string;
  titleBn: string;
  volume: string;
  priceBdt: number;
  quantity: number;
  image?: string;
  isBundle?: boolean;
}

export interface PlatformSettingsState {
  isVatEnabled: boolean;
  vatRatePercent: number;
  isVatInclusive: boolean;
  standardDeliveryDhakaBdt: number;
  standardDeliveryOutsideBdt: number;
  freeDeliveryThresholdBdt: number;
  isCampaignActive: boolean;
  campaignTitle: string;
  campaignDiscountPercent: number;
  campaignStartDate: string | null;
  campaignEndDate: string | null;
}

const DEFAULT_PLATFORM_SETTINGS: PlatformSettingsState = {
  isVatEnabled: false,
  vatRatePercent: 5,
  isVatInclusive: true,
  standardDeliveryDhakaBdt: BRAND.thresholds.standardDeliveryDhakaBdt,
  standardDeliveryOutsideBdt: BRAND.thresholds.standardDeliveryOutsideBdt,
  freeDeliveryThresholdBdt: BRAND.thresholds.freeDeliveryBdt,
  isCampaignActive: false,
  campaignTitle: 'Festive Eid Sanctuary Privilege',
  campaignDiscountPercent: 7,
  campaignStartDate: null,
  campaignEndDate: null,
};

interface CartContextType {
  items: CartItem[];
  itemCount: number;
  subtotalBdt: number;
  vatBdt: number;
  discountBdt: number;
  deliveryFeeBdt: number;
  totalBdt: number;
  freeDeliveryThreshold: number;
  amountNeededForFreeDelivery: number;
  freeDeliveryProgressPercent: number;
  isBagOpen: boolean;
  privilegeCode: string | null;
  isCampaignRunning: boolean;
  activePrivilegeLabel: string | null;
  settings: PlatformSettingsState;
  openBag: () => void;
  closeBag: () => void;
  toggleBag: () => void;
  addItem: (item: Omit<CartItem, 'id' | 'quantity'>, quantity?: number, openDrawer?: boolean) => void;
  updateQuantity: (id: string, delta: number) => void;
  removeItem: (id: string) => void;
  clearCart: () => void;
  applyPrivilege: (code: string) => Promise<{ success: boolean; message: string; discountBdt?: number }>;
  removePrivilege: () => void;
  refreshSettings: () => Promise<void>;
}

const CartContext = createContext<CartContextType>({
  items: [],
  itemCount: 0,
  subtotalBdt: 0,
  vatBdt: 0,
  discountBdt: 0,
  deliveryFeeBdt: 70,
  totalBdt: 0,
  freeDeliveryThreshold: 2000,
  amountNeededForFreeDelivery: 2000,
  freeDeliveryProgressPercent: 0,
  isBagOpen: false,
  privilegeCode: null,
  isCampaignRunning: false,
  activePrivilegeLabel: null,
  settings: DEFAULT_PLATFORM_SETTINGS,
  refreshSettings: async () => {},
  openBag: () => {},
  closeBag: () => {},
  toggleBag: () => {},
  addItem: () => {},
  updateQuantity: () => {},
  removeItem: () => {},
  clearCart: () => {},
  applyPrivilege: async () => ({ success: false, message: '' }),
  removePrivilege: () => {},
});

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isBagOpen, setIsBagOpen] = useState(false);
  const [privilegeCode, setPrivilegeCode] = useState<string | null>(null);
  const [settings, setSettings] = useState<PlatformSettingsState>(DEFAULT_PLATFORM_SETTINGS);

  const refreshSettings = React.useCallback(async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';
      const res = await fetch(`${apiUrl}/settings`, { cache: 'no-store' });
      const json = await res.json();
      if (json.success && json.data) {
        setSettings({
          isVatEnabled: json.data.isVatEnabled === true,
          vatRatePercent: Number(json.data.vatRatePercent) || 0,
          isVatInclusive: json.data.isVatInclusive === true,
          standardDeliveryDhakaBdt: Number(json.data.standardDeliveryDhakaBdt) || 70,
          standardDeliveryOutsideBdt: Number(json.data.standardDeliveryOutsideBdt) || 130,
          freeDeliveryThresholdBdt: Number(json.data.freeDeliveryThresholdBdt) || 2000,
          isCampaignActive: json.data.isCampaignActive === true,
          campaignTitle: json.data.campaignTitle || '',
          campaignDiscountPercent: Number(json.data.campaignDiscountPercent) || 0,
          campaignStartDate: json.data.campaignStartDate || null,
          campaignEndDate: json.data.campaignEndDate || null,
        });
      }
    } catch {
      // Keep defaults if backend offline
    }
  }, []);

  // Load from localStorage on mount, fetch live platform settings & check URL for privilege
  useEffect(() => {
    try {
      const savedItems = localStorage.getItem('seyven_bag_items');
      if (savedItems) {
        setItems(JSON.parse(savedItems));
      }

      // Check URL for automatic privilege dispatch link (e.g. ?privilege=EID7)
      if (typeof window !== 'undefined') {
        const urlParams = new URLSearchParams(window.location.search);
        const urlPrivilege = urlParams.get('privilege') || urlParams.get('privilegeCode');
        if (urlPrivilege) {
          const upper = urlPrivilege.trim().toUpperCase();
          setPrivilegeCode(upper);
          localStorage.setItem('seyven_active_privilege', upper);
        } else {
          const savedPrivilege = localStorage.getItem('seyven_active_privilege');
          if (savedPrivilege) {
            setPrivilegeCode(savedPrivilege.trim().toUpperCase());
          }
        }
      }

      refreshSettings();

      // Listen for window focus to immediately reflect changes made in admin portal
      window.addEventListener('focus', refreshSettings);
      return () => {
        window.removeEventListener('focus', refreshSettings);
      };
    } catch {
      // ignore
    }
  }, [refreshSettings]);

  // Save to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('seyven_bag_items', JSON.stringify(items));
    } catch {
      // ignore
    }
  }, [items]);

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotalBdt = items.reduce((sum, item) => sum + item.priceBdt * item.quantity, 0);

  const [isCampaignRunning, setIsCampaignRunning] = useState(false);

  // Time-bounded check for automated seasonal campaign (Evaluated client-side inside useEffect)
  useEffect(() => {
    if (!settings.isCampaignActive || !settings.campaignDiscountPercent || settings.campaignDiscountPercent <= 0) {
      setIsCampaignRunning(false);
      return;
    }
    const now = Date.now();
    if (settings.campaignStartDate) {
      const start = new Date(settings.campaignStartDate).getTime();
      if (!isNaN(start) && now < start) {
        setIsCampaignRunning(false);
        return;
      }
    }
    if (settings.campaignEndDate) {
      const end = new Date(settings.campaignEndDate).getTime();
      if (!isNaN(end) && now > end) {
        setIsCampaignRunning(false);
        return;
      }
    }
    setIsCampaignRunning(true);
  }, [settings]);

  const campaignDiscountBdt = isCampaignRunning ? Math.round(subtotalBdt * (settings.campaignDiscountPercent / 100)) : 0;

  // Privilege code is only usable when owner runs a festival campaign
  const calculatePrivilegeDiscount = (code: string | null, subtotal: number) => {
    if (!code || subtotal === 0 || !isCampaignRunning || !settings.campaignDiscountPercent) return 0;
    const trimmed = code.trim().toUpperCase();
    if (trimmed === 'EID7' || trimmed === 'FESTIVAL') {
      return Math.round(subtotal * (settings.campaignDiscountPercent / 100));
    }
    return 0;
  };

  const explicitPrivilegeDiscount = calculatePrivilegeDiscount(privilegeCode, subtotalBdt);
  
  const discountBdt = Math.max(campaignDiscountBdt, explicitPrivilegeDiscount);
  const activePrivilegeLabel = privilegeCode && discountBdt > 0
    ? `${settings.campaignTitle || 'Festival Sanctuary Privilege'} (${settings.campaignDiscountPercent}%)`
    : (isCampaignRunning && campaignDiscountBdt > 0 ? `${settings.campaignTitle} (${settings.campaignDiscountPercent}%)` : null);

  // VAT: if turned OFF by admin, vatBdt = 0; if turned ON, compute based on vatRatePercent
  const vatBdt = (settings.isVatEnabled && settings.vatRatePercent > 0)
    ? Math.round(subtotalBdt * (settings.vatRatePercent / 100))
    : 0;
  const freeDeliveryThreshold = settings.freeDeliveryThresholdBdt;
  const deliveryFeeBdt = items.length === 0 ? 0 : settings.standardDeliveryDhakaBdt;
  const amountNeededForFreeDelivery = Math.max(0, freeDeliveryThreshold - subtotalBdt);
  const freeDeliveryProgressPercent = Math.min(100, Math.round((subtotalBdt / freeDeliveryThreshold) * 100));
  const totalBdt = Math.max(0, subtotalBdt + vatBdt + deliveryFeeBdt - discountBdt);

  const openBag = () => setIsBagOpen(true);
  const closeBag = () => setIsBagOpen(false);
  const toggleBag = () => setIsBagOpen(!isBagOpen);

  const addItem = (item: Omit<CartItem, 'id' | 'quantity'>, quantity = 1, openDrawer = false) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.variantId === item.variantId);
      if (existing) {
        return prev.map((i) =>
          i.variantId === item.variantId ? { ...i, quantity: i.quantity + quantity } : i
        );
      }
      return [
        ...prev,
        {
          ...item,
          id: `item_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          quantity,
        },
      ];
    });
    if (openDrawer) {
      setIsBagOpen(true);
    }
  };

  const updateQuantity = (id: string, delta: number) => {
    setItems((prev) =>
      prev
        .map((item) => {
          if (item.id === id) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const clearCart = () => {
    setItems([]);
    setPrivilegeCode(null);
    try {
      localStorage.removeItem('seyven_active_privilege');
    } catch {
      // ignore
    }
  };

  const applyPrivilege = async (code: string) => {
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) {
      return { success: false, message: 'Privilege not recognized.' };
    }
    if (!isCampaignRunning || !settings.isCampaignActive) {
      return { success: false, message: 'No active festival campaign at this moment.' };
    }
    if (trimmed === 'EID7' || trimmed === 'FESTIVAL') {
      setPrivilegeCode(trimmed);
      try {
        localStorage.setItem('seyven_active_privilege', trimmed);
      } catch {
        // ignore
      }
      const disc = Math.round(subtotalBdt * (settings.campaignDiscountPercent / 100));
      return {
        success: true,
        message: `${settings.campaignTitle || 'Festival Sanctuary Privilege'} (${settings.campaignDiscountPercent}%) Honored`,
        discountBdt: disc,
      };
    }
    return { success: false, message: 'Invalid or expired festival campaign privilege code.' };
  };

  const removePrivilege = () => {
    setPrivilegeCode(null);
    try {
      localStorage.removeItem('seyven_active_privilege');
    } catch {
      // ignore
    }
  };

  return (
    <CartContext.Provider
      value={{
        items,
        itemCount,
        subtotalBdt,
        vatBdt,
        discountBdt,
        deliveryFeeBdt,
        totalBdt,
        freeDeliveryThreshold,
        amountNeededForFreeDelivery,
        freeDeliveryProgressPercent,
        isBagOpen,
        privilegeCode,
        isCampaignRunning,
        activePrivilegeLabel,
        settings,
        refreshSettings,
        openBag,
        closeBag,
        toggleBag,
        addItem,
        updateQuantity,
        removeItem,
        clearCart,
        applyPrivilege,
        removePrivilege,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
