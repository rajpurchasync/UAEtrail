import { describe, expect, it } from 'vitest';
import { parseShopPublicDetailTabParam } from './shopPublicDetailTab';

describe('parseShopPublicDetailTabParam', () => {
  it('defaults to about', () => {
    expect(parseShopPublicDetailTabParam(null)).toBe('about');
  });

  it('parses location and maps retired products tab to about', () => {
    expect(parseShopPublicDetailTabParam('products')).toBe('about');
    expect(parseShopPublicDetailTabParam('location')).toBe('location');
  });
});
