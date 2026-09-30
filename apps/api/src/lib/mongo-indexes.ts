import type { Db } from 'mongodb';
import { COLLECTIONS } from './collections.js';

export const ensureMongoIndexes = async (db: Db): Promise<void> => {
  const userFavorites = db.collection(COLLECTIONS.USER_FAVORITES);
  let existingFavoriteIndexes: Awaited<ReturnType<typeof userFavorites.indexes>> = [];
  try {
    existingFavoriteIndexes = await userFavorites.indexes();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (!/ns does not exist|NamespaceNotFound/i.test(message)) {
      throw error;
    }
  }
  const legacyFavoriteIndexNames = new Set([
    'userId_1_locationId_1',
    'userId_1_eventId_1',
    'userId_1_activityId_1',
    'userId_1_productId_1',
  ]);

  await Promise.all(
    existingFavoriteIndexes
      .map((index) => index.name)
      .filter((indexName): indexName is string => typeof indexName === 'string')
      .filter((indexName) => legacyFavoriteIndexNames.has(indexName))
      .map((indexName) => userFavorites.dropIndex(indexName))
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
    db.collection(COLLECTIONS.LOCATIONS).createIndexes([
      { key: { status: 1, featured: -1, createdAt: -1 } },
      { key: { submittedById: 1, createdAt: -1 } },
      { key: { geo: '2dsphere' } },
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
    userFavorites.createIndexes([
      { key: { userId: 1, createdAt: -1 } },
      {
        key: { userId: 1, locationId: 1 },
        unique: true,
        name: 'userId_locationId_unique',
        partialFilterExpression: { locationId: { $type: 'string' } }
      },
      {
        key: { userId: 1, activityId: 1 },
        unique: true,
        name: 'userId_activityId_unique',
        partialFilterExpression: { activityId: { $type: 'string' } }
      },
      {
        key: { userId: 1, productId: 1 },
        unique: true,
        name: 'userId_productId_unique',
        partialFilterExpression: { productId: { $type: 'string' } }
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
    db.collection(COLLECTIONS.ACTIVITIES).createIndexes([
      { key: { tenantId: 1, startAt: 1 } },
      { key: { status: 1, startAt: 1 } },
      { key: { locationId: 1 } },
      { key: { featured: 1, status: 1, startAt: 1 } }
    ]),
    db.collection(COLLECTIONS.PUSH_SUBSCRIPTIONS).createIndexes([{ key: { userId: 1 } }]),
    db.collection(COLLECTIONS.TENANTS).createIndexes([
      { key: { slug: 1 }, unique: true },
      { key: { ownerId: 1 } },
      { key: { status: 1 } },
      { key: { type: 1, ownerId: 1 } }
    ]),
    db.collection(COLLECTIONS.HOST_APPLICATIONS).createIndexes([
      { key: { status: 1 } },
      { key: { applicantId: 1, createdAt: -1 } }
    ]),
    db.collection(COLLECTIONS.PARTICIPANT_INTENTS).createIndexes([
      { key: { userId: 1, createdAt: -1 } },
      { key: { status: 1, createdAt: -1 } }
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
      { key: { requestId: 1 } }
    ]),
    db.collection(COLLECTIONS.CHAT_MESSAGES).createIndexes([
      { key: { senderId: 1, receiverId: 1, createdAt: -1 } },
      { key: { receiverId: 1, readAt: 1 } }
    ]),
    db.collection(COLLECTIONS.SOCIAL_REVIEWS).createIndexes([
      { key: { targetType: 1, targetId: 1, createdAt: -1 } },
      { key: { userId: 1, createdAt: -1 } }
    ]),
    db.collection(COLLECTIONS.SOCIAL_POSTS).createIndexes([
      { key: { category: 1, createdAt: -1 } },
      { key: { authorId: 1, createdAt: -1 } }
    ]),
    db.collection(COLLECTIONS.SOCIAL_POST_REPLIES).createIndexes([
      { key: { postId: 1, createdAt: 1 } },
      { key: { authorId: 1 } }
    ]),
    db.collection(COLLECTIONS.SOCIAL_POST_REPLY_LIKES).createIndexes([
      { key: { postId: 1, replyId: 1, userId: 1 }, unique: true },
      { key: { userId: 1 } }
    ]),
    db.collection(COLLECTIONS.SOCIAL_POST_LIKES).createIndexes([
      { key: { postId: 1, userId: 1 }, unique: true },
      { key: { userId: 1 } }
    ]),
    db.collection(COLLECTIONS.SHOP_ORDERS).createIndexes([
      { key: { userId: 1, createdAt: -1 } },
      { key: { status: 1, createdAt: -1 } },
      { key: { stripeSessionId: 1 }, sparse: true },
      { key: { 'items.id': 1 }, sparse: true },
      { key: { 'items.productId': 1 }, sparse: true },
    ]),
    db.collection(COLLECTIONS.PRODUCTS).createIndexes([
      { key: { merchantId: 1, status: 1, createdAt: -1 } }
    ]),
    db.collection(COLLECTIONS.MERCHANT_PROFILES).createIndexes([
      { key: { adminIds: 1 } },
      { key: { tenantId: 1 }, sparse: true, unique: true },
    ]),
    db.collection(COLLECTIONS.ORDER_LINE_ITEMS).createIndexes([
      { key: { orderId: 1, createdAt: -1 } },
      { key: { productId: 1 } },
      { key: { status: 1, createdAt: -1 } }
    ]),
    db.collection(COLLECTIONS.PRODUCT_CLICKS).createIndexes([
      { key: { productId: 1, createdAt: -1 } },
      { key: { userId: 1, createdAt: -1 } }
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
    db.collection(COLLECTIONS.SOCIAL_GROUPS).createIndexes([
      { key: { adminUserId: 1, createdAt: -1 } },
      { key: { activityId: 1 }, unique: true, sparse: true }
    ]),
    db.collection(COLLECTIONS.SOCIAL_GROUP_MEMBERS).createIndexes([
      { key: { groupId: 1, userId: 1 }, unique: true, partialFilterExpression: { userId: { $type: 'string' } } },
      { key: { userId: 1, createdAt: -1 } },
      { key: { groupId: 1, createdAt: 1 } }
    ]),
    db.collection(COLLECTIONS.SOCIAL_GROUP_INVITES).createIndexes([
      { key: { groupId: 1, email: 1, status: 1 } },
      { key: { token: 1 }, unique: true },
      { key: { email: 1, status: 1 } }
    ]),
    db.collection(COLLECTIONS.SOCIAL_GROUP_WALL).createIndexes([
      { key: { groupId: 1, createdAt: -1 } }
    ]),
    db.collection(COLLECTIONS.SOCIAL_GROUP_WALL_REACTIONS).createIndexes([
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
    ])
  ]);
};
