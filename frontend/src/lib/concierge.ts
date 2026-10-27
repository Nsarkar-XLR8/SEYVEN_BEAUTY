import { PlatformSettingsState } from '@/context/cart-context';
import { BRAND } from '@/lib/constants';

/**
 * Normalizes any Bangladeshi phone number to international WhatsApp format:
 * e.g. "+880 1712 345678", "01712345678", "8801712345678" -> "8801712345678"
 */
export function sanitizeWhatsAppNumber(rawPhone: string): string {
  if (!rawPhone) return '8801700000000';
  const digits = rawPhone.replace(/\D/g, '');
  if (digits.startsWith('880')) return digits;
  if (digits.startsWith('0')) return `88${digits}`;
  if (digits.length === 10) return `880${digits}`;
  return digits || '8801700000000';
}

/**
 * Builds a direct 1-tap WhatsApp chat URL with pre-filled message.
 */
export function buildWhatsAppUrl(phone: string, message?: string): string {
  const cleanPhone = sanitizeWhatsAppNumber(phone);
  const base = `https://wa.me/${cleanPhone}`;
  if (!message) return base;
  return `${base}?text=${encodeURIComponent(message)}`;
}

/**
 * Normalizes Facebook Messenger link or handle to standard https://m.me/ format.
 */
export function sanitizeMessengerUrl(rawMessenger: string): string {
  if (!rawMessenger) return 'https://m.me/seyvenofficial';
  const trimmed = rawMessenger.trim();
  if (trimmed.startsWith('https://m.me/') || trimmed.startsWith('http://m.me/')) {
    return trimmed;
  }
  if (trimmed.includes('facebook.com/')) {
    const handle = trimmed.split('facebook.com/')[1]?.split('/')[0]?.split('?')[0];
    return `https://m.me/${handle || 'seyvenofficial'}`;
  }
  const cleanHandle = trimmed.replace(/^@/, '').replace(/^m\.me\//, '').replace(/^\/+/, '');
  return `https://m.me/${cleanHandle || 'seyvenofficial'}`;
}

/**
 * Normalizes Instagram URL or handle to standard https://www.instagram.com/ format.
 */
export function sanitizeInstagramUrl(rawInstagram: string): string {
  if (!rawInstagram) return 'https://www.instagram.com/seyven_beauty/';
  const trimmed = rawInstagram.trim();
  if (trimmed.startsWith('http')) return trimmed;
  const cleanHandle = trimmed.replace(/^@/, '').replace(/^\/+/, '');
  return `https://www.instagram.com/${cleanHandle || 'seyven_beauty'}/`;
}

export interface ConciergeProductContext {
  productTitle: string;
  volume?: string;
  priceBdt: number;
  quantity?: number;
}

export interface ConciergeAction {
  channel: 'MESSENGER' | 'WHATSAPP';
  labelEn: string;
  labelBn: string;
  shortLabel: string;
  url: string;
  displayValue: string;
}

/**
 * Resolves the primary storefront concierge action dynamically driven by Admin Settings.
 */
export function getPrimaryConciergeAction(
  settings?: Partial<PlatformSettingsState>,
  context?: ConciergeProductContext
): ConciergeAction {
  const channel = settings?.primaryConciergeChannel === 'WHATSAPP' ? 'WHATSAPP' : 'MESSENGER';

  if (channel === 'MESSENGER') {
    const rawMessenger = settings?.supportMessenger || BRAND.supportMessenger || 'https://m.me/seyvenofficial';
    const messengerUrl = sanitizeMessengerUrl(rawMessenger);
    const handle = messengerUrl.replace(/^https?:\/\/m\.me\//, '');
    return {
      channel: 'MESSENGER',
      labelEn: 'ORDER VIA MESSENGER CONCIERGE',
      labelBn: 'মেসেঞ্জারে সরাসরি অর্ডার করুন',
      shortLabel: 'MESSENGER',
      url: messengerUrl,
      displayValue: `m.me/${handle}`,
    };
  }

  // Channel: WHATSAPP
  const rawPhone = settings?.supportWhatsApp || BRAND.supportWhatsApp;
  const cleanPhone = sanitizeWhatsAppNumber(rawPhone);

  let message: string | undefined;
  if (context) {
    message = `Hi SEYVEN! I saw this on Instagram/Facebook and would like to order:\n\n• Product: ${context.productTitle}${
      context.volume ? ` (${context.volume})` : ''
    }\n• Price: ৳${Math.round(context.priceBdt).toLocaleString('en-IN')}${
      context.quantity ? `\n• Quantity: ${context.quantity}` : ''
    }\n\nPlease confirm my delivery details.`;
  }

  return {
    channel: 'WHATSAPP',
    labelEn: 'ORDER VIA WHATSAPP CONCIERGE',
    labelBn: 'হোয়াটসঅ্যাপে সরাসরি অর্ডার করুন',
    shortLabel: 'WHATSAPP',
    url: buildWhatsAppUrl(cleanPhone, message),
    displayValue: rawPhone,
  };
}
