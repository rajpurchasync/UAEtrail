import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { buildPlaceConsumerDetailJumpLinks } from './buildPlaceConsumerDetailJumpLinks';

const read = (rel: string) => readFileSync(join(process.cwd(), rel), 'utf8');

describe('placeDetailGuestGuard', () => {
  it('guest jump chips stay on preview sections', () => {
    const guestInput = {
      guestPreview: true,
      kind: 'trail' as const,
      hasAbout: true,
      showMapElevation: true,
      showSeason: true,
      showTransport: true,
      showNearby: true,
      showAmenities: false,
      showWeather: true,
      showScheduled: true,
      showRides: true,
      showGuide: true,
    };
    // "Rides to this place" is a public preview section (rendered above the member-only block).
    expect(buildPlaceConsumerDetailJumpLinks(guestInput).map((l) => l.label)).toEqual([
      'Key facts',
      'Overview',
      'Rides',
    ]);
    expect(
      buildPlaceConsumerDetailJumpLinks({ ...guestInput, showRides: false }).map((l) => l.label)
    ).toEqual(['Key facts', 'Overview']);
  });

  it('guest rides chip targets a section rendered outside the member-only block', () => {
    const template = read('src/place/detail/templates/PlaceConsumerDetailPage.tsx');
    const ridesAt = template.indexOf('<PlaceReachableRidesSection');
    const memberOnlyAt = template.indexOf('{guestPreview ? null : (');
    expect(ridesAt).toBeGreaterThan(-1);
    expect(memberOnlyAt).toBeGreaterThan(-1);
    expect(ridesAt).toBeLessThan(memberOnlyAt);
  });

  it('place L3 wires guest gate above jump nav', () => {
    const page = read('src/place/detail/templates/PlaceConsumerDetailPage.tsx');
    expect(page).toMatch(/PlaceDetailGuestGate/);
    expect(page).toMatch(/guestPreview/);
    expect(read('src/pages/PlaceDetailPage.tsx')).toMatch(/guestPreview=\{!user\}/);
  });

  it('place consumer scroll owns a bounded flex chain (not document scroll)', () => {
    const template = read('src/place/detail/templates/PlaceConsumerDetailPage.tsx');
    expect(template).toMatch(/data-place-consumer-detail-template/);
    expect(template).toMatch(/flex h-full min-h-0 flex-1 flex-col overflow-hidden/);
    expect(read('src/pages/PlaceDetailPage.tsx')).toMatch(
      /flex min-h-0 flex-1 flex-col overflow-hidden/
    );
  });
});
