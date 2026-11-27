import { describe, expect, it } from 'vitest';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();

const R6_CONTRACTS = [
  'src/explore/ui/hostingActivityFlowPublish.test.ts',
  'src/routing/productUrlInbound.test.ts',
  'src/routing/crewsUrlInbound.contract.test.ts',
  'src/routing/inboundBookmark.contract.test.ts',
  'src/content/uplComposeSpine.contract.test.ts',
  'src/activity/activityHostDeskRouting.contract.test.ts',
  'src/utils/authRedirect.test.ts',
  'src/utils/authRouting.test.ts',
  'src/utils/notificationRouting.test.ts',
  'packages/shared-types/src/compose-route.test.ts',
  'apps/api/tests/activity-engagement-internals.contract.test.ts',
  'packages/shared-types/src/notification-bookmark-path.test.ts',
  'src/components/activity/ActivityDetailView.rtl.test.tsx',
  'src/components/activity/detail/useActivityDetailViewModel.contract.test.tsx',
  'src/components/activity/detail/activityDetailViewModelHeroFacts.test.ts',
  'src/components/activity/detail/activityDetailViewModelPeekCard.test.ts',
  'src/components/activity/detail/activityDetailViewModelPlaceAccess.test.ts',
  'src/components/activity/detail/activityDetailViewModelRoster.test.ts',
  'src/components/activity/detail/activityDetailViewModelSplit.guard.test.ts',
  'src/discovery/discoveryPortExplorePolicy.contract.test.ts',
];

describe('R6 program closure — executing contracts registered', () => {
  it('R6-REG-01: spine contract test files exist', () => {
    const missing = R6_CONTRACTS.filter((rel) => !existsSync(join(ROOT, rel)));
    expect(missing, `Missing R6 contracts:\n${missing.join('\n')}`).toEqual([]);
  });
});