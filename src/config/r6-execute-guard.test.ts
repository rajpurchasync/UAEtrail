import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const read = (rel: string) => readFileSync(join(process.cwd(), rel), 'utf8');

describe('R6 tests that execute (not token-only)', () => {
  it('hosting publish contract runs runHostingActivityFlowPublish with mocks', () => {
    const source = read('src/explore/ui/hostingActivityFlowPublish.test.ts');
    expect(source).toMatch(/vi\.mock/);
    expect(source).toMatch(/runHostingActivityFlowPublish/);
    expect(source).not.toMatch(/readFileSync\(.*hostingActivityFlowPublish\.ts/);
  });

  it('inbound registry behavior lives in productUrlInbound.test.ts', () => {
    const source = read('src/routing/productUrlInbound.test.ts');
    expect(source).toMatch(/parseExploreActivityModeFilter/);
    expect(source).toMatch(/listFilterMeansAvailabilityOnly/);
    expect(source).not.toMatch(/readFileSync/);
  });

  it('crews inbound + UPL spine use runtime contract tests', () => {
    expect(read('src/routing/crewsUrlInbound.contract.test.ts')).toMatch(/parseCrewBrowseState/);
    expect(read('src/content/uplComposeSpine.contract.test.ts')).toMatch(/UPL_COMPOSE_KIND_ACTIVITY/);
    expect(read('src/activity/activityHostDeskRouting.contract.test.ts')).toMatch(/activityCrewPath/);
  });

  it('ActivityDetailView RTL smoke renders with Testing Library', () => {
    const source = read('src/components/activity/ActivityDetailView.rtl.test.tsx');
    expect(source).toMatch(/@testing-library\/react/);
    expect(source).toMatch(/getByTestId/);
    expect(source).not.toMatch(/readFileSync/);
  });

  it('activity detail view model contract runs renderHook', () => {
    const source = read('src/components/activity/detail/useActivityDetailViewModel.contract.test.tsx');
    expect(source).toMatch(/renderHook/);
    expect(source).toMatch(/useActivityDetailViewModel/);
    expect(source).not.toMatch(/readFileSync/);
  });

  it('inbound bookmarks and compose wire execute in contract tests', () => {
    const inbound = read('src/routing/inboundBookmark.contract.test.ts');
    expect(inbound).toMatch(/canonicalizeInboundProductPath/);
    expect(inbound).toMatch(/parseComposeWire/);
    expect(inbound).not.toMatch(/readFileSync/);
  });
});