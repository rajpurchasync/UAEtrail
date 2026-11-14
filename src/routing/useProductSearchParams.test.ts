import { describe, expect, it } from 'vitest';

describe('useProductSearchParams', () => {
  it('module exports a hook for product-wide query reads', async () => {
    const mod = await import('./useProductSearchParams');
    expect(typeof mod.useProductSearchParams).toBe('function');
  });
});
