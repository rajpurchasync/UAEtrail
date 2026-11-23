import type { DiscoverCrewRecommendationRowDTO } from '@uaetrail/shared-types';
import type { BuildRecommendedCrewFeedInput } from '@uaetrail/shared-types';
import { buildRecommendedCrewFeed } from './buildRecommendedCrewFeed';
import type { MemberBrowseRowVm } from './memberBrowseRowModel';

/** Map server-ranked crew ids onto loaded browse payloads (client fallback when empty). */
export const resolveRecommendedCrewFeedRows = (
  serverRows: DiscoverCrewRecommendationRowDTO[] | undefined,
  input: BuildRecommendedCrewFeedInput
): MemberBrowseRowVm[] => {
  const clientRows = buildRecommendedCrewFeed(input);
  if (!serverRows?.length) return clientRows;

  const byUserId = new Map(clientRows.map((row) => [row.userId, row]));
  const resolved: MemberBrowseRowVm[] = [];
  const seen = new Set<string>();

  for (const ref of serverRows) {
    if (seen.has(ref.userId)) continue;
    const row = byUserId.get(ref.userId);
    if (!row) continue;
    seen.add(ref.userId);
    resolved.push({ ...row, recommendationBucket: ref.bucket });
  }

  if (resolved.length === 0) return clientRows;
  return resolved;
};