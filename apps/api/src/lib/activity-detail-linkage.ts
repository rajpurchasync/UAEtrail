import type { ActivityDTO } from '@uaetrail/shared-types';
import type { findPublishedActivityWithPreviewsById } from './activities-store.js';
import { findActivityPrivateByIds } from './activity-private-store.js';
import { buildActivityDto } from './mappers.js';

export type ActivityLinkedPlanSummary = NonNullable<ActivityDTO['linkedParentActivity']>;

const briefDescription = (description: string | null | undefined): string | null => {
  const text = description?.trim();
  if (!text) return null;
  if (text.length <= 220) return text;
  return `${text.slice(0, 217).trimEnd()}…`;
};

export const buildLinkedPlanSummary = (
  event: NonNullable<Awaited<ReturnType<typeof findPublishedActivityWithPreviewsById>>>
): ActivityLinkedPlanSummary => {
  const dto = buildActivityDto(event);
  return {
    id: event.id,
    title: event.title,
    activityType: dto.activityType,
    date: dto.date,
    time: dto.time,
    description: briefDescription(dto.description),
  };
};

export type ActivityDetailLinkage = {
  linkedParentActivity: ActivityLinkedPlanSummary | null;
  linkedRideshare: ActivityDTO | null;
  linkedRideshareSummary: ActivityLinkedPlanSummary | null;
};

export const resolveActivityDetailLinkage = async (
  event: NonNullable<Awaited<ReturnType<typeof findPublishedActivityWithPreviewsById>>>,
  findById: typeof findPublishedActivityWithPreviewsById
): Promise<ActivityDetailLinkage> => {
  const [parentEvent, linkedEvent] = await Promise.all([
    event.linkedActivityId ? findById(event.linkedActivityId) : Promise.resolve(null),
    event.linkedRideshareActivityId ? findById(event.linkedRideshareActivityId) : Promise.resolve(null),
  ]);

  const privateIds = [linkedEvent?.id].filter(Boolean) as string[];
  const privateById =
    privateIds.length > 0 ? await findActivityPrivateByIds(privateIds) : new Map();

  const linkedParentActivity = parentEvent ? buildLinkedPlanSummary(parentEvent) : null;
  const linkedRideshare = linkedEvent
    ? buildActivityDto(linkedEvent, { activityPrivate: privateById.get(linkedEvent.id) ?? null })
    : null;
  const linkedRideshareSummary = linkedEvent ? buildLinkedPlanSummary(linkedEvent) : null;

  return { linkedParentActivity, linkedRideshare, linkedRideshareSummary };
};
