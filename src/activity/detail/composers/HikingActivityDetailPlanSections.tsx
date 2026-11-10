import { ActivityDetailPlanFactsSection } from '../../../components/activity/detail/ActivityDetailPlanFactsSection';
import type { ActivityDetailPlanSectionsProps } from './activityDetailPlanSectionsProps';

/** Hiking plan column extensions (`/activity/:id` consumer template). */
export const HikingActivityDetailPlanSections = ({
  model,
  consumerInline = false,
}: ActivityDetailPlanSectionsProps) => (
  <ActivityDetailPlanFactsSection
    kind="hiking"
    activity={model.activity}
    panelClassName={model.mobilePlanPanel}
    consumerSection={consumerInline}
  />
);
