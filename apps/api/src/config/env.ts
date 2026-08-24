import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';
import { isEmailConfigured } from '../lib/email-config.js';

const configDir = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(configDir, '../../../../.env') });
dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  RUN_ENV: z.enum(['test', 'staging', 'production', 'local']).optional(),
  PORT: z.coerce.number().default(4000),
  MONGODB_URI: z.string().min(1),
  JWT_ACCESS_SECRET: z.string().min(24),
  JWT_REFRESH_SECRET: z.string().min(24),
  JWT_ACCESS_TTL: z.string().default('15m'),
  JWT_REFRESH_TTL_DAYS: z.coerce.number().default(30),
  APP_BASE_URL: z.string().url().default('http://localhost:5173'),
  APP_BASE_URLS: z.string().optional(),
  API_BASE_URL: z.string().url().default('http://localhost:4000'),
  S3_ENDPOINT: z.string().optional(),
  S3_REGION: z.string().default('us-east-1'),
  S3_BUCKET: z.string().default('uaetrail-assets'),
  S3_PUBLIC_BUCKET: z.string().default('uaetrail-public'),
  S3_PRIVATE_BUCKET: z.string().default('uaetrail-private'),
  S3_ACCESS_KEY_ID: z.string().optional(),
  S3_SECRET_ACCESS_KEY: z.string().optional(),
  S3_FORCE_PATH_STYLE: z.coerce.boolean().default(true),
  S3_PUBLIC_URL: z.string().url().optional(),
  GOOGLE_CLIENT_ID: z.string().optional()
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const message = parsed.error.errors.map((item) => `${item.path.join('.')}: ${item.message}`).join(', ');
  throw new Error(`Invalid environment variables: ${message}`);
}

export const env = parsed.data;

/** Fail fast when production is misconfigured. */
export const validateProductionConfig = (): void => {
  if (env.NODE_ENV !== 'production') return;

  if (!isEmailConfigured()) {
    throw new Error(
      'Production requires email delivery — set SMTP_URL_PROD, SENDGRID_API_KEY, or SMTP_HOST for production.'
    );
  }

  if (process.env.STRIPE_SECRET_KEY && !process.env.STRIPE_WEBHOOK_SECRET) {
    throw new Error('STRIPE_SECRET_KEY is set but STRIPE_WEBHOOK_SECRET is missing.');
  }

  if (env.JWT_ACCESS_SECRET === env.JWT_REFRESH_SECRET) {
    throw new Error('JWT_ACCESS_SECRET and JWT_REFRESH_SECRET must be different in production.');
  }

  if (!process.env.REDIS_URL) {
    throw new Error('Production requires REDIS_URL for rate limits and SSE tickets.');
  }
};

/** Warn at startup when payment features are partially configured. */
export const validateOptionalIntegrations = (): void => {
  validateProductionConfig();
  const hasStripeKey = Boolean(process.env.STRIPE_SECRET_KEY);
  const hasWebhookSecret = Boolean(process.env.STRIPE_WEBHOOK_SECRET);
  if (hasStripeKey && !hasWebhookSecret) {
    console.warn('[config] STRIPE_SECRET_KEY is set but STRIPE_WEBHOOK_SECRET is missing — webhooks will fail.');
  }
  if (!hasStripeKey && hasWebhookSecret) {
    console.warn('[config] STRIPE_WEBHOOK_SECRET is set but STRIPE_SECRET_KEY is missing.');
  }
};
