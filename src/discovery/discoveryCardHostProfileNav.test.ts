import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  discoveryCardCanOpenHostProfile,
  resolveDiscoveryCardHostProfilePath,
} from './discoveryCardModel';
import type { DiscoveryCardModel } from './discoveryCardModel';

const read = (relative: string) => readFileSync(join(process.cwd(), relative), 'utf8');

const activityCard = (overrides: Partial<DiscoveryCardModel> = {}): DiscoveryCardModel =>
  ({
    id: 'explore-1',
    source: 'activity',
    path: '/activity/a1',
    activity: {
      id: 'a1',
      hostUserId: 'host-1',
      publishingProfileKind: 'community',
    },
    ...overrides,
  }) as DiscoveryCardModel;

describe('discoveryCardHostProfileNav wiring', () => {
  it('DISC-HOST-01: poster banner routes host chip through DiscoveryCardHostProfileNav', () => {
    expect(read('src/discovery/DiscoveryCardHostProfileNav.tsx')).toMatch(
      /from '\.\/DiscoveryPosterOverlayNav'/
    );
    const banner = read('src/discovery/DiscoveryBrowsePosterBanner.tsx');
    expect(banner).toMatch(/DiscoveryCardHostProfileNav/);
    expect(banner).toMatch(/embedHostInItemLink/);
    const shell = read('src/explore/ui/map-peek/MapPeekShell.tsx');
    expect(shell).toMatch(/onGuestGatedAction=\{onGuestGatedAction\}/);
    expect(shell).toMatch(/onBeforeNavigate=\{onClose\}/);
  });

  it('DISC-HOST-02: signed-in members get a host profile path on activity cards', () => {
    const card = activityCard();
    expect(resolveDiscoveryCardHostProfilePath(card)).toBe('/member/host-1?source=host');
    expect(discoveryCardCanOpenHostProfile(card, { isGuest: false })).toBe(true);
  });
});