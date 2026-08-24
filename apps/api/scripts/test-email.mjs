import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import nodemailer from 'nodemailer';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(scriptDir, '../../../.env') });
dotenv.config();

const to = process.argv[2] ?? 'rajdhakal31@gmail.com';
const user = process.env.SMTP_GMAIL_USER ?? 'uaetrail@gmail.com';
const pass = process.env.SMTP_GMAIL_APP_PASSWORD;
const from = process.env.EMAIL_FROM ?? `UAE Trail <${user}>`;

if (!pass) {
  console.error('SMTP_GMAIL_APP_PASSWORD is not set in .env');
  process.exit(1);
}

const transport = nodemailer.createTransport({
  service: 'gmail',
  auth: { user, pass: pass.replace(/\s+/g, '') }
});

try {
  const info = await transport.sendMail({
    from,
    to,
    subject: 'UAE Trail — email test',
    text: 'If you received this, Gmail SMTP is working for UAE Trail OTP emails.',
    html: '<p>If you received this, <strong>Gmail SMTP is working</strong> for UAE Trail OTP emails.</p>'
  });
  console.log('SENT', info.messageId);
} catch (error) {
  console.error('FAILED', error instanceof Error ? error.message : error);
  process.exit(1);
}
