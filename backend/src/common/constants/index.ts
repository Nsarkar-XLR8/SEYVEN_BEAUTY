export const CORRELATION_ID_HEADER = 'x-correlation-id';
export const IDEMPOTENCY_KEY_HEADER = 'x-idempotency-key';

export const VAT_RATE_PERCENT = 15.0;
export const FREE_SHIPPING_THRESHOLD_BDT = 2000.0;
export const STANDARD_INSIDE_DHAKA_SHIPPING_BDT = 60.0;
export const STANDARD_OUTSIDE_DHAKA_SHIPPING_BDT = 120.0;
export const MANDATORY_ADVANCE_FEE_BDT = 150.0;
export const MIN_SHELF_LIFE_DAYS = 90;

export {
  UserRole,
  PublicationState,
  LotStatus,
  OrderStatus,
  PaymentStatus,
  BstiStatus,
  OutboxStatus,
} from '@prisma/client';
