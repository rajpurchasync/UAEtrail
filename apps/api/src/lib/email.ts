import nodemailer from 'nodemailer';
import { env } from '../config/env.js';

export type EmailTemplate =
  | 'request_approved'
  | 'request_rejected'
  | 'event_cancelled'
  | 'email_verification'
  | 'password_reset';

interface EmailPayload {
  to: string;
  subject: string;
  body: string;
  html?: string;
}

export const isEmailConfigured = (): boolean =>
  Boolean(process.env.SMTP_URL || process.env.SENDGRID_API_KEY || process.env.SMTP_HOST);

const createTransport = () => {
  if (process.env.SMTP_URL) {
    return nodemailer.createTransport(process.env.SMTP_URL);
  }
  if (process.env.SENDGRID_API_KEY) {
    return nodemailer.createTransport({
      host: 'smtp.sendgrid.net',
      port: 587,
      auth: {
        user: 'apikey',
        pass: process.env.SENDGRID_API_KEY
      }
    });
  }
  if (process.env.SMTP_HOST) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT ?? 587),
      secure: process.env.SMTP_SECURE === 'true',
      auth:
        process.env.SMTP_USER && process.env.SMTP_PASS
          ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
          : undefined
    });
  }
  return null;
};

export const sendRawEmail = async (payload: EmailPayload): Promise<boolean> => {
  const transport = createTransport();
  if (!transport) {
    if (env.NODE_ENV !== 'production') {
      console.info('[email:dev]', payload);
    }
    return false;
  }

  await transport.sendMail({
    from: process.env.EMAIL_FROM ?? 'UAE Trail <noreply@uaetrail.ae>',
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
  event_cancelled: 'A trip you joined was cancelled',
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
      return 'Hi {{name}}, your request to join {{eventTitle}} on {{eventDate}} was approved. See you on the trail!';
    case 'request_rejected':
      return 'Hi {{name}}, your request to join {{eventTitle}} was not approved. {{note}}';
    case 'event_cancelled':
      return 'Hi {{name}}, {{eventTitle}} on {{eventDate}} has been cancelled by the organizer.';
    case 'email_verification':
      return 'Hi {{name}}, verify your email to start joining trips on UAE Trail:\n\n{{verifyUrl}}\n\nThis link expires in 24 hours.';
    case 'password_reset':
      return 'Hi {{name}}, reset your password using this link:\n\n{{resetUrl}}\n\nThis link expires in 1 hour. If you did not request this, ignore this email.';
    default:
      return '';
  }
}

export const sendVerificationEmail = async (opts: {
  to: string;
  name: string;
  token: string;
}): Promise<void> => {
  const verifyUrl = `${env.APP_BASE_URL}/verify?token=${encodeURIComponent(opts.token)}&email=${encodeURIComponent(opts.to)}`;
  await sendTransactionalEmail('email_verification', opts.to, {
    name: opts.name,
    verifyUrl
  });
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
  eventTitle: string;
  eventDate: string;
  approved: boolean;
  note?: string;
}) => {
  await sendTransactionalEmail(
    opts.approved ? 'request_approved' : 'request_rejected',
    opts.to,
    {
      name: opts.userName,
      eventTitle: opts.eventTitle,
      eventDate: opts.eventDate,
      note: opts.note ?? ''
    }
  );
};

export const notifyEventCancelled = async (opts: {
  to: string;
  userName: string;
  eventTitle: string;
  eventDate: string;
}) => {
  await sendTransactionalEmail('event_cancelled', opts.to, {
    name: opts.userName,
    eventTitle: opts.eventTitle,
    eventDate: opts.eventDate
  });
};
