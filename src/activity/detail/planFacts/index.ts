import type { ComponentType } from 'react';
import type { ActivityDetailDTO } from '@uaetrail/shared-types';
import type { ActivityDetailKind } from '../activityDetailKind';
import { HikingActivityPlanFacts } from './HikingActivityPlanFacts';
import { CampingActivityPlanFacts } from './CampingActivityPlanFacts';
import { EventActivityPlanFacts } from './EventActivityPlanFacts';
import { RideshareActivityPlanFacts } from './RideshareActivityPlanFacts';
import { OtherActivityPlanFacts } from './OtherActivityPlanFacts';

export type ActivityKindPlanFactsProps = {
  activity: ActivityDetailDTO;
  panelClassName: string;
  consumerSection?: boolean;
};

export const ACTIVITY_KIND_PLAN_FACTS: Record<
  ActivityDetailKind,
  ComponentType<ActivityKindPlanFactsProps>
> = {
  hiking: HikingActivityPlanFacts,
  camping: CampingActivityPlanFacts,
  event: EventActivityPlanFacts,
  rideshare: RideshareActivityPlanFacts,
  other: OtherActivityPlanFacts,
};
