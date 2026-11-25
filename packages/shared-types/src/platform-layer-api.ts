/**
 * FE domain modules ↔ platform layer (MIG-PLATFORM-LAYER-SPINE).
 * Names match `src/api/domains/*` stems — not full HTTP paths.
 */
import type { PlatformLayer } from './platform-layers.js';

/** Primary layer per `src/api/domains` module (consumer paths). */
export const PLATFORM_LAYER_API_MODULES: Record<PlatformLayer, readonly string[]> = {
  publish: ['availability', 'activities', 'places', 'facilities', 'groups', 'media'],
  discover: [
    'explore',
    'places',
    'account',
    'organisation',
    'shop',
    'destinations',
    'weather',
    'crewDiscover',
    'discoverRecommendations',
  ],
  join: ['activities', 'member', 'memberCommitmentHub'],
  connect: ['friends', 'groups', 'chat', 'messaging', 'entityFollow', 'reviews'],
  plan: ['wishlist', 'goals', 'availability', 'memberJourneyMap', 'badges'],
  manage: ['publishingWorkspace', 'organisation', 'admin', 'platformAlerts'],
};

export const apiDomainModulesForLayer = (layer: PlatformLayer): readonly string[] =>
  PLATFORM_LAYER_API_MODULES[layer];