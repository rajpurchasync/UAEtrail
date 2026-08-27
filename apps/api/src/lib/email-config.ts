export type AppRunEnv = 'test' | 'staging' | 'production';

export const NONPROD_EMAIL_FROM = 'UAE Trail <uaetrail@gmail.com>';
export const PROD_EMAIL_FROM_DEFAULT = 'UAE Trail <noreply@uaetrail.com>';
export const GMAIL_USER_DEFAULT = 'uaetrail@gmail.com';

const GMAIL_SMTP_HOST = 'smtp.gmail.com';
const GMAIL_SMTP_PORT = 587;

export type ResolvedEmailConfig = {
  runEnv: AppRunEnv;
  emailFrom: string;
  smtpUrl?: string;
  sendgridApiKey?: string;
  smtpHost?: string;
  smtpPort: number;
  smtpSecure: boolean;
  smtpUser?: string;
  smtpPass?: string;
  configured: boolean;
};

const normalizeRunEnv = (runEnv: string | undefined): AppRunEnv => {
  const normalized = String(runEnv || 'test').trim().toLowerCase();
  if (normalized === 'local' || normalized === 'test') return 'test';
  if (normalized === 'staging') return 'staging';
  return 'production';
};

const envSuffix = (runEnv: AppRunEnv): 'TEST' | 'STAGING' | 'PROD' => {
  if (runEnv === 'production') return 'PROD';
  if (runEnv === 'staging') return 'STAGING';
  return 'TEST';
};

const firstSet = (keys: string[]): string | undefined => {
  for (const key of keys) {
    const value = process.env[key];
    if (typeof value === 'string' && value.trim().length > 0) {
      return value.trim();
    }
  }
  return undefined;
};

export const resolveEmailConfig = (): ResolvedEmailConfig => {
  const runEnv = normalizeRunEnv(process.env.RUN_ENV);
  const suffix = envSuffix(runEnv);
  const isNonProd = runEnv === 'test' || runEnv === 'staging';

  const smtpUrl = firstSet(['SMTP_URL', `SMTP_URL_${suffix}`]);
  const sendgridApiKey = firstSet(['SENDGRID_API_KEY', `SENDGRID_API_KEY_${suffix}`]);

  let smtpHost = firstSet(['SMTP_HOST', `SMTP_HOST_${suffix}`]);
  let smtpPort = Number(firstSet(['SMTP_PORT', `SMTP_PORT_${suffix}`]) ?? GMAIL_SMTP_PORT);
  let smtpSecure = (firstSet(['SMTP_SECURE', `SMTP_SECURE_${suffix}`]) ?? 'false') === 'true';
  let smtpUser = firstSet(['SMTP_USER', `SMTP_USER_${suffix}`]);
  let smtpPass = firstSet(['SMTP_PASS', `SMTP_PASS_${suffix}`]);

  if (!smtpUrl && !smtpHost && !sendgridApiKey && isNonProd) {
    const gmailUser = firstSet(['SMTP_GMAIL_USER', `SMTP_GMAIL_USER_${suffix}`]) ?? GMAIL_USER_DEFAULT;
    const gmailPass = firstSet(['SMTP_GMAIL_APP_PASSWORD', `SMTP_GMAIL_APP_PASSWORD_${suffix}`]);
    if (gmailPass) {
      smtpHost = GMAIL_SMTP_HOST;
      smtpPort = GMAIL_SMTP_PORT;
      smtpSecure = false;
      smtpUser = gmailUser;
      smtpPass = gmailPass.replace(/\s+/g, '');
    }
  }

  const emailFrom =
    firstSet(['EMAIL_FROM', `EMAIL_FROM_${suffix}`]) ??
    (isNonProd ? NONPROD_EMAIL_FROM : PROD_EMAIL_FROM_DEFAULT);

  const configured = Boolean(smtpUrl || sendgridApiKey || smtpHost);

  return {
    runEnv,
    emailFrom,
    smtpUrl,
    sendgridApiKey,
    smtpHost,
    smtpPort,
    smtpSecure,
    smtpUser,
    smtpPass,
    configured
  };
};

export const isEmailConfigured = (): boolean => resolveEmailConfig().configured;
