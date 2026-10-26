import type { HostTierFlags } from '@uaetrail/shared-types';

/** Pro / business hosts may pin any destination on the map. */
export const hostHasProRideshareMapDestination = (hostTiers: HostTierFlags): boolean =>
  Boolean(hostTiers.professional || hostTiers.business);
