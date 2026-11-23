import type { CanonicalComposeFlowId } from '../../composeFlowIds';
import type { CreateActivityDraft, CreateActivityKind, CreateFlowStepId } from '../hostingFlowEngine';

export type HostingRegistryVenueConfig = {
  placeType: 'hiking' | 'camping' | 'event';
  /** Steps skipped when host picks a place from `GET /places/catalog` (data lives on the place). */
  omitWhenRegistry: readonly CreateFlowStepId[];
};

/** Per activity-kind **hosting** wizard — steps, validation, registry venue rules (not place/facility catalog submit). */
export type HostingKindFlow = {
  id: CanonicalComposeFlowId;
  createKind: CreateActivityKind;
  defaultSteps: readonly CreateFlowStepId[];
  registryVenue?: HostingRegistryVenueConfig;
  /** Show optional carpool on post-publish success (not on review). */
  postPublishRideshare: boolean;
  getSteps: (
    draft: Pick<CreateActivityDraft, 'placeLabelSource' | 'registryPlaceId' | 'communityHostFlow'>
  ) => CreateFlowStepId[];
  validateStep: (step: CreateFlowStepId, draft: CreateActivityDraft) => string | null;
};

