import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const read = (rel: string) => readFileSync(join(process.cwd(), rel), 'utf8');

describe('explore availability catalog contract', () => {
  it('does not expose legacy GET /explore/seeking-activities', () => {
    const registrar = read('src/routes/user/registerPublicPlaceRoutes.ts');
    expect(registrar).not.toMatch(/\/explore\/seeking-activities/);
  });

  it('appends fixed availability to explore map assembler', () => {
    const assembler = read('src/lib/discovery-catalog-builder.ts');
    expect(assembler).toMatch(/buildAvailabilityFixedMapItems/);
    expect(assembler).toMatch(/activityMode === 'seeking'\) continue/);
  });
});