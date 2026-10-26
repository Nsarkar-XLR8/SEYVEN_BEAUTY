export enum PaymentGateway {
  COD = 'COD',
  BKASH = 'BKASH',
  NAGAD = 'NAGAD',
  SSLCOMMERZ = 'SSLCOMMERZ',
  SHURJOPAY = 'SHURJOPAY',
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  AUTHORIZED = 'AUTHORIZED',
  PARTIALLY_PAID = 'PARTIALLY_PAID',
  PAID = 'PAID',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
  PARTIALLY_REFUNDED = 'PARTIALLY_REFUNDED',
}

export enum PaymentType {
  ADVANCE_DELIVERY_FEE = 'ADVANCE_DELIVERY_FEE',
  FULL_PREPAYMENT = 'FULL_PREPAYMENT',
  PARTIAL_PAYMENT = 'PARTIAL_PAYMENT',
  DOORSTEP_COD = 'DOORSTEP_COD',
  REFUND = 'REFUND',
}

export enum PaymentTransactionStatus {
  INITIATED = 'INITIATED',
  PENDING = 'PENDING',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED',
}

export enum LedgerEntryType {
  ADVANCE_FEE_COLLECTED = 'ADVANCE_FEE_COLLECTED',
  FULL_PAYMENT_COLLECTED = 'FULL_PAYMENT_COLLECTED',
  PARTIAL_PAYMENT_COLLECTED = 'PARTIAL_PAYMENT_COLLECTED',
  DOORSTEP_COD_COLLECTED = 'DOORSTEP_COD_COLLECTED',
  REFUND_DISBURSED = 'REFUND_DISBURSED',
  ADJUSTMENT = 'ADJUSTMENT',
}

export enum LedgerEntryDirection {
  CREDIT = 'CREDIT',
  DEBIT = 'DEBIT',
}

export interface InitiatePaymentResult {
  orderId: string;
  orderNumber: string;
  paymentType: PaymentType;
  gateway: PaymentGateway;
  amountBdt: number;
  paymentUrl?: string;
  gatewayPaymentId?: string;
  transactionId?: string;
  clientSecret?: string;
  status: PaymentTransactionStatus;
  expiresAt?: string;
  metadata?: Record<string, any>;
}

export interface BkashCreateResponse {
  paymentID: string;
  bkashURL: string;
  callbackURL: string;
  amount: string;
  currency: string;
  intent: string;
  merchantInvoiceNumber: string;
  statusCode: string;
  statusMessage: string;
}

export interface BkashExecuteResponse {
  paymentID: string;
  trxID: string;
  transactionStatus: string;
  amount: string;
  currency: string;
  intent: string;
  merchantInvoiceNumber: string;
  payerReference?: string;
  customerMsisdn?: string;
  paymentExecuteTime?: string;
  statusCode: string;
  statusMessage: string;
}

export interface BkashQueryResponse {
  paymentID: string;
  trxID: string;
  transactionStatus: string;
  amount: string;
  currency: string;
  intent: string;
  merchantInvoiceNumber: string;
  statusCode: string;
  statusMessage: string;
}

export interface BkashRefundResponse {
  refundTrxID: string;
  originalTrxID: string;
  paymentID: string;
  amount: string;
  currency: string;
  completedTime?: string;
  statusCode: string;
  statusMessage: string;
}

export interface SSLCommerzInitResponse {
  status: string;
  failedreason?: string;
  sessionkey?: string;
  GatewayPageURL?: string;
  redirectGatewayURL?: string;
  DirectPaymentURL?: string;
}

export interface SSLCommerzIpnPayload {
  tran_id: string;
  val_id: string;
  amount: string;
  card_type?: string;
  store_amount?: string;
  card_no?: string;
  bank_tran_id?: string;
  status: string;
  tran_date?: string;
  currency?: string;
  card_issuer?: string;
  card_brand?: string;
  card_sub_brand?: string;
  card_issuer_country?: string;
  card_issuer_country_code?: string;
  store_id?: string;
  verify_sign?: string;
  verify_key?: string;
  verify_sign_sha2?: string;
  currency_type?: string;
  currency_amount?: string;
  value_a?: string; // Order ID
  value_b?: string; // Payment Type
  value_c?: string; // User ID
  value_d?: string; // Checksum or custom tag
  risk_level?: string;
  risk_title?: string;
}

export interface SplitLedgerSummary {
  ledgerId: string;
  orderId: string;
  orderNumber: string;
  totalPayableBdt: number;
  advanceRequiredBdt: number;
  advancePaidBdt: number;
  codDueBdt: number;
  isFullySettled: boolean;
  settledAt: Date | null;
  paymentStatus: PaymentStatus;
  entries: Array<{
    id: string;
    transactionId: string | null;
    entryType: LedgerEntryType;
    direction: LedgerEntryDirection;
    amountBdt: number;
    runningBalanceBdt: number;
    referenceNote: string | null;
    createdAt: Date;
  }>;
}

export interface RefundResult {
  success: boolean;
  refundTrxId: string;
  orderId: string;
  amountBdt: number;
  gateway: PaymentGateway;
  message: string;
  paymentStatus: PaymentStatus;
}
