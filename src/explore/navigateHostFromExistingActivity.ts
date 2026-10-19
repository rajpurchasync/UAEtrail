import type { ActivityDTO } from '@uaetrail/shared-types';
import type { NavigateFunction } from 'react-router-dom';
import { exploreHostFromActivityPath } from './routing';
import { resolveHostComposeKindFromActivity } from './ui/hostingFromActivity';

/** Open explore Host wizard prefilled from a prior activity (new id on publish). */
export const navigateToHostFromExistingActivity = (
  navigate: NavigateFunction,
  activity: ActivityDTO
): void => {
  const kind = resolveHostComposeKindFromActivity(activity);
  navigate(exploreHostFromActivityPath(activity.id, kind));
};
