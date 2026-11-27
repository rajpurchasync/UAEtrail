import type {
  ActivityDetailDTO,
  ActivityEngagementStripsDTO,
  ActivityViewerAccessDTO,
} from '@uaetrail/shared-types';
import { buildActivityDetailPageShellCard } from '../../../activity/detail/activityDetailPageShellCard';
import type { DiscoveryCardModel } from '../../../discovery/discoveryCardModel';

export const resolveActivityDetailPeekParityCard = (
  activity: ActivityDetailDTO,
  previewMode: boolean,
  publicDetail: boolean,
  viewerAccess: ActivityViewerAccessDTO | null | undefined,
  wireStrips: ActivityEngagementStripsDTO | null | undefined
): DiscoveryCardModel | null => {
  if (!publicDetail || previewMode) return null;
  return buildActivityDetailPageShellCard({
    activity,
    viewerAccess: viewerAccess ?? null,
    wireStrips: wireStrips ?? null,
  });
};