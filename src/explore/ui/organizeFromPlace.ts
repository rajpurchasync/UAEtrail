import type { PlaceDTO } from '@uaetrail/shared-types';
import type { ExploreCardKind } from '../exploreCardModel';
import type { OrganizeComposeKind } from '../compose';
import type { CreateActivityDraft, CreateActivityKind } from './organizeFlow';
import { emptyCreateActivityDraft } from './organizeFlow';
import { applyRegistryPlaceToOrganizeDraft } from './organizePlaceRegistryDraft';

/** Map a venue peek card kind to the organize FAB compose kind. */
export const resolveOrganizeComposeKindFromVenueCardKind = (
  kind: ExploreCardKind
): OrganizeComposeKind => {
  if (kind === 'hiking') return 'hiking';
  if (kind === 'camping') return 'camping';
  return 'event';
};

export const resolveCreateActivityKindFromVenueCardKind = (
  kind: ExploreCardKind
): CreateActivityKind => resolveOrganizeComposeKindFromVenueCardKind(kind);

/** Prefill the organize wizard from a registry place (trail, camp, or event venue). */
export const createDraftFromRegistryPlace = (
  place: PlaceDTO,
  kind: CreateActivityKind
): CreateActivityDraft => {
  const base = emptyCreateActivityDraft();
  const patch = applyRegistryPlaceToOrganizeDraft(base, place);
  return {
    ...base,
    kind,
    genericBuddy: false,
    ...patch,
  };
};
