const GMAIL_SMTP_HOST = 'smtp.gmail.com';
const GMAIL_SMTP_PORT = '587';
export const NONPROD_EMAIL_FROM = 'UAE Trail <uaetrail@gmail.com>';
export const PROD_EMAIL_FROM_DEFAULT = 'UAE Trail <noreply@uaetrail.ae>';
export const GMAIL_USER_DEFAULT = 'uaetrail@gmail.com';

const normalizeRunEnv = (runEnv) => {
  const normalized = String(runEnv || 'test').trim().toLowerCase();
  if (normalized === 'local') return 'test';
  if (normalized === 'prod') return 'production';
  return normalized;
};

const envSuffix = (runEnv) => {
  if (runEnv === 'production') return 'PROD';
  if (runEnv === 'staging') return 'STAGING';
  return 'TEST';
};

const firstSet = (getEnv, keys) => {
  for (const key of keys) {
    const value = getEnv(key);
    if (typeof value === 'string' && value.trim().length > 0) {
      return value.trim();
    }
  }
  return '';
};

/**
 * Resolve SMTP + sender settings for the active RUN_ENV.
 * Test and staging default to uaetrail@gmail.com when SMTP_GMAIL_APP_PASSWORD is set.
 */
export const resolveEmailEnv = ({ getEnv, runEnv }) => {
  const normalizedRunEnv = normalizeRunEnv(runEnv);
  const suffix = envSuffix(normalizedRunEnv);
  const isNonProd = normalizedRunEnv === 'test' || normalizedRunEnv === 'staging';

  let smtpUrl = firstSet(getEnv, ['SMTP_URL', `SMTP_URL_${suffix}`]);
  const sendgridApiKey = firstSet(getEnv, ['SENDGRID_API_KEY', `SENDGRID_API_KEY_${suffix}`]);

  let smtpHost = firstSet(getEnv, ['SMTP_HOST', `SMTP_HOST_${suffix}`]);
  let smtpPort = firstSet(getEnv, ['SMTP_PORT', `SMTP_PORT_${suffix}`]) || '587';
  let smtpSecure = firstSet(getEnv, ['SMTP_SECURE', `SMTP_SECURE_${suffix}`]);
  let smtpUser = firstSet(getEnv, ['SMTP_USER', `SMTP_USER_${suffix}`]);
  let smtpPass = firstSet(getEnv, ['SMTP_PASS', `SMTP_PASS_${suffix}`]);

  if (!smtpUrl && !smtpHost && !sendgridApiKey && isNonProd) {
    const gmailUser = firstSet(getEnv, ['SMTP_GMAIL_USER', `SMTP_GMAIL_USER_${suffix}`]) || GMAIL_USER_DEFAULT;
    const gmailPass = firstSet(getEnv, ['SMTP_GMAIL_APP_PASSWORD', `SMTP_GMAIL_APP_PASSWORD_${suffix}`]);
    if (gmailPass) {
      smtpHost = GMAIL_SMTP_HOST;
      smtpPort = GMAIL_SMTP_PORT;
      smtpSecure = 'false';
      smtpUser = gmailUser;
      smtpPass = gmailPass;
    }
  }

  const emailFrom =
    firstSet(getEnv, ['EMAIL_FROM', `EMAIL_FROM_${suffix}`]) ||
    (isNonProd ? NONPROD_EMAIL_FROM : PROD_EMAIL_FROM_DEFAULT);

  const emailConfigured = Boolean(smtpUrl || sendgridApiKey || smtpHost);

  return {
    RUN_ENV: normalizedRunEnv,
    EMAIL_FROM: emailFrom,
    SMTP_URL: smtpUrl,
    SENDGRID_API_KEY: sendgridApiKey,
    SMTP_HOST: smtpHost,
    SMTP_PORT: smtpPort,
    SMTP_SECURE: smtpSecure,
    SMTP_USER: smtpUser,
    SMTP_PASS: smtpPass,
    EMAIL_CONFIGURED: emailConfigured
  };
};

export const isEmailConfiguredFromEnv = (getEnv, runEnv) =>
  resolveEmailEnv({ getEnv, runEnv }).EMAIL_CONFIGURED;
