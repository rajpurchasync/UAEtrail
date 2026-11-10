import { ActivityDetailPlanFactsSection } from '../../../components/activity/detail/ActivityDetailPlanFactsSection';
import type { ActivityDetailPlanSectionsProps } from './activityDetailPlanSectionsProps';

/** Event / other plan column extensions (`/activity/:id` consumer template). */
export const OtherActivityDetailPlanSections = ({
  model,
  consumerInline = false,
}: ActivityDetailPlanSectionsProps) => (
  <ActivityDetailPlanFactsSection
    kind="other"
    activity={model.activity}
    panelClassName={model.mobilePlanPanel}
    consumerSection={consumerInline}
  />
);
