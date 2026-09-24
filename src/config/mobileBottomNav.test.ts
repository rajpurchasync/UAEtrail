import { describe, expect, it } from 'vitest';
import { shouldShowMobileBottomNav } from '../config/platform';

describe('shouldShowMobileBottomNav', () => {
  it('shows on signed-in root tabs', () => {
    expect(shouldShowMobileBottomNav('/explore', '', true)).toBe(true);
    expect(shouldShowMobileBottomNav('/activities', '?tab=joined', true)).toBe(true);
    expect(shouldShowMobileBottomNav('/messages', '', true)).toBe(true);
  });

  it('shows on profile hub while signed in', () => {
    expect(shouldShowMobileBottomNav('/profile', '', true)).toBe(true);
    expect(shouldShowMobileBottomNav('/profile/settings', '', true)).toBe(true);
    expect(shouldShowMobileBottomNav('/profile/reviews', '', true)).toBe(true);
  });

  it('hides for guests and other routes', () => {
    expect(shouldShowMobileBottomNav('/explore', '', false)).toBe(false);
    expect(shouldShowMobileBottomNav('/profile', '', false)).toBe(false);
    expect(shouldShowMobileBottomNav('/activity/abc', '', true)).toBe(false);
  });

  it('hides in message threads', () => {
    expect(shouldShowMobileBottomNav('/messages', '?to=user-1', true)).toBe(false);
  });
});
