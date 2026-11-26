import type { ActivityComposeKind } from '@uaetrail/shared-types';
import { LIST_DISCOVERY_PATH } from '@/config/platform';
import { activityCompose, formatComposeQuery } from '@/discovery/discoverySessionExploreCompose';
import {
  LIST_AVAILABILITY_SLOT_QUERY_KEY,
  LIST_PLAN_WITH_QUERY_KEY,
} from '@/list/browse/listComposeQuery';

const defaultComposeKind = (modalities: string[] | undefined): ActivityComposeKind => {
  const first = modalities?.[0]?.toLowerCase();
  if (first === 'camping') return 'camping';
  if (first === 'rideshare') return 'rideshare';
  return 'hiking';
};

/** Start hosting compose with `planWith` — preserves current list query when provided. */
export const findCrewProposePlanPath = (
  targetUserId: string,
  options?: {
    returnQuery?: string;
    modalities?: string[];
    /** Stable slot id — paired with session snapshot on card click. */
    availabilitySlotId?: string | null;
  }
): string => {
  const params = new URLSearchParams(options?.returnQuery ?? '');
  if (!params.has('listCat')) params.set('listCat', 'people');
  if (!params.has('crewSurface')) params.set('crewSurface', 'find');
  params.set(LIST_PLAN_WITH_QUERY_KEY, targetUserId.trim());
  params.set('compose', formatComposeQuery(activityCompose(defaultComposeKind(options?.modalities))));
  const slotId = options?.availabilitySlotId?.trim();
  if (slotId) params.set(LIST_AVAILABILITY_SLOT_QUERY_KEY, slotId);
  const qs = params.toString();
  return qs ? `${LIST_DISCOVERY_PATH}?${qs}` : LIST_DISCOVERY_PATH;
};