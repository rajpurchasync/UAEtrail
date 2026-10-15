import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const SCAN_ROOT = join(process.cwd(), 'src');

const DEPRECATED_MESSAGE_BUTTON_SHIMS = new Set([
  'src/components/ui/HostMessageButton.tsx',
  'src/components/ui/OrganizerMessageButton.tsx',
  'src/components/ui/index.ts',
]);

const SKIP_FILES = new Set(['src/config/moduleNamingGuard.test.ts']);

const EXPLORE_PREFIX_ALLOW_PREFIXES = [
  'src/discovery/',
  'src/explore/',
  'src/activity-discovery/',
  'src/people-discovery/',
  'src/places-discovery/',
  'src/api/domains/explore.ts',
  'src/api/domains/availability.ts',
  'src/config/platform.ts',
  'src/access/mapViewerAccessToUi.ts',
];

const PLAN_PREFIX_ALLOW_PREFIXES = ['src/components/plan/', 'src/member-plan/', 'src/plan/'];

const BROWSE_PREFIX_ALLOW_PREFIXES = ['src/list/', 'src/explore/'];

const LIST_PREFIX_ALLOW_PREFIXES = ['src/list/'];

const EXPORT_SYMBOL =
  /export\s+(?:const|function|class|type|interface)\s+(Explore|Plan|Browse|List)[A-Za-z0-9_]*/g;

const fileAllowed = (file: string, allowPrefixes: string[]) =>
  allowPrefixes.some((prefix) => file === prefix || file.startsWith(prefix));

const collectSourceFiles = (dir: string): string[] => {
  const files: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      files.push(...collectSourceFiles(full));
    } else if ((entry.endsWith('.ts') || entry.endsWith('.tsx')) && !entry.endsWith('.d.ts')) {
      files.push(relative(process.cwd(), full).replace(/\\/g, '/'));
    }
  }
  return files;
};

describe('moduleNamingGuard (structural naming — bounded context, not role prefixes)', () => {
  it('DM affordance uses MessageMemberButton (not Host/Organizer-prefixed buttons)', () => {
    const violations: string[] = [];

    for (const file of collectSourceFiles(SCAN_ROOT)) {
      if (DEPRECATED_MESSAGE_BUTTON_SHIMS.has(file) || SKIP_FILES.has(file) || file.endsWith('.test.ts')) {
        continue;
      }
      const content = readFileSync(join(process.cwd(), file), 'utf8');
      if (/from\s+['"].*HostMessageButton['"]/.test(content)) {
        violations.push(`${file}: import MessageMemberButton from components/chat`);
      }
      if (/from\s+['"].*OrganizerMessageButton['"]/.test(content)) {
        violations.push(`${file}: import MessageMemberButton — do not rename Host→Organizer in component names`);
      }
      if (/\bHostMessageButton\b/.test(content) && !/MessageMemberButton/.test(content)) {
        if (!DEPRECATED_MESSAGE_BUTTON_SHIMS.has(file)) {
          violations.push(`${file}: use MessageMemberButton`);
        }
      }
    }

    expect(violations).toEqual([]);
  });

  it('chat inbox has no legacy host-only shell branch', () => {
    const content = readFileSync(join(process.cwd(), 'src/pages/Messages.tsx'), 'utf8');
    expect(content).not.toMatch(/\bisHostMessages\b/);
  });

  it('activity manage UI uses components/activity (not deprecated components/host shims)', () => {
    const violations: string[] = [];
    for (const file of collectSourceFiles(SCAN_ROOT)) {
      if (file.startsWith('src/components/host/') || file.endsWith('.test.ts')) continue;
      const content = readFileSync(join(process.cwd(), file), 'utf8');
      if (/from\s+['"].*components\/host\//.test(content)) {
        violations.push(`${file}: import from components/activity`);
      }
      if (/components\/activity-manage\//.test(content)) {
        violations.push(`${file}: use components/activity (not activity-manage)`);
      }
    }
    expect(violations).toEqual([]);
  });

  it('activity manage logic uses src/activity (not activity/manage or src/host shims)', () => {
    const violations: string[] = [];
    for (const file of collectSourceFiles(SCAN_ROOT)) {
      if (file.startsWith('src/host/') || file.endsWith('.test.ts')) continue;
      const content = readFileSync(join(process.cwd(), file), 'utf8');
      if (/from\s+['"].*\/host\/hostActivity/.test(content)) {
        violations.push(`${file}: import from src/activity/*`);
      }
      if (/from\s+['"].*activity\/manage\//.test(content)) {
        violations.push(`${file}: import from src/activity/* (not activity/manage)`);
      }
    }
    expect(violations).toEqual([]);
  });

  it('Explore/Plan/Browse/List exports stay inside owning bounded-context folders (SN-6)', () => {
    const violations: string[] = [];

    for (const file of collectSourceFiles(SCAN_ROOT)) {
      if (SKIP_FILES.has(file) || file.endsWith('.test.ts')) continue;
      const content = readFileSync(join(process.cwd(), file), 'utf8');
      for (const match of content.matchAll(EXPORT_SYMBOL)) {
        const symbol = match[1] as 'Explore' | 'Plan' | 'Browse' | 'List';
        const allowed =
          symbol === 'Explore'
            ? fileAllowed(file, EXPLORE_PREFIX_ALLOW_PREFIXES)
            : symbol === 'Plan'
              ? fileAllowed(file, PLAN_PREFIX_ALLOW_PREFIXES)
              : symbol === 'Browse'
                ? fileAllowed(file, BROWSE_PREFIX_ALLOW_PREFIXES)
                : fileAllowed(file, LIST_PREFIX_ALLOW_PREFIXES);
        if (!allowed) {
          violations.push(`${file}: ${match[0]} — keep ${symbol}* under owning context folder`);
        }
      }
    }

    expect(violations).toEqual([]);
  });

  it('MessageMemberButton is defined only under components/chat', () => {
    const violations: string[] = [];
    for (const file of collectSourceFiles(SCAN_ROOT)) {
      if (file === 'src/components/chat/MessageMemberButton.tsx' || SKIP_FILES.has(file)) continue;
      const content = readFileSync(join(process.cwd(), file), 'utf8');
      if (/export const MessageMemberButton\b/.test(content)) {
        violations.push(`${file}: define MessageMemberButton only in components/chat`);
      }
    }
    expect(violations).toEqual([]);
  });
});
