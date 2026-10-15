import { ActivityDetailView } from '../../../components/activity/ActivityDetailView';
import type { ActivityDetailTemplateProps } from './activityDetailTemplateProps';

/**
 * Consumer **route** shell for `/activity/:id` (hiking / camping / rideshare / other templates).
 *
 * **Not a second implementation:** delegates to `ActivityDetailView`, which owns
 * `MobileDetailShell`, the view model, and tab bodies. Host **preview** and
 * **manage sheet** embed `ActivityDetailView` directly — they skip kind templates.
 *
 * Put kind-specific chrome here later (e.g. marketing fold above tabs, §6.0 peek parity)
 * without forking embedded surfaces.
 */
export const ActivityDetailPageShell = (props: ActivityDetailTemplateProps) => (
  <ActivityDetailView {...props} showConsumerMarketingFold />
);
