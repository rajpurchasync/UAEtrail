import type { HostComposeKind } from '../../compose';
import type { CreateActivityDraft, CreateActivityKind, CreateFlowStepId } from '../hostingFlowEngine';
import { activitiesHostingFlow } from './activities';
import { campingHostingFlow } from './camping';
import { eventsHostingFlow } from './events';
import { hikingHostingFlow } from './hiking';
import { rideshareHostingFlow } from './rideshare';
import type { HostingKindFlow } from './types';

export type {
  HostingKindFlow,
  HostingRegistryVenueConfig,
} from './types';
export { usesRegistryCatalogVenue, applyRegistryVenueStepOmit } from './registry';

export { hikingHostingFlow } from './hiking';
export { campingHostingFlow } from './camping';
export { eventsHostingFlow } from './events';
export { activitiesHostingFlow } from './activities';
export { rideshareHostingFlow } from './rideshare';

export const HOSTING_KIND_FLOWS: Record<HostComposeKind, HostingKindFlow> = {
  hiking: hikingHostingFlow,
  camping: campingHostingFlow,
  event: eventsHostingFlow,
  rideshare: rideshareHostingFlow,
  activity: activitiesHostingFlow,
};



const CREATE_KIND_TO_FLOW: Record<CreateActivityKind, HostingKindFlow> = {
  hiking: hikingHostingFlow,
  camping: campingHostingFlow,
  event: eventsHostingFlow,
  rideshare: rideshareHostingFlow,
  activity: activitiesHostingFlow,
};

export const hostingFlowForComposeKind = (kind: HostComposeKind): HostingKindFlow =>
  HOSTING_KIND_FLOWS[kind];



export const hostingFlowForCreateKind = (
  kind: CreateActivityKind,
  communityHostFlow = false
): HostingKindFlow => {
  if (communityHostFlow && kind === 'hiking') {
    return hikingHostingFlow;
  }
  return CREATE_KIND_TO_FLOW[kind];
};



export const getHostingKindFlowSteps = (
  kind: CreateActivityKind,
  communityHostFlow: boolean,
  draft: Pick<CreateActivityDraft, 'placeLabelSource' | 'registryPlaceId' | 'communityHostFlow'>
): CreateFlowStepId[] => {
  const flow = hostingFlowForCreateKind(kind, communityHostFlow);
  return flow.getSteps({ ...draft, communityHostFlow });
};



export const validateHostingKindStep = (
  kind: CreateActivityKind,
  step: CreateFlowStepId,
  draft: CreateActivityDraft
): string | null => {
  const flow = hostingFlowForCreateKind(kind, draft.communityHostFlow);
  return flow.validateStep(step, draft);
};



export const registryPlaceTypeForHostingKindFlow = (
  flow: HostingKindFlow
): 'hiking' | 'camping' | 'event' | undefined => flow.registryVenue?.placeType;
