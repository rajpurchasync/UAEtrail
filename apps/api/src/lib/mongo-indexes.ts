import type { Db } from 'mongodb';
import { COLLECTIONS } from './collections.js';

export const ensureMongoIndexes = async (db: Db): Promise<void> => {
  const userWishlist = db.collection(COLLECTIONS.USER_WISHLIST);
  let existingWishlistIndexes: Awaited<ReturnType<typeof userWishlist.indexes>> = [];
  try {
    existingWishlistIndexes = await userWishlist.indexes();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (!/ns does not exist|NamespaceNotFound/i.test(message)) {
      throw error;
    }
  }
  const retiredWishlistIndexNames = new Set([
    'userId_1_locationId_1',
    'userId_1_eventId_1',
    'userId_1_activityId_1',
    'userId_1_productId_1',
  ]);

  await Promise.all(
    existingWishlistIndexes
      .map((index) => index.name)
      .filter((indexName): indexName is string => typeof indexName === 'string')
      .filter((indexName) => retiredWishlistIndexNames.has(indexName))
      .map((indexName) => userWishlist.dropIndex(indexName))
  );

  await Promise.all([
    db.collection(COLLECTIONS.AUTH_USERS).createIndexes([
      { key: { email: 1 }, unique: true },
      { key: { googleId: 1 }, unique: true, sparse: true },
      { key: { referralCode: 1 }, unique: true }
    ]),
    db.collection(COLLECTIONS.AUTH_REFRESH_TOKENS).createIndexes([
      { key: { tokenHash: 1, userId: 1 } },
      { key: { userId: 1 } }
    ]),
    db.collection(COLLECTIONS.AUTH_EMAIL_VERIFICATION_TOKENS).createIndexes([{ key: { token: 1 } }]),
    db.collection(COLLECTIONS.AUTH_EMAIL_CHANGE_TOKENS).createIndexes([
      { key: { userId: 1, usedAt: 1 } },
      { key: { newEmail: 1, usedAt: 1 } }
    ]),
    db.collection(COLLECTIONS.AUTH_PASSWORD_RESET_TOKENS).createIndexes([{ key: { token: 1 } }]),
    db.collection(COLLECTIONS.TENANT_MEMBERSHIPS).createIndexes([
      { key: { tenantId: 1, userId: 1 }, unique: true },
      { key: { userId: 1 } }
    ]),
    db.collection(COLLECTIONS.AREAS).createIndexes([
      { key: { slug: 1 }, unique: true },
      { key: { status: 1, priority: 1 } },
    ]),
    db.collection(COLLECTIONS.FACILITIES).createIndexes([
      { key: { areaId: 1, facilityKind: 1, status: 1 }, sparse: true },
      { key: { parentPlaceId: 1, facilityKind: 1 }, sparse: true },
      { key: { venueId: 1, facilityKind: 1 }, sparse: true },
      { key: { moderationStatus: 1, publicationStatus: 1 } },
      { key: { registeredByUserId: 1, createdAt: -1 }, sparse: true },
      { key: { submittedById: 1, createdAt: -1 }, sparse: true },
      { key: { geo: '2dsphere' }, sparse: true },
    ]),
    db.collection(COLLECTIONS.PLATFORM_ALERTS).createIndexes([
      {
        key: { active: 1, startsAt: 1, endsAt: 1 },
        name: 'platform_alerts_active_window',
      },
      { key: { region: 1 }, sparse: true },
      { key: { geo: '2dsphere' }, sparse: true },
    ]),
    db.collection(COLLECTIONS.REFERRAL_CLICKS).createIndexes([
      { key: { entityKind: 1, entityId: 1, createdAt: -1 } },
      { key: { createdAt: -1 } },
    ]),
    db.collection(COLLECTIONS.LOCATIONS).createIndexes([
      { key: { status: 1, featured: -1, createdAt: -1 } },
      { key: { submittedById: 1, createdAt: -1 } },
      { key: { areaId: 1, status: 1 }, sparse: true },
      { key: { geo: '2dsphere' } },
      { key: { status: 1, groupRegionBrowseKey: 1, featured: -1 }, sparse: true },
      { key: { countryCode: 1, groupRegionBrowseKey: 1, status: 1 }, sparse: true },
      {
        key: { externalSource: 1, externalId: 1 },
        unique: true,
        sparse: true,
        name: 'externalSource_externalId_unique'
      }
    ]),
    db.collection(COLLECTIONS.LOCATION_UNLOCKS).createIndexes([
      { key: { userId: 1, locationId: 1 }, unique: true },
      { key: { locationId: 1 } }
    ]),
    db.collection(COLLECTIONS.NOTIFICATIONS).createIndexes([{ key: { userId: 1, createdAt: -1 } }]),
    db.collection(COLLECTIONS.SIDE_EFFECT_OUTBOX).createIndexes([
      { key: { status: 1, createdAt: 1 } },
      { key: { kind: 1, status: 1, createdAt: 1 } }
    ]),
    userWishlist.createIndexes([
      { key: { userId: 1, createdAt: -1 } },
      {
        key: { userId: 1, locationId: 1 },
        unique: true,
        name: 'userId_locationId_unique',
        partialFilterExpression: { locationId: { $type: 'string' } }
      },
      {
        key: { locationId: 1 },
        name: 'wishlist_locationId',
        partialFilterExpression: { locationId: { $type: 'string' } }
      },
      {
        key: { userId: 1, areaId: 1 },
        unique: true,
        name: 'userId_areaId_unique',
        partialFilterExpression: { areaId: { $type: 'string' } }
      },
      {
        key: { areaId: 1 },
        name: 'wishlist_areaId',
        partialFilterExpression: { areaId: { $type: 'string' } }
      },
      {
        key: { watchOutingCategory: 1 },
        name: 'wishlist_watch_category',
        partialFilterExpression: { watchOutingCategory: { $type: 'string' } }
      },
      {
        key: { userId: 1, activityId: 1 },
        unique: true,
        name: 'userId_activityId_unique',
        partialFilterExpression: { activityId: { $type: 'string' } }
      },
      {
        key: { userId: 1, merchantId: 1 },
        unique: true,
        name: 'userId_merchantId_unique',
        partialFilterExpression: { merchantId: { $type: 'string' } }
      },
      {
        key: { userId: 1, tenantId: 1 },
        unique: true,
        name: 'userId_tenantId_unique',
        partialFilterExpression: { tenantId: { $type: 'string' } }
      },
      {
        key: { userId: 1, profileUserId: 1 },
        unique: true,
        name: 'userId_profileUserId_unique',
        partialFilterExpression: { profileUserId: { $type: 'string' } }
      }
    ]),
    db.collection(COLLECTIONS.REWARD_LEDGERS).createIndexes([{ key: { userId: 1, action: 1 } }]),
    db.collection(COLLECTIONS.USER_BADGES).createIndexes([{ key: { userId: 1 } }]),
    db.collection(COLLECTIONS.MEMBER_AVAILABILITY).createIndexes([
      { key: { visibility: 1, areaId: 1 } },
      { key: { kinds: 1, visibility: 1 } },
    ]),
    db.collection(COLLECTIONS.USER_GOALS).createIndexes([{ key: { userId: 1, updatedAt: -1 } }]),
    db.collection(COLLECTIONS.MEMBER_MAP_PINS).createIndexes([
      { key: { userId: 1, placeDate: -1 } },
      {
        key: { userId: 1, activityId: 1 },
        unique: true,
        name: 'userId_activityId_checkin_unique',
        partialFilterExpression: { source: 'activity_check_in', activityId: { $type: 'string' } },
      },
    ]),
    db.collection(COLLECTIONS.ACTIVITIES).createIndexes([
      { key: { hostId: 1, status: 1 }, sparse: true },
      { key: { createdById: 1, status: 1 } },
      { key: { participantIntentId: 1 }, sparse: true },
      { key: { activityMode: 1, status: 1, hostId: 1 }, sparse: true },
      { key: { tenantId: 1, startAt: 1 } },
      { key: { status: 1, startAt: 1 } },
      { key: { status: 1, activityType: 1, meetingLat: 1 }, name: 'status_activityType_meetingLat' },
      { key: { locationId: 1 } },
      { key: { featured: 1, status: 1, startAt: 1 } },
      { key: { areaId: 1, status: 1 }, sparse: true },
      { key: { originLat: 1, originLng: 1 }, name: 'origin_lat_lng', sparse: true },
      { key: { geo: '2dsphere' }, sparse: true },
      { key: { status: 1, groupRegionBrowseKey: 1, startAt: 1 }, sparse: true },
    ]),
    db.collection(COLLECTIONS.PUSH_SUBSCRIPTIONS).createIndexes([{ key: { userId: 1 } }]),
    db.collection(COLLECTIONS.TENANTS).createIndexes([
      { key: { slug: 1 }, unique: true },
      { key: { ownerId: 1 } },
      { key: { businessMode: 1, status: 1, hiddenFromPublic: 1 }, sparse: true },
      { key: { status: 1 } },
      { key: { type: 1, ownerId: 1 } },
      { key: { geo: '2dsphere' }, sparse: true },
      { key: { status: 1, groupRegionBrowseKey: 1 }, sparse: true },
    ]),
    db.collection(COLLECTIONS.HOST_APPLICATIONS).createIndexes([
      { key: { status: 1 } },
      { key: { applicantId: 1, createdAt: -1 } }
    ]),
    db.collection(COLLECTIONS.PARTICIPANT_INTENTS).createIndexes([
      { key: { userId: 1, createdAt: -1 } },
      { key: { status: 1, createdAt: -1 } },
      { key: { areaId: 1, status: 1 }, sparse: true },
    ]),
    db.collection(COLLECTIONS.ACTIVITY_REQUESTS).createIndexes([
      { key: { activityId: 1, userId: 1 }, unique: true },
      { key: { activityId: 1, status: 1, createdAt: 1 } },
      { key: { userId: 1, createdAt: -1 } }
    ]),
    db.collection(COLLECTIONS.ACTIVITY_PARTICIPANTS).createIndexes([
      { key: { activityId: 1, userId: 1 }, unique: true },
      { key: { activityId: 1, createdAt: 1 } },
      { key: { userId: 1 } },
      { key: { userId: 1, hostRatedAt: 1 } },
      { key: { requestId: 1 } }
    ]),
    db.collection(COLLECTIONS.MEMBER_VEHICLES).createIndexes([
      { key: { userId: 1, updatedAt: -1 } }
    ]),
    db.collection(COLLECTIONS.CHAT_MESSAGES).createIndexes([
      { key: { senderId: 1, receiverId: 1, createdAt: -1 } },
      { key: { receiverId: 1, senderId: 1, createdAt: -1 } },
      { key: { receiverId: 1, readAt: 1 } }
    ]),
    db.collection(COLLECTIONS.SOCIAL_REVIEWS).createIndexes([
      { key: { targetType: 1, targetId: 1, createdAt: -1 } },
      { key: { targetType: 1, targetId: 1, userId: 1 }, name: 'one_per_user', unique: true },
      { key: { userId: 1, createdAt: -1 } }
    ]),
    db.collection(COLLECTIONS.CONTENT_REPORTS).createIndexes([
      { key: { createdAt: -1 }, name: 'reports_queue' },
      { key: { targetType: 1, createdAt: -1 }, name: 'reports_by_type' },
    ]),
    db.collection(COLLECTIONS.MERCHANT_PROFILES).createIndexes([
      { key: { adminIds: 1 } },
      { key: { tenantId: 1 }, sparse: true, unique: true },
    ]),
    db.collection(COLLECTIONS.MEDIA_ASSETS).createIndexes([
      { key: { uploadedById: 1, createdAt: -1 } },
      { key: { tenantId: 1, createdAt: -1 }, sparse: true },
      { key: { key: 1 }, unique: true, sparse: true }
    ]),
    db.collection(COLLECTIONS.AUDIT_LOGS).createIndexes([
      { key: { actorId: 1, createdAt: -1 } },
      { key: { entityType: 1, entityId: 1, createdAt: -1 } },
      { key: { tenantId: 1, createdAt: -1 }, sparse: true }
    ]),
    db.collection(COLLECTIONS.MEMBER_GROUPS).createIndexes([
      { key: { adminUserId: 1, createdAt: -1 } },
      { key: { activityId: 1 }, unique: true, sparse: true },
      { key: { kind: 1, teamLabel: 1 } },
    ]),
    db.collection(COLLECTIONS.MEMBER_GROUP_MEMBERS).createIndexes([
      { key: { groupId: 1, userId: 1 }, unique: true, partialFilterExpression: { userId: { $type: 'string' } } },
      { key: { userId: 1, createdAt: -1 } },
      { key: { groupId: 1, createdAt: 1 } }
    ]),
    db.collection(COLLECTIONS.MEMBER_GROUP_INVITES).createIndexes([
      { key: { groupId: 1, email: 1, status: 1 } },
      { key: { token: 1 }, unique: true },
      { key: { email: 1, status: 1 } }
    ]),
    db.collection(COLLECTIONS.ACTIVITY_FAMILY_INVITES).createIndexes([
      { key: { token: 1 }, unique: true },
      { key: { inviteeUserId: 1, status: 1, createdAt: -1 } },
      { key: { activityId: 1, inviteeUserId: 1, status: 1 } },
      { key: { activityId: 1, requestId: 1, membershipId: 1, status: 1 } },
    ]),
    db.collection(COLLECTIONS.MEMBER_GROUP_WALL).createIndexes([
      { key: { groupId: 1, createdAt: -1 } }
    ]),
    db.collection(COLLECTIONS.MEMBER_GROUP_WALL_REACTIONS).createIndexes([
      { key: { messageId: 1, userId: 1, kind: 1 }, unique: true },
      { key: { groupId: 1, messageId: 1 } }
    ]),
    db.collection(COLLECTIONS.BUDDY_REQUESTS).createIndexes([
      { key: { fromUserId: 1, toUserId: 1, status: 1 } },
      { key: { toUserId: 1, status: 1, createdAt: -1 } },
      { key: { fromUserId: 1, status: 1, createdAt: -1 } },
      {
        key: { fromUserId: 1, toUserId: 1 },
        unique: true,
        name: 'buddy_pending_pair_unique',
        partialFilterExpression: { status: 'pending' }
      }
    ]),
    db.collection(COLLECTIONS.BUDDY_PAIRS).createIndexes([
      { key: { userIds: 1 } },
      { key: { createdAt: -1 } }
    ]),
    db.collection(COLLECTIONS.USER_FOLLOWS).createIndexes([
      { key: { followerId: 1, followingId: 1 }, unique: true },
      { key: { followingId: 1, createdAt: -1 } },
      { key: { followerId: 1, createdAt: -1 } }
    ]),
    db.collection(COLLECTIONS.ENTITY_FOLLOWS).createIndexes([
      { key: { followerId: 1, kind: 1, targetId: 1 }, unique: true },
      { key: { kind: 1, targetId: 1, createdAt: -1 } },
      { key: { followerId: 1, createdAt: -1 } }
    ]),
    db.collection(COLLECTIONS.MEMBER_PROFILE_VIEWS).createIndexes([
      { key: { profileUserId: 1, viewedAt: -1 } },
      { key: { profileUserId: 1, viewerUserId: 1, viewedOn: 1 } },
      { key: { viewerUserId: 1, source: 1, viewedAt: -1 } }
    ]),
    db.collection(COLLECTIONS.ACTIVITY_INVITES).createIndexes([
      { key: { activityId: 1, fromUserId: 1, toUserId: 1, status: 1 } },
      { key: { toUserId: 1, status: 1, createdAt: -1 } }
    ]),
    db.collection(COLLECTIONS.PLACE_TRACKS).createIndexes([{ key: { updatedAt: -1 } }]),
    db.collection(COLLECTIONS.PLACE_GUIDES).createIndexes([{ key: { updatedAt: -1 } }]),
    db.collection(COLLECTIONS.WEATHER_CACHE).createIndexes([
      { key: { expiresAt: 1 }, expireAfterSeconds: 0, name: 'weather_cache_ttl' },
    ]),
    db.collection(COLLECTIONS.ACTIVITY_PRIVATE).createIndexes([
      { key: { updatedAt: -1 } },
      /** Sparse so docs without `exactGeo` are omitted (Mongo forbids sparse + partial on one index). */
      { key: { exactGeo: '2dsphere' }, sparse: true },
    ]),
    db.collection(COLLECTIONS.GEO_NODES).createIndexes([
      { key: { path: 1 }, name: 'path_unique', unique: true },
      { key: { parentId: 1, sort: 1 }, name: 'children' },
      { key: { ancestors: 1, level: 1 }, name: 'subtree' },
      {
        key: { geometry: '2dsphere' },
        name: 'geometry',
        partialFilterExpression: { geometry: { $exists: true } },
      },
      { key: { center: '2dsphere' }, name: 'center' },
      { key: { 'dedupe.nameKey': 1, parentId: 1 }, name: 'dedupe_name' },
      { key: { isoCode: 1 }, name: 'iso_unique', unique: true, sparse: true },
    ]),
    db.collection(COLLECTIONS.GEO_OUTBOX).createIndexes([{ key: { batch: 1, _id: 1 }, name: 'claim' }]),
    db.collection(COLLECTIONS.LOCATIONS).createIndexes([
      {
        key: { updatedAt: 1 },
        name: 'needs_review',
        partialFilterExpression: { 'needsReview.0': { $exists: true } },
      },
      {
        key: { 'geoRef.chain': 1, activityType: 1, status: 1 },
        name: 'by_chain',
      },
      {
        key: { 'geoRef.searchTokens': 1, status: 1 },
        name: 'geo_search_tokens',
      },
      {
        key: { 'dedupe.cells': 1, activityType: 1 },
        name: 'dedupe_cells',
      },
    ]),
    db.collection(COLLECTIONS.ACTIVITIES).createIndexes([
      {
        key: { 'geoRef.chain': 1, activityType: 1, status: 1, startAt: 1 },
        name: 'by_chain_active',
      },
      {
        key: { 'geoRef.searchTokens': 1, status: 1 },
        name: 'geo_search_tokens',
      },
      { key: { status: 1, endAt: 1 }, name: 'expiry_sweep' },
      {
        key: { status: 1, activityType: 1, startAt: 1, _id: 1 },
        name: 'browse_upcoming',
      },
      {
        key: { locationId: 1, status: 1, startAt: 1 },
        name: 'by_place_upcoming',
      },
      { key: { hostId: 1, startAt: -1 }, name: 'by_host', sparse: true },
      {
        key: { updatedAt: 1 },
        name: 'needs_review',
        partialFilterExpression: { 'needsReview.0': { $exists: true } },
      },
    ]),
    db.collection(COLLECTIONS.FACILITIES).createIndexes([
      {
        key: { 'geoRef.chain': 1, facilityKind: 1, status: 1 },
        name: 'by_chain',
      },
      {
        key: { 'geoRef.searchTokens': 1, status: 1 },
        name: 'geo_search_tokens',
      },
      {
        key: { 'dedupe.cells': 1, facilityKind: 1 },
        name: 'dedupe_cells',
      },
    ]),
    db.collection(COLLECTIONS.AMENITY_REPORTS).createIndexes([
      { key: { status: 1, createdAt: 1 }, name: 'amenity_reports_queue' },
      { key: { facilityId: 1, createdAt: -1 }, name: 'amenity_reports_by_facility' },
    ]),
    db.collection(COLLECTIONS.SUBMISSIONS).createIndexes([
      {
        key: { kind: 1, facilityType: 1, 'dedupe.nameKey': 1, 'dedupe.cells.0': 1 },
        name: 'pending_unique',
        unique: true,
        partialFilterExpression: { status: 'pending' },
      },
      { key: { status: 1, kind: 1, createdAt: 1 }, name: 'queue' },
      { key: { submittedBy: 1, createdAt: -1 }, name: 'by_user' },
      {
        key: { 'dedupe.cells': 1, status: 1 },
        name: 'pending_near',
        partialFilterExpression: { status: 'pending' },
      },
    ]),
    db.collection(COLLECTIONS.CATALOGS).createIndexes([{ key: { kind: 1, key: 1 }, unique: true }]),
    db.collection(COLLECTIONS.VERIFICATION_DOCUMENTS).createIndexes([
      { key: { organizerId: 1, createdAt: -1 }, name: 'by_organizer' },
      { key: { status: 1, createdAt: 1 }, name: 'verification_queue' },
    ]),
    db.collection(COLLECTIONS.PAYMENTS).createIndexes([
      { key: { activityId: 1, createdAt: -1 }, name: 'by_activity' },
      { key: { userId: 1, createdAt: -1 }, name: 'by_user' },
    ])
  ]);
};
