import type { EntityFollowKind } from '@uaetrail/shared-types';
import { NotificationType } from '../domain/enums.js';
import { listEntityFollowerIds } from '../lib/entity-follow-store.js';
import { activityDetailPath } from '../lib/member-routes.js';
import { findMerchantProfileByTenantId } from '../lib/shop-store.js';
import { createNotificationsMany } from '../lib/notifications-store.js';
import { resolveNotificationActorDisplayNamesForRecipients } from './notification-actor-label.js';
import { logger } from '../lib/logger.js';

const entityLabel = (kind: EntityFollowKind, name: string): string => {
  if (kind === 'location') return name;
  if (kind === 'tenant') return name;
  return name;
};

/** Notify members following a place, team, or shop when a hosted activity is published there. */
export const notifyEntityFollowersOnActivityPublished = async (input: {
  activityId: string;
  title: string;
  hostUserId: string;
  locationId: string | null;
  tenantId: string | null;
  locationName?: string | null;
  tenantName?: string | null;
}): Promise<void> => {
  try {
    type Target = { kind: EntityFollowKind; targetId: string; label: string };
    const targets: Target[] = [];

    if (input.locationId) {
      targets.push({
        kind: 'location',
        targetId: input.locationId,
        label: input.locationName?.trim() || 'this place',
      });
    }
    if (input.tenantId) {
      targets.push({
        kind: 'tenant',
        targetId: input.tenantId,
        label: input.tenantName?.trim() || 'this host',
      });
      const merchant = await findMerchantProfileByTenantId(input.tenantId);
      if (merchant) {
        targets.push({
          kind: 'shop',
          targetId: merchant.id,
          label: merchant.shopName?.trim() || 'this shop',
        });
      }
    }

    if (targets.length === 0) return;

    const recipientReasons = new Map<string, { kind: EntityFollowKind; label: string }>();

    for (const target of targets) {
      const followerIds = await listEntityFollowerIds(target.kind, target.targetId);
      for (const userId of followerIds) {
        if (userId === input.hostUserId) continue;
        if (!recipientReasons.has(userId)) {
          recipientReasons.set(userId, { kind: target.kind, label: target.label });
        }
      }
    }

    if (recipientReasons.size === 0) return;

    const path = activityDetailPath(input.activityId);
    const recipientIds = [...recipientReasons.keys()];
    const actorNames = await resolveNotificationActorDisplayNamesForRecipients(
      input.hostUserId,
      recipientIds
    );
    const rows = recipientIds.map((userId) => {
      const reason = recipientReasons.get(userId)!;
      const actorName = actorNames.get(userId) ?? 'Someone on UAE Trail';
      const placeLine = entityLabel(reason.kind, reason.label);
      return {
        userId,
        title: `New outing at ${placeLine}`,
        body: `${actorName}: ${input.title}`,
        type: NotificationType.ACTIVITY,
        meta: {
          kind: 'entity_activity_published',
          actorUserId: input.hostUserId,
          activityId: input.activityId,
          path,
          locationId: input.locationId ?? undefined,
          tenantId: input.tenantId ?? undefined,
        },
      };
    });

    await createNotificationsMany(rows);
  } catch (error) {
    logger.warn({ err: error, activityId: input.activityId }, 'entity follow publish notify failed');
  }
};
