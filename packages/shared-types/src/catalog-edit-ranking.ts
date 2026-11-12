/** Catalog contributor ranking from approved vs rejected map submissions/edits. */
export type CatalogEditTrustLevel = 'new' | 'building' | 'trusted' | 'high';

export type CatalogEditRankingDTO = {
  successCount: number;
  failCount: number;
  totalEdits: number;
  /** 0–100, integer percent of successful edits. */
  successRatePct: number;
  trustLevel: CatalogEditTrustLevel;
};

export const CATALOG_EDIT_TRUST_LABELS: Record<CatalogEditTrustLevel, string> = {
  new: 'New',
  building: 'Building',
  trusted: 'Trusted',
  high: 'High',
};

/**
 * Trust rises with both volume and success rate.
 * Example: 1,960 successes / 2,000 edits → 98% → high.
 */
export const computeCatalogEditRanking = (
  successCount: number,
  failCount: number
): CatalogEditRankingDTO => {
  const success = Math.max(0, Math.floor(successCount));
  const fail = Math.max(0, Math.floor(failCount));
  const totalEdits = success + fail;
  const successRatePct = totalEdits === 0 ? 100 : Math.round((success / totalEdits) * 100);

  let trustLevel: CatalogEditTrustLevel = 'new';
  if (totalEdits >= 100 && successRatePct >= 95) {
    trustLevel = 'high';
  } else if (totalEdits >= 25 && successRatePct >= 90) {
    trustLevel = 'trusted';
  } else if (totalEdits >= 3 && successRatePct >= 70) {
    trustLevel = 'building';
  } else if (totalEdits >= 3) {
    trustLevel = 'building';
  }

  return {
    successCount: success,
    failCount: fail,
    totalEdits,
    successRatePct,
    trustLevel,
  };
};

export const formatCatalogEditRankingSummary = (ranking: CatalogEditRankingDTO): string => {
  if (ranking.totalEdits === 0) {
    return 'No catalog edits yet · Trust: New';
  }
  return `${ranking.successRatePct}% success · ${ranking.totalEdits.toLocaleString()} edits · Trust: ${CATALOG_EDIT_TRUST_LABELS[ranking.trustLevel]}`;
};
