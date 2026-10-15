import type { ActivityDetailKind } from '../activityDetailKind';
import type { ActivityDetailTabId } from '../../activityDetailTab';

export type ActivityDetailTemplateAccent = 'emerald' | 'amber' | 'sky' | 'violet';

export type ActivityDetailTemplateConfig = {
  /** Stable template id for tests and docs. */
  pageComponent: string;
  label: string;
  accent: ActivityDetailTemplateAccent;
  /** Default deep-link tab when product wants kind-specific landing (optional). */
  defaultTab: ActivityDetailTabId;
  /** Transport tab is primary story for this kind. */
  transportForward: boolean;
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
    },
    camping: {
      pageComponent: 'CampingActivityDetailPage',
      label: 'Camping outing',
      accent: 'amber',
      defaultTab: 'plan',
      transportForward: false,
    },
    rideshare: {
      pageComponent: 'RideshareActivityDetailPage',
      label: 'Rideshare',
      accent: 'sky',
      defaultTab: 'transport',
      transportForward: true,
    },
    other: {
      pageComponent: 'OtherActivityDetailPage',
      label: 'Group outing',
      accent: 'violet',
      defaultTab: 'plan',
      transportForward: false,
    },
  };
