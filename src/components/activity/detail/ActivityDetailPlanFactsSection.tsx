import type { ActivityDetailDTO } from '@uaetrail/shared-types';
import type { ActivityDetailKind } from '../../../activity/detail/activityDetailKind';
import { ACTIVITY_KIND_PLAN_FACTS } from '../../../activity/detail/planFacts';

type Props = {
  kind: ActivityDetailKind;
  activity: ActivityDetailDTO;
  panelClassName: string;
  consumerSection?: boolean;
};

/** Kind-specific plan facts grid (W7) — injected on Plan column, not in `ActivityDetailBody` switches. */
export const ActivityDetailPlanFactsSection = ({
  kind,
  activity,
  panelClassName,
  consumerSection = false,
}: Props) => {
  const PlanFacts = ACTIVITY_KIND_PLAN_FACTS[kind];
  return (
    <PlanFacts activity={activity} panelClassName={panelClassName} consumerSection={consumerSection} />
  );
};
