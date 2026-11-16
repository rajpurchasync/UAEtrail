import type { MemberDiscoveryAvailabilityRowDTO } from '@uaetrail/shared-types';
import { exploreAvailabilityMapItemPath } from '@uaetrail/shared-types';

/** Deep link to map list + availability pin peek — no activity detail hop. */
export const exploreMapItemPathFromAvailabilityRow = (
  row: MemberDiscoveryAvailabilityRowDTO
): string => exploreAvailabilityMapItemPath(row.exploreItemId);