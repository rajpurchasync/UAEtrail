import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const TEMPLATES = [
  'src/activity/detail/templates/ActivityDetailSections.tsx',
  'src/place/detail/templates/PlaceDetailSections.tsx',
  'src/facility/detail/templates/FacilityDetailSections.tsx',
  'src/plan/PlanTodayPage.tsx',
  'src/components/ui/PlaceDetailTabs.tsx',
];

describe('detail templates do not statically import map libraries', () => {
  it('must not import leaflet/mapbox or MeetingPointMap on the initial graph', () => {
    const violations: string[] = [];
    for (const file of TEMPLATES) {
      const source = readFileSync(join(process.cwd(), file), 'utf8');
      if (/from ['"]leaflet['"]/.test(source) || /from ['"]react-leaflet['"]/.test(source)) {
        violations.push(`${file}: static leaflet`);
      }
      if (/mapbox/i.test(source) && /import /.test(source)) {
        violations.push(`${file}: mapbox`);
      }
      if (/from ['"][^'"]*\/MeetingPointMap['"]/.test(source)) {
        violations.push(`${file}: static MeetingPointMap`);
      }
      if (/from ['"][^'"]*\/PlaceTrackPreviewMap['"]/.test(source)) {
        violations.push(`${file}: static PlaceTrackPreviewMap`);
      }
    }
    expect(violations).toEqual([]);
  });
});
