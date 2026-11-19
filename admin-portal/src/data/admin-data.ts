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
    id: 'staff-nayem',
    name: 'Nayem Sarkar',
    email: 'officialseyven@gmail.com',
    role: 'SUPER_ADMIN',
    avatar: 'NS',
    title: 'Founder & Super Admin',
  },
];

export const INITIAL_ORDERS: AdminOrder[] = [];

export const INITIAL_CATEGORIES: AdminCategory[] = [];

export const INITIAL_PRODUCTS: AdminProduct[] = [];

export const INITIAL_QR_BATCHES: QRBatch[] = [];

export const INITIAL_ANOMALIES: ScanAnomaly[] = [];

export const INITIAL_REDIRECTS: RedirectRule[] = [];
