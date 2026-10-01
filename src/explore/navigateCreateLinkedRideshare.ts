import type { ActivityDTO } from '@uaetrail/shared-types';
import type { NavigateFunction } from 'react-router-dom';
import { composeFlowIdFromRoute } from './composeFlowCatalog';
import { buildRideshareDraftFromParentActivity } from './linkRidesharePrefill';
import { explorePath } from './routing';
import { writeOrganizeWizardSession } from './ui/composeWizardSession';

/** Open explore organize rideshare wizard prefilled from a parent outing. */
export const navigateToCreateLinkedRideshare = (
  navigate: NavigateFunction,
  parent: ActivityDTO
): void => {
  const flowId = composeFlowIdFromRoute({ intent: 'organize', kind: 'rideshare' });
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
  navigate(
    explorePath({
      compose: { intent: 'organize', kind: 'rideshare' },
    })
  );
};
