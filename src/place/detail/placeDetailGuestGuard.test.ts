import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { buildPlaceConsumerDetailJumpLinks } from './buildPlaceConsumerDetailJumpLinks';

const read = (rel: string) => readFileSync(join(process.cwd(), rel), 'utf8');

describe('placeDetailGuestGuard', () => {
  it('guest jump chips stay on preview sections', () => {
    const guestInput = {
      guestPreview: true,
      hasAbout: true,
      showSeason: true,
      showTransport: true,
      showNearby: true,
      showScheduled: true,
      showGuide: true,
    };
    expect(buildPlaceConsumerDetailJumpLinks(guestInput).map((l) => l.label)).toEqual([
      'Key facts',
      'Overview',
    ]);
    expect(
      buildPlaceConsumerDetailJumpLinks({ ...guestInput, hasAbout: false }).map((l) => l.label)
    ).toEqual(['Key facts']);
  });

  it('place L3 passes guestPreview from route loader', () => {
    const template = read('src/place/detail/templates/PlaceDetailSections.tsx');
    expect(template).toMatch(/guestPreview/);
    expect(template).toMatch(/PlaceDetailGuestGate/);
    expect(read('src/pages/PlaceDetailPage.tsx')).toMatch(/guestPreview=\{!user\}/);
  });

  it('place consumer detail mounts section jump chips', () => {
    const template = read('src/place/detail/templates/PlaceDetailSections.tsx');
    expect(template).toMatch(/ConsumerDetailSectionJumpNav/);
    expect(template).toMatch(/buildPlaceConsumerDetailJumpLinks/);
  });

  it('place consumer scroll owns a bounded flex chain (not document scroll)', () => {
    const template = read('src/place/detail/templates/PlaceDetailSections.tsx');
    expect(template).toMatch(/data-place-consumer-detail-template/);
    expect(template).toMatch(/flex h-full min-h-0 flex-1 flex-col overflow-hidden/);
    expect(read('src/pages/PlaceDetailPage.tsx')).toMatch(
      /flex min-h-0 flex-1 flex-col overflow-hidden/
    );
  });
});
