import { HikingActivityDetailPlanSections } from '../composers/HikingActivityDetailPlanSections';
import { ActivityDetailPageShell } from './ActivityDetailPageShell';
import type { ActivityDetailViewProps } from '../../../components/activity/ActivityDetailView';

/** Consumer detail template for `activityType: hiking` (`/activity/:id`). */
export const HikingActivityDetailPage = (props: ActivityDetailViewProps) => (
  <ActivityDetailPageShell
    {...props}
    detailKind="hiking"
    planSections={HikingActivityDetailPlanSections}
  />
);
