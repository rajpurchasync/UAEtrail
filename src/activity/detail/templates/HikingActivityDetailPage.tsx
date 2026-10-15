import { ActivityDetailPageShell } from './ActivityDetailPageShell';
import type { ActivityDetailTemplateProps } from './activityDetailTemplateProps';

/** Consumer detail template for `activityType: hiking` (`/activity/:id`). */
export const HikingActivityDetailPage = (props: ActivityDetailTemplateProps) => (
  <ActivityDetailPageShell {...props} detailKind="hiking" />
);
