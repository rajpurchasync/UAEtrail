import type { AreaPublicDTO, PlaceDTO } from '@uaetrail/shared-types';
import type { DiscoveryCardKind } from '../../discovery/discoveryCardModel';
import type { HostComposeKind } from '../compose';
import type { CountryCode } from '../../config/regions';
import { DEFAULT_PLACE_CATALOG_COUNTRY } from '../../places/placeCatalogDestinationIndex';
import type { CreateActivityDraft, CreateActivityKind } from './hostingFlowEngine';
import { emptyCreateActivityDraft } from './hostingFlowEngine';
import { patchHostingDestinationCatalogLeafLadder } from './hostingDestinationDraft';
import { applyRegistryPlaceToHostingDraft } from './hostingPlaceRegistryDraft';

/** Map a place peek card kind to the organize FAB compose kind. */
export const resolveHostComposeKindFromVenueCardKind = (
  kind: DiscoveryCardKind
): HostComposeKind => {
  if (kind === 'hiking') return 'hiking';
  if (kind === 'camping') return 'camping';
  return 'event';
};

export const resolveCreateActivityKindFromVenueCardKind = (
  kind: DiscoveryCardKind
): CreateActivityKind => resolveHostComposeKindFromVenueCardKind(kind);

/** Prefill the host wizard from a catalog place (trail, camp, or event venue) + destination ladder. */
export const createDraftFromRegistryPlace = (
  place: PlaceDTO,
  kind: CreateActivityKind,
  areas: AreaPublicDTO[] = [],
  countryCode: CountryCode = DEFAULT_PLACE_CATALOG_COUNTRY
): CreateActivityDraft => {
  const base = emptyCreateActivityDraft();
  const ladder = patchHostingDestinationCatalogLeafLadder(place, areas, countryCode);
  const patch = applyRegistryPlaceToHostingDraft(base, place);
  return {
    ...base,
    kind,
    genericBuddy: false,
    ...ladder,
    ...patch,
    registryPlaceAreaId:
      patch.registryPlaceAreaId ?? ladder.registryPlaceAreaId ?? null,
  };
};
