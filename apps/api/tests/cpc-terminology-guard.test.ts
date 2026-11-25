import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const API_SRC = join(process.cwd(), 'src');

const collectTsFiles = (dir: string, root = dir): string[] => {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      out.push(...collectTsFiles(full, root));
    } else if (entry.endsWith('.ts') && !entry.endsWith('.test.ts')) {
      out.push(relative(root, full).replace(/\\/g, '/'));
    }
  }
  return out;
};

/** Compose wire + CPC docs may mention contribute as UI token only. */
const _CONTRIBUTE_COMMENT_ALLOWLIST = new Set([
  'domain/location-submit.ts',
  'services/location-submit.ts',
]);

describe('CPC terminology guard (API)', () => {
  it('does not use contribute as route path or service noun in routes/', () => {
    const violations: string[] = [];
    const routesDir = join(API_SRC, 'routes');
    for (const file of collectTsFiles(routesDir)) {
      const content = readFileSync(join(API_SRC, 'routes', file), 'utf8');
      if (/\/contribute/i.test(content)) {
        violations.push(`routes/${file}: /contribute path`);
      }
      if (/registerContribute|ContributeRoutes/i.test(content)) {
        violations.push(`routes/${file}: Contribute route registrar name`);
      }
    }
    expect(violations).toEqual([]);
  });

  it('member place submit uses /me/places as primary registrar path', () => {
    const registrar = readFileSync(
      join(API_SRC, 'routes/user/registerMeSubmittedPlaceRoutes.ts'),
      'utf8'
    );
    const commands = readFileSync(join(API_SRC, 'services/me-place-submit-commands.ts'), 'utf8');
    expect(registrar).toMatch(/router\.(get|post)\([\s\S]*'\/me\/places'/);
    expect(registrar).toMatch(/me-place-submit-commands/);
    expect(commands).toMatch(/place\.submit/);
  });

  it('catalog submit notifications module avoids Contribute API framing', () => {
    const content = readFileSync(join(API_SRC, 'services/catalog-submit-notifications.ts'), 'utf8');
    expect(content).toMatch(/notifyAdminsCatalogSubmitted/);
    expect(content).not.toMatch(/contribute/i);
  });

  it('member facility submit does not dual-write locations (CPC-7)', () => {
    const registrar = readFileSync(
      join(API_SRC, 'routes/user/registerMeFacilityRoutes.ts'),
      'utf8'
    );
    const commands = readFileSync(join(API_SRC, 'services/me-facility-submit-commands.ts'), 'utf8');
    expect(registrar).not.toMatch(/createLocationRecord/);
    expect(registrar).not.toMatch(/upsertFacilityFromLocationRow/);
    expect(registrar).not.toMatch(/createFacilityRecord/);
    expect(registrar).toMatch(/me-facility-submit-commands/);
    expect(commands).not.toMatch(/createLocationRecord/);
    expect(commands).toMatch(/createFacilityRecord/);
  });

  it('place location mapper exposes registeredByUserId (CPC-7 dual-read)', () => {
    const content = readFileSync(join(API_SRC, 'lib/mappers.ts'), 'utf8');
    expect(content).toMatch(/registeredByUserId:\s*location\.registeredByUserId/);
    expect(content).toMatch(/opts\?\.admin[\s\S]*submittedById:\s*location\.submittedById/);
  });

  it('admin facility CRUD does not dual-write locations (CPC-7)', () => {
    const content = readFileSync(
      join(API_SRC, 'routes/admin/registerAdminFacilityRoutes.ts'),
      'utf8'
    );
    expect(content).not.toMatch(/createAdminLocation/);
    expect(content).not.toMatch(/updateAdminLocation/);
    expect(content).not.toMatch(/deleteAdminLocation/);
    expect(content).not.toMatch(/upsertFacilityFromLocationRow/);
    expect(content).toMatch(/createAdminFacility/);
  });
});
