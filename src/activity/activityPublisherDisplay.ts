import { resolveActivityPublisherChip, type ActivityDetailDTO } from '@uaetrail/shared-types';
import { activityHostAvatar, activityHostName } from '../utils/hostLabels';

export const activityPublisherFromDetail = (activity: ActivityDetailDTO) =>
  resolveActivityPublisherChip({
    publishingProfileKind: activity.publishingProfileKind,
    tenantName: activity.tenantName,
    tenantLogoUrl: activity.tenantLogoUrl,
    hostName: activityHostName(activity),
    hostAvatar: activityHostAvatar(activity),
  });

export const shouldListActivityGuidesOnDetail = (activity: ActivityDetailDTO): boolean => {
  const count = activity.guides?.length ?? 0;
  if (count === 0) return false;
  if (activityPublisherFromDetail(activity).kind === 'company') return true;
  return count > 1;
};
