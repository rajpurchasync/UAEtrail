import type { ComponentType } from 'react';
import type { ActivityDetailKind } from '../activityDetailKind';
import { CampingActivityDetailPlanSections } from './CampingActivityDetailPlanSections';
import { HikingActivityDetailPlanSections } from './HikingActivityDetailPlanSections';
import { OtherActivityDetailPlanSections } from './OtherActivityDetailPlanSections';
import { RideshareActivityDetailPlanSections } from './RideshareActivityDetailPlanSections';
import type { ActivityDetailPlanSectionsProps } from './activityDetailPlanSectionsProps';

export type ActivityDetailPlanSectionsComponent = ComponentType<ActivityDetailPlanSectionsProps>;

export const ACTIVITY_DETAIL_KIND_PLAN_SECTIONS: Record<
  ActivityDetailKind,
  ActivityDetailPlanSectionsComponent
> = {
  hiking: HikingActivityDetailPlanSections,
  camping: CampingActivityDetailPlanSections,
  rideshare: RideshareActivityDetailPlanSections,
  other: OtherActivityDetailPlanSections,
};

export const activityDetailPlanSectionsForKind = (
  kind: ActivityDetailKind
): ActivityDetailPlanSectionsComponent => ACTIVITY_DETAIL_KIND_PLAN_SECTIONS[kind];
