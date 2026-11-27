import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const read = (rel: string) => readFileSync(join(process.cwd(), rel), 'utf8');

describe('consumer surface layout (modals / map peek)', () => {
  it('CONSUMER-SURF-01: map peek uses readable fit floor + scroll fallback', () => {
    const layout = read('src/explore/mapPeekBubbleLayout.ts');
    const overlay = read('src/explore/ui/map-peek/MapPeekShell.tsx');
    const css = read('src/index.css');
    expect(layout).toMatch(/resolveMapPeekFit/);
    expect(layout).toMatch(/MAP_PEEK_MIN_READABLE_FIT/);
    expect(overlay).toMatch(/resolveMapPeekFit/);
    expect(overlay).toMatch(/map-peek-scrollable/);
    expect(css).toMatch(/map-peek-scrollable/);
    expect(css).toMatch(/map-peek-fit-scroll/);
  });

  it('CONSUMER-SURF-02: shared modal layout + typography tokens exist', () => {
    const tokens = read('src/config/consumerSurfaceTypography.ts');
    expect(tokens).toMatch(/CONSUMER_MODAL_LAYOUT/);
    expect(tokens).toMatch(/CONSUMER_SURFACE_TYPE/);
    expect(tokens).toMatch(/MAP_PEEK_MIN_READABLE_FIT/);
  });

  it('CONSUMER-SURF-03: ConsumerBottomSheet uses flex scroll shell', () => {
    const sheet = read('src/components/mobile/ConsumerBottomSheet.tsx');
    expect(sheet).toMatch(/CONSUMER_MODAL_LAYOUT|min-h-0 flex-1 overflow-y-auto/);
    expect(sheet).toMatch(/max-h-\[min\(88dvh/);
  });

  it('CONSUMER-SURF-05: ExploreResponsiveSheet uses CONSUMER_MODAL_LAYOUT', () => {
    const sheet = read('src/explore/ui/ExploreResponsiveSheet.tsx');
    expect(sheet).toMatch(/CONSUMER_MODAL_LAYOUT/);
    expect(sheet).toMatch(/panelBodyScrollClass/);
  });

  it('CONSUMER-SURF-06: create/hosting surfaces avoid text-[9px]/10px', () => {
    const paths = [
      'src/explore/ui/CreatePlacePicker.tsx',
      'src/explore/ui/HostingDestinationCascade.tsx',
      'src/explore/ui/HostingPackingListEditor.tsx',
      'src/explore/ui/HostingGuidesField.tsx',
      'src/explore/ui/ExploreWishlistSaveButton.tsx',
      'src/explore/ui/ExploreFollowButton.tsx',
    ];
    for (const rel of paths) {
      const src = read(rel);
      expect(src).not.toMatch(/text-\[9px\]/);
      expect(src).not.toMatch(/text-\[10px\]/);
    }
  });

  it('CONSUMER-SURF-07: sheet close controls use subtle CONSUMER_MODAL_CLOSE (no chip)', () => {
    const popup = read('src/explore/exploreDesktopPopup.ts');
    const sheet = read('src/components/mobile/ConsumerBottomSheet.tsx');
    expect(popup).toMatch(/CONSUMER_MODAL_CLOSE/);
    expect(popup).not.toMatch(/bg-neutral-100/);
    expect(sheet).toMatch(/CONSUMER_MODAL_CLOSE/);
    expect(sheet).not.toMatch(/bg-neutral-100/);
    expect(read('src/explore/ui/ExploreResponsiveSheet.tsx')).toMatch(/exploreDesktopPopupCloseButtonClass/);
  });

  it('CONSUMER-SURF-04: map trip/venue peeks pin footer + scroll body', () => {
    const trip = read('src/explore/ui/map-peek/MapTripPeekCard.tsx');
    const venue = read('src/explore/ui/map-peek/MapVenuePeekCard.tsx');
    expect(trip).toMatch(/map-peek-summary-scroll/);
    expect(venue).toMatch(/map-peek-summary-scroll/);
    expect(trip).toMatch(/<footer className="shrink-0/);
    expect(venue).toMatch(/<footer className="shrink-0/);
  });
});