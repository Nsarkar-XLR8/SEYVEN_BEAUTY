/**
 * Central API Configuration for SEYVEN Admin Portal
 * Defaults to live Render backend if NEXT_PUBLIC_API_URL is unset
 */
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'https://seyven-beauty-backend.onrender.com/api/v1';
