import { ActivityDetailPlanFactsSection } from '../../../components/activity/detail/ActivityDetailPlanFactsSection';
import type { ActivityDetailPlanSectionsProps } from './activityDetailPlanSectionsProps';

/** Camping plan column extensions (`/activity/:id` consumer template). */
export const CampingActivityDetailPlanSections = ({ model }: ActivityDetailPlanSectionsProps) => (
  <ActivityDetailPlanFactsSection
    kind="camping"
    activity={model.activity}
    panelClassName={model.mobilePlanPanel}
  />
);
