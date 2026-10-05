import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const SCAN_ROOT = join(process.cwd(), 'src');

const ALLOW_BECOME_HOST_PATH = new Set([
  'src/config/memberRoutes.ts',
  'src/config/platform.ts',
  'src/pages/BecomeHost.tsx',
  'src/utils/becomeHostSurfaceGuard.test.ts',
  'src/components/organisation-console/hostWizardFlow.ts',
  'src/components/organisation-console/hostWizardFlow.test.ts',
  'src/components/organisation-console/BecomeHostFlow.tsx',
  'src/pages/ProfileProMembership.tsx',
  'src/App.tsx',
]);

const SKIP_PREFIXES = ['src/api/', 'src/member/hostMemberGuard.test.ts'];

const collectSourceFiles = (dir: string): string[] => {
  const entries = readdirSync(dir);
  const files: string[] = [];
  for (const entry of entries) {
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      files.push(...collectSourceFiles(full));
    } else if (entry.endsWith('.ts') || entry.endsWith('.tsx')) {
      files.push(relative(process.cwd(), full).replace(/\\/g, '/'));
    }
  }
  return files;
};

describe('hostMemberGuard', () => {
  it('consumer UI does not link to /become-host (use PRO_MEMBERSHIP_PATH)', () => {
    const files = collectSourceFiles(SCAN_ROOT).filter(
      (file) =>
        !SKIP_PREFIXES.some((prefix) => file.startsWith(prefix)) &&
        !ALLOW_BECOME_HOST_PATH.has(file)
    );
    const violations: string[] = [];

    for (const file of files) {
      const content = readFileSync(join(process.cwd(), file), 'utf8');
      if (/to=["']\/become-host|navigate\(\s*['"]\/become-host|href=["']\/become-host/.test(content)) {
        violations.push(`${file}: use PRO_MEMBERSHIP_PATH or proMembershipPath()`);
      }
    }

    expect(violations).toEqual([]);
  });

  it('product gates do not use isHostRole (use canAccessHostConsole / canPublish from host-status)', () => {
    const files = collectSourceFiles(SCAN_ROOT).filter(
      (file) => file !== 'src/utils/roles.ts' && !file.endsWith('.test.ts')
    );
    const violations: string[] = [];

    for (const file of files) {
      const content = readFileSync(join(process.cwd(), file), 'utf8');
      if (/\bisHostRole\s*\(/.test(content)) {
        violations.push(`${file}: use useHostStatus / canAccessHostConsole`);
      }
    }

    expect(violations).toEqual([]);
  });

  it('new host-status reads prefer getMemberHostStatus over getMyOrganisationStatus', () => {
    const files = collectSourceFiles(SCAN_ROOT).filter(
      (file) =>
        !SKIP_PREFIXES.some((prefix) => file.startsWith(prefix)) &&
        (file.startsWith('src/hooks/') ||
          file.startsWith('src/pages/') ||
          file.startsWith('src/components/'))
    );
    const violations: string[] = [];

    for (const file of files) {
      const content = readFileSync(join(process.cwd(), file), 'utf8');
      if (/\bapi\.getMyOrganisationStatus\s*\(/.test(content)) {
        violations.push(`${file}: use api.getMemberHostStatus()`);
      }
    }

    expect(violations).toEqual([]);
  });
});
