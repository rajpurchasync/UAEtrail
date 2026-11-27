import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const read = (rel: string) => readFileSync(join(process.cwd(), rel), 'utf8');

describe('productUrlInboundGuard (single inbound alias registry)', () => {
  it('INBOUND-01: availability list filter delegates to productUrlInbound', () => {
    const urlState = read('src/list/browse/browseListUrlState.ts');
    expect(urlState).toMatch(/listFilterMeansAvailabilityOnly/);
    expect(urlState).not.toMatch(/filterParam === 'looking'/);
  });

  it('INBOUND-02: explore activity mode delegates to productUrlInbound', () => {
    const mode = read('src/explore/exploreActivityModeFilter.ts');
    expect(mode).toMatch(/parseInboundExploreActivityMode/);
    expect(mode).not.toMatch(/value === 'seeking'/);
  });

  it('INBOUND-03: pin kind + search scope delegate to productUrlInbound', () => {
    expect(read('src/explore/explorePinKindFilter.ts')).toMatch(/canonicalizeExplorePinKindToken/);
    expect(read('src/explore/exploreBrowseTaxonomy.ts')).toMatch(/normalizeExploreSearchScopeInbound/);
    expect(read('src/explore/exploreBrowseUrlHydrate.ts')).toMatch(/readExploreSearchScopeParam/);
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
    expect(inbound).toMatch(/stripRetiredPeopleListTabParams/);
    expect(read('src/list/browse/peopleListBrowseUrl.ts')).toMatch(/readPeopleCrewsTabParam/);
    expect(read('src/explore/exploreBrowseUrlSync.ts')).toMatch(/stripRetiredPeopleListTabParams/);
    expect(read('src/list/browse/browseListMapHandoff.ts')).toMatch(/stripRetiredPeopleListTabParams/);
    expect(read('src/discovery/discoveryBrowseListUrlMerge.ts')).toMatch(/stripRetiredPeopleListTabParams/);
    expect(read('src/list/browse/browseListUrlState.ts')).not.toMatch(/readPeopleListBrowseTabParam/);
  });

  it('INBOUND-07: auth return redirect uses shared-types bookmark canonicalize', () => {
    const authRedirect = read('src/utils/authRedirect.ts');
    expect(authRedirect).toMatch(/canonicalizeInboundProductPath/);
    expect(authRedirect).toMatch(/resolveAuthRedirect/);
  });

  it('INBOUND-06: notification deep links use shared-types bookmark canonicalize', () => {
    const routing = read('src/utils/notificationRouting.ts');
    expect(routing).toMatch(/canonicalizeInboundProductPath/);
    expect(routing).not.toMatch(/resolveInboundPlanHubPath/);
    expect(existsSync(join(process.cwd(), 'packages/shared-types/src/notification-bookmark-path.ts'))).toBe(
      true
    );
  });

  it('INBOUND-08: publishing workspace gate uses shared-types bookmark canonicalize', () => {
    expect(read('src/utils/authRouting.ts')).toMatch(/canonicalizeInboundProductPath/);
    expect(read('src/components/auth/ProtectedRoute.tsx')).toMatch(/participantHostBookmarkRedirect/);
  });
});