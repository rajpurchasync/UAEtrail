import type { ActivityDTO } from '@uaetrail/shared-types';
import type { NavigateFunction } from 'react-router-dom';
import { hostCompose } from '../explore/compose';
import { composeFlowIdFromRoute } from '../explore/composeFlowCatalog';
import { buildRideshareDraftFromParentActivity } from '../explore/linkRidesharePrefill';
import { launchHostWizard } from './launchHostWizard';

/**
 * Compose entry — child rideshare wizard prefilled from a hosted parent activity.
 * Post-publish `linkedActivityId` is set in the hosting wizard, not here.
 */
export const launchLinkedRideshareFromParentActivity = (
  navigate: NavigateFunction,
  parent: ActivityDTO,
  location?: { pathname: string; search: string }
): void => {
  const composeRoute = hostCompose('rideshare');
  const flowId = composeFlowIdFromRoute(composeRoute);
  launchHostWizard({
    navigate,
    route: composeRoute,
    pathname: location?.pathname,
    search: location?.search,
    sessionScope: `link:${parent.id}`,
    session:
      flowId ?
        {
          step: 'title',
          draft: buildRideshareDraftFromParentActivity(parent),
          selectedKind: 'rideshare',
          linkToParentActivityId: parent.id,
        }
      : undefined,
  });
};