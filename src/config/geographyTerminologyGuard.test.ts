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

describe('geographyTerminologyGuard (Place · Facility · Area)', () => {
  it('GEO-01: vocabulary module documents Place vs Facility vs Area', () => {
    const vocab = read('src/place/geographyVocabulary.ts');
    expect(vocab).toMatch(/MapPlaceWireSource/);
    expect(vocab).toMatch(/MapFacilityWireSource/);
    expect(vocab).toMatch(/GeographyAreaHubWireSource/);
    expect(vocab).toMatch(/facilities/);
    const canon = read('docs/DOMAIN_CANONICALS.md');
    expect(canon).toMatch(/12\.1\.1 Explore UI — Place · Facility · Area \(Area is a name, not a pin\)/);
    expect(canon).toMatch(/source: facility/);
  });

  it('GEO-02: Place pin summary never handles Area lens source', () => {
    expect(read('src/explore/ui/peek/place/PlacePeekBody.tsx')).not.toMatch(
      /source === 'area'/
    );
    expect(read('src/explore/ui/peek/place/PlacePeekHero.tsx')).toMatch(
      /resolvePlacePeekCuratedArea/
    );
    expect(read('src/explore/ui/map-peek/mapPeekSlots.tsx')).toMatch(
      /card\.source === 'area'/
    );
    expect(read('src/explore/ui/map-peek/mapPeekSlots.tsx')).not.toMatch(
      /card\.source === 'venue'/
    );
    expect(read('src/explore/ui/map-peek/mapPeekSlots.tsx')).not.toMatch(
      /source === 'venue'/
    );
  });

  it('GEO-03: Place and Facility map selection uses Place peek host until facility peek ships', () => {
    const stage = read('src/explore/ui/ExploreMapStage.tsx');
    expect(stage).toMatch(/isGeographyMapSource/);
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

  it('GEO-06: BWL map source is one lexicon — place + facility, not catalog_place', () => {
    const lexicon = read('packages/shared-types/src/wire-lexicon.ts');
    expect(lexicon).toMatch(/PLACE: 'place'/);
    expect(lexicon).toMatch(/FACILITY: 'facility'/);
    expect(lexicon).toMatch(/AREA_LEGACY: 'area'/);
    expect(lexicon).toMatch(/isGeographyMapSource/);
    expect(lexicon).not.toMatch(/CATALOG_PLACE_TARGET/);
    const person = read('packages/shared-types/src/explore-person.ts');
    const plan = read('packages/shared-types/src/explore-plan-projection.ts');
    expect(person).toMatch(/ExploreMapSourceWire/);
    expect(plan).toMatch(/ExploreMapSourceWire/);
    expect(person).not.toMatch(/catalog_place/);
    expect(plan).not.toMatch(/catalog_place/);
  });

  it('GEO-05: Area hub actions label facility Places distinctly from Spots rollups', () => {
    const area = read('src/explore/ui/peek/area/AreaPeekActions.tsx');
    expect(area).toMatch(/Facilities/);
    expect(area).toMatch(/Trails/);
    expect(area).not.toMatch(/venue/i);
  });
});

