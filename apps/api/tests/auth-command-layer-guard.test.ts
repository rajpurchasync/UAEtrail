import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const SERVICES_DIR = join(process.cwd(), 'src/services');

const AUTH_COMMAND_MODULES = readdirSync(SERVICES_DIR).filter(
  (name) =>
    name.startsWith('auth-') &&
    name.endsWith('-commands.ts') &&
    name !== 'auth-session-commands.ts'
);

/**
 * Auth routes stay HTTP-only; command modules must not depend on Express route files.
 * @see MIG-CQRS-ROUTE-AUTH · docs/SYSTEM_COHERENCE.md §8.6
 */
describe('auth command layer guard (MIG-CQRS-ROUTE-AUTH)', () => {
  it('auth-*-commands modules do not import route handlers', () => {
    const routeImport = /from\s+['"][^'"]*\/routes\//;
    const violations: string[] = [];

    for (const file of AUTH_COMMAND_MODULES) {
      const text = readFileSync(join(SERVICES_DIR, file), 'utf8');
      if (routeImport.test(text)) {
        violations.push(file);
      }
    }

    expect(violations).toEqual([]);
  });

  it('auth-session-flow does not import route handlers', () => {
    const text = readFileSync(join(SERVICES_DIR, 'auth-session-flow.ts'), 'utf8');
    expect(text).not.toMatch(/from\s+['"][^'"]*\/routes\//);
  });
});
