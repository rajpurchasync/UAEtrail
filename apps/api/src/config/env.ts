import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(4000),
  DATABASE_URL: z.string().min(1),
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
  S3_ACCESS_KEY_ID: z.string().optional(),
  S3_SECRET_ACCESS_KEY: z.string().optional(),
  S3_FORCE_PATH_STYLE: z.coerce.boolean().default(true),
  GOOGLE_CLIENT_ID: z.string().optional()
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const message = parsed.error.errors.map((item) => `${item.path.join('.')}: ${item.message}`).join(', ');
  throw new Error(`Invalid environment variables: ${message}`);
}

export const env = parsed.data;

/** Warn at startup when payment features are partially configured. */
export const validateOptionalIntegrations = (): void => {
  const hasStripeKey = Boolean(process.env.STRIPE_SECRET_KEY);
  const hasWebhookSecret = Boolean(process.env.STRIPE_WEBHOOK_SECRET);
  if (hasStripeKey && !hasWebhookSecret && env.NODE_ENV === 'production') {
    console.warn('[config] STRIPE_SECRET_KEY is set but STRIPE_WEBHOOK_SECRET is missing — webhooks will fail.');
  }
  if (!hasStripeKey && hasWebhookSecret) {
    console.warn('[config] STRIPE_WEBHOOK_SECRET is set but STRIPE_SECRET_KEY is missing.');
  }
};
