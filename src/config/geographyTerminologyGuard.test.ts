import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const read = (rel: string) => readFileSync(join(process.cwd(), rel), 'utf8');

const collectTsxUnder = (dir: string): string[] => {
  const root = join(process.cwd(), dir);
  const files: string[] = [];
  const walk = (current: string) => {
    for (const entry of readdirSync(current)) {
      const full = join(current, entry);
      if (statSync(full).isDirectory()) walk(full);
      else if (entry.endsWith('.tsx') || entry.endsWith('.ts')) {
        files.push(relative(process.cwd(), full).replace(/\\/g, '/'));
      }
    }
  };
  walk(root);
  return files;
};

describe('geographyTerminologyGuard (Place · venue wire · Area · facility)', () => {
  it('GEO-01: vocabulary module documents Place vs venue vs Area', () => {
    const vocab = read('src/place/geographyVocabulary.ts');
    expect(vocab).toMatch(/MapVenueWireSource/);
    expect(vocab).toMatch(/GeographyAreaHubWireSource/);
    expect(vocab).toMatch(/facilities/);
    const canon = read('docs/DOMAIN_CANONICALS.md');
    expect(canon).toMatch(/12\.1\.1 Explore UI — Place vs `venue`/);
    expect(canon).toMatch(/Facility/);
  });

  it('GEO-02: Place pin summary never handles Area lens source', () => {
    expect(read('src/explore/ui/peek/place/PlacePeekBody.tsx')).not.toMatch(
      /source === 'area'/
    );
    expect(read('src/explore/ui/peek/place/PlacePeekBody.tsx')).toMatch(
      /resolvePlacePeekCuratedArea/
    );
    expect(read('src/explore/ui/map-peek/mapPeekSlots.tsx')).toMatch(
      /card\.source === 'area'/
    );
    expect(read('src/explore/ui/map-peek/mapPeekSlots.tsx')).not.toMatch(
      /card\.source === 'venue'/
    );
  });

  it('GEO-03: venue map selection uses Place peek host (wire `venue`, entity Place)', () => {
    const stage = read('src/explore/ui/ExploreMapStage.tsx');
    expect(stage).toMatch(/source === 'venue'/);
    const placeHost = read('src/explore/ui/peek/place/PlaceMapPeekHost.tsx');
    expect(placeHost).toMatch(/PlacePeekCard/);
    expect(stage).toMatch(/PlaceMapPeekHost/);
  });

  it('GEO-04: no new ExploreVenuePeek* implementations under peek/place', () => {
    const violations: string[] = [];
    for (const file of collectTsxUnder('src/explore/ui/peek/place')) {
      if (/ExploreVenuePeek/i.test(read(file))) violations.push(file);
    }
    expect(violations).toEqual([]);
  });

  it('GEO-05: Area hub actions label facility Places distinctly from Spots rollups', () => {
    const area = read('src/explore/ui/peek/area/AreaPeekActions.tsx');
    expect(area).toMatch(/Facilities/);
    expect(area).toMatch(/Trails/);
    expect(area).not.toMatch(/venue/i);
  });
});

