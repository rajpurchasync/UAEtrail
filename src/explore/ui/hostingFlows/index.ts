import type { OrganizeComposeKind } from '../../compose';
import type { CreateActivityDraft, CreateActivityKind, CreateFlowStepId } from '../hostingFlowEngine';
import { organizeActivitiesFlow } from './activities';
import { organizeCampingFlow } from './camping';
import { organizeEventsFlow } from './events';
import { organizeHikingFlow } from './hiking';
import { organizeRideshareFlow } from './rideshare';
import type { HostingKindFlow } from './types';

export type {
  HostingKindFlow,
  HostingRegistryVenueConfig,
  HostingCatalogFlow,
  OrganizeCatalogFlow,
  OrganizeRegistryVenueConfig,
} from './types';
export { usesRegistryCatalogVenue, applyRegistryVenueStepOmit } from './registry';

export { organizeHikingFlow } from './hiking';
export { organizeCampingFlow } from './camping';
export { organizeEventsFlow } from './events';
export { organizeActivitiesFlow } from './activities';
export { organizeRideshareFlow } from './rideshare';

export const HOSTING_KIND_FLOWS: Record<OrganizeComposeKind, HostingKindFlow> = {
  hiking: organizeHikingFlow,
  camping: organizeCampingFlow,
  event: organizeEventsFlow,
  rideshare: organizeRideshareFlow,
  activity: organizeActivitiesFlow,
};

/** @deprecated Use {@link HOSTING_KIND_FLOWS}. */
export const HOSTING_CATALOG_FLOWS = HOSTING_KIND_FLOWS;

/** @deprecated Use {@link HOSTING_KIND_FLOWS}. */
export const ORGANIZE_CATALOG_FLOWS = HOSTING_KIND_FLOWS;

const CREATE_KIND_TO_FLOW: Record<CreateActivityKind, HostingKindFlow> = {
  hiking: organizeHikingFlow,
  camping: organizeCampingFlow,
  event: organizeEventsFlow,
  rideshare: organizeRideshareFlow,
  activity: organizeActivitiesFlow,
};

export const hostingFlowForComposeKind = (kind: OrganizeComposeKind): HostingKindFlow =>
  HOSTING_KIND_FLOWS[kind];

/** @deprecated Use {@link hostingFlowForComposeKind}. */
export const hostingCatalogFlowForPlanKind = hostingFlowForComposeKind;

/** @deprecated Use {@link hostingFlowForComposeKind}. */
export const organizeCatalogFlowForComposeKind = hostingFlowForComposeKind;

export const hostingFlowForCreateKind = (
  kind: CreateActivityKind,
  genericBuddy = false
): HostingKindFlow => {
  if (genericBuddy && kind === 'hiking') {
    return organizeHikingFlow;
  }
  return CREATE_KIND_TO_FLOW[kind];
};

/** @deprecated Use {@link hostingFlowForCreateKind}. */
export const hostingCatalogFlowForCreateKind = hostingFlowForCreateKind;

/** @deprecated Use {@link hostingFlowForCreateKind}. */
export const organizeCatalogFlowForCreateKind = hostingFlowForCreateKind;

export const getHostingKindFlowSteps = (
  kind: CreateActivityKind,
  genericBuddy: boolean,
  draft: Pick<CreateActivityDraft, 'placeLabelSource' | 'registryPlaceId' | 'genericBuddy'>
): CreateFlowStepId[] => {
  const flow = hostingFlowForCreateKind(kind, genericBuddy);
  return flow.getSteps({ ...draft, genericBuddy });
};

/** @deprecated Use {@link getHostingKindFlowSteps}. */
export const getHostingCatalogFlowSteps = getHostingKindFlowSteps;

/** @deprecated Use {@link getHostingKindFlowSteps}. */
export const getOrganizeCatalogFlowSteps = getHostingKindFlowSteps;

export const validateHostingKindStep = (
  kind: CreateActivityKind,
  step: CreateFlowStepId,
  draft: CreateActivityDraft
): string | null => {
  const flow = hostingFlowForCreateKind(kind, draft.genericBuddy);
  return flow.validateStep(step, draft);
};

/** @deprecated Use {@link validateHostingKindStep}. */
export const validateHostingCatalogStep = validateHostingKindStep;

/** @deprecated Use {@link validateHostingKindStep}. */
export const validateOrganizeCatalogStep = validateHostingKindStep;

export const registryPlaceTypeForHostingKindFlow = (
  flow: HostingKindFlow
): 'hiking' | 'camping' | 'event' | undefined => flow.registryVenue?.placeType;

/** @deprecated Use {@link registryPlaceTypeForHostingKindFlow}. */
export const registryPlaceTypeForHostingFlow = registryPlaceTypeForHostingKindFlow;

/** @deprecated Use {@link registryPlaceTypeForHostingKindFlow}. */
export const registryPlaceTypeForOrganizeFlow = registryPlaceTypeForHostingKindFlow;
