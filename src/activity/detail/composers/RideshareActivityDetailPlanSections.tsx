import { ActivityDetailPlanFactsSection } from '../../../components/activity/detail/ActivityDetailPlanFactsSection';
import type { ActivityDetailPlanSectionsProps } from './activityDetailPlanSectionsProps';

/** Rideshare plan column extensions — transport story continues on Transport tab/panels. */
export const RideshareActivityDetailPlanSections = ({ model }: ActivityDetailPlanSectionsProps) => (
  <ActivityDetailPlanFactsSection
    kind="rideshare"
    activity={model.activity}
    panelClassName={model.mobilePlanPanel}
  />
);
