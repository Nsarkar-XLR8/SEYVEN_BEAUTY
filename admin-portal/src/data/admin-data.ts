import {
  StaffUser,
  AdminOrder,
  QRBatch,
  ScanAnomaly,
  RedirectRule,
  TierConfig,
  ClientSpendRecord,
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

export const INITIAL_TIERS: TierConfig[] = [
  {
    id: 'bronze',
    name: 'Sanctuary Patron',
    thresholdBdt: 0,
    discountPercent: 0,
    descriptionEn: 'Standard luxury concierge and guaranteed authentic international imports.',
  },
  {
    id: 'silver',
    name: 'Silver Privilege',
    thresholdBdt: 5000,
    discountPercent: 5,
    descriptionEn: 'Automatic 5% courtesy discount on all future orders & priority warehouse packaging.',
  },
  {
    id: 'gold',
    name: 'Gold Privilege',
    thresholdBdt: 10000,
    discountPercent: 8,
    descriptionEn: 'Automatic 8% courtesy discount, personal skincare advisory & WhatsApp concierge.',
  },
  {
    id: 'noir',
    name: 'Noir Atelier',
    thresholdBdt: 20000,
    discountPercent: 10,
    descriptionEn: 'Automatic 10% maximum lifetime courtesy discount, bespoke skincare gifts & private collection previews.',
  },
];

export const INITIAL_CLIENT_SPEND_RECORDS: ClientSpendRecord[] = [
  {
    id: 'cl-01',
    name: 'Farah Rahman',
    phone: '01712-345678',
    email: 'farah.rahman@example.com',
    deliveredOrdersCount: 6,
    cumulativeSpendBdt: 24500,
    currentTier: 'Noir Atelier',
    discountPercent: 10,
    lastMilestoneEmailAt: '2026-10-15 14:32 BST',
  },
  {
    id: 'cl-02',
    name: 'Nusrat Jahan',
    phone: '01819-876543',
    email: 'nusrat.jahan@gmail.com',
    deliveredOrdersCount: 4,
    cumulativeSpendBdt: 12450,
    currentTier: 'Gold Privilege',
    discountPercent: 8,
    lastMilestoneEmailAt: '2026-10-12 11:20 BST',
  },
  {
    id: 'cl-03',
    name: 'Sadia Islam',
    phone: '01911-223344',
    email: 'sadia.islam@yahoo.com',
    deliveredOrdersCount: 2,
    cumulativeSpendBdt: 6800,
    currentTier: 'Silver Privilege',
    discountPercent: 5,
    lastMilestoneEmailAt: '2026-09-28 17:45 BST',
  },
];
