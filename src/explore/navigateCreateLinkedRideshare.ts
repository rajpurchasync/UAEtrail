import type { ActivityDTO } from '@uaetrail/shared-types';
import type { NavigateFunction } from 'react-router-dom';
import { planHostingCompose } from './compose';
import { composeFlowIdFromRoute } from './composeFlowCatalog';
import { buildRideshareDraftFromParentActivity } from './linkRidesharePrefill';
import { explorePath } from './routing';
import { writeOrganizeWizardSession } from './ui/composeWizardSession';

/** Open explore organize rideshare wizard prefilled from a parent outing. */
export const navigateToCreateLinkedRideshare = (
  navigate: NavigateFunction,
  parent: ActivityDTO
): void => {
  const composeRoute = planHostingCompose('rideshare');
  const flowId = composeFlowIdFromRoute(composeRoute);
  if (flowId) {
    const scope = `link:${parent.id}`;
    writeOrganizeWizardSession(
      flowId,
      {
        step: 'title',
        draft: buildRideshareDraftFromParentActivity(parent),
        selectedKind: 'rideshare',
      },
      scope
    );
  }
  navigate(explorePath({ compose: composeRoute }));
};
