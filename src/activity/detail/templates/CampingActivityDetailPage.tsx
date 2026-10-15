import { ActivityDetailPageShell } from './ActivityDetailPageShell';
import type { ActivityDetailTemplateProps } from './activityDetailTemplateProps';

/** Consumer detail template for `activityType: camping` (`/activity/:id`). */
export const CampingActivityDetailPage = (props: ActivityDetailTemplateProps) => (
  <ActivityDetailPageShell {...props} detailKind="camping" />
);
