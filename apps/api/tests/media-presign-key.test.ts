import { describe, expect, it } from 'vitest';

/** Keep in sync with apps/api/src/routes/media.ts */
const PRESIGN_KEY_PATTERN =
  /^(users\/[\w-]+|tenants\/[\w-]+)\/(uploads|avatars|activities|events|locations|shop|guides|waivers|private-photos)\/\d+-[a-f0-9]+-.+$/i;

describe('presign media keys', () => {
  it('accepts activity cover image keys', () => {
    const key = 'tenants/t1/activities/1730000000000-abc123-camp-cover.jpg';
    expect(PRESIGN_KEY_PATTERN.test(key)).toBe(true);
  });

  it('accepts legacy event segment keys', () => {
    const key = 'users/u1/events/1730000000000-abc123-photo.jpg';
    expect(PRESIGN_KEY_PATTERN.test(key)).toBe(true);
  });
});
