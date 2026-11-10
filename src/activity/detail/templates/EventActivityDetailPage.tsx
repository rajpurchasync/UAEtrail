import { EventActivityDetailPlanSections } from '../composers/EventActivityDetailPlanSections';
import { ActivityDetailPageShell } from './ActivityDetailPageShell';
import type { ActivityDetailViewProps } from '../../../components/activity/ActivityDetailView';

/** Consumer detail template for `activityType: event` (`/activity/:id`). */
export const EventActivityDetailPage = (props: ActivityDetailViewProps) => (
  <ActivityDetailPageShell
    {...props}
    detailKind="event"
    planSections={EventActivityDetailPlanSections}
  />
);
