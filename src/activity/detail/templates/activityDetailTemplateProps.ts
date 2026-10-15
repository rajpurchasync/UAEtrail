import type { ActivityDetailViewProps } from '../../../components/activity/ActivityDetailView';
import type { ActivityDetailKind } from '../activityDetailKind';
import type { ActivityDetailPlanSectionsComponent } from '../composers';

/** Props for kind-specific activity detail page templates (shared shell). */
export type ActivityDetailTemplateProps = ActivityDetailViewProps & {
  detailKind: ActivityDetailKind;
  /** Kind-owned plan column slot (place-pattern composer). */
  planSections: ActivityDetailPlanSectionsComponent;
};
