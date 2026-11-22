import type { ActivityDetailDTO } from '@uaetrail/shared-types';
import type { ActivityDetailTabId } from '../activityDetailTab';
import { ACTIVITY_DETAIL_TABS } from '../activityDetailTab';
import type { ActivityDetailKind } from './activityDetailKind';
import { resolveActivityDetailKind } from './activityDetailKind';
import {
  ACTIVITY_DETAIL_TEMPLATE_CONFIG,
  activityDetailTabVisibilityForKind,
  type ActivityDetailTemplateConfig,
  type ActivityDetailTemplateTabVisibility,
} from './templates/activityDetailTemplateConfig';

export type ActivityDetailPageModel = {
  kind: ActivityDetailKind;
  template: ActivityDetailTemplateConfig;
  tabVisibility: ActivityDetailTemplateTabVisibility;
};

export const buildActivityDetailPageModel = (
  activity: Pick<ActivityDetailDTO, 'activityType'>,
  options?: { detailKind?: ActivityDetailKind }
): ActivityDetailPageModel => {
  const kind = options?.detailKind ?? resolveActivityDetailKind(activity);
  const template = ACTIVITY_DETAIL_TEMPLATE_CONFIG[kind];
  return {
    kind,
    template,
    tabVisibility: activityDetailTabVisibilityForKind(kind),
  };
};

/** Whether Transport appears in mobile tab chrome (template + linked ride content). */
export const resolveActivityDetailShowTransportTab = (
  activity: Pick<
    ActivityDetailDTO,
    'rideshareEnabled' | 'linkedRideshare' | 'linkedParentActivity'
  >,
  kind: ActivityDetailKind
): boolean => {
  if (ACTIVITY_DETAIL_TEMPLATE_CONFIG[kind].transportForward) return true;
  return Boolean(
    activity.rideshareEnabled ||
      activity.linkedRideshare?.id ||
      activity.linkedParentActivity?.id ||
      activity.linkedRideshare ||
      activity.linkedParentActivity
  );
};

export const resolveVisibleActivityDetailTabs = (
  tabVisibility: ActivityDetailTemplateTabVisibility,
  options: { showTransportTab: boolean }
): ActivityDetailTabId[] =>
  ACTIVITY_DETAIL_TABS.filter((tab) => {
    if (!tabVisibility[tab]) return false;
    if (tab === 'transport' && !options.showTransportTab) return false;
    return true;
  });

/** Deep-link tab query clamped to kind template + transport wire. */
export const resolveActivityDetailMobileTab = (
  activity: ActivityDetailDTO,
  options: {
    tabParam: string | null;
    detailKind?: ActivityDetailKind;
  }
): ActivityDetailTabId => {
  const pageModel = buildActivityDetailPageModel(activity, { detailKind: options.detailKind });
  const showTransportTab = resolveActivityDetailShowTransportTab(activity, pageModel.kind);
  const visible = resolveVisibleActivityDetailTabs(pageModel.tabVisibility, { showTransportTab });
  const requested = options.tabParam
    ? (['plan', 'place', 'crew', 'transport'] as const).includes(
        options.tabParam as ActivityDetailTabId
      )
      ? (options.tabParam as ActivityDetailTabId)
      : 'plan'
    : pageModel.template.defaultTab;
  if (visible.includes(requested)) return requested;
  return visible.includes(pageModel.template.defaultTab)
    ? pageModel.template.defaultTab
    : (visible[0] ?? 'plan');
};
