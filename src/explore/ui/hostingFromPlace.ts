import type { PlaceDTO } from '@uaetrail/shared-types';
import type { DiscoveryCardKind } from '../../discovery/discoveryCardModel';
import type { HostComposeKind } from '../compose';
import type { CreateActivityDraft, CreateActivityKind } from './hostingFlowEngine';
import { emptyCreateActivityDraft } from './hostingFlowEngine';
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

/** Prefill the organize wizard from a registry place (trail, camp, or event venue). */
export const createDraftFromRegistryPlace = (
  place: PlaceDTO,
  kind: CreateActivityKind
): CreateActivityDraft => {
  const base = emptyCreateActivityDraft();
  const patch = applyRegistryPlaceToHostingDraft(base, place);
  return {
    ...base,
    kind,
    genericBuddy: false,
    ...patch,
  };
};
