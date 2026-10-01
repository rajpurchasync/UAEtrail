import type { ComposeFlowId } from '../../composeFlowCatalog';
import type { CreateActivityDraft, CreateActivityKind, CreateFlowStepId } from '../organizeFlow';

export type OrganizeRegistryVenueConfig = {
  placeType: 'hiking' | 'camping' | 'event';
  /** Steps skipped when host picks a catalog venue (data lives on the place). */
  omitWhenRegistry: readonly CreateFlowStepId[];
};

/** One FAB catalog organize entry — steps, validation, registry, publish traits. */
export type OrganizeCatalogFlow = {
  id: ComposeFlowId;
  createKind: CreateActivityKind;
  defaultSteps: readonly CreateFlowStepId[];
  registryVenue?: OrganizeRegistryVenueConfig;
  /** Show optional carpool on post-publish success (not on review). */
  postPublishRideshare: boolean;
  getSteps: (
    draft: Pick<CreateActivityDraft, 'placeLabelSource' | 'registryPlaceId' | 'genericBuddy'>
  ) => CreateFlowStepId[];
  validateStep: (step: CreateFlowStepId, draft: CreateActivityDraft) => string | null;
};
