import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import {
  APP_SETTINGS_DISPLAY_PATH,
  APP_SETTINGS_ACCOUNT_PATH,
  APP_SETTINGS_NOTIFICATIONS_PATH,
  APP_SETTINGS_NOTIFICATIONS_PREFERENCES_PATH,
  APP_SETTINGS_PATH,
  APP_SETTINGS_PRIVACY_PATH,
  APP_SETTINGS_SAFETY_PATH,
} from './surfacePaths';
import { hasConsumerSelfHeader } from './platform';

const SCAN_ROOT = join(process.cwd(), 'src');

const LEGACY_PROFILE_SETTINGS_LINK_ALLOWLIST = new Set([
  'src/config/inboundBookmarkPaths.ts',
  'src/config/appSettingsRoutingGuard.test.ts',
  'src/config/routingHygiene.test.ts',
  'src/utils/backStack.ts',
  'src/utils/authRouting.test.ts',
]);

const collectSourceFiles = (dir: string): string[] => {
  const entries = readdirSync(dir);
  const files: string[] = [];
  for (const entry of entries) {
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      if (entry === 'node_modules' || entry === 'api') continue;
      files.push(...collectSourceFiles(full));
    } else if (
      (entry.endsWith('.ts') || entry.endsWith('.tsx')) &&
      !entry.endsWith('.d.ts')
    ) {
      files.push(relative(process.cwd(), full).replace(/\\/g, '/'));
    }
  }
  return files;
};

const LEGACY_INBOUND_ROUTE_PATTERNS = [
  /path="\/map"/,
  /InboundLegacyProfileSettingsRedirect/,
  /InboundLegacyNotificationsRedirect/,
  /InboundMessagesRedirect/,
  /INBOUND_PROFILE_SETTINGS_PATH/,
  /Navigate to=\{/,
];

describe('appSettingsRoutingGuard', () => {
  it('app settings use layout unified header via self-header contract', () => {
    expect(hasConsumerSelfHeader(APP_SETTINGS_PATH)).toBe(true);
    expect(hasConsumerSelfHeader(APP_SETTINGS_DISPLAY_PATH)).toBe(true);
    expect(hasConsumerSelfHeader(APP_SETTINGS_PRIVACY_PATH)).toBe(true);
    expect(hasConsumerSelfHeader(APP_SETTINGS_SAFETY_PATH)).toBe(true);
    expect(hasConsumerSelfHeader(APP_SETTINGS_NOTIFICATIONS_PATH)).toBe(true);
    expect(hasConsumerSelfHeader(APP_SETTINGS_NOTIFICATIONS_PREFERENCES_PATH)).toBe(true);
  });

  it('canonical app settings paths live at /settings (not under /profile)', () => {
    expect(APP_SETTINGS_PATH).toBe('/settings');
    expect(APP_SETTINGS_DISPLAY_PATH).toBe('/settings/display');
    expect(APP_SETTINGS_ACCOUNT_PATH).toBe('/settings/account');
    expect(APP_SETTINGS_PRIVACY_PATH).toBe('/settings/privacy');
    expect(APP_SETTINGS_NOTIFICATIONS_PATH).toBe('/settings/notifications');
    expect(APP_SETTINGS_SAFETY_PATH).toBe('/settings/safety');
  });

  it('routingCatalog re-exports APP_SETTINGS_* only', () => {
    const catalog = readFileSync(join(process.cwd(), 'src/config/routingCatalog.ts'), 'utf8');
    expect(catalog).toMatch(/APP_SETTINGS_PATH/);
    expect(catalog).not.toMatch(/PROFILE_SETTINGS_PATH/);
    expect(catalog).not.toMatch(/INBOUND_PROFILE_SETTINGS_PATH/);
    expect(catalog).toMatch(/isAppSettingsPath/);
  });

  it('desktop settings sections map to dedicated routes (not in-page hashes)', () => {
    const desktop = readFileSync(join(process.cwd(), 'src/config/desktopSettings.ts'), 'utf8');
    expect(desktop).toContain('APP_SETTINGS_ACCOUNT_PATH');
    expect(desktop).toContain('desktopSettingsActiveSectionFromPath');
    expect(desktop).not.toMatch(/#\$\{desktopSettingsSectionDomId/);
    const shell = readFileSync(join(process.cwd(), 'src/components/profile/DesktopSettingsShell.tsx'), 'utf8');
    expect(shell).toContain('DESKTOP_SETTINGS_SECTIONS');
    expect(shell).toMatch(/<Link[\s\S]*to=\{section\.path\}/);
  });

  it('mobile hub lists sections without inlining bodies on the index route', () => {
    const hub = readFileSync(join(process.cwd(), 'src/components/profile/AppSettingsHubIndex.tsx'), 'utf8');
    const body = readFileSync(join(process.cwd(), 'src/components/profile/AppSettingsBody.tsx'), 'utf8');
    expect(hub).toContain('MOBILE_SETTINGS_HUB_SECTIONS');
    expect(hub).toContain('SettingsMenuRow');
    expect(body).toContain('AppSettingsHubIndex');
    expect(body).toMatch(/if \(!section\) \{\s*return <AppSettingsHubIndex/);
    expect(hub).not.toContain('ProfileAccountSettingsSections');
  });

  it('consumer settings UI uses Settings title (not App Settings)', () => {
    const violations: string[] = [];
    for (const rel of [
      'src/components/profile/ProfileSettingsIndex.tsx',
      'src/components/profile/DesktopSettingsShell.tsx',
      'src/config/mobileTabHeader.ts',
      'src/hooks/useProfileHubBackChrome.ts',
      'src/utils/mobileBackNav.ts',
    ]) {
      const content = readFileSync(join(process.cwd(), rel), 'utf8');
      if (content.includes("'App Settings'") || content.includes('"App Settings"')) {
        violations.push(rel);
      }
    }
    expect(violations).toEqual([]);
  });

  it('GW7-01: AppRoutes mounts canonical /settings routes without legacy Navigate shims', () => {
    const routes = readFileSync(join(process.cwd(), 'src/routing/AppRoutes.tsx'), 'utf8');
    expect(routes).toContain(`path={APP_SETTINGS_PATH}`);
    for (const pattern of LEGACY_INBOUND_ROUTE_PATTERNS) {
      expect(routes, pattern.toString()).not.toMatch(pattern);
    }
    expect(existsSync(join(process.cwd(), 'src/routing/inboundBookmarkRedirects.tsx'))).toBe(false);
    expect(existsSync(join(process.cwd(), 'src/routing/exploreEntryRedirects.tsx'))).toBe(false);
  });

  it('consumer UI does not link to /profile/settings (use APP_SETTINGS_PATH)', () => {
    const legacyLink =
      /(?:to|href)=["'`]\/profile\/settings|navigate\(\s*["'`]\/profile\/settings/;
    const violations: string[] = [];

    for (const file of collectSourceFiles(SCAN_ROOT)) {
      if (LEGACY_PROFILE_SETTINGS_LINK_ALLOWLIST.has(file) || file.includes('.test.')) continue;
      const content = readFileSync(join(process.cwd(), file), 'utf8');
      if (legacyLink.test(content)) {
        violations.push(file);
      }
    }

    expect(violations).toEqual([]);
  });
});