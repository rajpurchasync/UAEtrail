import {
  exploreMapItemIsSeeking,
  type ActivityDTO,
  type ExploreMapItemDTO,
  type ParticipantIntentDTO,
} from '@uaetrail/shared-types';
import { fetchPublicActivityDetail } from '../hooks/usePublicActivityDetail';
import { updateActivity } from '../hooks/tenantActivityClientApi';

/** Parse `/activity/:id` or a bare UUID from user paste. */
export const parseActivityIdFromShareInput = (input: string): string | null => {
  const trimmed = input.trim();
  if (!trimmed) return null;
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(trimmed)) {
    return trimmed;
  }
  try {
    const url = trimmed.includes('://') ? new URL(trimmed) : new URL(trimmed, 'https://uaetrail.com');
    const match = url.pathname.match(/\/activity\/([^/?#]+)/i);
    return match?.[1] ?? null;
  } catch {
    return null;
  }
};

const assertRideshareForLink = (rideshare: ActivityDTO, tenantId: string, parentId: string): void => {
  if (rideshare.activityType !== 'rideshare') {
    throw new Error('That link must be a published rideshare activity.');
  }
  if (rideshare.tenantId !== tenantId) {
    throw new Error('You can only link rides you host under this organization.');
  }
  if (rideshare.status !== 'published') {
    throw new Error('Publish the rideshare first, then paste its link here.');
  }
  if (rideshare.linkedActivityId && rideshare.linkedActivityId !== parentId) {
    throw new Error('That rideshare is already linked to another plan.');
  }
  if (rideshare.id === parentId) {
    throw new Error('Cannot link a plan to itself.');
  }
};

/** Link a standalone rideshare activity to a parent hike/camp/event/activity. */
export const linkParentToRideshareActivity = async (
  tenantId: string,
  parentActivityId: string,
  rideshareActivityId: string
): Promise<void> => {
  const detail = await fetchPublicActivityDetail(rideshareActivityId);
  const rideshare = detail.activity as ActivityDTO;
  assertRideshareForLink(rideshare, tenantId, parentActivityId);
  if (rideshare.linkedActivityId === parentActivityId) {
    return;
  }

  await updateActivity(tenantId, rideshareActivityId, {
    linkedActivityId: parentActivityId,
  });
  await updateActivity(tenantId, parentActivityId, {
    linkedRideshareActivityId: rideshareActivityId,
  });
};

/** Rideshare detail — paste parent hike/camp/event link to attach this ride. */
export const linkRideshareToParentActivityFromPaste = async (
  tenantId: string,
  rideshareActivityId: string,
  paste: string
): Promise<string> => {
  const parentActivityId = parseActivityIdFromShareInput(paste);
  if (!parentActivityId) {
    throw new Error('Paste a valid activity link or ID.');
  }
  await linkParentToRideshareActivity(tenantId, parentActivityId, rideshareActivityId);
  return parentActivityId;
};

/** Map/list pin kinds that may have a linked transport (rideshare) child — not rideshare plans. */
export const parentMapKindMayOfferLinkedRideshare = (
  kind:
    | ExploreMapItemDTO['kind']
    | ActivityDTO['activityType']
    | ParticipantIntentDTO['kind']
    | null
    | undefined
): boolean => {
  if (!kind || kind === 'rideshare') return false;
  if (kind === 'guide' || kind === 'shop' || kind === 'agency' || kind === 'area') return false;
  return kind === 'hiking' || kind === 'camping' || kind === 'event';
};

/** Published parent activity id for a seeking map row (`activity:{id}` wire). */
export const resolveSeekingParentActivityId = (item: ExploreMapItemDTO): string | null => {
  const nested = item.activity?.id?.trim();
  if (nested) return nested;
  if (item.id.startsWith('activity:')) return item.id.slice('activity:'.length);
  return null;
};

/** Parent plans that may spawn or link FLOW-04 rideshares (peek + post-publish when enabled). */
export const canLinkRideshareToActivity = (activity: ActivityDTO | null | undefined): boolean => {
  if (!activity) return false;
  return parentMapKindMayOfferLinkedRideshare(activity.activityType);
};

/** Own seeking peek — offer a rideshare alongside the parent plan (not rideshare find posts). */
export const canOfferRideshareForSeekingItem = (item: ExploreMapItemDTO | null | undefined): boolean => {
  if (!item || !exploreMapItemIsSeeking(item)) return false;
  if (item.convertedActivityId) return false;
  return parentMapKindMayOfferLinkedRideshare(item.kind);
};

/**
 * Legacy intent-only host-manage peek — prefer host `link_rideshare` on `mapPeekActions` for M0 seeking pins.
 * @deprecated Use `canAddLinkedRide` + `canLinkRideshareToActivity` on activity-backed peek only.
 */
export const canShowSeekingLinkRideshareOffer = (item: ExploreMapItemDTO | null | undefined): boolean =>
  canOfferRideshareForSeekingItem(item) && Boolean(item?.viewerAccess?.entitlements?.canOfferTransport);

/** Trips → My plans manage sheet — same rules as map host-manage peek. */
export const canOfferRideshareForParticipantIntent = (
  intent: ParticipantIntentDTO | null | undefined
): boolean => {
  if (!intent || intent.status !== 'active') return false;
  if (intent.convertedActivityId) return false;
  return parentMapKindMayOfferLinkedRideshare(intent.kind);
};
