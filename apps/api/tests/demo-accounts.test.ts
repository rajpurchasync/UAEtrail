import { describe, expect, it } from 'vitest';
import { resolveDemoAccountPassword } from '../src/lib/demo-accounts.js';

describe('resolveDemoAccountPassword', () => {
  it('uses DEMO_ACCOUNT_PASSWORD when set', () => {
    const prev = process.env.DEMO_ACCOUNT_PASSWORD;
    process.env.DEMO_ACCOUNT_PASSWORD = 'LocalDevOnly!';
    expect(resolveDemoAccountPassword('admin@uaetrails.app')).toBe('LocalDevOnly!');
    if (prev) process.env.DEMO_ACCOUNT_PASSWORD = prev;
    else delete process.env.DEMO_ACCOUNT_PASSWORD;
  });

  it('uses test default in NODE_ENV=test', () => {
    expect(resolveDemoAccountPassword('visitor@uaetrails.app')).toBe('Demo@TestPass1');
  });
});
