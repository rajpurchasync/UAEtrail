import { ActivityDetailPageShell } from './ActivityDetailPageShell';
import type { ActivityDetailTemplateProps } from './activityDetailTemplateProps';

/** Consumer detail template for `activityType: rideshare` (`/activity/:id`). */
export const RideshareActivityDetailPage = (props: ActivityDetailTemplateProps) => (
  <ActivityDetailPageShell {...props} detailKind="rideshare" />
);
