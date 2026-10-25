import { describe, expect, it } from 'vitest';
import { summarizeReviewRatings } from './useTenantReviewsQuery';

describe('summarizeReviewRatings', () => {
  it('returns average and count when reviews exist', () => {
    const summary = summarizeReviewRatings(
      [
        { id: '1', rating: 5, comment: 'great', userId: 'u1', targetType: 'tenant', targetId: 't1', createdAt: '' },
        { id: '2', rating: 4, comment: 'good', userId: 'u2', targetType: 'tenant', targetId: 't1', createdAt: '' },
      ],
      2
    );
    expect(summary).toEqual({ averageRating: 4.5, reviewCount: 2 });
  });
});
