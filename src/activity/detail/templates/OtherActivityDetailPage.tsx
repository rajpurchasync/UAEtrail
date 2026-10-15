import { OtherActivityDetailPlanSections } from '../composers/OtherActivityDetailPlanSections';
import { ActivityDetailPageShell } from './ActivityDetailPageShell';
import type { ActivityDetailViewProps } from '../../../components/activity/ActivityDetailView';

/** Consumer detail template for events and other buddy outings (`/activity/:id`). */
export const OtherActivityDetailPage = (props: ActivityDetailViewProps) => (
  <ActivityDetailPageShell
    {...props}
    detailKind="other"
    planSections={OtherActivityDetailPlanSections}
  />
);
