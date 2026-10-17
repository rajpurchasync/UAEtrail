import { describe, expect, it } from 'vitest';
import { execSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';

const FORBIDDEN_PATTERNS: Array<{ pattern: RegExp; label: string }> = [
  { pattern: /from ['"][^'"]*pages\/BecomeOrganisation['"]/, label: 'BecomeOrganisation page import' },
  {
    pattern: /from ['"][^'"]*MobileBecomeOrganisationFlow['"]/,
    label: 'MobileBecomeOrganisationFlow import',
  },
  {
    pattern: /from ['"][^'"]*\/becomeOrganisationForm['"]/,
    label: 'becomeOrganisationForm module import',
  },
  {
    pattern: /from ['"][^'"]*\/becomeOrganisationFlow['"]/,
    label: 'becomeOrganisationFlow module import',
  },
];

const listTrackedSourceFiles = (): string[] =>
  execSync('git ls-files "src/**/*.ts" "src/**/*.tsx"', { encoding: 'utf8' })
    .trim()
    .split('\n')
    .filter(Boolean);

describe('proMembershipSurfaceGuard', () => {
  it('does not reintroduce duplicate become-organisation page or wizard modules', () => {
    const violations: string[] = [];

    for (const file of listTrackedSourceFiles()) {
      if (!existsSync(file)) continue;
      const content = readFileSync(file, 'utf8');
      for (const { pattern, label } of FORBIDDEN_PATTERNS) {
        if (pattern.test(content)) {
          violations.push(`${file}: ${label}`);
        }
      }
    }

    expect(violations).toEqual([]);
  });

  it('App mounts LegacyProMembershipRedirect for /become-host routes', () => {
    const app = readFileSync('src/App.tsx', 'utf8');
    expect(app).toMatch(/import\('\.\/pages\/LegacyProMembershipRedirect'\)/);
    expect(app).not.toMatch(/pages\/BecomeHost/);
    expect(app).not.toMatch(/pages\/BecomeOrganisation/);
  });
});
