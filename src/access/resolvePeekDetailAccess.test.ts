import { describe, expect, it } from 'vitest';
import type { ExploreCardModel } from '../explore/exploreCardModel';
import { resolvePeekDetailAccess } from './resolvePeekDetailAccess';

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

describe('resolvePeekDetailAccess', () => {
  it('links public venue peeks for guests', () => {
    const card = baseCard({ source: 'venue', path: '/trail/foo', kind: 'hiking' });
    expect(resolvePeekDetailAccess(card, { isGuest: true })).toEqual({
      kind: 'link',
      href: '/trail/foo',
    });
  });

  it('gates shop peeks from API viewerAccess', () => {
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
        canAccessCrewSurfaces: false,
      },
    });
    expect(resolvePeekDetailAccess(card, { isGuest: true })).toEqual({ kind: 'guest_gate' });
  });

  it('gates hosted activity detail for guests (sign in on peek, not L3)', () => {
    const card = baseCard({
      viewerAccess: {
        exposure: 'none',
        level: 'public',
        gateReason: 'sign_in',
        canViewFullActivity: false,
        canOpenDetailPage: false,
        joinMode: 'open',
        canAccessCrewSurfaces: false,
      },
    });
    expect(resolvePeekDetailAccess(card, { isGuest: true })).toEqual({ kind: 'guest_gate' });
  });

  it('links when wire grants full detail', () => {
    const card = baseCard({
      viewerAccess: {
        exposure: 'full',
        level: 'participant',
        gateReason: null,
        canViewFullActivity: true,
        canOpenDetailPage: true,
        joinMode: 'open',
        canAccessCrewSurfaces: true,
      },
    });
    expect(resolvePeekDetailAccess(card, { isGuest: false })).toEqual({
      kind: 'link',
      href: '/activity/1',
    });
  });

  it('links hosted peeks for signed-in members when viewerAccess wire is absent', () => {
    const card = baseCard({});
    expect(resolvePeekDetailAccess(card, { isGuest: false })).toEqual({
      kind: 'link',
      href: '/activity/1',
    });
  });

  it('keeps secondary/detail access while join context loads when map wire actions are present', () => {
    const card = baseCard({
      viewerAccess: {
        exposure: 'none',
        level: 'public',
        gateReason: 'sign_in',
        canViewFullActivity: false,
        canOpenDetailPage: true,
        joinMode: 'open',
        canAccessCrewSurfaces: false,
        mapPeekActions: [
          { id: 'request_join', prominence: 'primary' },
          { id: 'view_detail', prominence: 'text' },
        ],
      },
    });
    expect(resolvePeekDetailAccess(card, { isGuest: true, joinStateLoading: true })).toEqual({
      kind: 'link',
      href: '/activity/1',
    });
  });

  it('links rideshare-style peeks when API allows the detail page before join', () => {
    const card = baseCard({
      kind: 'rideshare',
      path: '/activity/rs-1',
      viewerAccess: {
        exposure: 'redacted',
        level: 'link_holder',
        gateReason: 'join_required',
        canViewFullActivity: false,
        canOpenDetailPage: true,
        joinMode: 'open',
        canAccessCrewSurfaces: false,
      },
    });
    expect(resolvePeekDetailAccess(card, { isGuest: false })).toEqual({
      kind: 'link',
      href: '/activity/rs-1',
    });
  });
});
