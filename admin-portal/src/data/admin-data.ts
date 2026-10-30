import {
  StaffUser,
  AdminOrder,
  QRBatch,
  ScanAnomaly,
  RedirectRule,
  AdminCategory,
  AdminProduct,
} from '../types/admin';

export const STAFF_USERS: StaffUser[] = [
  {
    id: 'staff-farah',
    name: 'Farah Rahman',
    email: 'farah@seyven.com',
    role: 'SUPER_ADMIN',
    avatar: 'FR',
    title: 'Principal Curator & Super Admin',
  },
  {
    id: 'staff-tariq',
    name: 'Tariq Al-Mansur',
    email: 'tariq@seyven.com',
    role: 'FULFILLMENT_OPERATOR',
    avatar: 'TM',
    title: 'Lead Dispatch & Logistics Specialist',
  },
  {
    id: 'staff-anika',
    name: 'Anika Tabassum',
    email: 'anika@seyven.com',
    role: 'CATALOG_MANAGER',
    avatar: 'AT',
    title: 'Senior Formulations & Catalog Curator',
  },
  {
    id: 'staff-nafis',
    name: 'Nafis Chowdhury',
    email: 'nafis@seyven.com',
    role: 'SUPPORT_AGENT',
    avatar: 'NC',
    title: 'Client Skincare Concierge & Order Verification',
  },
  {
    id: 'staff-hasan',
    name: 'Hasan Mahmud',
    email: 'hasan@seyven.com',
    role: 'FINANCE_OFFICER',
    avatar: 'HM',
    title: 'Executive Financial Comptroller',
  },
];

export const INITIAL_ORDERS: AdminOrder[] = [];

export const INITIAL_CATEGORIES: AdminCategory[] = [];

export const INITIAL_PRODUCTS: AdminProduct[] = [];

export const INITIAL_QR_BATCHES: QRBatch[] = [
  {
    id: 'batch-01',
    batchNumber: 'BATCH-2026-OCT-A',
    productName: 'Hyaluronic Acid Multi-Depth Hydration',
    sku: 'SYV-TO-HA30ML',
    quantity: 500,
    createdAt: '2026-10-12',
    downloadUrl: '#',
    scannedCount: 142,
  },
];

export const INITIAL_ANOMALIES: ScanAnomaly[] = [
  {
    id: 'anom-01',
    serialNumber: 'SYV-AUTH-889210-XC',
    productTitle: 'Hyaluronic Acid Multi-Depth Hydration Serum (30ml)',
    firstScannedLocation: 'Dhaka, Dhanmondi (IP: 103.205.x.x)',
    secondScannedLocation: 'Chattogram, GEC Circle (IP: 118.179.x.x)',
    firstScannedAt: '2026-10-17 11:15 BST',
    secondScannedAt: '2026-10-17 11:18 BST',
    timeDeltaMinutes: 3,
    severity: 'CRITICAL',
    resolved: false,
    notes: 'Impossible physical velocity: 250km apart in 3 minutes. Flagged as potential counterfeit clone scan.',
  },
];

export const INITIAL_REDIRECTS: RedirectRule[] = [
  {
    id: 'red-01',
    sourcePath: '/the-ordinary-hyaluronic-acid',
    destinationPath: '/catalog/hyaluronic-acid-multi-depth',
    statusCode: 301,
    isActive: true,
    notes: 'Legacy SEO URL 301 redirect',
    createdAt: '2026-10-10',
  },
];
