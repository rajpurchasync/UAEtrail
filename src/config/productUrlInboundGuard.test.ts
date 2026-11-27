import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const read = (rel: string) => readFileSync(join(process.cwd(), rel), 'utf8');

describe('productUrlInboundGuard (single inbound alias registry)', () => {
  it('INBOUND-01: browse list URL state has no legacy looking token branch', () => {
    const urlState = read('src/list/browse/browseListUrlState.ts');
    expect(urlState).not.toMatch(/filterParam === 'looking'/);
  });

  it('INBOUND-02: explore activity mode filter has no seeking shim', () => {
    const mode = read('src/explore/exploreActivityModeFilter.ts');
    expect(mode).not.toMatch(/value === 'seeking'/);
    expect(mode).not.toMatch(/'seeking'/);
  });

  it('INBOUND-03: explore URL hydrate avoids retired searchFocus param', () => {
    const hydrate = read('src/explore/exploreBrowseUrlHydrate.ts');
    expect(hydrate).not.toMatch(/searchFocus=/);
  });

  it('INBOUND-04: explore routing has no participant-intent pin shims', () => {
    const routing = read('src/explore/routing.ts');
    expect(routing).toMatch(/resolveCrewExploreMapItemId/);
    expect(routing).not.toMatch(/participantIntentExplorePinPath/);
    expect(routing).not.toMatch(/resolveParticipantIntentMapItemId/);
  });

  it('GW7-01: SPA inbound redirect modules removed', () => {
    expect(existsSync(join(process.cwd(), 'src/routing/inboundBookmarkRedirects.tsx'))).toBe(false);
    expect(existsSync(join(process.cwd(), 'src/routing/exploreEntryRedirects.tsx'))).toBe(false);
    expect(read('src/routing/AppRoutes.tsx')).not.toMatch(/<Navigate\b/);
  });

  it('INBOUND-05: crews tab params centralized', () => {
    const inbound = read('src/routing/productUrlInbound.ts');
    expect(inbound).toMatch(/readPeopleCrewsTabParam/);
    expect(inbound).not.toMatch(/stripRetiredPeopleListTabParams/);
    expect(read('src/list/browse/peopleListBrowseUrl.ts')).toMatch(/readPeopleCrewsTabParam/);
    expect(read('src/explore/exploreBrowseUrlSync.ts')).toMatch(/PEOPLE_LIST_TAB_URL_PARAM/);
    expect(read('src/list/browse/browseListUrlState.ts')).not.toMatch(/readPeopleListBrowseTabParam/);
  });

  it('INBOUND-06/07: no resolveInboundPlanHubPath shims in redirect modules', () => {
    expect(read('src/utils/authRedirect.ts')).not.toMatch(/resolveInboundPlanHubPath/);
    expect(read('src/utils/notificationRouting.ts')).not.toMatch(/resolveInboundPlanHubPath/);
  });

  it('INBOUND-08: ProtectedRoute has no bare /become-host consumer link', () => {
    const route = read('src/components/auth/ProtectedRoute.tsx');
    expect(route).toMatch(/participantHostBookmarkRedirect/);
    expect(route).not.toMatch(/path:\s*['"]\/become-host['"]/);
  });
});