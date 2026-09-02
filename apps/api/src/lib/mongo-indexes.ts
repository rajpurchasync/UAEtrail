import type { Db } from 'mongodb';
import { COLLECTIONS } from './collections.js';

export const ensureMongoIndexes = async (db: Db): Promise<void> => {
  const userFavorites = db.collection('user_favorites');
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
    db.collection('auth_users').createIndexes([
      { key: { email: 1 }, unique: true },
      { key: { googleId: 1 }, unique: true, sparse: true },
      { key: { referralCode: 1 }, unique: true }
    ]),
    db.collection('auth_refresh_tokens').createIndexes([
      { key: { tokenHash: 1, userId: 1 } },
      { key: { userId: 1 } }
    ]),
    db.collection('auth_email_verification_tokens').createIndexes([{ key: { token: 1 } }]),
    db.collection('auth_email_change_tokens').createIndexes([
      { key: { userId: 1, usedAt: 1 } },
      { key: { newEmail: 1, usedAt: 1 } }
    ]),
    db.collection('auth_password_reset_tokens').createIndexes([{ key: { token: 1 } }]),
    db.collection('tenant_memberships').createIndexes([
      { key: { tenantId: 1, userId: 1 }, unique: true },
      { key: { userId: 1 } }
    ]),
    db.collection('locations').createIndexes([
      { key: { status: 1, featured: -1, createdAt: -1 } },
      { key: { submittedById: 1, createdAt: -1 } },
      { key: { geo: '2dsphere' } }
    ]),
    db.collection('notifications').createIndexes([{ key: { userId: 1, createdAt: -1 } }]),
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
      }
    ]),
    db.collection('reward_ledgers').createIndexes([{ key: { userId: 1, action: 1 } }]),
    db.collection('user_badges').createIndexes([{ key: { userId: 1 } }]),
    db.collection(COLLECTIONS.ACTIVITIES).createIndexes([
      { key: { tenantId: 1, startAt: 1 } },
      { key: { status: 1, startAt: 1 } },
      { key: { locationId: 1 } },
      { key: { featured: 1, status: 1, startAt: 1 } }
    ]),
    db.collection('push_subscriptions').createIndexes([{ key: { userId: 1 } }]),
    db.collection('tenants').createIndexes([
      { key: { slug: 1 }, unique: true },
      { key: { ownerId: 1 } },
      { key: { status: 1 } }
    ]),
    db.collection('organizer_applications').createIndexes([
      { key: { status: 1 } },
      { key: { applicantId: 1, createdAt: -1 } }
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
    db.collection('chat_messages').createIndexes([
      { key: { senderId: 1, receiverId: 1, createdAt: -1 } },
      { key: { receiverId: 1, readAt: 1 } }
    ]),
    db.collection('social_reviews').createIndexes([
      { key: { targetType: 1, targetId: 1, createdAt: -1 } },
      { key: { userId: 1, createdAt: -1 } }
    ]),
    db.collection('social_posts').createIndexes([
      { key: { category: 1, createdAt: -1 } },
      { key: { authorId: 1, createdAt: -1 } }
    ]),
    db.collection('social_post_replies').createIndexes([
      { key: { postId: 1, createdAt: 1 } },
      { key: { authorId: 1 } }
    ]),
    db.collection('social_post_reply_likes').createIndexes([
      { key: { postId: 1, replyId: 1, userId: 1 }, unique: true },
      { key: { userId: 1 } }
    ]),
    db.collection('social_post_likes').createIndexes([
      { key: { postId: 1, userId: 1 }, unique: true },
      { key: { userId: 1 } }
    ]),
    db.collection('shop_orders').createIndexes([
      { key: { userId: 1, createdAt: -1 } },
      { key: { status: 1, createdAt: -1 } },
      { key: { stripeSessionId: 1 }, sparse: true }
    ]),
    db.collection('products').createIndexes([
      { key: { merchantId: 1, status: 1, createdAt: -1 } }
    ]),
    db.collection('merchant_profiles').createIndexes([
      { key: { adminIds: 1 } }
    ]),
    db.collection('social_groups').createIndexes([{ key: { adminUserId: 1, createdAt: -1 } }]),
    db.collection('social_group_members').createIndexes([
      { key: { groupId: 1, userId: 1 }, unique: true, partialFilterExpression: { userId: { $type: 'string' } } },
      { key: { userId: 1, createdAt: -1 } },
      { key: { groupId: 1, createdAt: 1 } }
    ]),
    db.collection('social_group_invites').createIndexes([
      { key: { groupId: 1, email: 1, status: 1 } },
      { key: { token: 1 }, unique: true },
      { key: { email: 1, status: 1 } }
    ]),
    db.collection('social_group_wall').createIndexes([
      { key: { groupId: 1, createdAt: -1 } }
    ]),
    db.collection('social_group_wall_reactions').createIndexes([
      { key: { messageId: 1, userId: 1, kind: 1 }, unique: true },
      { key: { groupId: 1, messageId: 1 } }
    ])
  ]);
};
