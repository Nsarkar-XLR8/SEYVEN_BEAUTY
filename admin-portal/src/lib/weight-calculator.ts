/**
 * Universal Intelligent Logistics & Product Weight Engine for SEYVEN
 * Calibrates authentic cosmetic gross weight (formula + packaging tare weight)
 * and computes dynamic parcel weights for Pathao, Steadfast, and Thermal Labels.
 */

export interface OrderWeightCalculation {
  itemTotalGrams: number;
  packagingBufferGrams: number;
  grossGrams: number;
  weightKg: number;
  courierBillableKg: number;
  weightDisplay: string;
}

/**
 * Intelligent Volume & Category to Packaging Gross Weight Estimator.
 * Formulas in cosmetic containers include bottle tare weight:
 * - 30–50ml glass dropper serums weigh ~130–160g total.
 * - 150ml toner in plastic/glass weighs ~220–260g total.
 * - Lip balms and eyeliners weigh ~25–35g total.
 */
export function suggestProductWeightGrams(volume: string = '', category: string = ''): number {
  const volStr = (volume || '').toLowerCase().trim();
  const catStr = (category || '').toLowerCase().trim();

  // 1. Direct Category overrides
  if (catStr.includes('lip') || volStr.includes('lip')) return 30;
  if (catStr.includes('eye') || volStr.includes('liner') || volStr.includes('pencil')) return 25;
  if (catStr.includes('mask') || volStr.includes('sheet')) return 35;

  // 2. Extract numeric volume (e.g. "50 ML", "150ml", "100g")
  const numMatch = volStr.match(/(\d+(?:\.\d+)?)\s*(ml|g|gm|gram|oz|fl\s*oz)?/i);
  if (numMatch) {
    const val = parseFloat(numMatch[1]);
    const unit = (numMatch[2] || 'ml').toLowerCase();

    // Convert fluid oz to ml
    const numericMlOrG = unit.includes('oz') ? val * 29.57 : val;

    if (numericMlOrG <= 15) return 35;
    if (numericMlOrG <= 30) return 110;
    if (numericMlOrG <= 50) return 145;
    if (numericMlOrG <= 100) return 190;
    if (numericMlOrG <= 150) return 240;
    if (numericMlOrG <= 200) return 290;
    if (numericMlOrG <= 250) return 340;
    if (numericMlOrG <= 400) return 480;
    if (numericMlOrG <= 500) return 580;
    return Math.round(numericMlOrG * 1.15 + 60);
  }

  // Fallback default for standard luxury skincare bottle
  return 150;
}

/**
 * Dynamically aggregates gross parcel weight from order items,
 * adding safety packaging buffer (shipping box, corrugated liner, bubble wrap ~80g).
 */
export function calculateOrderGrossWeight(
  items: Array<{
    quantity?: number;
    weightGrams?: number;
    title?: string;
    variant?: string;
  }> = [],
  packagingBufferGrams: number = 80,
): OrderWeightCalculation {
  let itemTotalGrams = 0;

  for (const item of items) {
    const qty = Math.max(1, item.quantity || 1);
    let unitGram = item.weightGrams;

    // Intelligent heuristic fallback if item didn't carry explicit weightGrams
    if (!unitGram || unitGram <= 0) {
      unitGram = suggestProductWeightGrams(item.variant || '', item.title || '');
    }

    itemTotalGrams += unitGram * qty;
  }

  const grossGrams = itemTotalGrams + packagingBufferGrams;
  const rawKg = grossGrams / 1000;

  // Minimum courier billable tier in Bangladesh is 0.5 KG
  // Displayed weight rounded up to 1 decimal place (e.g. 0.5, 0.6, 0.7, 1.1 KG)
  const weightKg = Math.max(0.5, +(Math.ceil(rawKg * 10) / 10).toFixed(1));

  // Courier billable weight in 0.5 KG increments (0.5, 1.0, 1.5, 2.0 KG)
  const courierBillableKg = Math.max(0.5, +(Math.ceil(rawKg * 2) / 2).toFixed(1));

  return {
    itemTotalGrams,
    packagingBufferGrams,
    grossGrams,
    weightKg,
    courierBillableKg,
    weightDisplay: `${weightKg} KG`,
  };
}
