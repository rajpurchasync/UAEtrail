#!/usr/bin/env node
/**
 * Domain / routing canonical docs and entry module present.
 * @see docs/DOMAIN_CANONICALS.md
 */
import { existsSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

const required = [
  'docs/DOMAIN_CANONICALS.md',
  'src/config/routingCatalog.ts',
  'packages/shared-types/src/entity-path.ts',
];

let failed = false;

for (const rel of required) {
  if (!existsSync(join(root, rel))) {
    console.error(`[verify:domain] missing ${rel}`);
    failed = true;
  }
}

const canon = readFileSync(join(root, 'docs/DOMAIN_CANONICALS.md'), 'utf8');
for (const needle of ['EntityRef', 'routingCatalog', 'participant-intents', 'TRIPS_PATH']) {
  if (!canon.includes(needle)) {
    console.error(`[verify:domain] DOMAIN_CANONICALS.md missing "${needle}"`);
    failed = true;
  }
}

if (failed) {
  console.error('\n[verify:domain] FAILED');
  process.exit(1);
}

console.log('[verify:domain] docs + catalog OK');

execSync(
  'npx vitest run src/activity/activityDetailAcceptance.test.ts src/activity/activity-detail-cta-matrix.test.ts packages/shared-types/src/activity-engagement-policy.test.ts src/activity/resolveActivityPresentation.test.ts src/activity/resolveActivityDetailTabUi.test.ts src/activity/resolveActivityDetailWirePresentation.test.ts src/activity/activityDetailTab.test.ts src/activity/activityDetailTransport.test.ts src/components/seo/schemas.activity.test.ts src/explore/activityPeekEngagement.test.ts src/list/routing.test.ts src/list/listDiscoveryMode.test.ts src/config/mobileBottomNav.test.ts src/config/discoverBrowseNav.test.ts src/config/routingHygiene.test.ts src/config/routingCatalogAdoption.test.ts src/config/systemCoherenceGuard.test.ts src/config/boundedContextAlignment.test.ts src/config/mapNavigationGuard.test.ts src/member/hostMemberGuard.test.ts src/member/memberSurfacesAcceptance.test.ts src/member/coordinationAttentionPresentation.test.ts src/member/organisationNamingGuard.test.ts src/wishlist/wishlistNamingGuard.test.ts src/member-plan/tripsConsumerNamingGuard.test.ts src/member/archivedDocsGuard.test.ts src/api/apiLegacyGuard.test.ts src/api/services.domain-aliases.test.ts src/messaging/clientGuard.test.ts src/explore/exploreDiscoverBrowse.test.ts src/explore/exploreRouting.test.ts src/explore/memberDiscoverySeekingRow.test.ts src/explore/ui/exploreListPanelUrl.test.ts src/utils/authRouting.test.ts src/utils/notificationRouting.test.ts src/utils/notificationCategories.test.ts src/utils/notificationTopics.test.ts src/utils/notificationSearch.test.ts src/utils/mapLinks.test.ts src/utils/preferredNavigationApp.test.ts',
  { cwd: root, stdio: 'inherit' }
);

execSync(
  'npm --workspace @uaetrail/api run test -- --run tests/test-seed-coherence.test.ts tests/activity-group-chat-post-policy.test.ts tests/naming-coherence.test.ts tests/wishlist-naming-guard.test.ts tests/entity-follow-contract.test.ts tests/member-goals-contract.test.ts tests/member-availability-contract.test.ts tests/engagement-openapi-contract.test.ts tests/data-export-contract.test.ts tests/bounded-context-alignment.test.ts tests/member-routes-alignment.test.ts tests/admin-route-registrars.test.ts tests/platform-master-admin.test.ts tests/user-route-shell.test.ts tests/host-route-shell.test.ts tests/notification-actor-label.test.ts tests/member-people-routes-contract.test.ts tests/social-review-contract.test.ts tests/participant-roster-dto.test.ts tests/participant-intent-m2-guards.test.ts tests/participant-intent-stub-write-default.test.ts tests/participant-intent-seeking-activity-primary.test.ts tests/participant-intent-seeking-route-primary.test.ts tests/coordination-attention-contract.test.ts tests/coordination-attention-route.test.ts tests/g-manage-coordination-join-approve.test.ts tests/member-entitlements.test.ts tests/api-surface-route-naming.test.ts tests/member-journey-map-contract.test.ts tests/seeking-storage-ops-contract.test.ts',
  { cwd: root, stdio: 'inherit' }
);

console.log('[verify:domain] guards OK');
