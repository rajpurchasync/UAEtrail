import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const read = (rel: string) => readFileSync(join(process.cwd(), rel), 'utf8');

describe('admin places catalog split (R5 god-file)', () => {
  it('keeps page shell under 650 lines and delegates table + wizard', () => {
    const page = read('src/pages/admin/Places.tsx');
    expect(page).toMatch(/AdminPlacesCatalogTable/);
    expect(page).toMatch(/AdminPlacesCatalogEditWizard/);
    expect(page).not.toMatch(/HIKING_SURFACES/);
    expect(page.split(/\r?\n/).length).toBeLessThan(650);
  });

  it('routes catalog constants through adminPlacesCatalogConstants', () => {
    const constants = read('src/place/admin/adminPlacesCatalogConstants.ts');
    expect(constants).toMatch(/emptyPlaceForm/);
    expect(constants).toMatch(/canApprovePlaceDraft/);
  });

  it('keeps edit fieldsets in AdminPlacesCatalogEditWizard', () => {
    const wizard = read('src/place/admin/AdminPlacesCatalogEditWizard.tsx');
    expect(wizard).toMatch(/MapPinPicker/);
    expect(wizard).toMatch(/Route map &amp; paid guide/);
  });
});