import { ActivityDetailPageShell } from './ActivityDetailPageShell';
import type { ActivityDetailTemplateProps } from './activityDetailTemplateProps';

/** Consumer detail template for events and other buddy outings (`/activity/:id`). */
export const OtherActivityDetailPage = (props: ActivityDetailTemplateProps) => (
  <ActivityDetailPageShell {...props} detailKind="other" />
);
