import { describe, expect, it } from 'vitest';
import { COMPOSE_MAP_INTENTS } from '../create/interactions';
import { resolveHostingActivityFlowMapChrome } from './hostingActivityFlowMapChrome';

describe('resolveHostingActivityFlowMapChrome', () => {
  it('opens route overlay on route step', () => {
    const flags = resolveHostingActivityFlowMapChrome(
      'route',
      COMPOSE_MAP_INTENTS.hostRouteFrom
    );
    expect(flags.isRouteMapOverlay).toBe(true);
    expect(flags.isMeetingPointMapOpen).toBe(false);
  });

  it('defaults catalog/custom flags to false when intent is null', () => {
    const flags = resolveHostingActivityFlowMapChrome('title', null);
    expect(flags.isDestinationCatalogMapOpen).toBe(false);
    expect(flags.isCustomSpotMapOpen).toBe(false);
  });
});