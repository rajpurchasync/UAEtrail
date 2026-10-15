import { RideshareActivityDetailPlanSections } from '../composers/RideshareActivityDetailPlanSections';
import { ActivityDetailPageShell } from './ActivityDetailPageShell';
import type { ActivityDetailViewProps } from '../../../components/activity/ActivityDetailView';

/** Consumer detail template for `activityType: rideshare` (`/activity/:id`). */
export const RideshareActivityDetailPage = (props: ActivityDetailViewProps) => (
  <ActivityDetailPageShell
    {...props}
    detailKind="rideshare"
    planSections={RideshareActivityDetailPlanSections}
  />
);
