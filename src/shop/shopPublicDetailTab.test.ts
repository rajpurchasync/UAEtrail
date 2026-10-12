import { describe, expect, it } from 'vitest';
import { parseShopPublicDetailTabParam } from './shopPublicDetailTab';

describe('parseShopPublicDetailTabParam', () => {
  it('defaults to about', () => {
    expect(parseShopPublicDetailTabParam(null)).toBe('about');
  });

  it('parses products and location', () => {
    expect(parseShopPublicDetailTabParam('products')).toBe('products');
    expect(parseShopPublicDetailTabParam('location')).toBe('location');
  });
});
