import { ActivityDetailView } from '../../../components/activity/ActivityDetailView';
import type { ActivityDetailTemplateProps } from './activityDetailTemplateProps';

/**
 * Consumer **kind template** shell for `/activity/:id` (see `ActivityDetailByKind`).
 *
 * Route loader: `src/pages/ActivityDetail.tsx` (data, modals, SEO) — same role as
 * `PlaceDetailPage` + thin `*PlaceDetailPage` kind wrappers.
 *
 * Sets `consumerDetailLayout` on `ActivityDetailView` → `ActivityConsumerDetailPage`.
 * Host **manage sheet** uses `ActivityDetailByKind` + `inlineConsumerDetail` (consumer scroll, hosting section).
 */
export const ActivityDetailPageShell = (props: ActivityDetailTemplateProps) => (
  <ActivityDetailView {...props} consumerDetailLayout />
);
