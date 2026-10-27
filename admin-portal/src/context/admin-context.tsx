'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  StaffUser,
  StaffRole,
  AdminOrder,
  OrderStatus,
  CODVerificationStatus,
  QRBatch,
  ScanAnomaly,
  RedirectRule,
  TierConfig,
  ClientSpendRecord,
  AdminCategory,
  AdminProduct,
} from '../types/admin';
import {
  STAFF_USERS,
  INITIAL_ORDERS,
  INITIAL_CATEGORIES,
  INITIAL_PRODUCTS,
  INITIAL_QR_BATCHES,
  INITIAL_ANOMALIES,
  INITIAL_REDIRECTS,
  INITIAL_TIERS,
  INITIAL_CLIENT_SPEND_RECORDS,
} from '../data/admin-data';

interface AdminContextType {
  staffUser: StaffUser | null;
  isAuthenticated: boolean;
  isReady: boolean;
  login: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  switchRole: (role: StaffRole) => void;
  hasRole: (allowedRoles: StaffRole[]) => boolean;

  // Orders
  orders: AdminOrder[];
  updateOrderStatus: (orderId: string, nextStatus: OrderStatus, notes?: string) => void;
  updateCODVerification: (orderId: string, status: CODVerificationStatus, notes?: string) => void;
  assignCourier: (orderId: string, courier: 'Pathao' | 'Steadfast', consignmentId?: string) => void;
  addManualOrder: (data: {
    customerName: string;
    customerPhone: string;
    customerEmail?: string;
    shippingAddress: string;
    zone: string;
    district: string;
    items: import('../types/admin').OrderItem[];
    subtotal: number;
    deliveryFee: number;
    discount?: number;
    totalAmount: number;
    paymentMethod: 'COD' | 'BKASH' | 'NAGAD' | 'CARD';
    source?: string;
    status?: OrderStatus;
    advancePaid?: number;
    agentNotes?: string;
  }) => Promise<AdminOrder>;
  refreshOrders: () => Promise<void>;
  isSyncingOrders: boolean;

  // Categories & Products (Zero-loss sync)
  categories: AdminCategory[];
  addCategory: (cat: Omit<AdminCategory, 'id' | 'productCount'>) => Promise<void>;
  deleteCategory: (categoryId: string) => Promise<boolean>;
  products: AdminProduct[];
  addProduct: (prod: Omit<AdminProduct, 'id' | 'createdAt'>) => void;
  addBulkProducts: (prods: AdminProduct[]) => void;
  updateProduct: (productIdOrSlug: string, updatedFields: Partial<AdminProduct>) => Promise<boolean>;
  updateProductState: (productId: string, state: AdminProduct['state']) => Promise<boolean>;
  updateProductPrice: (productId: string, newPriceBdt: number, compareAtPriceBdt?: number) => Promise<boolean>;
  deleteProduct: (productId: string) => Promise<boolean>;
  refreshCatalog: () => Promise<void>;

  // QR Batches & Anomalies
  qrBatches: QRBatch[];
  generateQRBatch: (batch: Omit<QRBatch, 'id' | 'createdAt' | 'downloadUrl'>) => QRBatch;
  anomalies: ScanAnomaly[];
  resolveAnomaly: (id: string, notes?: string) => void;

  // Tiers & Loyalty
  tiers: TierConfig[];
  updateTier: (id: string, field: 'thresholdBdt' | 'discountPercent', value: number) => void;
  clientSpendRecords: ClientSpendRecord[];
  triggerMilestoneEmail: (clientId: string) => void;

  // Site Redirects & Edge Cache
  redirects: RedirectRule[];
  addRedirect: (source: string, dest: string, code: 301 | 302, notes: string) => void;
  toggleRedirect: (id: string) => void;
  deleteRedirect: (id: string) => void;
  lastPurgedAt: string | null;
  purgeEdgeCache: (scope: string) => void;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

const STORAGE_KEYS = {
  STAFF: 'seyven_admin_staff_profile_v3',
  TOKEN: 'seyven_admin_jwt_v3',
  REFRESH_TOKEN: 'seyven_admin_refresh_token_v3',
  ORDERS: 'seyven_admin_orders_v3',
  CATEGORIES: 'seyven_admin_categories_v3',
  PRODUCTS: 'seyven_admin_products_v3',
  QR_BATCHES: 'seyven_admin_qr_batches_v3',
  ANOMALIES: 'seyven_admin_anomalies_v3',
  REDIRECTS: 'seyven_admin_redirects_v3',
  TIERS: 'seyven_admin_tiers_v3',
  PURGED: 'seyven_admin_cache_purged_v3',
};

function safeStorageSet(key: string, value: string): boolean {
  if (typeof window === 'undefined') return false;
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (err: any) {
    console.warn(`[SafeStorage] Quota or write notice on "${key}":`, err?.message);
    try {
      // For large collections (e.g. 1000+ products), save a lightweight representation without bulky text/data-urls
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        const lightweight = parsed.map((item: any) => {
          if (item && typeof item === 'object') {
            return {
              id: item.id,
              slug: item.slug,
              titleEn: item.titleEn,
              titleBn: item.titleBn,
              brand: item.brand,
              category: item.category,
              priceBdt: item.priceBdt,
              priceRangeBdt: item.priceRangeBdt,
              state: item.state,
              publicationState: item.publicationState,
              volume: item.volume,
              variantsCount: item.variantsCount || item.variants?.length || 1,
              imageUrl: typeof item.imageUrl === 'string' && item.imageUrl.length < 500
                ? item.imageUrl
                : '',
              bstiApproved: item.bstiApproved,
              createdAt: item.createdAt,
            };
          }
          return item;
        });
        localStorage.setItem(key, JSON.stringify(lightweight));
        return true;
      }
    } catch {
      // If even lightweight exceeds quota, do NOT delete anything from local memory!
      // The complete product catalog remains intact in React state and is backed by server API.
      return false;
    }
    return false;
  }
}

function getAdminAuthHeader(): string {
  if (typeof window === 'undefined') return 'Bearer admin_jwt_demo';
  const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
  return token ? `Bearer ${token}` : 'Bearer admin_jwt_demo';
}

function sanitizeProductsForStorage(prods: AdminProduct[]): AdminProduct[] {
  return prods.map((p) => {
    const isBulkyImg = p.imageUrl && p.imageUrl.startsWith('data:image') && p.imageUrl.length > 500;
    const cleanImg = isBulkyImg ? '' : (p.imageUrl || '');
    const cleanImages = p.images?.map((img) =>
      img && img.startsWith('data:image') && img.length > 500 ? '' : img
    ).filter(Boolean) || (cleanImg ? [cleanImg] : []);
    return {
      ...p,
      imageUrl: cleanImg,
      images: cleanImages,
    };
  });
}

export function AdminProvider({ children }: { children: React.ReactNode }) {
  const [staffUser, setStaffUser] = useState<StaffUser | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [orders, setOrders] = useState<AdminOrder[]>(INITIAL_ORDERS);
  const [categories, setCategories] = useState<AdminCategory[]>(INITIAL_CATEGORIES);
  const [products, setProducts] = useState<AdminProduct[]>(INITIAL_PRODUCTS);
  const [qrBatches, setQrBatches] = useState<QRBatch[]>(INITIAL_QR_BATCHES);
  const [anomalies, setAnomalies] = useState<ScanAnomaly[]>(INITIAL_ANOMALIES);
  const [redirects, setRedirects] = useState<RedirectRule[]>(INITIAL_REDIRECTS);
  const [tiers, setTiers] = useState<TierConfig[]>(INITIAL_TIERS);
  const [clientSpendRecords, setClientSpendRecords] = useState<ClientSpendRecord[]>(INITIAL_CLIENT_SPEND_RECORDS);
  const [lastPurgedAt, setLastPurgedAt] = useState<string | null>(null);
  const [isSyncingOrders, setIsSyncingOrders] = useState(false);

  const refreshOrders = async () => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://seyven-beauty-backend.onrender.com/api/v1';
    setIsSyncingOrders(true);
    try {
      const res = await fetch(`${apiUrl}/orders`, {
        headers: {
          Authorization: getAdminAuthHeader(),
        },
      });
      if (res.ok) {
        const data = await res.json();
        const list = data?.items || (Array.isArray(data) ? data : null);
        if (Array.isArray(list)) {
          setOrders(list);
          safeStorageSet(STORAGE_KEYS.ORDERS, JSON.stringify(list));
        }
      }
    } catch {
      // Graceful fallback to cached state
    } finally {
      setIsSyncingOrders(false);
    }
  };

  const normalizeProduct = (p: any) => ({
    ...p,
    category: typeof p.category === 'object' && p.category ? (p.category.nameEn || p.category.slug || 'Curated Care') : (p.category || 'Curated Care'),
  });

  const refreshCatalog = async () => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://seyven-beauty-backend.onrender.com/api/v1';
    try {
      // 1. Fetch real products directly from backend (including DRAFTs for admin desk)
      const pRes = await fetch(`${apiUrl}/catalog/products?includeDrafts=true`, { cache: 'no-store' });
      if (pRes.ok) {
        const pData = await pRes.json();
        if (Array.isArray(pData)) {
          const formatted = pData
            .filter((p) => p && !p.id?.startsWith('dummy-'))
            .map(normalizeProduct);
          setProducts(formatted);
          safeStorageSet(STORAGE_KEYS.PRODUCTS, JSON.stringify(sanitizeProductsForStorage(formatted)));
        }
      }

      // 2. Fetch real categories directly from backend
      const cRes = await fetch(`${apiUrl}/catalog/categories`, { cache: 'no-store' });
      if (cRes.ok) {
        const cData = await cRes.json();
        if (Array.isArray(cData)) {
          const mapped: AdminCategory[] = cData.map((d: any, idx: number) => ({
            id: d.id || `cat-${idx}`,
            nameEn: d.nameEn || '',
            nameBn: d.nameBn || '',
            slug: d.slug || '',
            iconName: 'Sparkles',
            sortOrder: d.sortOrder || idx + 1,
            productCount: d.productCount || 0,
            isActive: true,
          }));
          setCategories(mapped);
          safeStorageSet(STORAGE_KEYS.CATEGORIES, JSON.stringify(mapped));
        }
      }
    } catch (err) {
      console.warn('[AdminContext] refreshCatalog warning:', err);
    }
  };

  useEffect(() => {
    try {
      // Clean up legacy ghost caches from previous versions
      if (typeof window !== 'undefined') {
        localStorage.removeItem('seyven_admin_products_v2');
        localStorage.removeItem('seyven_admin_categories_v2');
        localStorage.removeItem('seyven_admin_orders_v2');
        localStorage.removeItem('seyven_admin_products');
        localStorage.removeItem('seyven_admin_categories');
      }

      const savedStaff = localStorage.getItem(STORAGE_KEYS.STAFF);
      const savedToken = localStorage.getItem(STORAGE_KEYS.TOKEN);
      if (savedStaff && savedToken) {
        try {
          setStaffUser(JSON.parse(savedStaff));
        } catch {
          setStaffUser(null);
        }
      } else {
        setStaffUser(null);
      }

      const savedOrders = localStorage.getItem(STORAGE_KEYS.ORDERS);
      if (savedOrders) setOrders(JSON.parse(savedOrders));

      const savedCategories = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
      if (savedCategories) setCategories(JSON.parse(savedCategories));

      const savedProducts = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
      if (savedProducts) {
        try {
          const parsed = JSON.parse(savedProducts);
          if (Array.isArray(parsed)) {
            const cleaned = parsed
              .filter((p) => p && !p.id?.startsWith('formulation-') && !p.id?.startsWith('dummy-'))
              .map(normalizeProduct);
            setProducts(cleaned);
          }
        } catch {}
      }

      // Initial live sync directly from PostgreSQL database
      refreshCatalog();
      refreshOrders();

      const orderPollInterval = setInterval(() => {
        refreshOrders();
      }, 12000);

      const savedTiers = localStorage.getItem(STORAGE_KEYS.TIERS);
      if (savedTiers) setTiers(JSON.parse(savedTiers));
    } catch {
      // Fallback to initial constants
    } finally {
      setIsReady(true);
    }
  }, []);

  const refreshAdminToken = async (): Promise<string | null> => {
    if (typeof window === 'undefined') return null;
    const refreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
    if (!refreshToken) return null;

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://seyven-beauty-backend.onrender.com/api/v1';
    try {
      const res = await fetch(`${apiUrl}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });
      if (res.ok) {
        const tokens = await res.json();
        if (tokens?.accessToken) {
          safeStorageSet(STORAGE_KEYS.TOKEN, tokens.accessToken);
          if (tokens.refreshToken) {
            safeStorageSet(STORAGE_KEYS.REFRESH_TOKEN, tokens.refreshToken);
          }
          return tokens.accessToken;
        }
      }
    } catch {
      // Network or invalid token
    }
    return null;
  };

  const login = async (identifier: string, pass: string): Promise<{ success: boolean; error?: string }> => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://seyven-beauty-backend.onrender.com/api/v1';
    const isDev = process.env.NODE_ENV !== 'production' && process.env.NEXT_PUBLIC_ENVIRONMENT !== 'production';

    // Demo bypass only allowed in local development
    if (pass === 'demo') {
      if (!isDev) {
        return {
          success: false,
          error: 'Demo access is strictly disabled on live production. Please authenticate with your staff credentials.',
        };
      }
      const found = STAFF_USERS.find((s) => s.email.toLowerCase() === identifier.toLowerCase());
      const staff = found || STAFF_USERS[0];
      setStaffUser(staff);
      safeStorageSet(STORAGE_KEYS.STAFF, JSON.stringify(staff));
      safeStorageSet(STORAGE_KEYS.TOKEN, 'admin_jwt_' + staff.id);
      return { success: true };
    }

    try {
      const res = await fetch(`${apiUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: identifier.trim(), password: pass }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        return {
          success: false,
          error: data?.message || data?.error || 'Authentication failed. Please verify email and password.',
        };
      }

      const user = data.user;
      const role = user?.role;

      if (!role || role === 'CUSTOMER') {
        return {
          success: false,
          error: 'Access restricted: Your account has Customer role. Contact administrator to grant executive staff permissions.',
        };
      }

      const initials = (user.fullName || user.email || 'SM')
        .split(' ')
        .map((n: string) => n[0])
        .join('')
        .substring(0, 2)
        .toUpperCase();

      const staff: StaffUser = {
        id: user.id,
        name: user.fullName || user.email?.split('@')[0] || 'Staff Member',
        email: user.email || identifier,
        role: role as StaffRole,
        avatar: initials || 'SO',
        title: role === 'SUPER_ADMIN' ? 'Managing Director / Super Admin' : `${role.replace('_', ' ')} Operator`,
      };

      setStaffUser(staff);
      safeStorageSet(STORAGE_KEYS.STAFF, JSON.stringify(staff));
      if (data?.tokens?.accessToken) {
        safeStorageSet(STORAGE_KEYS.TOKEN, data.tokens.accessToken);
      }
      if (data?.tokens?.refreshToken) {
        safeStorageSet(STORAGE_KEYS.REFRESH_TOKEN, data.tokens.refreshToken);
      }
      return { success: true };
    } catch {
      if (isDev) {
        const found = STAFF_USERS.find((s) => s.email.toLowerCase() === identifier.toLowerCase());
        if (found) {
          setStaffUser(found);
          safeStorageSet(STORAGE_KEYS.STAFF, JSON.stringify(found));
          safeStorageSet(STORAGE_KEYS.TOKEN, 'admin_jwt_' + found.id);
          return { success: true };
        }
      }
      return {
        success: false,
        error: 'Unable to reach authentication server. Please check internet connection.',
      };
    }
  };

  const logout = () => {
    localStorage.removeItem(STORAGE_KEYS.STAFF);
    localStorage.removeItem(STORAGE_KEYS.TOKEN);
    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
    setStaffUser(null);
  };

  const switchRole = (role: StaffRole) => {
    if (!staffUser) return;
    const match = STAFF_USERS.find((s) => s.role === role);
    const updated: StaffUser = match || {
      ...staffUser,
      role,
      title: `${role.replace('_', ' ')} Operator`,
    };
    setStaffUser(updated);
    safeStorageSet(STORAGE_KEYS.STAFF, JSON.stringify(updated));
  };

  const hasRole = (allowedRoles: StaffRole[]) => {
    if (!staffUser) return false;
    if (staffUser.role === 'SUPER_ADMIN') return true;
    return allowedRoles.includes(staffUser.role);
  };

  // Orders
  const updateOrderStatus = (orderId: string, nextStatus: OrderStatus, notes?: string) => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://seyven-beauty-backend.onrender.com/api/v1';
    fetch(`${apiUrl}/admin/orders/${orderId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: getAdminAuthHeader(),
      },
      body: JSON.stringify({ status: nextStatus, notes }),
    }).catch(() => {});

    setOrders((prev) => {
      const updated = prev.map((o) =>
        o.id === orderId
          ? {
              ...o,
              status: nextStatus,
              agentNotes: notes ? `${o.agentNotes ? o.agentNotes + ' | ' : ''}${notes}` : o.agentNotes,
              updatedAt: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) + ' BST',
            }
          : o
      );
      safeStorageSet(STORAGE_KEYS.ORDERS, JSON.stringify(updated));
      return updated;
    });
  };

  const updateCODVerification = (orderId: string, status: CODVerificationStatus, notes?: string) => {
    setOrders((prev) => {
      const updated = prev.map((o) =>
        o.id === orderId
          ? {
              ...o,
              codVerification: status,
              agentNotes: notes ? `${o.agentNotes ? o.agentNotes + ' | ' : ''}${notes}` : o.agentNotes,
              updatedAt: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) + ' BST',
            }
          : o
      );
      safeStorageSet(STORAGE_KEYS.ORDERS, JSON.stringify(updated));
      return updated;
    });
  };

  const assignCourier = (orderId: string, courier: 'Pathao' | 'Steadfast', consignmentId?: string) => {
    const genId = consignmentId || `${courier === 'Pathao' ? 'PT' : 'SF'}-${Math.floor(100000 + Math.random() * 900000)}`;
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://seyven-beauty-backend.onrender.com/api/v1';
    fetch(`${apiUrl}/admin/orders/${orderId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: getAdminAuthHeader(),
      },
      body: JSON.stringify({ status: 'SHIPPED', trackingCode: genId }),
    }).catch(() => {});

    setOrders((prev) => {
      const updated = prev.map((o) =>
        o.id === orderId
          ? {
              ...o,
              courier,
              consignmentId: genId,
              status: 'SHIPPED' as OrderStatus,
              courierTrackingUrl: `https://${courier.toLowerCase()}.com/track/${genId}`,
              updatedAt: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) + ' BST',
            }
          : o
      );
      safeStorageSet(STORAGE_KEYS.ORDERS, JSON.stringify(updated));
      return updated;
    });
  };

  const addManualOrder = async (data: {
    customerName: string;
    customerPhone: string;
    customerEmail?: string;
    shippingAddress: string;
    zone: string;
    district: string;
    items: import('../types/admin').OrderItem[];
    subtotal: number;
    deliveryFee: number;
    discount?: number;
    totalAmount: number;
    paymentMethod: 'COD' | 'BKASH' | 'NAGAD' | 'CARD';
    source?: string;
    status?: OrderStatus;
    advancePaid?: number;
    agentNotes?: string;
  }): Promise<AdminOrder> => {
    const now = new Date();
    const orderId = `SYV-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    const refNo = `ORD-${Math.floor(1000 + Math.random() * 9000)}`;

    const newOrder: AdminOrder = {
      id: orderId,
      referenceNo: refNo,
      customerName: data.customerName.trim(),
      customerPhone: data.customerPhone.trim(),
      customerEmail: data.customerEmail?.trim() || '',
      shippingAddress: data.shippingAddress.trim(),
      zone: data.zone,
      district: data.district,
      items: data.items,
      subtotal: data.subtotal,
      deliveryFee: data.deliveryFee,
      discount: data.discount || 0,
      totalAmount: data.totalAmount,
      paymentMethod: data.paymentMethod,
      status: data.status || 'CONFIRMED',
      codVerification: 'VERIFIED',
      source: data.source || 'Facebook Messenger',
      advancePaid: data.advancePaid || 0,
      agentNotes: data.agentNotes || `Manual order booked via ${data.source || 'Facebook Messenger'}`,
      createdAt: now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) + ' BST',
      updatedAt: now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) + ' BST',
    };

    setOrders((prev) => {
      const updated = [newOrder, ...prev];
      safeStorageSet(STORAGE_KEYS.ORDERS, JSON.stringify(updated));
      return updated;
    });

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://seyven-beauty-backend.onrender.com/api/v1';
    fetch(`${apiUrl}/orders/direct`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderId,
        customerName: newOrder.customerName,
        phone: newOrder.customerPhone,
        email: newOrder.customerEmail,
        address: newOrder.shippingAddress,
        districtName: newOrder.district,
        items: newOrder.items.map((it) => ({
          id: it.id,
          sku: it.sku,
          titleEn: it.title,
          brand: it.brand,
          volume: it.variant,
          quantity: it.quantity,
          priceBdt: it.unitPrice,
        })),
        totalBdt: newOrder.totalAmount,
        subtotalBdt: newOrder.subtotal,
        deliveryFeeBdt: newOrder.deliveryFee,
        discountBdt: newOrder.discount,
        paymentMethod: newOrder.paymentMethod,
      }),
    }).catch(() => {});

    return newOrder;
  };

  // Categories & Products
  const addCategory = async (cat: Omit<AdminCategory, 'id' | 'productCount'>) => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://seyven-beauty-backend.onrender.com/api/v1';
    try {
      const res = await fetch(`${apiUrl}/catalog/categories`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: getAdminAuthHeader(),
        },
        body: JSON.stringify({
          nameEn: cat.nameEn,
          nameBn: cat.nameBn,
          slug: cat.slug,
          description: cat.nameEn,
        }),
      });

      if (res.ok) {
        const saved = await res.json();
        const newCat: AdminCategory = {
          id: saved.id || `cat-${Date.now().toString(36)}`,
          nameEn: saved.nameEn || cat.nameEn,
          nameBn: saved.nameBn || cat.nameBn,
          slug: saved.slug || cat.slug,
          iconName: 'Sparkles',
          sortOrder: categories.length + 1,
          productCount: 0,
          isActive: true,
        };
        setCategories((prev) => {
          const updated = [...prev, newCat];
          safeStorageSet(STORAGE_KEYS.CATEGORIES, JSON.stringify(updated));
          return updated;
        });
        return;
      }
    } catch (err) {
      console.warn('[addCategory] Direct backend sync notice:', err);
    }

    // Fallback optimistic
    const newCat: AdminCategory = {
      ...cat,
      id: `cat-${Date.now().toString(36)}`,
      productCount: 0,
    };
    setCategories((prev) => {
      const updated = [...prev, newCat];
      safeStorageSet(STORAGE_KEYS.CATEGORIES, JSON.stringify(updated));
      return updated;
    });
  };

  const deleteCategory = async (categoryId: string): Promise<boolean> => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://seyven-beauty-backend.onrender.com/api/v1';
      const res = await fetch(`${apiUrl}/catalog/categories/${categoryId}`, {
        method: 'DELETE',
        headers: {
          Authorization: getAdminAuthHeader(),
        },
      });

      if (res.ok) {
        setCategories((prev) => {
          const updated = prev.filter((c) => c.id !== categoryId && c.slug !== categoryId);
          safeStorageSet(STORAGE_KEYS.CATEGORIES, JSON.stringify(updated));
          return updated;
        });
        return true;
      }
    } catch (err) {
      console.error('[deleteCategory] Error:', err);
    }
    // Optimistic fallback
    setCategories((prev) => {
      const updated = prev.filter((c) => c.id !== categoryId && c.slug !== categoryId);
      safeStorageSet(STORAGE_KEYS.CATEGORIES, JSON.stringify(updated));
      return updated;
    });
    return true;
  };

  const addProduct = async (prod: Omit<AdminProduct, 'id' | 'createdAt'>) => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://seyven-beauty-backend.onrender.com/api/v1';
    try {
      const res = await fetch(`${apiUrl}/catalog/products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: getAdminAuthHeader(),
        },
        body: JSON.stringify(prod),
      });

      if (res.ok) {
        const saved = await res.json();
        const formatted = normalizeProduct(saved);
        setProducts((prev) => {
          const updated = [formatted, ...prev.filter((p) => p.id !== formatted.id && p.slug !== formatted.slug)];
          safeStorageSet(STORAGE_KEYS.PRODUCTS, JSON.stringify(sanitizeProductsForStorage(updated)));
          return updated;
        });
        return;
      }
    } catch (err) {
      console.warn('[addProduct] Backend sync notice:', err);
    }

    const newProd: AdminProduct = {
      ...prod,
      id: `prod-${Date.now().toString(36)}`,
      createdAt: new Date().toISOString().split('T')[0],
    };
    setProducts((prev) => {
      const updated = [newProd, ...prev];
      safeStorageSet(STORAGE_KEYS.PRODUCTS, JSON.stringify(sanitizeProductsForStorage(updated)));
      return updated;
    });
  };

  const deleteProduct = async (productId: string): Promise<boolean> => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://seyven-beauty-backend.onrender.com/api/v1';
      const res = await fetch(`${apiUrl}/catalog/products/${productId}`, {
        method: 'DELETE',
        headers: {
          Authorization: getAdminAuthHeader(),
        },
      });

      if (res.ok) {
        setProducts((prev) => {
          const updated = prev.filter((p) => p.id !== productId && p.slug !== productId);
          safeStorageSet(STORAGE_KEYS.PRODUCTS, JSON.stringify(sanitizeProductsForStorage(updated)));
          return updated;
        });
        return true;
      }
    } catch (err) {
      console.error('[deleteProduct] Error:', err);
    }

    // Local fallback
    setProducts((prev) => {
      const updated = prev.filter((p) => p.id !== productId && p.slug !== productId);
      safeStorageSet(STORAGE_KEYS.PRODUCTS, JSON.stringify(sanitizeProductsForStorage(updated)));
      return updated;
    });
    return true;
  };

  const addBulkProducts = (newProds: AdminProduct[]) => {
    setProducts((prev) => {
      const updated = [...newProds, ...prev];
      safeStorageSet(STORAGE_KEYS.PRODUCTS, JSON.stringify(sanitizeProductsForStorage(updated)));
      return updated;
    });
  };

  const updateProductState = async (productId: string, state: AdminProduct['state']): Promise<boolean> => {
    // 1. Optimistic local state update
    setProducts((prev) => {
      const updated = prev.map((p) => (p.id === productId || p.slug === productId ? { ...p, state } : p));
      safeStorageSet(STORAGE_KEYS.PRODUCTS, JSON.stringify(sanitizeProductsForStorage(updated)));
      return updated;
    });

    // 2. Direct backend API call to persist in Supabase PostgreSQL & Redis
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://seyven-beauty-backend.onrender.com/api/v1';
      const res = await fetch(`${apiUrl}/catalog/products/${productId}/state`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: getAdminAuthHeader(),
        },
        body: JSON.stringify({ state }),
      });

      if (res.ok) {
        return true;
      } else {
        const errJson = await res.json().catch(() => ({}));
        console.warn('[updateProductState] Server notice:', errJson);
      }
    } catch (err) {
      console.warn('[updateProductState] Network notice:', err);
    }
    return false;
  };

  const updateProductPrice = async (productId: string, newPriceBdt: number, compareAtPriceBdt?: number): Promise<boolean> => {
    setProducts((prev) => {
      const updated = prev.map((p) => {
        if (p.id === productId || p.slug === productId) {
          return {
            ...p,
            priceBdt: newPriceBdt,
            priceRangeBdt: `৳${Number(newPriceBdt).toLocaleString()}`,
          };
        }
        return p;
      });
      safeStorageSet(STORAGE_KEYS.PRODUCTS, JSON.stringify(sanitizeProductsForStorage(updated)));
      return updated;
    });

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://seyven-beauty-backend.onrender.com/api/v1';
      const res = await fetch(`${apiUrl}/catalog/products/${productId}/pricing`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: getAdminAuthHeader(),
        },
        body: JSON.stringify({
          priceBdt: newPriceBdt,
          compareAtPriceBdt,
        }),
      });
      return res.ok;
    } catch {
      return false;
    }
  };

  const updateProduct = async (productIdOrSlug: string, updatedFields: Partial<AdminProduct>): Promise<boolean> => {
    setProducts((prev) => {
      const updated = prev.map((p) => {
        if (p.id === productIdOrSlug || p.slug === productIdOrSlug) {
          return {
            ...p,
            ...updatedFields,
          };
        }
        return p;
      });
      safeStorageSet(STORAGE_KEYS.PRODUCTS, JSON.stringify(sanitizeProductsForStorage(updated)));
      return updated;
    });

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://seyven-beauty-backend.onrender.com/api/v1';
      const res = await fetch(`${apiUrl}/catalog/products/${productIdOrSlug}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: getAdminAuthHeader(),
        },
        body: JSON.stringify(updatedFields),
      });
      return res.ok;
    } catch {
      return false;
    }
  };

  // QR Batches & Anomalies
  const generateQRBatch = (batchData: Omit<QRBatch, 'id' | 'createdAt' | 'downloadUrl'>): QRBatch => {
    const newBatch: QRBatch = {
      ...batchData,
      id: `batch-${Date.now().toString(36)}`,
      createdAt: new Date().toISOString().split('T')[0],
      downloadUrl: '#',
    };
    setQrBatches((prev) => [newBatch, ...prev]);
    return newBatch;
  };

  const resolveAnomaly = (id: string, notes?: string) => {
    setAnomalies((prev) =>
      prev.map((a) => (a.id === id ? { ...a, resolved: true, notes: notes || 'Resolved by staff curator' } : a))
    );
  };

  // Tiers & Loyalty
  const updateTier = (id: string, field: 'thresholdBdt' | 'discountPercent', value: number) => {
    setTiers((prev) => {
      const updated = prev.map((t) => (t.id === id ? { ...t, [field]: value } : t));
      safeStorageSet(STORAGE_KEYS.TIERS, JSON.stringify(updated));
      return updated;
    });
  };

  const triggerMilestoneEmail = (clientId: string) => {
    setClientSpendRecords((prev) =>
      prev.map((c) =>
        c.id === clientId
          ? {
              ...c,
              lastMilestoneEmailAt: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) + ' BST',
            }
          : c
      )
    );
  };

  // Site Redirects & Edge Cache
  const addRedirect = (source: string, dest: string, code: 301 | 302, notes: string) => {
    const newRule: RedirectRule = {
      id: `red-${Date.now().toString(36)}`,
      sourcePath: source,
      destinationPath: dest,
      statusCode: code,
      isActive: true,
      notes,
      createdAt: new Date().toISOString().split('T')[0],
    };
    setRedirects((prev) => [newRule, ...prev]);
  };

  const toggleRedirect = (id: string) => {
    setRedirects((prev) => prev.map((r) => (r.id === id ? { ...r, isActive: !r.isActive } : r)));
  };

  const deleteRedirect = (id: string) => {
    setRedirects((prev) => prev.filter((r) => r.id !== id));
  };

  const purgeEdgeCache = (_scope: string) => {
    const now = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) + ' BST';
    setLastPurgedAt(now);
  };

  return (
    <AdminContext.Provider
      value={{
        staffUser,
        isAuthenticated: !!staffUser,
        isReady,
        login,
        logout,
        switchRole,
        hasRole,
        orders,
        updateOrderStatus,
        updateCODVerification,
        assignCourier,
        addManualOrder,
        refreshOrders,
        isSyncingOrders,
        categories,
        addCategory,
        deleteCategory,
        products,
        addProduct,
        addBulkProducts,
        updateProduct,
        updateProductState,
        updateProductPrice,
        deleteProduct,
        refreshCatalog,
        qrBatches,
        generateQRBatch,
        anomalies,
        resolveAnomaly,
        tiers,
        updateTier,
        clientSpendRecords,
        triggerMilestoneEmail,
        redirects,
        addRedirect,
        toggleRedirect,
        deleteRedirect,
        lastPurgedAt,
        purgeEdgeCache,
      }}
    >
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
}
