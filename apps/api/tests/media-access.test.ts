import { describe, expect, it } from 'vitest';
import {
  bucketForKind,
  canAccessMedia,
  extractStorageKey,
  normalizeProfileVisibility,
  parseMediaKey
} from '../src/lib/media-access.js';

const buckets = { publicBucket: 'uaetrail-public', privateBucket: 'uaetrail-private' };

describe('bucketForKind', () => {
  it('sends avatar, waiver, and private_photo to the private bucket', () => {
    expect(bucketForKind('avatar', buckets)).toBe('uaetrail-private');
    expect(bucketForKind('waiver', buckets)).toBe('uaetrail-private');
    expect(bucketForKind('private_photo', buckets)).toBe('uaetrail-private');
  });

  it('sends other kinds to the public bucket', () => {
    expect(bucketForKind('general', buckets)).toBe('uaetrail-public');
    expect(bucketForKind('event', buckets)).toBe('uaetrail-public');
    expect(bucketForKind('location', buckets)).toBe('uaetrail-public');
  });
});

describe('canAccessMedia', () => {
  const owner = 'owner-1';
  const viewer = 'viewer-1';

  it('allows the owner and platform admin for every visibility', () => {
    for (const visibility of ['public', 'group_members', 'private'] as const) {
      expect(
        canAccessMedia({
          kind: 'avatar',
          visibility,
          viewerUserId: owner,
          ownerUserId: owner,
          sharesGroupOrActivity: false,
          isPlatformAdmin: false
        })
      ).toBe(true);
      expect(
        canAccessMedia({
          kind: 'avatar',
          visibility,
          viewerUserId: viewer,
          ownerUserId: owner,
          sharesGroupOrActivity: false,
          isPlatformAdmin: true
        })
      ).toBe(true);
    }
  });

  it('allows anyone to read public-bucket objects', () => {
    expect(
      canAccessMedia({
        kind: 'activity',
        visibility: 'private',
        viewerUserId: null,
        ownerUserId: owner,
        sharesGroupOrActivity: false,
        isPlatformAdmin: false
      })
    ).toBe(true);
  });

  it('allows anonymous viewers when profileVisibility is public', () => {
    expect(
      canAccessMedia({
        kind: 'avatar',
        visibility: 'public',
        viewerUserId: null,
        ownerUserId: owner,
        sharesGroupOrActivity: false,
        isPlatformAdmin: false
      })
    ).toBe(true);
  });

  it('requires group or event co-membership for group_members visibility', () => {
    expect(
      canAccessMedia({
        kind: 'avatar',
        visibility: 'group_members',
        viewerUserId: viewer,
        ownerUserId: owner,
        sharesGroupOrActivity: false,
        isPlatformAdmin: false
      })
    ).toBe(false);
    expect(
      canAccessMedia({
        kind: 'avatar',
        visibility: 'group_members',
        viewerUserId: viewer,
        ownerUserId: owner,
        sharesGroupOrActivity: true,
        isPlatformAdmin: false
      })
    ).toBe(true);
    expect(
      canAccessMedia({
        kind: 'avatar',
        visibility: 'group_members',
        viewerUserId: null,
        ownerUserId: owner,
        sharesGroupOrActivity: true,
        isPlatformAdmin: false
      })
    ).toBe(false);
  });

  it('denies other viewers when profileVisibility is private', () => {
    expect(
      canAccessMedia({
        kind: 'waiver',
        visibility: 'private',
        viewerUserId: viewer,
        ownerUserId: owner,
        sharesGroupOrActivity: true,
        isPlatformAdmin: false
      })
    ).toBe(false);
  });
});

describe('extractStorageKey', () => {
  it('accepts raw keys and resolve URLs', () => {
    expect(extractStorageKey('users/abc/avatars/file.jpg')).toBe('users/abc/avatars/file.jpg');
    expect(extractStorageKey('/api/v1/media/resolve?key=users/abc/avatars/file.jpg')).toBe(
      'users/abc/avatars/file.jpg'
    );
  });

  it('strips bucket prefixes from MinIO URLs', () => {
    expect(
      extractStorageKey('http://minio:9000/uaetrail-private/users/abc/avatars/file.jpg?X-Amz-Signature=1')
    ).toBe('users/abc/avatars/file.jpg');
  });
});

describe('parseMediaKey / visibility helpers', () => {
  it('parses owner and kind from user-scoped keys', () => {
    expect(parseMediaKey('users/u1/avatars/1-token-photo.jpg')).toEqual({
      userId: 'u1',
      tenantId: null,
      kind: 'avatar'
    });
  });

  it('defaults unknown visibility to public', () => {
    expect(normalizeProfileVisibility(undefined)).toBe('public');
    expect(normalizeProfileVisibility('group_members')).toBe('group_members');
  });
});
