import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const read = (relativePath: string) =>
  readFileSync(join(process.cwd(), relativePath), 'utf8');

describe('catalog client facades (CPC)', () => {
  it('picker and submit flows use canonical modules not placeCatalogApi shim', () => {
    expect(read('src/components/ui/PlaceSelect.tsx')).toMatch(/placeCatalogReadsClientApi/);
    expect(read('src/components/ui/SubmitPlaceForm.tsx')).toMatch(/memberCatalogSubmitClientApi/);
    expect(read('src/hooks/usePlaceRegistry.ts')).toMatch(/placeCatalogReadsClientApi/);
  });

  it('placeCatalogApi remains a re-export shim only', () => {
    const shim = read('src/hooks/placeCatalogApi.ts');
    expect(shim).toMatch(/@deprecated/);
    expect(shim).toMatch(/memberCatalogSubmitClientApi/);
    expect(shim).toMatch(/placeCatalogReadsClientApi/);
  });
});
