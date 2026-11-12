import {
  computeCatalogEditRanking,
  type CatalogEditRankingDTO,
} from '@uaetrail/shared-types';
import {
  findAuthUserById,
  incrementCatalogEditOutcome,
} from '../lib/auth-users-store.js';
import { scheduleSideEffect } from '../lib/schedule-side-effect.js';

export const loadCatalogEditRankingForUser = async (
  userId: string
): Promise<CatalogEditRankingDTO> => {
  const user = await findAuthUserById(userId);
  return computeCatalogEditRanking(
    user?.profile?.catalogEditSuccessCount ?? 0,
    user?.profile?.catalogEditFailCount ?? 0
  );
};

export const recordCatalogEditOutcome = (
  userId: string | null | undefined,
  outcome: 'success' | 'fail'
): void => {
  const id = userId?.trim();
  if (!id) return;
  scheduleSideEffect(incrementCatalogEditOutcome(id, outcome), 'catalog.edit_ranking');
};
