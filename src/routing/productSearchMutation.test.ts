import { describe, expect, it, vi } from 'vitest';
import { applyProductSearchMutation } from './productSearchMutation';

describe('applyProductSearchMutation', () => {
  it('writes through setSearchParams', () => {
    const setSearchParams = vi.fn((updater: (prev: URLSearchParams) => URLSearchParams) => {
      updater(new URLSearchParams('a=1'));
    });
    const navigate = vi.fn();
    applyProductSearchMutation(
      { pathname: '/explore', navigate, setSearchParams },
      (params) => {
        params.set('compose', 'host');
      }
    );
    expect(setSearchParams).toHaveBeenCalledTimes(1);
  });
});
