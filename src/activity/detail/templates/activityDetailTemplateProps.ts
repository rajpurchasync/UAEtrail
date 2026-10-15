import type { ActivityDetailViewProps } from '../../../components/activity/ActivityDetailView';
import type { ActivityDetailKind } from '../activityDetailKind';

/** Props for kind-specific activity detail page templates (shared shell). */
export type ActivityDetailTemplateProps = ActivityDetailViewProps & {
  detailKind: ActivityDetailKind;
};
