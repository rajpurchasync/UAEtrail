import type { CreateActivityDraft, CreateFlowStepId } from '../hostingFlowEngine';

export const usesRegistryCatalogVenue = (
  draft: Pick<CreateActivityDraft, 'placeLabelSource' | 'registryPlaceId'>
): boolean => draft.placeLabelSource === 'registry' && Boolean(draft.registryPlaceId);

export const applyRegistryVenueStepOmit = (
  steps: readonly CreateFlowStepId[],
  omit: readonly CreateFlowStepId[],
  draft: Pick<CreateActivityDraft, 'placeLabelSource' | 'registryPlaceId'>
): CreateFlowStepId[] => {
  if (!usesRegistryCatalogVenue(draft)) return [...steps];
  const omitSet = new Set(omit);
  return steps.filter((step) => !omitSet.has(step));
};
