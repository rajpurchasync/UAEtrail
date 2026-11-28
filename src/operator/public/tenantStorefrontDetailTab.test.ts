import { describe, expect, it } from 'vitest';
import { parseTenantStorefrontDetailTabParam } from './tenantStorefrontDetailTab';

describe('tenantStorefrontDetailTab', () => {
  it('defaults to about', () => {
    expect(parseTenantStorefrontDetailTabParam(null)).toBe('about');
    expect(parseTenantStorefrontDetailTabParam('')).toBe('about');
  });

  it('accepts outings and contact', () => {
    expect(parseTenantStorefrontDetailTabParam('outings')).toBe('outings');
    expect(parseTenantStorefrontDetailTabParam('contact')).toBe('contact');
  });
});