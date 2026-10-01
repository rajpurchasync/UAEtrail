import type { OrganizeComposeKind } from '../../compose';
import type { CreateActivityDraft, CreateActivityKind, CreateFlowStepId } from '../organizeFlow';
import { organizeActivitiesFlow } from './activities';
import { organizeCampingFlow } from './camping';
import { organizeEventsFlow } from './events';
import { organizeHikingFlow } from './hiking';
import { organizeRideshareFlow } from './rideshare';
import type { OrganizeCatalogFlow } from './types';

export type { OrganizeCatalogFlow, OrganizeRegistryVenueConfig } from './types';
export { usesRegistryCatalogVenue, applyRegistryVenueStepOmit } from './registry';

export { organizeHikingFlow } from './hiking';
export { organizeCampingFlow } from './camping';
export { organizeEventsFlow } from './events';
export { organizeActivitiesFlow } from './activities';
export { organizeRideshareFlow } from './rideshare';

export const ORGANIZE_CATALOG_FLOWS: Record<OrganizeComposeKind, OrganizeCatalogFlow> = {
  hiking: organizeHikingFlow,
  camping: organizeCampingFlow,
  event: organizeEventsFlow,
  rideshare: organizeRideshareFlow,
  activity: organizeActivitiesFlow,
};

const CREATE_KIND_TO_FLOW: Record<CreateActivityKind, OrganizeCatalogFlow> = {
  hiking: organizeHikingFlow,
  camping: organizeCampingFlow,
  event: organizeEventsFlow,
  rideshare: organizeRideshareFlow,
  activity: organizeActivitiesFlow,
};

export const organizeCatalogFlowForComposeKind = (kind: OrganizeComposeKind): OrganizeCatalogFlow =>
  ORGANIZE_CATALOG_FLOWS[kind];

export const organizeCatalogFlowForCreateKind = (
  kind: CreateActivityKind,
  genericBuddy = false
): OrganizeCatalogFlow => {
  if (genericBuddy && kind === 'hiking') {
    return organizeHikingFlow;
  }
  return CREATE_KIND_TO_FLOW[kind];
};

export const getOrganizeCatalogFlowSteps = (
  kind: CreateActivityKind,
  genericBuddy: boolean,
  draft: Pick<CreateActivityDraft, 'placeLabelSource' | 'registryPlaceId' | 'genericBuddy'>
): CreateFlowStepId[] => {
  const flow = organizeCatalogFlowForCreateKind(kind, genericBuddy);
  return flow.getSteps({ ...draft, genericBuddy });
};

export const validateOrganizeCatalogStep = (
  kind: CreateActivityKind,
  step: CreateFlowStepId,
  draft: CreateActivityDraft
): string | null => {
  const flow = organizeCatalogFlowForCreateKind(kind, draft.genericBuddy);
  return flow.validateStep(step, draft);
};

export const registryPlaceTypeForOrganizeFlow = (
  flow: OrganizeCatalogFlow
): 'hiking' | 'camping' | 'event' | undefined => flow.registryVenue?.placeType;
