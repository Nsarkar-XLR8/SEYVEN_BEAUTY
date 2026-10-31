/**
 * Meta Pixel & Conversions API (CAPI) Client Helper
 * Strict Zero Hardcoded Fallbacks: Reads dynamically from environment variables.
 */

declare global {
  interface Window {
    fbq?: any;
    _fbq?: any;
  }
}

export function getMetaPixelId(): string | undefined {
  const id = process.env.NEXT_PUBLIC_META_PIXEL_ID;
  if (!id || id.trim().length === 0) return undefined;
  return id.trim();
}

export function getMetaTestEventCode(): string | undefined {
  const code = process.env.NEXT_PUBLIC_META_TEST_EVENT_CODE;
  if (!code || code.trim().length === 0) return undefined;
  return code.trim();
}

export function trackPageView() {
  if (typeof window !== 'undefined' && typeof window.fbq === 'function') {
    window.fbq('track', 'PageView');
  }
}

export function trackViewContent(product: {
  id?: string;
  slug?: string;
  name?: string;
  titleEn?: string;
  priceBdt?: number;
  category?: string;
}) {
  if (typeof window !== 'undefined' && typeof window.fbq === 'function') {
    const testCode = getMetaTestEventCode();
    const options = testCode ? { test_event_code: testCode } : undefined;

    window.fbq(
      'track',
      'ViewContent',
      {
        content_name: product.name || product.titleEn || 'Product',
        content_category: product.category || 'Skincare',
        content_ids: [product.slug || product.id || 'PRODUCT'],
        content_type: 'product',
        value: Number(product.priceBdt) || 0,
        currency: 'BDT',
      },
      options,
    );
  }
}

export function trackAddToCart(item: {
  id?: string;
  variantId?: string;
  name?: string;
  titleEn?: string;
  priceBdt?: number;
  quantity?: number;
}) {
  if (typeof window !== 'undefined' && typeof window.fbq === 'function') {
    const testCode = getMetaTestEventCode();
    const options = testCode ? { test_event_code: testCode } : undefined;

    window.fbq(
      'track',
      'AddToCart',
      {
        content_name: item.name || item.titleEn || 'Product',
        content_ids: [item.variantId || item.id || 'ITEM'],
        content_type: 'product',
        value: (Number(item.priceBdt) || 0) * (item.quantity || 1),
        currency: 'BDT',
      },
      options,
    );
  }
}

export function trackInitiateCheckout(items: any[], totalValue: number) {
  if (typeof window !== 'undefined' && typeof window.fbq === 'function') {
    const testCode = getMetaTestEventCode();
    const options = testCode ? { test_event_code: testCode } : undefined;

    window.fbq(
      'track',
      'InitiateCheckout',
      {
        content_ids: items.map((it) => it.variantId || it.id || 'ITEM'),
        content_type: 'product',
        num_items: items.reduce((acc, it) => acc + (it.quantity || 1), 0),
        value: Number(totalValue) || 0,
        currency: 'BDT',
      },
      options,
    );
  }
}

export function trackPurchase(
  order: {
    orderNumber?: string;
    totalAmount?: number;
    subtotal?: number;
    items?: any[];
  },
  eventId: string,
) {
  if (typeof window !== 'undefined' && typeof window.fbq === 'function') {
    const testCode = getMetaTestEventCode();
    const options: Record<string, any> = {
      eventID: eventId,
    };
    if (testCode) {
      options.test_event_code = testCode;
    }

    const items = order.items || [];
    window.fbq(
      'track',
      'Purchase',
      {
        content_type: 'product',
        content_ids: items.map((it) => it.id || it.sku || 'ITEM'),
        value: Number(order.totalAmount || order.subtotal) || 0,
        currency: 'BDT',
        num_items: items.reduce((acc, it) => acc + (it.quantity || 1), 0),
      },
      options,
    );
  }
}

