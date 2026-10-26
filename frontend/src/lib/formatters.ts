/**
 * Formats a number to Bangladeshi Taka (৳) with proper comma separators.
 */
export function formatBdt(amount: number | string | null | undefined): string {
  const numeric = typeof amount === 'string' ? parseFloat(amount) : (amount || 0);
  if (isNaN(numeric)) return '৳0';
  
  // Format with standard grouping without breaking space
  return `৳${Math.round(numeric).toLocaleString('en-IN')}`;
}

/**
 * Normalizes phone number to E.164 Bangladeshi standard (+8801XXXXXXXXX)
 */
export function normalizeBdPhone(phone: string): string {
  const cleaned = phone.replace(/[^\d+]/g, '');
  if (cleaned.startsWith('+880')) return cleaned;
  if (cleaned.startsWith('880')) return `+${cleaned}`;
  if (cleaned.startsWith('01')) return `+88${cleaned}`;
  if (cleaned.startsWith('1')) return `+880${cleaned}`;
  return cleaned;
}

/**
 * Validates Bangladeshi 11-digit mobile phone
 */
export function isValidBdPhone(phone: string): boolean {
  const norm = normalizeBdPhone(phone);
  return /^\+8801[3-9]\d{8}$/.test(norm);
}
