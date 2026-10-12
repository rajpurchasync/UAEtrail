/**
 * Activity detail + map peek program gates.
 * @see docs/experiment/activity-detail-tabs-implementation-plan.md
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (rel: string) => readFileSync(join(process.cwd(), rel), 'utf8');

const PROGRAM_DOC = 'docs/experiment/activity-detail-tabs-implementation-plan.md';
const MEMBER_SURFACES = 'docs/experiment/member-surfaces-implementation-plan.md';

describe('activity detail program — governance', () => {
  it('AD-ARCH-01: canonical program doc exists with phase status', () => {
    const plan = read(PROGRAM_DOC);
    expect(plan).toMatch(/\*\*Status:\*\* `(in_progress|complete)`/);
    expect(plan).toMatch(/## 8\. Trace matrix/);
    expect(plan).toMatch(/AD-PEEK-03/);
  });

  it('AD-ARCH-02: member-surfaces §21 points at program doc (not a second truth)', () => {
    const member = read(MEMBER_SURFACES);
    expect(member).toMatch(/activity-detail-tabs-implementation-plan\.md/);
    expect(member).toMatch(/exit criteria live here|canonical program|program doc/i);
  });

  it('AD-ARCH-03: cursor rule for activity detail program', () => {
    const rule = read('.cursor/rules/activity-detail-program.mdc');
    expect(rule).toMatch(/activity-detail-tabs-implementation-plan/);
    expect(rule).toMatch(/Definition of done/i);
    expect(rule).toMatch(/§6\.2/);
  });

  it('AD-ARCH-04: dynamic CTA matrix spec present (§6.2 A–E + §6.7)', () => {
    const plan = read(PROGRAM_DOC);
    expect(plan).toMatch(/### 6\.7 Implementation sequence/);
    expect(plan).toMatch(/AD-CTA-01/);
    expect(read('src/activity/activity-detail-cta-matrix.test.ts')).toMatch(/AD-ARCH-04/);
  });

  it('AD-PEEK-02 (partial): L1 resolveActivityEngagementPolicy owns map peek base actions', () => {
    const policy = read('packages/shared-types/src/activity-engagement-policy.ts');
    expect(policy).toMatch(/resolveActivityEngagementPolicy/);
    expect(policy).toMatch(/projectActivityMapPeekActions/);
    const api = read('apps/api/src/lib/explore-map-viewer-access.ts');
    expect(api).toMatch(/resolveActivityEngagementMapPeekActionsBase/);
    expect(api).not.toMatch(/computeActivityMapPeekActions\(/);
  });

  it('AD-DEDUPE-01: explore peek has no showHostActivityCtas / host CTA handler plumbing', () => {
    const model = read('src/explore/exploreCardModel.ts');
    expect(model).not.toMatch(/showHostActivityCtas/);
    const experience = read('src/explore/ui/ExploreExperience.tsx');
    expect(experience).not.toMatch(/showHostActivityCtas/);
    expect(experience).not.toMatch(/hostActivityCtaHandlers/);
    const peekParts = read('src/explore/ui/ExploreItemPeekParts.tsx');
    expect(peekParts).not.toMatch(/HostActivityCtas/);
    const presentation = read('src/activity/activityDetailPresentation.ts');
    expect(presentation).toMatch(/resolveActivityEngagementPolicy/);
  });

  it('AD-PEEK-05: host peek uses My host profile subtitle from mapPeekStrips wire', () => {
    const peopleRow = read('src/explore/ui/ExploreCardPresentation.tsx');
    expect(peopleRow).toMatch(/showHostSelfProfileLink/);
    expect(peopleRow).toMatch(/ACTIVITY_PEEK_MY_HOST_PROFILE_SUBTITLE/);
    const copy = read('src/content/activityPeekCopy.ts');
    expect(copy).toMatch(/ACTIVITY_PEEK_MY_HOST_PROFILE_SUBTITLE/);
  });

  it('AD-DEDUPE-01 (finish): mapPeekStrips carries pendingJoinInviteCount + peek UI chip', () => {
    const policy = read('packages/shared-types/src/activity-engagement-policy.ts');
    expect(policy).toMatch(/pendingJoinInviteCount/);
    const api = read('apps/api/src/lib/explore-map-viewer-access.ts');
    expect(api).toMatch(/pendingJoinInviteCountByActivityId/);
    const strips = read('src/explore/ui/ExploreActivityPeekStrips.tsx');
    expect(strips).toMatch(/pendingJoinInviteCount/);
    expect(strips).toMatch(/activityPeekPendingInviteChipLabel/);
  });

  it('AD-PEEK-06: host peek share_activity + manage_activity handlers wired', () => {
    const actions = read('src/explore/ui/useExploreSelectionActions.ts');
    expect(actions).toMatch(/case 'share_activity'/);
    expect(actions).toMatch(/navigator\.share/);
    expect(actions).toMatch(/case 'manage_activity'/);
    expect(actions).toMatch(/onOpenHostManage/);
    const experience = read('src/explore/ui/ExploreExperience.tsx');
    expect(experience).toMatch(/ActivityManageSheet/);
    expect(experience).toMatch(/onOpenHostManage: tenantId/);
  });

  it('AD-PEEK-03: activity map peek must not branch to HostActivityCtas', () => {
    const peek = read('src/explore/ui/ExploreItemPeekParts.tsx');
    expect(peek).not.toMatch(/showHostActivityCtas[\s\S]*HostActivityCtas/);
    expect(peek).not.toMatch(/<HostActivityCtas/);
  });

  it('AD-PRES-03: host detail uses wire plan_host_share footer + hostDetailCtas', () => {
    const sticky = read('src/components/activity/detail/ActivityDetailStickyFooter.tsx');
    expect(sticky).toMatch(/hostSecondaryActions/);
    expect(sticky).toMatch(/plan_host_share/);
    const page = read('src/pages/ActivityDetail.tsx');
    expect(page).toMatch(/hostDetailCtas/);
    expect(page).not.toMatch(/footerOverride/);
    expect(page).not.toMatch(/hostMobilePlanAccessory/);
  });

  it('AD-PRES-01: public activity detail returns presentation envelope', () => {
    const routes = read('apps/api/src/routes/user/registerPublicActivityRoutes.ts');
    expect(routes).toMatch(/presentation/);
    expect(routes).toMatch(/buildActivityPresentationForDetail/);
    expect(routes).toMatch(/pendingJoinInviteCount/);
    const hero = read('src/activity/activityDetailHeroStatus.ts');
    expect(hero).toMatch(/pendingJoinInviteCount/);
  });

  it('AD-CHROME-01: mobile chrome uses emoji + activity title (AD-2b, not kind-only chrome)', () => {
    const detail = read('src/components/activity/ActivityDetailView.tsx');
    const chrome = read('src/activity/activityKindChrome.ts');
    expect(detail).not.toMatch(/kindChromeTitle/);
    expect(detail).toMatch(/activityTitleChromeLine/);
    expect(detail).toMatch(/titleChromeLine/);
    expect(chrome).toMatch(/activityTitleChromeLine/);
  });
});

describe('activity detail program — engagement wire (AD-PRO-01, AD-PRES-02)', () => {
  it('AD-PRO-01: peek people row gates roster with canViewFullBuddyRoster', () => {
    const peopleRow = read('src/explore/ui/ExploreCardPresentation.tsx');
    expect(peopleRow).toMatch(/canViewFullBuddyRoster/);
    expect(peopleRow).toMatch(/buddyUserIdsOnActivity/);
  });

  it('AD-PRES-02: detail shell consumes presentation.footerByTab + tabs from wire', () => {
    const page = read('src/pages/ActivityDetail.tsx');
    expect(page).toMatch(/footerByTab/);
    expect(page).toMatch(/wireTabs/);
    const detail = read('src/components/activity/ActivityDetailView.tsx');
    expect(detail).toMatch(/wireFooterByTab/);
    expect(detail).toMatch(/wireTabs/);
    expect(detail).toMatch(/resolveActivityDetailTabUi/);
    expect(detail).not.toMatch(/resolveActivityDetailEngagementFooterKind/);
    const pageWire = read('src/pages/ActivityDetail.tsx');
    expect(pageWire).toMatch(/resolveActivityDetailWirePresentation/);
    expect(pageWire).toMatch(/effectiveWirePresentation/);
  });
});
