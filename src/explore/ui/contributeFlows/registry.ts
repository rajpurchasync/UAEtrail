import type { ContributeVenueKind } from '../../contributeTypes';
import type { ContributeFlowStepId } from '../contributeFlow';
import { CAMPING_CONTRIBUTE_STEPS } from './camping';
import { HIKING_CONTRIBUTE_STEPS } from './hiking';
import { SHOP_CONTRIBUTE_STEPS } from './shop';

export const getOutdoorContributeFlowSteps = (
  kind: Extract<ContributeVenueKind, 'hiking' | 'camping'>
): ContributeFlowStepId[] =>
  kind === 'hiking'
    ? [...HIKING_CONTRIBUTE_STEPS]
    : [...CAMPING_CONTRIBUTE_STEPS];

export const getShopContributeFlowSteps = (): ContributeFlowStepId[] => [...SHOP_CONTRIBUTE_STEPS];
