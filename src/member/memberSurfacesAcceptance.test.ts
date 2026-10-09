/**
 * Automated gates from `docs/experiment/member-surfaces-implementation-plan.md` §11.
 * UI flows (G-manage approve from Plan sheet) remain manual QA.
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

  it('G-seek: explore map build does not merge legacy demand pins into payload', () => {
    const exploreMap = read('apps/api/src/lib/explore-map.ts');
    expect(exploreMap).not.toMatch(/listActiveParticipantIntentsForMap\(/);
  });

  it('G-seek: publish fan-out prefers activity pin when seeking id exists', () => {
    const publish = read('apps/api/src/services/member-publish-notifications.ts');
    expect(publish).toContain('exploreSeekingPinPath');
    expect(publish).toContain('seekingActivityId');
  });
});
