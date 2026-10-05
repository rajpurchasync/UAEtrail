import type { NavigateFunction } from 'react-router-dom';
import type { ActivityType } from '../config/activityTypes';
import type { OrganizeComposeKind } from './compose';
import { exploreOrganizePath } from './routing';

export const activityTypeToOrganizeKind = (type: ActivityType): OrganizeComposeKind => {
  if (type === 'event') return 'event';
  return type;
};

/** Host console / admin — open consumer Organize wizard on `/explore`. */
export const navigateToExploreOrganize = (
  navigate: NavigateFunction,
  kind?: OrganizeComposeKind | null
): void => {
  navigate(kind ? exploreOrganizePath(kind) : exploreOrganizePath());
};
