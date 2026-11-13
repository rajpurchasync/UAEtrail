import { ActivityDetailPlanFactsSection } from '../../../components/activity/detail/ActivityDetailPlanFactsSection';
import type { ActivityDetailPlanSectionsProps } from './activityDetailPlanSectionsProps';

/** Event plan column extensions (`/activity/:id` consumer template). */
export const EventActivityDetailPlanSections = ({
  model,
  consumerInline = false,
}: ActivityDetailPlanSectionsProps) => (
  <ActivityDetailPlanFactsSection
    kind="event"
    activity={model.activity}
    panelClassName={model.mobilePlanPanel}
    consumerSection={consumerInline}
  />
);
