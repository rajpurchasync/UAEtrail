import { describe, expect, it } from 'vitest';
import { isDiscoverBrowseRoute } from './exploreDiscoverBrowse';
import { exploreDiscoverBrowsePath } from './routing';

describe('discover browse routes', () => {
  it('exploreDiscoverBrowsePath sets browse=1', () => {
    expect(exploreDiscoverBrowsePath()).toBe('/explore?browse=1');
  });

  it('isDiscoverBrowseRoute matches /list and /explore?browse=1', () => {
    expect(isDiscoverBrowseRoute('/list', '')).toBe(true);
    expect(isDiscoverBrowseRoute('/explore', '?browse=1')).toBe(true);
    expect(isDiscoverBrowseRoute('/explore', '?browse=1&list=0')).toBe(true);
    expect(isDiscoverBrowseRoute('/explore', '?list=1')).toBe(false);
    expect(isDiscoverBrowseRoute('/explore', '')).toBe(false);
    expect(isDiscoverBrowseRoute('/trips', '')).toBe(false);
  });
});
