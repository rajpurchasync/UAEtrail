import { describe, expect, it } from 'vitest';
import { memberDiscoverProfilePath, memberProfilePath } from './entity-path.js';

describe('memberProfilePath', () => {
  it('uses plain path for organic opens', () => {
    expect(memberProfilePath('u1')).toBe('/member/u1');
    expect(memberProfilePath('u1', { lens: 'organic' })).toBe('/member/u1');
  });

  it('tags discover directory opens for quota', () => {
    expect(memberProfilePath('u1', { discover: true, lens: 'discover' })).toBe(
      '/member/u1?discover=1&from=discover&source=discover'
    );
    expect(memberDiscoverProfilePath('u1')).toBe(
      '/member/u1?discover=1&from=discover&source=discover'
    );
  });

  it('serializes non-directory browse lenses without discover flag', () => {
    expect(memberProfilePath('u1', { lens: 'available' })).toBe('/member/u1?source=available');
    expect(memberProfilePath('u1', { lens: 'friends' })).toBe('/member/u1?source=friends');
    expect(memberProfilePath('u1', { lens: 'host' })).toBe('/member/u1?source=host');
  });

  it('serializes owner public preview without treating it as a browse lens', () => {
    expect(memberProfilePath('u1', { publicPreview: true })).toBe('/member/u1?view=public');
  });
});
