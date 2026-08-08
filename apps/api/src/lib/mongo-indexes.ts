import type { Db } from 'mongodb';

export const ensureMongoIndexes = async (db: Db): Promise<void> => {
  const userFavorites = db.collection('user_favorites');
  const existingFavoriteIndexes = await userFavorites.indexes();
  const legacyFavoriteIndexNames = new Set(['userId_1_locationId_1', 'userId_1_eventId_1', 'userId_1_productId_1']);

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
        key: { userId: 1, eventId: 1 },
        unique: true,
        name: 'userId_eventId_unique',
        partialFilterExpression: { eventId: { $type: 'string' } }
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
    db.collection('events').createIndexes([
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
    db.collection('event_requests').createIndexes([
      { key: { eventId: 1, userId: 1 }, unique: true },
      { key: { eventId: 1, status: 1, createdAt: 1 } },
      { key: { userId: 1, createdAt: -1 } }
    ]),
    db.collection('event_participants').createIndexes([
      { key: { eventId: 1, userId: 1 }, unique: true },
      { key: { eventId: 1, createdAt: 1 } },
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
    ])
  ]);
};
