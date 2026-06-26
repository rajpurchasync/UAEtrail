import { prisma } from '../lib/prisma.js';

export interface UserDataExport {
  exportedAt: string;
  account: {
    id: string;
    email: string;
    role: string;
    authProvider: string;
    createdAt: Date;
    emailVerifiedAt: Date | null;
  };
  profile: {
    displayName: string | null;
    phone: string | null;
    bio: string | null;
    avatarUrl: string | null;
    rewardPoints: number;
    membershipTier: string;
  } | null;
  favorites: Array<{ id: string; locationId: string | null; eventId: string | null; createdAt: Date }>;
  tripRequests: Array<{ id: string; eventId: string; status: string; createdAt: Date }>;
  participations: Array<{ id: string; eventId: string; checkedInAt: Date | null; createdAt: Date }>;
  shopOrders: Array<{ id: string; status: string; totalAed: number; createdAt: Date }>;
  rewardLedger: Array<{ action: string; points: number; label: string | null; createdAt: Date }>;
  badges: Array<{ badgeKey: string; earnedAt: Date }>;
  pushSubscriptionCount: number;
}

export async function buildUserDataExport(userId: string): Promise<UserDataExport> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      profile: true,
      favorites: { select: { id: true, locationId: true, eventId: true, createdAt: true } },
      requests: { select: { id: true, eventId: true, status: true, createdAt: true }, orderBy: { createdAt: 'desc' }, take: 200 },
      participants: {
        select: { id: true, eventId: true, checkedInAt: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
        take: 200
      },
      shopOrders: { select: { id: true, status: true, totalAed: true, createdAt: true }, orderBy: { createdAt: 'desc' }, take: 100 },
      rewardLedger: { select: { action: true, points: true, label: true, createdAt: true }, orderBy: { createdAt: 'desc' }, take: 500 },
      badges: { select: { badgeKey: true, earnedAt: true } },
      _count: { select: { pushSubscriptions: true } }
    }
  });

  if (!user) {
    throw new Error('User not found');
  }

  return {
    exportedAt: new Date().toISOString(),
    account: {
      id: user.id,
      email: user.email,
      role: user.role,
      authProvider: user.authProvider,
      createdAt: user.createdAt,
      emailVerifiedAt: user.emailVerifiedAt
    },
    profile: user.profile
      ? {
          displayName: user.profile.displayName,
          phone: user.profile.phone,
          bio: user.profile.bio,
          avatarUrl: user.profile.avatarUrl,
          rewardPoints: user.profile.rewardPoints,
          membershipTier: user.profile.membershipTier
        }
      : null,
    favorites: user.favorites,
    tripRequests: user.requests.map((r) => ({
      id: r.id,
      eventId: r.eventId,
      status: r.status,
      createdAt: r.createdAt
    })),
    participations: user.participants.map((p) => ({
      id: p.id,
      eventId: p.eventId,
      checkedInAt: p.checkedInAt,
      createdAt: p.createdAt
    })),
    shopOrders: user.shopOrders,
    rewardLedger: user.rewardLedger.map((e) => ({
      action: e.action,
      points: e.points,
      label: e.label,
      createdAt: e.createdAt
    })),
    badges: user.badges,
    pushSubscriptionCount: user._count.pushSubscriptions
  };
}
