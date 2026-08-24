import { afterEach, describe, expect, it } from 'vitest';
import {
  GMAIL_USER_DEFAULT,
  NONPROD_EMAIL_FROM,
  resolveEmailConfig
} from '../src/lib/email-config.js';

const withEnv = (values: Record<string, string | undefined>, fn: () => void) => {
  const touched = new Set<string>();
  const previous: Record<string, string | undefined> = {};

  Object.entries(values).forEach(([key, value]) => {
    touched.add(key);
    previous[key] = process.env[key];
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  });

  try {
    fn();
  } finally {
    for (const key of touched) {
      if (previous[key] === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = previous[key];
      }
    }
  }
};

describe('resolveEmailConfig', () => {
  afterEach(() => {
    delete process.env.RUN_ENV;
    delete process.env.SMTP_URL;
    delete process.env.SMTP_HOST;
    delete process.env.SMTP_GMAIL_APP_PASSWORD;
    delete process.env.EMAIL_FROM;
  });

  it('defaults test sender to uaetrail@gmail.com', () => {
    withEnv({ RUN_ENV: 'test' }, () => {
      const config = resolveEmailConfig();
      expect(config.emailFrom).toBe(NONPROD_EMAIL_FROM);
      expect(config.runEnv).toBe('test');
    });
  });

  it('configures Gmail SMTP for staging when app password is set', () => {
    withEnv(
      {
        RUN_ENV: 'staging',
        SMTP_GMAIL_APP_PASSWORD: 'app-password',
        SMTP_GMAIL_USER: GMAIL_USER_DEFAULT
      },
      () => {
        const config = resolveEmailConfig();
        expect(config.configured).toBe(true);
        expect(config.smtpHost).toBe('smtp.gmail.com');
        expect(config.smtpUser).toBe(GMAIL_USER_DEFAULT);
        expect(config.emailFrom).toBe(NONPROD_EMAIL_FROM);
      }
    );
  });

  it('prefers explicit SMTP_URL override', () => {
    withEnv(
      {
        RUN_ENV: 'test',
        SMTP_URL: 'smtp://custom@example.com:secret@smtp.example.com:587',
        SMTP_GMAIL_APP_PASSWORD: 'ignored'
      },
      () => {
        const config = resolveEmailConfig();
        expect(config.smtpUrl).toContain('smtp.example.com');
        expect(config.smtpHost).toBeUndefined();
      }
    );
  });
});
