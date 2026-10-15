import { CampingActivityDetailPlanSections } from '../composers/CampingActivityDetailPlanSections';
import { ActivityDetailPageShell } from './ActivityDetailPageShell';
import type { ActivityDetailViewProps } from '../../../components/activity/ActivityDetailView';

/** Consumer detail template for `activityType: camping` (`/activity/:id`). */
export const CampingActivityDetailPage = (props: ActivityDetailViewProps) => (
  <ActivityDetailPageShell
    {...props}
    detailKind="camping"
    planSections={CampingActivityDetailPlanSections}
  />
);
