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
import type { PublishingTenantActivitiesListQuery } from '../lib/publishing-tenant-activities-list-query.js';
import { parsePublishingListDate } from '../lib/publishing-tenant-activities-list-query.js';
import { ActivityStatus } from '../domain/enums.js';

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

const activityStatusFromQuery = (
  status: PublishingTenantActivitiesListQuery['status']
): ActivityStatus | undefined => {
  if (!status) return undefined;
  if (status === 'published') return ActivityStatus.PUBLISHED;
  if (status === 'draft') return ActivityStatus.DRAFT;
  if (status === 'cancelled') return ActivityStatus.CANCELLED;
  return undefined;
};

export const listPublishingTenantActivitiesPage = async (input: {
  tenantId: string;
  page: number;
  pageSize: number;
  listQuery?: Pick<
    PublishingTenantActivitiesListQuery,
  'status' | 'startAtGte' | 'startAtLt' | 'windowOutside' | 'order' | 'upcomingFromToday'
  >;
}) => {
  const startAtGte = input.listQuery?.startAtGte
    ? parsePublishingListDate(input.listQuery.startAtGte)
    : undefined;
  const startAtLt = input.listQuery?.startAtLt
    ? parsePublishingListDate(input.listQuery.startAtLt)
    : undefined;

  const { items: events, total } = await listTenantActivitiesDetailed({
    tenantId: input.tenantId,
    skip: (input.page - 1) * input.pageSize,
    take: input.pageSize,
    orderBy: { startAt: input.listQuery?.order === 'desc' ? 'desc' : 'asc' },
    status: activityStatusFromQuery(input.listQuery?.status),
    startAtGte,
    startAtLt,
    windowOutside: input.listQuery?.windowOutside,
    upcomingFromToday: input.listQuery?.upcomingFromToday,
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
