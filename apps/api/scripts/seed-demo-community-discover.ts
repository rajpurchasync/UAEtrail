/**
 * Discoverable community clubs (`community_groups`) for local QA — search Groups pill, host manage, join flows.
 * Owner: host@uaetrails.app (Omar) — three join-policy variants.
 */
import type { CommunityJoinPolicy, GeoRef } from '@uaetrail/shared-types';
import { curatedDestinationSeedId } from '@uaetrail/shared-types';
import { COLLECTIONS } from '../src/lib/collections.js';
import { getMongoClient } from '../src/lib/mongo.js';
import { findCommunityBySlug } from '../src/lib/community-groups-store.js';
import { insertCommunityMember } from '../src/lib/community-group-members-store.js';
import {
  findCommunityGroupAdmin,
  insertCommunityGroupAdmin,
} from '../src/lib/community-group-admins-store.js';
import { seedCommunityOwnerAdmin } from '../src/services/community-host-access.js';

export const SEED_COMMUNITY_SLUGS = [
  'seed-dubai-weekend-hikers',
  'seed-abu-dhabi-trail-runners',
  'seed-dubai-family-campers',
] as const;

export type SeedDemoCommunityDiscoverInput = {
  hostId: string;
  visitorId: string;
  visitor2Id: string;
  guideId: string;
  organizerId: string;
};

type SeedCommunitySpec = {
  id: string;
  slug: (typeof SEED_COMMUNITY_SLUGS)[number];
  name: string;
  summary: string;
  description: string;
  joinPolicy: CommunityJoinPolicy;
  emirate: string;
  destinationId: string;
  memberCount: number;
};

const demoGeoRef = (emirate: string, destinationId: string): GeoRef => ({
  chain: [],
  countryId: 'ae',
  stateId: emirate.toLowerCase().replace(/\s+/g, '-'),
  areaId,
  path: `United Arab Emirates/${emirate}`,
  names: {
    country: 'United Arab Emirates',
    state: emirate,
    area: emirate,
  },
  searchTokens: ['united arab emirates', emirate.toLowerCase(), 'uae'],
});

const SEED_COMMUNITIES: SeedCommunitySpec[] = [
  {
    id: 'seed-community-dxb-hikers',
    slug: 'seed-dubai-weekend-hikers',
    name: 'Dubai Weekend Hikers',
    summary: 'Friday–Sunday hikes around Hatta, Shawka, and desert lakes — all paces welcome.',
    description:
      'We post weekly hikes on the map. Open join — show up, say hi, and find your pace group at the trailhead.',
    joinPolicy: 'open',
    emirate: 'Dubai',
    destinationId: curatedDestinationSeedId('hatta'),
    memberCount: 24,
  },
  {
    id: 'seed-community-auh-runners',
    slug: 'seed-abu-dhabi-trail-runners',
    name: 'Abu Dhabi Trail Runners',
    summary: 'Early-morning trail runs and Jebel Hafeet hill repeats — request to join.',
    description:
      'Small crew focused on trail etiquette and steady pacing. Host approves new members to keep group size manageable.',
    joinPolicy: 'request',
    emirate: 'Abu Dhabi',
    destinationId: curatedDestinationSeedId('jebelHafeet'),
    memberCount: 18,
  },
  {
    id: 'seed-community-dxb-campers',
    slug: 'seed-dubai-family-campers',
    name: 'Dubai Family Campers',
    summary: 'Family-friendly desert camps and stargazing — invite or host approval only.',
    description:
      'Weekend family camps with early bedtimes and shared gear lists. Join via invite from a member or host.',
    joinPolicy: 'invite',
    emirate: 'Dubai',
    destinationId: curatedDestinationSeedId('alQudra'),
    memberCount: 11,
  },
];

const upsertMember = async (
  communityId: string,
  userId: string,
  status: 'member' | 'pending'
): Promise<void> => {
  const col = getMongoClient().db().collection(COLLECTIONS.COMMUNITY_GROUP_MEMBERS);
  await col.deleteOne({ communityId, userId });
  await insertCommunityMember({ communityId, userId, status });
};

const upsertCoAdmin = async (communityId: string, userId: string): Promise<void> => {
  const existing = await findCommunityGroupAdmin(communityId, userId);
  if (existing) return;
  await insertCommunityGroupAdmin({ communityId, userId, role: 'admin' });
};

export const seedDemoCommunityDiscover = async (input: SeedDemoCommunityDiscoverInput): Promise<void> => {
  const db = getMongoClient().db();
  const groupsCol = db.collection(COLLECTIONS.COMMUNITY_GROUPS);
  const now = new Date();

  const prior = await groupsCol
    .find({ slug: { $in: [...SEED_COMMUNITY_SLUGS] } })
    .project({ _id: 1 })
    .toArray();
  const priorIds = prior.map((row) => String(row._id));
  if (priorIds.length > 0) {
    await db.collection(COLLECTIONS.COMMUNITY_GROUP_MEMBERS).deleteMany({ communityId: { $in: priorIds } });
    await db.collection(COLLECTIONS.COMMUNITY_GROUP_ADMINS).deleteMany({ communityId: { $in: priorIds } });
    await db.collection(COLLECTIONS.COMMUNITY_GROUP_INVITES).deleteMany({ communityId: { $in: priorIds } });
  }

  for (const spec of SEED_COMMUNITIES) {
    await groupsCol.deleteOne({ slug: spec.slug });
    await groupsCol.insertOne({
      _id: spec.id,
      id: spec.id,
      name: spec.name,
      slug: spec.slug,
      summary: spec.summary,
      description: spec.description,
      policies: 'Be kind · pack out trash · no spam in chat.',
      bannerUrl: null,
      visibility: 'public',
      joinPolicy: spec.joinPolicy,
      geoRef: demoGeoRef(spec.emirate, spec.areaId),
      adminUserId: input.hostId,
      status: 'active',
      memberCount: spec.memberCount,
      createdAt: now,
      updatedAt: now,
    });
  }

  const hikers = await findCommunityBySlug('seed-dubai-weekend-hikers');
  const runners = await findCommunityBySlug('seed-abu-dhabi-trail-runners');
  const campers = await findCommunityBySlug('seed-dubai-family-campers');
  if (!hikers || !runners || !campers) {
    console.warn('[seed] seedDemoCommunityDiscover skipped — could not load seeded communities');
    return;
  }

  for (const communityId of [hikers.id, runners.id, campers.id]) {
    await seedCommunityOwnerAdmin(communityId, input.hostId);
    await upsertMember(communityId, input.hostId, 'member');
  }

  await upsertMember(hikers.id, input.visitorId, 'member');
  await upsertMember(hikers.id, input.organizerId, 'member');

  await upsertMember(runners.id, input.visitorId, 'member');
  await upsertMember(runners.id, input.visitor2Id, 'pending');
  await upsertCoAdmin(runners.id, input.guideId);

  await upsertMember(campers.id, input.visitorId, 'member');

  console.log('[seed] Community discover demo seeded (3 public clubs — host@ owns all)');
};

export const logCommunityDiscoverPlaybook = (): void => {
  const passwordHint = process.env.DEMO_ACCOUNT_PASSWORD?.trim()
    ? '(password: DEMO_ACCOUNT_PASSWORD from .env)'
    : '(set DEMO_ACCOUNT_PASSWORD in .env — see docs/DEV_RUN.md)';
  console.log(
    `Community discover QA:\n` +
      `  • Explore search → Groups pill: Dubai Weekend Hikers · Abu Dhabi Trail Runners · Dubai Family Campers\n` +
      `  • Host manage (log in as host@uaetrails.app ${passwordHint}):\n` +
      `      – /clubs/seed-dubai-weekend-hikers — open join\n` +
      `      – /clubs/seed-abu-dhabi-trail-runners — approve visitor2@ pending join\n` +
      `      – /clubs/seed-dubai-family-campers — invite-only\n` +
      `  • visitor@: member of hikers + campers; pending on runners\n` +
      `  • guide@: co-admin on Abu Dhabi Trail Runners\n` +
      `  • Groups hub (/groups): Communities section lists host + joined rows`
  );
};