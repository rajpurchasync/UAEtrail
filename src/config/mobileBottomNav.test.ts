import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { MOBILE_FIVE_TAB_ORDER } from './mobileFiveTabNav';
import {
  LIST_DISCOVERY_PATH,
  MOBILE_BOTTOM_NAV_TAB_PATHS,
  shouldShowMobileBottomNav,
} from '../config/platform';

describe('mobile bottom nav contract', () => {
  it('exposes five tab ids and four shell route roots (explore + list + plan + chat)', () => {
    expect(MOBILE_FIVE_TAB_ORDER).toHaveLength(5);
    expect(MOBILE_BOTTOM_NAV_TAB_PATHS).toEqual(['/explore', '/list', '/plan', '/chat']);
    expect(MOBILE_BOTTOM_NAV_TAB_PATHS as readonly string[]).toContain(LIST_DISCOVERY_PATH);
  });

  it('wires tab targets through mobileBottomTabHomePath', () => {
    const source = readFileSync(join(process.cwd(), 'src/components/layout/MobileBottomNav.tsx'), 'utf8');
    expect(source).toContain('mobileBottomTabHomePath');
    expect(source).toContain('resolveMobileBottomTab');
    expect(source).toMatch(/gridTemplateColumns|repeat\(\$\{tabs\.length\}/);
    expect(source).toMatch(/mobile-bottom-nav|safe-area-bottom/);
    expect(source).toMatch(/pb-\[var\(--safe-bottom\)\]|safe-area-bottom/);
  });
});

describe('shouldShowMobileBottomNav', () => {
  it('shows on signed-in root tabs', () => {
    expect(shouldShowMobileBottomNav('/explore', '', true)).toBe(true);
    expect(shouldShowMobileBottomNav('/list', '', true)).toBe(true);
    expect(shouldShowMobileBottomNav('/list', '?listCat=venues', true)).toBe(true);
    expect(shouldShowMobileBottomNav('/plan', '?view=plans&role=joined', true)).toBe(true);
    expect(shouldShowMobileBottomNav('/chat', '', true)).toBe(true);
    expect(shouldShowMobileBottomNav('/home', '', true)).toBe(true);
  });

  it('shows on profile hub while signed in', () => {
    expect(shouldShowMobileBottomNav('/profile', '', true)).toBe(true);
    expect(shouldShowMobileBottomNav('/settings', '', true)).toBe(true);
    expect(shouldShowMobileBottomNav('/profile/reviews', '', true)).toBe(true);
    expect(shouldShowMobileBottomNav('/crews', '', true)).toBe(true);
    expect(shouldShowMobileBottomNav('/profile/submissions', '', true)).toBe(true);
  });

  it('hides for guests and other routes', () => {
    expect(shouldShowMobileBottomNav('/explore', '', false)).toBe(true);
    expect(shouldShowMobileBottomNav('/list', '', false)).toBe(true);
    expect(shouldShowMobileBottomNav('/plan', '', false)).toBe(true);
    expect(shouldShowMobileBottomNav('/chat', '', false)).toBe(true);
    expect(shouldShowMobileBottomNav('/home', '', false)).toBe(false);
    expect(shouldShowMobileBottomNav('/profile', '', false)).toBe(false);
    expect(shouldShowMobileBottomNav('/activity/abc', '', true)).toBe(false);
  });

  it('hides in message threads', () => {
    expect(shouldShowMobileBottomNav('/chat', '?to=user-1', true)).toBe(false);
  });

  it('hides embedded list drawer on explore', () => {
    expect(shouldShowMobileBottomNav('/explore', '?list=1', true)).toBe(false);
  });

  it('shows on explore search results', () => {
    expect(shouldShowMobileBottomNav('/explore/search', '', true)).toBe(true);
    expect(shouldShowMobileBottomNav('/explore/search', '?view=map', true)).toBe(true);
  });
});

describe('product shell marketing footer', () => {
  it('does not mount the global Footer inside ProductShell (guest landing only)', () => {
    const source = readFileSync(join(process.cwd(), 'src/components/layout/ProductShell.tsx'), 'utf8');
    expect(source).not.toMatch(/<Footer\b/);
    expect(source).not.toMatch(/shouldShowMarketingSiteFooter/);
  });

  it('does not mount the retired logo+hamburger MobileConsumerNavBar', () => {
    const source = readFileSync(join(process.cwd(), 'src/components/layout/ProductShell.tsx'), 'utf8');
    expect(source).not.toMatch(/MobileConsumerNavBar/);
  });
});
