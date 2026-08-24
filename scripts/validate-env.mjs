/**
 * Validate environment variables for local or production deploy.
 * No network calls — reads process.env or a .env file path.
 *
 * Usage:
 *   node scripts/validate-env.mjs              # checks process.env
 *   node scripts/validate-env.mjs --file .env  # load file first
 *   node scripts/validate-env.mjs --production
 */
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { isEmailConfiguredFromEnv } from './lib/resolve-email-env.mjs';

const args = process.argv.slice(2);
const production = args.includes('--production');
const fileIdx = args.indexOf('--file');
const envFile = fileIdx >= 0 ? args[fileIdx + 1] : null;

if (envFile) {
  const abs = resolve(envFile);
  if (!existsSync(abs)) {
    console.error(`Env file not found: ${abs}`);
    process.exit(1);
  }
  for (const line of readFileSync(abs, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

const isSet = (key) => {
  const v = process.env[key];
  return typeof v === 'string' && v.trim().length > 0;
};

const minLen = (key, n) => isSet(key) && process.env[key].length >= n;
const rawRunEnv = (process.env.RUN_ENV || (production ? 'production' : 'test')).toLowerCase();
const runEnv = rawRunEnv === 'local' ? 'test' : rawRunEnv;
const requiredMongoKey = runEnv === 'production'
  ? 'MONGODB_URI_PROD'
  : runEnv === 'staging'
    ? 'MONGODB_URI_STAGING'
    : 'MONGODB_URI_TEST';

const getEnv = (key) => process.env[key] ?? '';

const emailConfigured = () => isEmailConfiguredFromEnv(getEnv, runEnv);

const errors = [];
const warnings = [];

if (runEnv === 'staging' && !emailConfigured()) {
  errors.push(
    'Email — set SMTP_GMAIL_APP_PASSWORD (Gmail App Password for uaetrail@gmail.com) or SMTP_URL_STAGING / SENDGRID_API_KEY'
  );
}

const requiredAlways = [
  [
    'MONGODB_URI',
    () => isSet(requiredMongoKey),
    runEnv === 'production'
      ? 'required — set MONGODB_URI_PROD'
        : runEnv === 'staging'
          ? 'required — set MONGODB_URI_STAGING'
          : 'required — set MONGODB_URI_TEST'
  ],
  ['JWT_ACCESS_SECRET', () => minLen('JWT_ACCESS_SECRET', 24), 'min 24 characters'],
  ['JWT_REFRESH_SECRET', () => minLen('JWT_REFRESH_SECRET', 24), 'min 24 characters'],
  ['S3_ACCESS_KEY_ID', () => isSet('S3_ACCESS_KEY_ID'), 'required'],
  ['S3_SECRET_ACCESS_KEY', () => minLen('S3_SECRET_ACCESS_KEY', 8), 'min 8 characters']
];

for (const [key, check, hint] of requiredAlways) {
  if (!check()) errors.push(`${key} — ${hint}`);
}

if (production) {
  if (!isSet('APP_BASE_URL') || !process.env.APP_BASE_URL.startsWith('https://')) {
    errors.push('APP_BASE_URL — must be https:// in production');
  }
  if (!isSet('VITE_SITE_ORIGIN') || !process.env.VITE_SITE_ORIGIN.startsWith('https://')) {
    warnings.push('VITE_SITE_ORIGIN — should be https:// for production builds');
  }
  if (!emailConfigured()) {
    errors.push('SMTP_URL_PROD, SENDGRID_API_KEY, or SMTP_HOST — required for verification/reset emails');
  }
  if (!isSet('REDIS_URL')) {
    errors.push('REDIS_URL — required in production for rate limits and SSE tickets');
  }
  if (!isSet('EMAIL_FROM') && !isSet('EMAIL_FROM_PROD')) {
    warnings.push('EMAIL_FROM_PROD — set a verified production sender address');
  }
  const googleApi = isSet('GOOGLE_CLIENT_ID');
  const googleVite = isSet('VITE_GOOGLE_CLIENT_ID');
  if (googleApi !== googleVite) {
    warnings.push('GOOGLE_CLIENT_ID and VITE_GOOGLE_CLIENT_ID should both be set (or both omitted)');
  }
  if (isSet('STRIPE_SECRET_KEY') && !isSet('STRIPE_WEBHOOK_SECRET')) {
    warnings.push('STRIPE_WEBHOOK_SECRET — missing while STRIPE_SECRET_KEY is set');
  }
  if (process.env.SEED_ADMIN_PASSWORD === 'Admin@12345') {
    errors.push('SEED_ADMIN_PASSWORD — rotate default seed password before production');
  }
}

const vapidPub = isSet('VAPID_PUBLIC_KEY');
const vapidPriv = isSet('VAPID_PRIVATE_KEY');
if (vapidPub !== vapidPriv) {
  warnings.push('VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY — set both or neither');
}

console.log(production ? 'Production env validation' : 'Env validation');
console.log('─'.repeat(40));
if (isSet(requiredMongoKey)) {
  console.log(`MongoDB source: ${requiredMongoKey}`);
}

if (errors.length === 0 && warnings.length === 0) {
  console.log('✓ All checks passed.');
  process.exit(0);
}

for (const e of errors) console.error(`✗ ${e}`);
for (const w of warnings) console.warn(`⚠ ${w}`);

process.exit(errors.length > 0 ? 1 : 0);
