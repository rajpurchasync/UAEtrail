import type { ActivityDetailKind } from '../activityDetailKind';
import { resolveActivityDetailKind } from '../activityDetailKind';
import type { ActivityDetailViewProps } from '../../../components/activity/ActivityDetailView';
import { HikingActivityDetailPage } from './HikingActivityDetailPage';
import { CampingActivityDetailPage } from './CampingActivityDetailPage';
import { RideshareActivityDetailPage } from './RideshareActivityDetailPage';
import { OtherActivityDetailPage } from './OtherActivityDetailPage';

export type ActivityDetailRouteProps = ActivityDetailViewProps;

const PAGE_BY_KIND: Record<
  ActivityDetailKind,
  (props: ActivityDetailViewProps & { detailKind: ActivityDetailKind }) => JSX.Element
> = {
  hiking: HikingActivityDetailPage,
  camping: CampingActivityDetailPage,
  rideshare: RideshareActivityDetailPage,
  other: OtherActivityDetailPage,
};

/** Route loader picks the consumer page template from `activity.activityType`. */
export const ActivityDetailByKind = (props: ActivityDetailRouteProps) => {
  const kind = resolveActivityDetailKind(props.activity);
  const Page = PAGE_BY_KIND[kind];
  return <Page {...props} detailKind={kind} />;
};
