import type { ActivityDTO } from '@uaetrail/shared-types';
import type { NavigateFunction } from 'react-router-dom';
import { exploreReorganizeActivityPath } from './routing';
import { resolveOrganizeComposeKindFromActivity } from './ui/organizeFromActivity';

/** Open explore organize wizard prefilled from a prior activity (new id on publish). */
export const navigateToReorganizeActivity = (
  navigate: NavigateFunction,
  activity: ActivityDTO
): void => {
  const kind = resolveOrganizeComposeKindFromActivity(activity);
  navigate(exploreReorganizeActivityPath(activity.id, kind));
};
