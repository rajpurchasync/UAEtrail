import { describe, expect, it } from 'vitest';
import { canonicalizeInboundProductPath, parseComposeWire } from '@uaetrail/shared-types';
import { resolveAuthRedirect } from '../utils/authRedirect';
import { participantHostBookmarkRedirect } from '../utils/authRouting';
import { inferNotificationPath } from '../utils/notificationRouting';

const notifPath = (path: string) =>
  inferNotificationPath({
    id: 'n1',
    title: 'Test',
    body: 'Body',
    type: 'request_update',
    isRead: false,
    createdAt: new Date().toISOString(),
    meta: { path },
  });

describe('inbound bookmark contracts (R6)', () => {
  it('shared-types canonicalizes retired consumer bookmarks', () => {
    expect(canonicalizeInboundProductPath('/buddies')).toBe('/crews');
    expect(canonicalizeInboundProductPath('/map')).toBe('/explore');
    expect(canonicalizeInboundProductPath('/become-host')).toBe('/profile/pro-membership');
  });

  it('auth redirect resolves through canonical inbound paths', () => {
    expect(resolveAuthRedirect(null, '/buddies')).toBe('/crews');
    expect(resolveAuthRedirect(null, '/map')).toBe('/explore');
    expect(resolveAuthRedirect(null, '/explore')).toBe('/explore');
  });

  it('notification deep links rewrite stale bookmarks', () => {
    expect(notifPath('/buddies')).toBe('/crews');
  });

  it('participant operator desk bookmarks route to consumer surfaces', () => {
    expect(participantHostBookmarkRedirect('/operator/overview')).toBe('/profile');
    expect(participantHostBookmarkRedirect('/operator/requests')).toBe('/my-requests');
  });

  it('compose wire parses canonical activity · intent · place emits', () => {
    expect(parseComposeWire('activity:hiking')).toEqual({ composeKind: 'activity', kind: 'hiking' });
    expect(parseComposeWire('intent:open')).toEqual({ composeKind: 'intent', mode: 'open' });
    expect(parseComposeWire('place:facility:toilet')).toEqual({
      composeKind: 'place',
      target: 'facility',
      kind: 'toilet',
    });
    expect(parseComposeWire('seek:flexible')).toBeNull();
  });
});