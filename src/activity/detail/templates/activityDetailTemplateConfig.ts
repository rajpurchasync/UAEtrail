import type { ActivityDetailKind } from '../activityDetailKind';
import type { ActivityDetailTabId } from '../../activityDetailTab';

export type ActivityDetailTemplateAccent = 'emerald' | 'amber' | 'sky' | 'violet';

export type ActivityDetailTemplateTabVisibility = Record<ActivityDetailTabId, boolean>;

export type ActivityDetailTemplateConfig = {
  /** Stable template id for tests and docs. */
  pageComponent: string;
  label: string;
  accent: ActivityDetailTemplateAccent;
  /** Default deep-link tab when product wants kind-specific landing (optional). */
  defaultTab: ActivityDetailTabId;
  /** Transport tab is primary story for this kind. */
  transportForward: boolean;
  /** Per-kind tab chrome — rideshare drops Place (venue hike stats are N/A). */
  tabVisibility: ActivityDetailTemplateTabVisibility;
};

const ALL_TABS: ActivityDetailTemplateTabVisibility = {
  plan: true,
  place: true,
  buddies: true,
  transport: true,
};

const RIDESHARE_TABS: ActivityDetailTemplateTabVisibility = {
  plan: true,
  place: false,
  buddies: true,
  transport: true,
};

/** Per-kind consumer detail page templates (`/activity/:id`). */
export const ACTIVITY_DETAIL_TEMPLATE_CONFIG: Record<ActivityDetailKind, ActivityDetailTemplateConfig> =
  {
    hiking: {
      pageComponent: 'HikingActivityDetailPage',
      label: 'Hiking outing',
      accent: 'emerald',
      defaultTab: 'plan',
      transportForward: false,
      tabVisibility: ALL_TABS,
    },
    camping: {
      pageComponent: 'CampingActivityDetailPage',
      label: 'Camping outing',
      accent: 'amber',
      defaultTab: 'plan',
      transportForward: false,
      tabVisibility: ALL_TABS,
    },
    rideshare: {
      pageComponent: 'RideshareActivityDetailPage',
      label: 'Rideshare',
      accent: 'sky',
      defaultTab: 'transport',
      transportForward: true,
      tabVisibility: RIDESHARE_TABS,
    },
    other: {
      pageComponent: 'OtherActivityDetailPage',
      label: 'Group outing',
      accent: 'violet',
      defaultTab: 'plan',
      transportForward: false,
      tabVisibility: ALL_TABS,
    },
  };

export const activityDetailTabVisibilityForKind = (
  kind: ActivityDetailKind
): ActivityDetailTemplateTabVisibility => ACTIVITY_DETAIL_TEMPLATE_CONFIG[kind].tabVisibility;
