import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import { env } from '../config/env.js';
import { isEmailConfigured, resolveEmailConfig } from './email-config.js';

export type EmailTemplate =
  | 'request_approved'
  | 'request_rejected'
  | 'activity_cancelled'
  | 'email_verification'
  | 'password_reset';

interface EmailPayload {
  to: string;
  subject: string;
  body: string;
  html?: string;
}

export { isEmailConfigured };

const testVerificationOtps = new Map<string, string>();

/** Test-only: read the last verification OTP captured for an email address. */
export const peekTestVerificationOtp = (email: string): string | undefined =>
  process.env.NODE_ENV === 'test' ? testVerificationOtps.get(email.trim().toLowerCase()) : undefined;

export const clearTestVerificationOtps = (): void => {
  testVerificationOtps.clear();
};

const createTransport = (): Transporter | null => {
  const config = resolveEmailConfig();

  if (config.smtpUrl) {
    return nodemailer.createTransport(config.smtpUrl);
  }
  if (config.sendgridApiKey) {
    return nodemailer.createTransport({
      host: 'smtp.sendgrid.net',
      port: 587,
      auth: {
        user: 'apikey',
        pass: config.sendgridApiKey
      }
    });
  }
  if (config.smtpHost) {
    if (config.smtpHost === 'smtp.gmail.com' && config.smtpUser && config.smtpPass) {
      return nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: config.smtpUser,
          pass: config.smtpPass
        }
      });
    }

    return nodemailer.createTransport({
      host: config.smtpHost,
      port: config.smtpPort,
      secure: config.smtpSecure,
      auth:
        config.smtpUser && config.smtpPass
          ? { user: config.smtpUser, pass: config.smtpPass }
          : undefined
    });
  }
  return null;
};

export const sendRawEmail = async (payload: EmailPayload): Promise<boolean> => {
  const transport = createTransport();
  const { emailFrom } = resolveEmailConfig();

  if (!transport) {
    if (env.NODE_ENV !== 'production') {
      console.info('[email:dev]', { from: emailFrom, ...payload });
    }
    return false;
  }

  await transport.sendMail({
    from: emailFrom,
    to: payload.to,
    subject: payload.subject,
    text: payload.body,
    html: payload.html ?? payload.body.replace(/\n/g, '<br/>')
  });
  return true;
};

const templateSubjects: Record<EmailTemplate, string> = {
  request_approved: 'Your trip request was approved',
  request_rejected: 'Update on your trip request',
  activity_cancelled: 'A trip you joined was cancelled',
  email_verification: 'Verify your UAE Trail account',
  password_reset: 'Reset your UAE Trail password'
};

export const sendTransactionalEmail = async (
  template: EmailTemplate,
  to: string,
  vars: Record<string, string>
): Promise<void> => {
  const subject = templateSubjects[template];
  const body = Object.entries(vars).reduce(
    (text, [key, val]) => text.replace(new RegExp(`{{${key}}}`, 'g'), val),
    getTemplateBody(template)
  );
  await sendRawEmail({ to, subject, body });
};

function getTemplateBody(template: EmailTemplate): string {
  switch (template) {
    case 'request_approved':
      return 'Hi {{name}}, your request to join {{activityTitle}} on {{activityDate}} was approved. See you on the trail!';
    case 'request_rejected':
      return 'Hi {{name}}, your request to join {{activityTitle}} was not approved. {{note}}';
    case 'activity_cancelled':
      return 'Hi {{name}}, {{activityTitle}} on {{activityDate}} has been cancelled by the organizer.';
    case 'email_verification':
      return 'Hi {{name}}, your UAE Trail verification code is:\n\n{{otp}}\n\nThis code expires in 60 seconds. If it expires, request a new code from the app.';
    case 'password_reset':
      return 'Hi {{name}}, reset your password using this link:\n\n{{resetUrl}}\n\nThis link expires in 1 hour. If you did not request this, ignore this email.';
    default:
      return '';
  }
}

export const sendVerificationEmail = async (opts: {
  to: string;
  name: string;
  otp: string;
}): Promise<boolean> => {
  if (process.env.NODE_ENV === 'test') {
    testVerificationOtps.set(opts.to.trim().toLowerCase(), opts.otp);
    return true;
  }

  const subject = templateSubjects.email_verification;
  const body = getTemplateBody('email_verification')
    .replace(/{{name}}/g, opts.name)
    .replace(/{{otp}}/g, opts.otp);

  return sendRawEmail({ to: opts.to, subject, body });
};

export const sendPasswordResetEmail = async (opts: {
  to: string;
  name: string;
  token: string;
}): Promise<void> => {
  const resetUrl = `${env.APP_BASE_URL}/verify?token=${encodeURIComponent(opts.token)}&email=${encodeURIComponent(opts.to)}&mode=password-reset`;
  await sendTransactionalEmail('password_reset', opts.to, {
    name: opts.name,
    resetUrl
  });
};

export const notifyRequestDecision = async (opts: {
  to: string;
  userName: string;
  activityTitle: string;
  activityDate: string;
  approved: boolean;
  note?: string;
}) => {
  await sendTransactionalEmail(
    opts.approved ? 'request_approved' : 'request_rejected',
    opts.to,
    {
      name: opts.userName,
      activityTitle: opts.activityTitle,
      activityDate: opts.activityDate,
      note: opts.note ?? ''
    }
  );
};

export const notifyActivityCancelled = async (opts: {
  to: string;
  userName: string;
  activityTitle: string;
  activityDate: string;
}) => {
  await sendTransactionalEmail('activity_cancelled', opts.to, {
    name: opts.userName,
    activityTitle: opts.activityTitle,
    activityDate: opts.activityDate
  });
};
