import { describe, expect, it } from 'vitest';
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

/** Paths / modules removed in favor of `BecomeHost` + `BecomeHostFlow` on experiment-ui. */
const FORBIDDEN_IMPORT_FRAGMENTS = [
  'pages/BecomeOrganisation',
  'MobileBecomeOrganisationFlow',
  'organisation-console/becomeOrganisationForm',
  'organisation-console/becomeOrganisationFlow',
];

const listTrackedSourceFiles = (): string[] =>
  execSync('git ls-files "src/**/*.ts" "src/**/*.tsx"', { encoding: 'utf8' })
    .trim()
    .split('\n')
    .filter(Boolean);

describe('becomeHostSurfaceGuard', () => {
  it('does not reintroduce duplicate become-organisation page or wizard modules', () => {
    const violations: string[] = [];

    for (const file of listTrackedSourceFiles()) {
      const content = readFileSync(file, 'utf8');
      for (const fragment of FORBIDDEN_IMPORT_FRAGMENTS) {
        if (content.includes(fragment)) {
          violations.push(`${file} imports or references ${fragment}`);
        }
      }
    }

    expect(violations).toEqual([]);
  });

  it('App lazy-loads the BecomeHost page for /become-host routes', () => {
    const app = readFileSync('src/App.tsx', 'utf8');
    expect(app).toMatch(/import\('\.\/pages\/BecomeHost'\)/);
    expect(app).not.toMatch(/pages\/BecomeOrganisation/);
  });
});
