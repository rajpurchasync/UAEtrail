import { describe, expect, it } from 'vitest';
import type { ExploreCardModel } from './exploreCardModel';
import { resolveExplorePeekDetailAccess } from './explorePeekDetailAccess';

const baseCard = (overrides: Partial<ExploreCardModel>): ExploreCardModel =>
  ({
    id: 'activity:1',
    path: '/activity/1',
    source: 'activity',
    kind: 'hiking',
    sections: { plainTitle: 'Sunrise hike' },
    showJoinActions: true,
    ...overrides,
  }) as ExploreCardModel;

describe('resolveExplorePeekDetailAccess', () => {
  it('links catalog peeks for guests', () => {
    const card = baseCard({ source: 'venue', path: '/trail/foo', kind: 'hiking' });
    expect(
      resolveExplorePeekDetailAccess(card, { isGuest: true, joinUiState: { kind: 'open' } })
    ).toEqual({ kind: 'link', href: '/trail/foo' });
  });

  it('gates shop peeks for guests when viewerAccess is on the wire', () => {
    const card = baseCard({
      source: 'shop',
      path: '/shop/gear',
      kind: 'shop',
      viewerAccess: {
        exposure: 'redacted',
        level: 'public',
        gateReason: 'sign_in',
        canViewFullActivity: false,
        canOpenDetailPage: false,
        joinMode: 'open',
      },
    });
    expect(resolveExplorePeekDetailAccess(card, { isGuest: true })).toEqual({ kind: 'guest_gate' });
  });

  it('gates hosted activity peeks for guests (API wire)', () => {
    const card = baseCard({
      viewerAccess: {
        exposure: 'redacted',
        level: 'public',
        gateReason: 'sign_in',
        canViewFullActivity: false,
        canOpenDetailPage: true,
        joinMode: 'open',
      },
    });
    expect(resolveExplorePeekDetailAccess(card, { isGuest: true })).toEqual({ kind: 'guest_gate' });
  });

  it('prefers API viewerAccess on the card when present', () => {
    const card = baseCard({
      viewerAccess: {
        exposure: 'full',
        level: 'participant',
        gateReason: null,
        canViewFullActivity: true,
        canOpenDetailPage: true,
        joinMode: 'open',
      },
    });
    expect(
      resolveExplorePeekDetailAccess(card, {
        isGuest: false,
        joinUiState: { kind: 'open' },
      })
    ).toEqual({ kind: 'link', href: '/activity/1' });
  });

  it('links hosted peeks for confirmed members', () => {
    const card = baseCard({});
    expect(
      resolveExplorePeekDetailAccess(card, {
        isGuest: false,
        joinUiState: { kind: 'confirmed', requestId: 'r1' },
      })
    ).toEqual({ kind: 'link', href: '/activity/1' });
  });

  it('blocks hosted peeks for signed-in non-participants', () => {
    const card = baseCard({});
    expect(
      resolveExplorePeekDetailAccess(card, {
        isGuest: false,
        joinUiState: { kind: 'open' },
      })
    ).toEqual({ kind: 'members_only' });
  });

  it('links for host-owned cards', () => {
    const card = baseCard({ showHostActions: true });
    expect(
      resolveExplorePeekDetailAccess(card, {
        isGuest: false,
        joinUiState: { kind: 'open' },
        isHostOrOwner: true,
      })
    ).toEqual({ kind: 'link', href: '/activity/1' });
  });
});
