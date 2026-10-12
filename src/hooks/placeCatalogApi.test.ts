import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const read = (rel: string) => readFileSync(join(process.cwd(), rel), 'utf8');

describe('placeCatalogApi (R8.1)', () => {
  it('place pickers and submit wizard use hooks layer', () => {
    expect(read('src/components/ui/PlaceSelect.tsx')).toMatch(/placeCatalogApi/);
    expect(read('src/components/ui/PlaceSelect.tsx')).not.toMatch(/\bapi\./);
    expect(read('src/components/ui/SubmitPlaceForm.tsx')).toMatch(/placeCatalogApi/);
    expect(read('src/components/ui/SubmitPlaceForm.tsx')).not.toMatch(/\bapi\./);
    expect(read('src/components/ui/PlaceDetailTabs.tsx')).toMatch(/placePremiumApi/);
    expect(read('src/components/ui/PlaceDetailTabs.tsx')).not.toMatch(/\bapi\./);
  });
});
