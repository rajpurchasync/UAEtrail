import { describe, expect, it } from 'vitest';
import { memberProfileLink, memberPublicPreviewLink } from './memberProfileLink';

describe('memberProfileLink', () => {
  it('maps browse lenses to memberProfilePath query shape', () => {
    expect(memberProfileLink('u1')).toBe('/member/u1');
    expect(memberProfileLink('u1', 'friends')).toBe('/member/u1?source=friends');
    expect(memberProfileLink('u1', 'discover')).toBe(
      '/member/u1?discover=1&from=discover&source=discover'
    );
  });

  it('owner public preview is view=public, not a source lens', () => {
    expect(memberPublicPreviewLink('u1')).toBe('/member/u1?view=public');
  });
});
