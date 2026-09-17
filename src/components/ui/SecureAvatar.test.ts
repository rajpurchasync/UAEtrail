import { describe, expect, it } from 'vitest';
import { normalizeAvatarSrc } from './SecureAvatar';
import { initialsFromName } from '../../utils/userDisplay';
import { extractMediaKey } from '../../lib/mediaKey';

describe('normalizeAvatarSrc', () => {
  it('returns trimmed strings and rejects non-string values', () => {
    expect(normalizeAvatarSrc('  https://example.com/a.jpg  ')).toBe('https://example.com/a.jpg');
    expect(normalizeAvatarSrc(null)).toBe('');
    expect(normalizeAvatarSrc(undefined)).toBe('');
    expect(normalizeAvatarSrc(123)).toBe('');
    expect(normalizeAvatarSrc({ url: 'x' })).toBe('');
  });
});

describe('initialsFromName', () => {
  it('uses first and last name letters', () => {
    expect(initialsFromName('John Doe')).toBe('JD');
    expect(initialsFromName('  mary jane watson  ')).toBe('MW');
  });

  it('uses two letters from a single name', () => {
    expect(initialsFromName('John')).toBe('JO');
  });

  it('falls back for empty names', () => {
    expect(initialsFromName('   ')).toBe('?');
  });
});

describe('extractMediaKey', () => {
  it('reads keys from resolve URLs and private bucket paths', () => {
    expect(extractMediaKey('/api/v1/media/resolve?key=users/a/avatars/x.jpg')).toBe('users/a/avatars/x.jpg');
    expect(extractMediaKey('http://minio:9000/uaetrail-private/users/a/avatars/x.jpg')).toBe(
      'users/a/avatars/x.jpg'
    );
  });

  it('ignores external CDN URLs', () => {
    expect(extractMediaKey('https://images.unsplash.com/photo.jpg')).toBeNull();
  });
});
