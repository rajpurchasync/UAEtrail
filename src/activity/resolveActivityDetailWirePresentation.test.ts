import { describe, expect, it } from 'vitest';
import { APPROVAL_PARTICIPATION_REQUIREMENT } from '@uaetrail/shared-types';
import {
  mergeActivityDetailWirePresentation,
  resolveActivityDetailWirePresentation,
} from './resolveActivityDetailWirePresentation';
import type { JoinRequestUiState } from '../utils/joinRequestUi';

const guestAccess = {
  exposure: 'redacted' as const,
  level: 'public' as const,
  gateReason: 'sign_in' as const,
  canViewFullActivity: false,
  canOpenDetailPage: true,
  joinMode: 'open' as const,
  canAccessCrewSurfaces: false,
};

describe('resolveActivityDetailWirePresentation', () => {
  it('returns footerByTab + tabs from L1 policy', () => {
    const openJoin: JoinRequestUiState = { kind: 'open' };
    const presentation = resolveActivityDetailWirePresentation({
      activity: {
        status: 'published',
        participationMode: 'approval',
        requirements: [APPROVAL_PARTICIPATION_REQUIREMENT],
        joinMode: 'open',
        participants: [],
      },
      viewerAccess: guestAccess,
      isHostUser: false,
      joinUiState: openJoin,
    });

    expect(presentation?.footerByTab.plan).toBe('plan_join');
    expect(presentation?.tabs.plan.useTabChrome).toBe(true);
    expect(presentation?.engagement.joinEngagement).toBe('open');
    expect(presentation?.consumerLayout?.showPublishedCatalog).toBe(true);
  });

  it('omits consumerLayout when isEmbedded (manage sheet fallback)', () => {
    const presentation = resolveActivityDetailWirePresentation({
      activity: {
        status: 'published',
        participationMode: 'rsvp',
        requirements: [],
        joinMode: 'open',
        participants: [{ id: 'p1' }],
      },
      viewerAccess: {
        ...guestAccess,
        level: 'host',
        gateReason: null,
        canAccessCrewSurfaces: true,
      },
      isHostUser: true,
      isEmbedded: true,
      joinUiState: { kind: 'open' },
    });

    expect(presentation?.consumerLayout).toBeUndefined();
    expect(presentation?.tabs.plan.useTabChrome).toBe(false);
  });

  it('mergeActivityDetailWirePresentation backfills consumerLayout from resolver', () => {
    const openJoin: JoinRequestUiState = { kind: 'open' };
    const resolved = resolveActivityDetailWirePresentation({
      activity: {
        status: 'published',
        participationMode: 'rsvp',
        requirements: [],
        joinMode: 'open',
        participants: [],
      },
      viewerAccess: guestAccess,
      isHostUser: false,
      joinUiState: openJoin,
    });
    const staleApi = {
      engagement: resolved!.engagement,
      tabs: resolved!.tabs,
      footerByTab: resolved!.footerByTab,
      strips: resolved!.strips,
    };
    const merged = mergeActivityDetailWirePresentation(staleApi, resolved);
    expect(merged?.consumerLayout?.showPublishedCatalog).toBe(true);
  });

  it('returns null without viewerAccess', () => {
    expect(
      resolveActivityDetailWirePresentation({
        activity: { status: 'draft', joinMode: 'open', participants: [] },
        viewerAccess: null,
        isHostUser: true,
        joinUiState: { kind: 'open' },
      })
    ).toBeNull();
  });
});
