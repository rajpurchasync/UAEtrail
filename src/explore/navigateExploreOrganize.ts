import type { NavigateFunction } from 'react-router-dom';
import type { ScheduledActivityType } from '@uaetrail/shared-types';
import type { OrganizeComposeKind } from './compose';
import { exploreOrganizePath } from './routing';

export const activityTypeToOrganizeKind = (type: ScheduledActivityType): OrganizeComposeKind => {
  if (type === 'event') return 'event';
  if (type === 'rideshare') return 'rideshare';
  return type;
};

/** Host console / admin — open consumer Organize wizard on `/explore`. */
export const navigateToExploreOrganize = (
  navigate: NavigateFunction,
  kind?: OrganizeComposeKind | null
): void => {
  navigate(kind ? exploreOrganizePath(kind) : exploreOrganizePath());
};
