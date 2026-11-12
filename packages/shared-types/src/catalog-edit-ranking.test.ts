import { describe, expect, it } from 'vitest';
import {
  computeCatalogEditRanking,
  formatCatalogEditRankingSummary,
} from './catalog-edit-ranking.js';

describe('computeCatalogEditRanking', () => {
  it('starts new with no edits', () => {
    expect(computeCatalogEditRanking(0, 0)).toMatchObject({
      totalEdits: 0,
      successRatePct: 100,
      trustLevel: 'new',
    });
  });

  it('marks high trust for 98% of 2000 edits', () => {
    const ranking = computeCatalogEditRanking(1960, 40);
    expect(ranking.totalEdits).toBe(2000);
    expect(ranking.successRatePct).toBe(98);
    expect(ranking.trustLevel).toBe('high');
    expect(formatCatalogEditRankingSummary(ranking)).toContain('98% success');
    expect(formatCatalogEditRankingSummary(ranking)).toContain('2,000 edits');
  });

  it('requires volume for trusted and high', () => {
    expect(computeCatalogEditRanking(19, 1).trustLevel).toBe('building');
    expect(computeCatalogEditRanking(23, 2).trustLevel).toBe('trusted');
  });
});
