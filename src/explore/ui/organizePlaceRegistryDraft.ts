import type { PlaceDTO } from '@uaetrail/shared-types';
import type { ActivityDifficulty, CreateActivityDraft } from './organizeFlow';
import type { HostingKindFlow } from './hostingFlows';

export const mapRegistryPlaceDifficulty = (
  difficulty?: PlaceDTO['difficulty'] | null
): ActivityDifficulty => {
  if (difficulty === 'moderate') return 'medium';
  if (difficulty === 'hard') return 'hard';
  return 'easy';
};

/** Whether this catalog flow loads venue rows from the place registry on destination. */
export const organizeFlowUsesPlaceRegistry = (flow: HostingKindFlow): boolean =>
  Boolean(flow.registryVenue);

/** Apply a registry venue place onto the organize activity draft. */
export const applyRegistryPlaceToOrganizeDraft = (
  draft: CreateActivityDraft,
  place: PlaceDTO
): Partial<CreateActivityDraft> => ({
  placeLabelSource: 'registry',
  registryPlaceId: place.id,
  trailName: place.name,
  trailLatitude: place.latitude ?? null,
  trailLongitude: place.longitude ?? null,
  difficulty: mapRegistryPlaceDifficulty(place.difficulty),
  aboutTrail: draft.aboutTrail.trim() ? draft.aboutTrail : place.description?.trim().slice(0, 2000) ?? '',
});
