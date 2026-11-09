import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const read = (rel: string) => readFileSync(join(process.cwd(), rel), 'utf8');

/**
 * S13-W6 — one guest/join presentation kit (`guestBrowseGateCopy` + `ExploreGuestSignInCard`).
 */
describe('guestParticipationKitGuard', () => {
  it('GPK-01: people browse panel gates with explore-people-browse intent', () => {
    const tab = read('src/people-discovery/panel/peopleBrowse/PeopleBrowseTabContent.tsx');
    expect(tab).toMatch(/ExploreGuestSignInCard/);
    expect(tab).toMatch(/intent="explore-people-browse"/);
  });

  it('GPK-02: member profile L3 uses member-profile guest card', () => {
    const page = read('src/pages/MemberProfile.tsx');
    expect(page).toMatch(/ExploreGuestSignInCard intent="member-profile"/);
    expect(page).toMatch(/viewerAccess\?\.gateReason === 'sign_in'/);
  });

  it('GPK-03: activity L3 guest gate delegates to shared sign-in card (join-activity)', () => {
    const gate = read('src/components/activity/detail/ActivityDetailGuestGate.tsx');
    expect(gate).toMatch(/ExploreGuestSignInCard/);
    expect(gate).toMatch(/intent="join-activity"/);
    expect(gate).not.toMatch(/guestJoinSheetHeadline/);
    const template = read('src/activity/detail/templates/ActivityDetailSections.tsx');
    expect(template).toMatch(/requiresSignIn[\s\S]*ActivityDetailGuestGate/);
  });

  it('GPK-04: map peek view-details uses browse gate not join sheet', () => {
    const peekJoin = read('src/explore/ui/useExploreSelectionPeekJoin.ts');
    expect(peekJoin).toMatch(/openGuestBrowseGate\('peek-details'/);
  });

  it('GPK-05: guest copy keys live in guestBrowseGateCopy only', () => {
    const copy = read('src/content/guestBrowseGateCopy.ts');
    expect(copy).toMatch(/explore-people-browse/);
    expect(copy).toMatch(/member-profile/);
    expect(copy).toMatch(/peek-details/);
  });

  it('GPK-06: guest gated member routes use unified mobile tab header chrome', () => {
    const layout = read('src/components/auth/GuestGatedSurfaceLayout.tsx');
    expect(layout).toMatch(/MobileUnifiedTabHeader/);
    expect(layout).toMatch(/EXPLORE_MAP_PATH/);
    expect(layout).not.toMatch(/border-neutral-100 px-5 py-4 md:hidden/);
  });

  it('GPK-07: guest gated routes hide layout MobileTabHeader (avoid double chrome)', () => {
    const tabHeader = read('src/config/mobileTabHeader.ts');
    expect(tabHeader).toMatch(/resolveGuestSurfaceForPath/);
    expect(tabHeader).toMatch(/if \(!signedIn && resolveGuestSurfaceForPath\(pathname\)\) return false/);
  });
});
