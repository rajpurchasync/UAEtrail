import { describe, expect, it } from 'vitest';
import { catalogPlaceReviewDraftsForId } from '../src/lib/seed-catalog-place-reviews.js';

describe('catalogPlaceReviewDraftsForId', () => {
  it('always returns three scored reviews with unique reviewers', () => {
    const drafts = catalogPlaceReviewDraftsForId('al-ain-desert-camp');
    expect(drafts).toHaveLength(3);
    expect(new Set(drafts.map((row) => row.userIndex)).size).toBe(3);
    expect(drafts.every((row) => row.rating >= 4 && row.rating <= 5)).toBe(true);
    expect(drafts.every((row) => row.comment.length > 20)).toBe(true);
  });

  it('keeps the featured Shawka and Jais comments', () => {
    const shawka = catalogPlaceReviewDraftsForId('wadi-shawka-loop');
    expect(shawka[0]).toMatchObject({
      userIndex: 0,
      rating: 5,
      comment: expect.stringContaining('Beautiful wadi'),
    });
    const jais = catalogPlaceReviewDraftsForId('jebel-jais-summit-trail');
    expect(jais[0]).toMatchObject({
      userIndex: 2,
      rating: 4,
      comment: expect.stringContaining('Challenging but rewarding'),
    });
  });

  it('uses shop copy for shop targets', () => {
    const shop = catalogPlaceReviewDraftsForId('hatta-wadi-gear-shop', 'shop');
    expect(shop.every((row) => /hydration|staff|camp kit/i.test(row.comment))).toBe(true);
  });
});
