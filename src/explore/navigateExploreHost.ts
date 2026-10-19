import type { NavigateFunction } from 'react-router-dom';
import type { ScheduledActivityType } from '@uaetrail/shared-types';
import type { HostComposeKind } from './compose';
import { exploreHostPath } from './routing';

export const activityTypeToHostComposeKind = (type: ScheduledActivityType): HostComposeKind => {
  if (type === 'event') return 'event';
  if (type === 'rideshare') return 'rideshare';
  return type;
};

/** Publishing workspace / admin — open consumer Host wizard on `/explore`. */
export const navigateToExploreHost = (
  navigate: NavigateFunction,
  kind?: HostComposeKind | null
): void => {
  navigate(kind ? exploreHostPath(kind) : exploreHostPath());
};
