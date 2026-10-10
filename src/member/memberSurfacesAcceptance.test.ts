/**
 * Automated gates from `docs/experiment/member-surfaces-implementation-plan.md` §11.
 * G-manage approve from Plan sheet: manual staging QA; API slice in `g-manage-coordination-join-approve.test.ts`.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';
import { parsePeopleBrowseTabFromUrl } from '../explore/peopleBrowseTab';
import { PLAN_LENS_SEGMENTS } from '../plan/planLens';
import { participantHostBookmarkRedirect } from '../utils/authRouting';
import { inferNotificationPath } from '../utils/notificationRouting';
import type { NotificationDTO } from '@uaetrail/shared-types';

const read = (rel: string) => readFileSync(join(process.cwd(), rel), 'utf8');

const collectApiNotificationServices = (): string[] => {
  const dir = join(process.cwd(), 'apps/api/src/services');
  const files: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isFile() && entry.includes('notification')) {
      files.push(relative(process.cwd(), full).replace(/\\/g, '/'));
    }
  }
  return files;
};

describe('member surfaces §11 acceptance (automated)', () => {
  it('G-arch: host withdrawal notification meta uses Plan hosted (not /host/requests)', () => {
    const withdrawal = read('apps/api/src/services/request-notifications.ts');
    expect(withdrawal).toContain('planHostedSchedulePath');
    expect(withdrawal).not.toContain('HOST_REQUESTS_PATH');
  });

  it('G-arch: API join/goal notification paths use /plan not /trips', () => {
    const memberRoutes = read('apps/api/src/lib/member-routes.ts');
    expect(memberRoutes).toMatch(/TRIPS_JOINED_TAB_PATH = planJoinedSchedulePath\(\)/);
    expect(memberRoutes).toContain("export const PLAN_PATH = '/plan'");

    const staleTripsMeta: string[] = [];
    for (const file of collectApiNotificationServices()) {
      const content = read(file);
      if (content.includes("path: '/trips") || content.includes('path: `/trips')) {
        staleTripsMeta.push(file);
      }
    }
    expect(staleTripsMeta).toEqual([]);
  });

  it('G-arch: legacy notification meta.path normalizes to Plan', () => {
    const notif = (meta: Record<string, unknown>): NotificationDTO => ({
      id: 'n1',
      title: 'T',
      body: 'B',
      type: 'request_update',
      isRead: false,
      createdAt: new Date().toISOString(),
      meta,
    });
    expect(
      inferNotificationPath(
        notif({ path: '/trips?segment=upcoming&tab=joined', kind: 'join_request_waitlisted' })
      )
    ).toBe('/plan?view=plans&role=joined');
  });

  it('G-arch: participant /host bookmarks redirect off host console', () => {
    expect(participantHostBookmarkRedirect('/host/overview')).toBe('/explore?compose=organize');
    expect(participantHostBookmarkRedirect('/host/activities')).toContain('/plan');
  });

  it('G-lang: mobile tab bar labels Plan (not Trips hub)', () => {
    const nav = read('src/components/layout/MobileBottomNav.tsx');
    expect(nav).toMatch(/aria-label="Plan"/);
    expect(nav).toMatch(/>Plan</);
    expect(nav).not.toMatch(/aria-label="Trips"/);
  });

  it('G-plan: Plan lenses cover schedule, saved, goals, availability', () => {
    const keys = PLAN_LENS_SEGMENTS.map((row) => row.key);
    expect(keys).toContain('schedule');
    expect(keys).toContain('saved');
    expect(keys).toContain('goals');
    expect(keys).toContain('availability');
  });

  it('G-avail-map: People browse defaults to Available tab', () => {
    expect(parsePeopleBrowseTabFromUrl(null, null)).toBe('available');
  });

  it('G-seek: ActivityDTO wire includes activityMode for /activity/:id', () => {
    const mappers = read('apps/api/src/lib/mappers.ts');
    expect(mappers).toContain('activityMode: event.activityMode');
    const dto = read('packages/shared-types/src/index.ts');
    expect(dto).toMatch(/activityMode\?: ExploreActivityMode/);
  });

  it('G-seek: explore map build does not merge legacy demand pins into payload', () => {
    const exploreMap = read('apps/api/src/lib/explore-map.ts');
    expect(exploreMap).not.toMatch(/listActiveParticipantIntentsForMap\(/);
    expect(exploreMap).toMatch(/source: 'activity',\s*\n\s*activityMode,/);
    expect(exploreMap).not.toMatch(/activityMode === 'seeking' \? 'demand'/);
  });

  it('G-seek: publish fan-out prefers activity pin when seeking id exists', () => {
    const publish = read('apps/api/src/services/member-publish-notifications.ts');
    expect(publish).toMatch(/explorePublishedActivityPinPath|exploreSeekingPinPath/);
    expect(publish).toContain('activityId');
  });

  it('G-seek: wishlist demand alerts use explorePublishedActivityPinPath with activityId', () => {
    const wishlist = read('apps/api/src/services/wishlist-alerts.ts');
    expect(wishlist).toContain('explorePublishedActivityPinPath');
    expect(wishlist).toMatch(/activityId|seekingActivityId/);
  });

  it('G-manage: coordination attention has API route contract test', () => {
    const routeTest = read('apps/api/tests/coordination-attention-route.test.ts');
    expect(routeTest).toContain('/me/coordination-attention');
    expect(routeTest).toContain("not.toHaveProperty('label')");
    const flowTest = read('apps/api/tests/g-manage-coordination-join-approve.test.ts');
    expect(flowTest).toContain('host_join_queue');
    expect(flowTest).toContain('/host/requests/');
  });

  it('G-manage: Plan needs-you uses domain read-model GET /me/coordination-attention', () => {
    const hook = read('src/hooks/useMemberCoordinationAttention.ts');
    expect(hook).toContain('getMeCoordinationAttention');
    const strip = read('src/components/plan/PlanNeedsYouStrip.tsx');
    expect(strip).toContain('useMemberCoordinationAttention');
    expect(strip).toContain('coordinationAttentionPresentation');
    expect(strip).not.toContain('HOST_REQUESTS_PATH');
    const api = read('apps/api/src/services/member-coordination-attention.ts');
    expect(api).not.toMatch(/\blabel\s*:/);
    expect(api).not.toContain('/host/requests');
  });

  it('G-manage: hosted Plan opens ActivityManageSheet (approve via host API, not /host shell)', () => {
    const plan = read('src/pages/Activities.tsx');
    expect(plan).toContain('HostedActivitiesSection');
    expect(plan).toContain('PlanNeedsYouStrip');
    const hosted = read('src/pages/activities/HostedActivitiesSection.tsx');
    expect(hosted).toContain('ActivityManageSheet');
    expect(hosted).not.toMatch(/\/host\/requests|HOST_REQUESTS_PATH/);
    const sheet = read('src/components/host/ActivityManageSheet.tsx');
    expect(sheet).toContain('decideHostActivityJoinRequest');
    expect(sheet).toContain('tripsHostedActivityPath');
  });

  it('G-profile: badges and contributions live on Profile launcher (not Plan)', () => {
    const launcher = read('src/components/profile/ProfileQuickLauncher.tsx');
    expect(launcher).toContain('PROFILE_BADGES_PATH');
    expect(launcher).toContain('CONTRIBUTIONS_PATH');
    const contributions = read('src/pages/Contributions.tsx');
    expect(contributions).toContain('PROFILE_REVIEWS_PATH');
    const plan = read('src/pages/Activities.tsx');
    expect(plan).not.toContain('PROFILE_BADGES_PATH');
    expect(plan).not.toContain('CONTRIBUTIONS_PATH');
  });

  it('G-profile: hub shortcuts use profile/plan paths (not host shell)', () => {
    const launcher = read('src/components/profile/ProfileQuickLauncher.tsx');
    expect(launcher).toContain('BUDDIES_PATH');
    expect(launcher).toContain('PROFILE_HISTORY_PATH');
    expect(launcher).toContain("tripsPlansPath('hosted')");
    expect(launcher).not.toMatch(/HOST_OVERVIEW_PATH/);
    const settings = read('src/components/profile/ProfileSettingsIndex.tsx');
    expect(settings).toMatch(/visibility/i);
  });

  it('G-profile: goals teaser links to Plan lens (no duplicate goals CRUD on hub)', () => {
    const hub = read('src/components/profile/ProfileConsumerHub.tsx');
    expect(hub).toContain('ProfilePlanGoalsTeaser');
    expect(hub).not.toContain('ProfileGoalsSection');
    const teaser = read('src/components/profile/ProfilePlanGoalsTeaser.tsx');
    expect(teaser).toContain("planLensPath('goals')");
  });

  it('G-arch: Profile business entry uses pro membership (not host overview)', () => {
    const hub = read('src/components/profile/ProfileConsumerHub.tsx');
    expect(hub).toContain('PRO_MEMBERSHIP_PATH');
    expect(hub).not.toMatch(/\/host\/overview/);
    const launcher = read('src/components/profile/ProfileQuickLauncher.tsx');
    expect(launcher).toContain("tripsPlansPath('hosted')");
    expect(launcher).not.toMatch(/\/host\//);
  });

  it('G-arch: org public profile owner CTAs avoid consumer /host/* routes', () => {
    const orgProfile = read('src/components/organisation-console/OrganisationPublicProfile.tsx');
    expect(orgProfile).toContain("tripsPlansPath('hosted')");
    expect(orgProfile).toContain('PRO_MEMBERSHIP_PATH');
    expect(orgProfile).not.toMatch(/HOST_(ACTIVITIES|TEAM|REQUESTS)_PATH/);
  });

  it('G-plan: Plan page is forward-looking (past outings on profile history)', () => {
    const plan = read('src/pages/Activities.tsx');
    expect(plan).not.toMatch(/timeScope=["']past["']/);
    expect(plan).not.toMatch(/segment=["']completed["']/);
    expect(plan).toContain('PROFILE_HISTORY_PATH');
  });

  it('G-plan: Plan routing helpers live under src/member-plan', () => {
    const catalog = read('src/config/routingCatalog.ts');
    expect(catalog).toContain("from '../member-plan/tripsRouting'");
    expect(catalog).not.toMatch(/from '\.\.\/trips\//);
  });

  it('G-chat: empty inbox is coordination-first (no Start a conversation CTA)', () => {
    const list = read('src/components/chat/MessagesInboxList.tsx');
    expect(list).not.toMatch(/Start a conversation/);
    const messages = read('src/pages/Messages.tsx');
    expect(messages).toMatch(/hasInboxThreads/);
  });

  it('G-chat: /groups is manage-only; threads use /chat?group=', () => {
    const groups = read('src/pages/Groups.tsx');
    expect(groups).not.toMatch(/GroupChatThread/);
    expect(groups).toMatch(/activityGroupChatPath/);
    expect(groups).toMatch(/groupsManagePath/);
    const routing = read('src/utils/notificationRouting.ts');
    expect(routing).toMatch(/normalizeConsumerChatDeepLinkPath/);
    expect(routing).toMatch(/messagesGroupPath/);
  });
});
