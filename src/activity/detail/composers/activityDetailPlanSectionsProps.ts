import type { useActivityDetailViewModel } from '../../../components/activity/detail/useActivityDetailViewModel';

export type ActivityDetailPlanSectionsModel = ReturnType<typeof useActivityDetailViewModel>;

export type ActivityDetailPlanSectionsProps = {
  model: ActivityDetailPlanSectionsModel;
  consumerInline?: boolean;
};
