import { z } from 'zod';

export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3000),
  API_PREFIX: z.string().default('api/v1'),
  CORS_ORIGIN: z.string().default('*'),
  FRONTEND_URL: z.string().default('https://theseyven.com'),
  BACKEND_URL: z.string().default('https://api.theseyven.com/api/v1'),

  DATABASE_URL: z.string().url().default('postgresql://seyven_user:seyven_secret_pass@localhost:5432/seyven_db?schema=public'),

  // Supabase Cloud Infrastructure (Database & Storage Only)
  SUPABASE_URL: z.string().optional().default(''),
  SUPABASE_ANON_KEY: z.string().optional().default(''),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional().default(''),
  SUPABASE_PROJECT_JWT_SECRET: z.string().optional().default(''),
  SUPABASE_JWT_SECRET: z.string().optional().default(''),

  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.coerce.number().default(6379),
  REDIS_PASSWORD: z.string().optional().default(''),
  REDIS_URL: z.string().optional().default(''),
  REDIS_TLS: z.string().optional().default('false'),

  // Cloudinary Media CDN & Asset Storage
  CLOUDINARY_CLOUD_NAME: z.string().optional().default('uoh4c2xb'),
  CLOUDINARY_API_KEY: z.string().optional().default('529213915192717'),
  CLOUDINARY_API_SECRET: z.string().optional().default('y4p0_vLRq-j89fp-fHjBrQC_gaA'),
  CLOUDINARY_URL: z.string().optional().default('cloudinary://529213915192717:y4p0_vLRq-j89fp-fHjBrQC_gaA@uoh4c2xb'),

  // SEYVEN Application Authentication Tokens (Independent Secrets)
  SEYVEN_JWT_ACCESS_TOKEN_SECRET: z.string().min(16).default('seyven_ultra_secure_jwt_access_secret_key_2026'),
  SEYVEN_JWT_ACCESS_EXPIRATION: z.string().default('15m'),
  SEYVEN_JWT_REFRESH_TOKEN_SECRET: z.string().min(16).default('seyven_ultra_secure_jwt_refresh_secret_key_2026'),
  SEYVEN_JWT_REFRESH_EXPIRATION: z.string().default('7d'),
  SEYVEN_PREVIEW_TOKEN_SECRET: z.string().min(16).default('seyven_preview_token_secret_2026'),

  // Backward compatibility aliases
  JWT_ACCESS_SECRET: z.string().min(16).optional().default('seyven_ultra_secure_jwt_access_secret_key_2026'),
  JWT_ACCESS_EXPIRATION: z.string().optional().default('15m'),
  JWT_REFRESH_SECRET: z.string().min(16).optional().default('seyven_ultra_secure_jwt_refresh_secret_key_2026'),
  JWT_REFRESH_EXPIRATION: z.string().optional().default('7d'),
  PREVIEW_TOKEN_SECRET: z.string().min(16).optional().default('seyven_preview_token_secret_2026'),

  SENTRY_DSN: z.string().optional().default(''),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),

  // Gateway Configurations
  BKASH_APP_KEY: z.string().default('mock_bkash_app_key_2026'),
  BKASH_APP_SECRET: z.string().default('mock_bkash_app_secret_2026'),
  BKASH_USERNAME: z.string().default('sandbox_user'),
  BKASH_PASSWORD: z.string().default('sandbox_pass'),
  BKASH_BASE_URL: z.string().default('https://tokenized.sandbox.bka.sh/v1.2.0-beta'),
  BKASH_CALLBACK_URL: z.string().default('http://localhost:3000/api/v1/payments/bkash/callback'),

  SSLCOMMERZ_STORE_ID: z.string().default('seyven_sandbox_store'),
  SSLCOMMERZ_STORE_PASSWD: z.string().default('seyven_sandbox_pass'),
  SSLCOMMERZ_IS_SANDBOX: z.preprocess((val: unknown) => val === 'true' || val === true, z.boolean()).default(true),
  SSLCOMMERZ_BASE_URL: z.string().default('https://sandbox.sslcommerz.com'),
  SSLCOMMERZ_IPN_URL: z.string().default('http://localhost:3000/api/v1/payments/sslcommerz/ipn'),
  SSLCOMMERZ_SUCCESS_URL: z.string().default('http://localhost:3000/checkout/success'),
  SSLCOMMERZ_FAIL_URL: z.string().default('http://localhost:3000/checkout/fail'),
  SSLCOMMERZ_CANCEL_URL: z.string().default('http://localhost:3000/checkout/cancel'),

  // Pathao Courier Logistics Configurations
  PATHAO_BASE_URL: z.string().default('https://courier-api-sandbox.pathao.com'),
  PATHAO_CLIENT_ID: z.string().default('mock_pathao_client_id_2026'),
  PATHAO_CLIENT_SECRET: z.string().default('mock_pathao_client_secret_2026'),
  PATHAO_USERNAME: z.string().default('sandbox_merchant@seyven.com'),
  PATHAO_PASSWORD: z.string().default('mock_pathao_pass_2026'),
  PATHAO_STORE_ID: z.coerce.number().default(12345),
  PATHAO_WEBHOOK_SECRET: z.string().default('mock_pathao_webhook_secret_2026'),

  // Steadfast Courier Logistics Configurations (Fallback / Supplementary)
  STEADFAST_API_KEY: z.string().default('mock_steadfast_api_key_2026'),
  STEADFAST_SECRET_KEY: z.string().default('mock_steadfast_secret_key_2026'),
  STEADFAST_BASE_URL: z.string().default('https://portal.steadfast.com.bd/api/v1'),
  STEADFAST_WEBHOOK_SECRET: z.string().default('mock_steadfast_webhook_secret_2026'),

  // BTRC Masked SMS Gateway Configurations
  SMS_GATEWAY_PROVIDER: z.enum(['MOCK', 'GREENWEB', 'REVE', 'SSL_WIRELESS']).default('MOCK'),
  SMS_GATEWAY_API_KEY: z.string().default('mock_sms_api_key_2026'),
  SMS_GATEWAY_API_URL: z.string().default('https://api.sms-gateway.bd/v1/send'),
  SMS_SENDER_MASK: z.string().default('SEYVEN'),
  SMS_QUIET_HOURS_ENABLED: z.preprocess((val: unknown) => val === 'true' || val === true, z.boolean()).default(true),

  // Meta WhatsApp Business Cloud API Configurations
  WHATSAPP_API_URL: z.string().default('https://graph.facebook.com/v20.0'),
  WHATSAPP_PHONE_NUMBER_ID: z.string().default('mock_wa_phone_number_id_2026'),
  WHATSAPP_BUSINESS_ACCOUNT_ID: z.string().default('mock_wa_business_account_id_2026'),
  WHATSAPP_ACCESS_TOKEN: z.string().default('mock_wa_access_token_2026'),
  WHATSAPP_WEBHOOK_VERIFY_TOKEN: z.string().default('seyven_wa_webhook_verify_token_2026'),

  // Meta Conversions API (CAPI) Configurations
  META_PIXEL_ID: z.string().default('mock_meta_pixel_id_2026'),
  META_CAPI_ACCESS_TOKEN: z.string().default('mock_meta_capi_access_token_2026'),
  META_CAPI_API_VERSION: z.string().default('v20.0'),
  META_TEST_EVENT_CODE: z.string().optional().default(''),

  // Google Analytics 4 Measurement Protocol Configurations
  GA4_MEASUREMENT_ID: z.string().default('G-MOCK2026MEASURE'),
  GA4_API_SECRET: z.string().default('mock_ga4_api_secret_2026'),
  GA4_ENDPOINT: z.string().default('https://www.google-analytics.com/mp/collect'),
});

export type EnvConfig = z.infer<typeof envSchema>;

export function validateEnv(config: Record<string, unknown>): EnvConfig {
  const parsed = envSchema.safeParse(config);
  if (!parsed.success) {
    console.error('❌ Invalid environment variables configuration:', parsed.error.format());
    throw new Error('Environment variable validation failed');
  }
  return parsed.data;
}
