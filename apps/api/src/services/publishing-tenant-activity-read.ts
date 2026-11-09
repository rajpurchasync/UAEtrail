import type { ActivityDTO } from '@uaetrail/shared-types';
import { fromPrismaActivityType } from '../domain/activity-type.js';
import {
  findTenantActivityForEdit,
  listTenantActivitiesDetailed,
  listTenantActivityHistoryWithParticipation,
} from '../lib/activities-store.js';
import type { ActivityWithTenantRelations } from '../lib/activity-read-assembler.js';
import { buildActivityDto } from '../lib/mappers.js';
import { findActivityPrivateByIds } from '../lib/activity-private-store.js';
import { mapActivityIdsToGroupChatIds } from '../lib/social-groups-store.js';

export const buildPublishingTenantActivityDto = async (
  event: ActivityWithTenantRelations
): Promise<ActivityDTO> => {
  const loadPrivate = async (ids: string[]) => findActivityPrivateByIds(ids);

  if (!event.linkedRideshareActivityId) {
    const privateMap = await loadPrivate([event.id]);
    return buildActivityDto(event, { activityPrivate: privateMap.get(event.id) ?? null });
  }

  const linked = await findTenantActivityForEdit(event.linkedRideshareActivityId, event.tenantId);
  if (!linked) {
    const privateMap = await loadPrivate([event.id]);
    return buildActivityDto(event, { activityPrivate: privateMap.get(event.id) ?? null });
  }

  const privateMap = await loadPrivate([event.id, linked.id]);
  return {
    ...buildActivityDto(event, { activityPrivate: privateMap.get(event.id) ?? null }),
    linkedRideshare: buildActivityDto(linked, { activityPrivate: privateMap.get(linked.id) ?? null }),
  };
};

export const listPublishingTenantActivitiesPage = async (input: {
  tenantId: string;
  page: number;
  pageSize: number;
}) => {
  const { items: events, total } = await listTenantActivitiesDetailed({
    tenantId: input.tenantId,
    skip: (input.page - 1) * input.pageSize,
    take: input.pageSize,
    orderBy: { startAt: 'asc' },
  });

  const groupChatIds = await mapActivityIdsToGroupChatIds(events.map((event) => event.id));
  const privateById = await findActivityPrivateByIds(events.map((event) => event.id));

  return {
    total,
    items: events.map((event) => ({
      ...buildActivityDto(event, { activityPrivate: privateById.get(event.id) ?? null }),
      groupChatId: groupChatIds.get(event.id) ?? null,
    })),
  };
};

export const listPublishingTenantActivityHistoryPage = async (input: {
  tenantId: string;
  page: number;
  pageSize: number;
}) => {
  const { items: events, total } = await listTenantActivityHistoryWithParticipation({
    tenantId: input.tenantId,
    skip: (input.page - 1) * input.pageSize,
    take: input.pageSize,
  });

  return {
    total,
    items: events.map((e) => ({
      id: e.id,
      title: e.title,
      locationName: e.location.name,
      activityType: fromPrismaActivityType(e.location.activityType),
      startAt: e.startAt,
      status: e.status.toLowerCase(),
      capacity: e.capacity,
      participantCount: e.participants.length,
      checkedInCount: e.participants.filter((p) => p.checkedInAt !== null).length,
    })),
  };
};
