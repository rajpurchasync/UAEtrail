import type { AddVenueKind } from '../../addTypes';
import type { AddFlowStepId } from '../addFlow';
import { CAMPING_ADD_STEPS } from './camping';
import { HIKING_ADD_STEPS } from './hiking';
import { SHOP_ADD_STEPS } from './shop';

export const getOutdoorAddFlowSteps = (
  kind: Extract<AddVenueKind, 'hiking' | 'camping'>
): AddFlowStepId[] =>
  kind === 'hiking'
    ? [...HIKING_ADD_STEPS]
    : [...CAMPING_ADD_STEPS];

export const getShopAddFlowSteps = (): AddFlowStepId[] => [...SHOP_ADD_STEPS];
