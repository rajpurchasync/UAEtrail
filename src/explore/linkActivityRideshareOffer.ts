import {
  exploreMapItemIsAvailabilityCatalog,
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

/** Attach a self-hosted ride to a parent outing. Updates the parent pin only when it is the same tenant. */
export const linkParentToRideshareActivity = async (
  tenantId: string,
  parentActivityId: string,
  rideshareActivityId: string
): Promise<void> => {
  const [rideshareDetail, parentDetail] = await Promise.all([
    fetchPublicActivityDetail(rideshareActivityId),
    fetchPublicActivityDetail(parentActivityId),
  ]);
  const rideshare = rideshareDetail.activity as ActivityDTO;
  const parent = parentDetail.activity as ActivityDTO;
  assertRideshareForLink(rideshare, tenantId, parentActivityId);
  if (!canLinkRideshareToActivity(parent)) {
    throw new Error('That outing cannot take a linked ride.');
  }
  if (parent.status !== 'published') {
    throw new Error('Publish the outing first, then link this ride.');
  }
  if (rideshare.linkedActivityId === parentActivityId) {
    return;
  }

  await updateActivity(tenantId, rideshareActivityId, {
    linkedActivityId: parentActivityId,
  });
  if (parent.tenantId === tenantId) {
    await updateActivity(tenantId, parentActivityId, {
      linkedRideshareActivityId: rideshareActivityId,
    });
  }
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

/** Ride host — clear parent outing link on this rideshare (and parent primary pin when same tenant). */
export const unlinkRideshareFromParentActivity = async (
  tenantId: string,
  rideshareActivityId: string
): Promise<void> => {
  const rideshareDetail = await fetchPublicActivityDetail(rideshareActivityId);
  const rideshare = rideshareDetail.activity as ActivityDTO;
  if (rideshare.activityType !== 'rideshare') {
    throw new Error('Only rideshare activities can be unlinked from an outing.');
  }
  if (rideshare.tenantId !== tenantId) {
    throw new Error('You can only unlink rides you host under this organization.');
  }
  const parentActivityId = rideshare.linkedActivityId?.trim() || null;
  if (!parentActivityId) {
    return;
  }

  await updateActivity(tenantId, rideshareActivityId, {
    linkedActivityId: null,
  });

  try {
    const parentDetail = await fetchPublicActivityDetail(parentActivityId);
    const parent = parentDetail.activity as ActivityDTO;
    if (
      parent.tenantId === tenantId &&
      parent.linkedRideshareActivityId === rideshareActivityId
    ) {
      await updateActivity(tenantId, parentActivityId, {
        linkedRideshareActivityId: null,
      });
    }
  } catch {
    // Parent may be unpublished or inaccessible — ride unlink already succeeded.
  }
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

/** Published parent activity id when the pin nests an activity (`activity:{id}` wire). */
export const resolveAvailabilityParentActivityId = (item: ExploreMapItemDTO): string | null => {
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

/** Availability or legacy activity peek — offer a rideshare alongside someone's plan (not rideshare pins). */
export const canOfferRideshareForAvailabilityItem = (item: ExploreMapItemDTO | null | undefined): boolean => {
  if (!item) return false;
  const crewPin = exploreMapItemIsAvailabilityCatalog(item);
  if (!crewPin) return false;
  if (item.convertedActivityId) return false;
  return parentMapKindMayOfferLinkedRideshare(item.kind);
};

/** Map peek CTA — host may offer transport when entitlement allows. */
export const canShowAvailabilityLinkRideshareOffer = (item: ExploreMapItemDTO | null | undefined): boolean =>
  canOfferRideshareForAvailabilityItem(item) &&
  Boolean(item?.viewerAccess?.entitlements?.canOfferTransport);

