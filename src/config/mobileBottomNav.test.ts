import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  LIST_DISCOVERY_PATH,
  MOBILE_BOTTOM_NAV_TAB_PATHS,
  shouldShowMobileBottomNav,
} from '../config/platform';

describe('mobile bottom nav contract', () => {
  it('has exactly three tabs and never includes list discovery as a tab', () => {
    expect(MOBILE_BOTTOM_NAV_TAB_PATHS).toHaveLength(3);
    expect(MOBILE_BOTTOM_NAV_TAB_PATHS as readonly string[]).not.toContain(LIST_DISCOVERY_PATH);
  });

  it('does not link to /list from the tab bar component', () => {
    const source = readFileSync(join(process.cwd(), 'src/components/layout/MobileBottomNav.tsx'), 'utf8');
    expect(source).not.toMatch(/to=\{LIST_DISCOVERY_PATH\}/);
    expect(source).not.toMatch(/to=["']\/list["']/);
  });
});

describe('shouldShowMobileBottomNav', () => {
  it('shows on signed-in root tabs', () => {
    expect(shouldShowMobileBottomNav('/explore', '', true)).toBe(true);
    expect(shouldShowMobileBottomNav('/plan', '?view=plans&role=joined', true)).toBe(true);
    expect(shouldShowMobileBottomNav('/chat', '', true)).toBe(true);
  });

  it('shows on profile hub while signed in', () => {
    expect(shouldShowMobileBottomNav('/profile', '', true)).toBe(true);
    expect(shouldShowMobileBottomNav('/settings', '', true)).toBe(true);
    expect(shouldShowMobileBottomNav('/profile/reviews', '', true)).toBe(true);
    expect(shouldShowMobileBottomNav('/buddies', '', true)).toBe(true);
    expect(shouldShowMobileBottomNav('/profile/submissions', '', true)).toBe(true);
    expect(shouldShowMobileBottomNav('/contributions', '', true)).toBe(true);
  });

  it('hides for guests and other routes', () => {
    expect(shouldShowMobileBottomNav('/explore', '', false)).toBe(true);
    expect(shouldShowMobileBottomNav('/plan', '', false)).toBe(true);
    expect(shouldShowMobileBottomNav('/chat', '', false)).toBe(true);
    expect(shouldShowMobileBottomNav('/profile', '', false)).toBe(false);
    expect(shouldShowMobileBottomNav('/activity/abc', '', true)).toBe(false);
  });

  it('hides in message threads', () => {
    expect(shouldShowMobileBottomNav('/chat', '?to=user-1', true)).toBe(false);
  });
});

describe('product shell marketing footer', () => {
  it('does not mount the global Footer inside ProductShell (guest landing only)', () => {
    const source = readFileSync(join(process.cwd(), 'src/components/layout/ProductShell.tsx'), 'utf8');
    expect(source).not.toMatch(/<Footer\b/);
    expect(source).not.toMatch(/shouldShowMarketingSiteFooter/);
  });
});
