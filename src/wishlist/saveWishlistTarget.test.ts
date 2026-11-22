import { describe, expect, it, vi, beforeEach } from 'vitest';
import { saveWishlistTarget, wishlistSaveInputToTarget } from './saveWishlistTarget';

vi.mock('../hooks/wishlistClientApi', () => ({
  addWishlistTarget: vi.fn(async (target: unknown) => ({
    id: 'wl-1',
    ...(typeof target === 'object' && target !== null ? target : {}),
  })),
}));

describe('saveWishlistTarget', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('maps venue saves to locationId POST payload', () => {
    expect(wishlistSaveInputToTarget({ kind: 'venue', locationId: 'place-1', alertOnMatch: true })).toEqual({
      locationId: 'place-1',
      alertOnMatch: true,
    });
  });

  it('delegates to addWishlistTarget', async () => {
    const { addWishlistTarget } = await import('../hooks/wishlistClientApi');
    await saveWishlistTarget({ kind: 'activity', activityId: 'act-9' });
    expect(addWishlistTarget).toHaveBeenCalledWith({ activityId: 'act-9' });
  });
});