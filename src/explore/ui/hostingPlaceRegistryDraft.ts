import type { PlaceDTO } from '@uaetrail/shared-types';
import type { ActivityDifficulty, CreateActivityDraft } from './hostingFlowEngine';
import type { HostingKindFlow } from './hostingFlows';

export const mapRegistryPlaceDifficulty = (
  difficulty?: PlaceDTO['difficulty'] | null
): ActivityDifficulty => {
  if (difficulty === 'moderate') return 'medium';
  if (difficulty === 'hard') return 'hard';
  return 'easy';
};

/** Whether this flow picks a catalog leaf (`GET /places/catalog`) on the destination step. */
export const hostingFlowUsesPlaceRegistry = (flow: HostingKindFlow): boolean =>
  Boolean(flow.registryVenue);

/** Apply a catalog leaf row onto the hosting draft (`registryPlaceId`). */
export const applyRegistryPlaceToHostingDraft = (
  draft: CreateActivityDraft,
  place: PlaceDTO
): Partial<CreateActivityDraft> => ({
  placeLabelSource: 'registry',
  registryPlaceId: place.id,
  registryPlaceAreaId: place.areaId?.trim() || null,
  trailName: place.name,
  trailLatitude: place.latitude ?? null,
  trailLongitude: place.longitude ?? null,
  ...(place.latitude != null && place.longitude != null
    ? {
        meetingLatitude: place.latitude,
        meetingLongitude: place.longitude,
        meetingPointLabel: place.name,
      }
    : {
        meetingLatitude: null,
        meetingLongitude: null,
        meetingPointLabel: '',
      }),
  difficulty: mapRegistryPlaceDifficulty(place.difficulty),
  trailDistanceKm: place.distance ?? null,
  trailElevationM: place.elevation ?? null,
  aboutTrail: draft.aboutTrail.trim() ? draft.aboutTrail : place.description?.trim().slice(0, 2000) ?? '',
});
