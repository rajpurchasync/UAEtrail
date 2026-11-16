import type { ActivityDTO } from '@uaetrail/shared-types';
import type { NavigateFunction } from 'react-router-dom';
import { launchHostWizard } from '../create/launchHostWizard';
import { hostCompose } from './compose';
import { composeFlowIdFromRoute } from './composeFlowCatalog';
import { buildRideshareDraftFromParentActivity } from './linkRidesharePrefill';

/** Parent activity → host rideshare wizard (session prefill + compose on current surface). */
export const navigateCreateLinkedRideshare = (
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
        }
      : undefined,
  });
};