import { ActivityDetailView } from '../../../components/activity/ActivityDetailView';
import type { ActivityDetailTemplateProps } from './activityDetailTemplateProps';

/**
 * Consumer **kind template** shell for `/activity/:id` (see `ActivityDetailByKind`).
 *
 * Route loader: `src/pages/ActivityDetail.tsx` (data, modals, SEO) — same role as
 * `PlaceDetailPage` + thin `*PlaceDetailPage` kind wrappers.
 *
 * Public `/activity/:id` is the default of `ActivityDetailView` (`!preview && layout !== embedded`).
 * Host **preview** passes `previewMode`. **Manage sheet** passes `layout="embedded"`.
 */
export const ActivityDetailPageShell = (props: ActivityDetailTemplateProps) => (
  <ActivityDetailView {...props} />
);
