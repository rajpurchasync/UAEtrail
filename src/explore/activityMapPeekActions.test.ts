import { describe, expect, it } from 'vitest';
import {
  activityMapPeekNeedsJoinContext,
  activityMapPeekShowsJoinFlow,
  activityMapPeekSkipsJoinContext,
  resolveActivityMapPeekActions,
} from './activityMapPeekActions';
import type { ExploreCardModel } from './exploreCardModel';

const activityCard = (overrides: Partial<ExploreCardModel> = {}): ExploreCardModel =>
  ({
    id: 'activity:a1',
    path: '/activity/a1',
    source: 'activity',
    kind: 'hiking',
    tone: 'hiking',
    emoji: '🥾',
    headline: 'Hike',
    listTitle: 'Hike',
    listHost: null,
    subtitle: null,
    price: null,
    spotsLabel: null,
    venueHint: null,
    showJoinHint: false,
    primaryCta: 'Request to join',
    secondaryCta: 'View details',
    showJoinActions: true,
    shareTitle: 'Hike',
    sharePath: '/explore?pin=activity:a1',
    sections: { details: [], aboutLine: null },
    activityId: 'a1',
    activity: { id: 'a1', status: 'published' } as ExploreCardModel['activity'],
    viewerAccess: {
      exposure: 'full',
      level: 'participant',
      gateReason: null,
      canViewFullActivity: true,
      canOpenDetailPage: true,
      joinMode: 'open',
      mapPeekActions: [
        { id: 'message_host', prominence: 'primary' },
        { id: 'view_detail', prominence: 'text' },
      ],
    },
    ...overrides,
  }) as ExploreCardModel;

describe('resolveActivityMapPeekActions', () => {
  it('uses API mapPeekActions when present', () => {
    const actions = resolveActivityMapPeekActions(activityCard());
    expect(actions.map((a) => a.id)).toEqual(['message_host', 'view_detail']);
  });

  it('computes public wire affordances when API sends an empty list', () => {
    const card = activityCard({
      viewerAccess: {
        exposure: 'redacted',
        level: 'public',
        gateReason: 'sign_in',
        canViewFullActivity: false,
        canOpenDetailPage: true,
        joinMode: 'open',
        mapPeekActions: [],
      },
    });
    expect(resolveActivityMapPeekActions(card).map((a) => a.id)).toEqual([
      'request_join',
      'view_detail',
    ]);
    expect(activityMapPeekShowsJoinFlow(card, { kind: 'open' })).toBe(false);
  });

  it('does not show legacy join flow when request_join is wired', () => {
    const card = activityCard({
      viewerAccess: {
        exposure: 'redacted',
        level: 'link_holder',
        gateReason: 'join_required',
        canViewFullActivity: false,
        canOpenDetailPage: true,
        joinMode: 'open',
        mapPeekActions: [
          { id: 'request_join', prominence: 'primary' },
          { id: 'view_detail', prominence: 'text' },
        ],
      },
    });
    expect(activityMapPeekShowsJoinFlow(card)).toBe(false);
    expect(activityMapPeekNeedsJoinContext(card)).toBe(true);
  });

  it('does not fetch join context for pending_join wire only', () => {
    const card = activityCard({
      viewerAccess: {
        exposure: 'full',
        level: 'join_request',
        gateReason: null,
        canViewFullActivity: true,
        canOpenDetailPage: true,
        joinMode: 'open',
        mapPeekActions: [
          { id: 'pending_join', prominence: 'primary', joinRequestStatus: 'pending' },
          { id: 'view_detail', prominence: 'text' },
        ],
      },
    });
    expect(activityMapPeekNeedsJoinContext(card)).toBe(false);
  });
});

describe('activityMapPeekSkipsJoinContext', () => {
  it('is true when open_crew_chat is an affordance', () => {
    const card = activityCard({
      viewerAccess: {
        exposure: 'full',
        level: 'host',
        gateReason: null,
        canViewFullActivity: true,
        canOpenDetailPage: true,
        joinMode: 'open',
        mapPeekActions: [
          { id: 'open_crew_chat', prominence: 'primary' },
          { id: 'link_carpool', prominence: 'link' },
        ],
      },
    });
    expect(activityMapPeekSkipsJoinContext(card)).toBe(true);
  });
});
