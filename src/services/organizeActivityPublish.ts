import { activityOrganizeTopicToOutingTopic, type ActivityDTO } from '@uaetrail/shared-types';
import { api } from '../api/index';
import { HOME_HERO_OG_PATH } from '../config/seo';
import {
  buildOrganisationActivityPublishPayload,
  type ActivityPublishInput,
} from '../utils/activityPublishPayload';
import type { CreateActivityDraft } from '../explore/ui/organizeFlow';
import { composeFlowSpecForOrganizeKind } from '../explore/composeFlowCatalog';
import { linkParentToRideshareActivity } from '../explore/linkActivityCarpoolOffer';
import {
  buildOrganizeActivityRequirements,
  defaultDescription,
  isActivityOrganizeFlow,
  isEventOrganizeFlow,
  isHikingOrganizeFlow,
  isStructuredOrganizeFlow,
  resolveActivityTitle,
  resolveActivityType,
  usesGoingFromOrganizeStep,
} from '../explore/ui/organizeFlow';

const formatCoord = (value: number): string => Number(value.toFixed(6)).toString();

const resolveFromLabel = (draft: CreateActivityDraft, lat: number, lng: number): string => {
  if (draft.fromLabel.trim()) return draft.fromLabel.trim();
  const coordLabel = `${formatCoord(lat)}, ${formatCoord(lng)}`;
  return draft.kind === 'carpool' ? `From · ${coordLabel}` : coordLabel;
};

const resolveToLabel = (draft: CreateActivityDraft, lat: number, lng: number): string => {
  if (draft.toLabel.trim()) return draft.toLabel.trim();
  return `To · ${formatCoord(lat)}, ${formatCoord(lng)}`;
};

export type OrganizePublishContext = {
  draft: CreateActivityDraft;
  tenantId: string;
  userId: string;
};

/** Resolve `locationId` for explore organize publish — registry venue or activity-only anchor. */
export const resolveOrganizeActivityLocationId = async (
  ctx: OrganizePublishContext
): Promise<string> => {
  const { draft, tenantId } = ctx;
  if (!draft.kind) throw new Error('Choose an activity type.');
  const structured = isStructuredOrganizeFlow(draft.kind, draft.genericBuddy);
  const activityHost = isActivityOrganizeFlow(draft.kind, draft.genericBuddy);
  const activityType = resolveActivityType(draft.kind);

  const registryVenueId =
    structured && draft.registryPlaceId && draft.placeLabelSource === 'registry'
      ? draft.registryPlaceId
      : null;

  if (registryVenueId) return registryVenueId;

  const event = isEventOrganizeFlow(draft.kind, draft.genericBuddy);
  const anchorLat = event || activityHost ? draft.meetingLatitude : draft.latitude;
  const anchorLng = event || activityHost ? draft.meetingLongitude : draft.longitude;

  if (anchorLat == null || anchorLng == null) {
    throw new Error(event ? 'Drop a meeting point pin on the map first.' : 'Drop a pin on the map first.');
  }

  const lat = anchorLat;
  const lng = anchorLng;
  const fromLabel = resolveFromLabel(draft, lat, lng);
  const anchorName =
    structured && draft.trailName.trim()
      ? draft.trailName.trim().slice(0, 120)
      : `Outing · ${fromLabel}`.slice(0, 120);
  const anchorDescription =
    (structured ? draft.aboutTrail.trim() : activityHost ? draft.joinKit.trim() : draft.description.trim()) ||
    defaultDescription(draft.kind);

  const locationRes = await api.submitPlace(tenantId, {
    name: anchorName,
    countryCode: 'AE',
    emirate: 'Dubai',
    region: 'Dubai',
    activityType,
    description: anchorDescription.slice(0, 3000),
    latitude: lat,
    longitude: lng,
    images: [HOME_HERO_OG_PATH],
    difficulty: draft.difficulty === 'easy' ? 'easy' : draft.difficulty === 'medium' ? 'moderate' : 'hard',
    activityAnchor: true,
  } as Record<string, unknown>);

  return locationRes.data.id;
};

/** Build canonical host activity payload from an organize draft (shared publish pipeline). */
export const buildOrganizeActivityPublishInput = (
  ctx: OrganizePublishContext & { locationId: string }
): ActivityPublishInput => {
  const { draft, userId, locationId } = ctx;
  if (!draft.kind) throw new Error('Choose an activity type.');
  const hiking = isHikingOrganizeFlow(draft.kind, draft.genericBuddy);
  const activityHost = isActivityOrganizeFlow(draft.kind, draft.genericBuddy);
  const goingFrom = usesGoingFromOrganizeStep(draft.kind, draft.genericBuddy);
  const structured = isStructuredOrganizeFlow(draft.kind, draft.genericBuddy);
  const structuredLike = structured || activityHost;
  const kind = draft.kind;
  const activityType = resolveActivityType(kind);
  const isCarpool = kind === 'carpool';

  const fromLat = goingFrom ? draft.latitude ?? draft.meetingLatitude! : draft.meetingLatitude!;
  const fromLng = goingFrom ? draft.longitude ?? draft.meetingLongitude! : draft.meetingLongitude!;
  const fromLabel = resolveFromLabel(draft, fromLat, fromLng);

  const registryVenueId =
    structured && draft.registryPlaceId && draft.placeLabelSource === 'registry'
      ? draft.registryPlaceId
      : null;

  const trailStartLat =
    registryVenueId && draft.trailLatitude != null ? draft.trailLatitude : fromLat;
  const trailStartLng =
    registryVenueId && draft.trailLongitude != null ? draft.trailLongitude : fromLng;
  const toLat = isCarpool ? draft.toLatitude! : trailStartLat;
  const toLng = isCarpool ? draft.toLongitude! : trailStartLng;
  const trailOrFrom =
    structured && draft.trailName.trim() ? draft.trailName.trim() : fromLabel;
  const toLabel = isCarpool ? resolveToLabel(draft, toLat, toLng) : trailOrFrom;

  const meetLat = structuredLike ? draft.meetingLatitude! : fromLat;
  const meetLng = structuredLike ? draft.meetingLongitude! : fromLng;
  const meetLabel = draft.meetingPointLabel.trim() || (structuredLike ? 'Meeting point' : fromLabel);
  const meetingLineRaw = draft.meetingPointInfo.trim()
    ? `${meetLabel} — ${draft.meetingPointInfo.trim()}`
    : meetLabel;
  const meetingLine = meetingLineRaw.slice(0, 200);
  const meetingDifferent =
    goingFrom &&
    structuredLike &&
    (Math.abs(meetLat - fromLat) > 0.00001 || Math.abs(meetLng - fromLng) > 0.00001);

  const isPaid = draft.priceMode === 'paid';
  const isShared = draft.priceMode === 'shared';
  const priceAmount = Math.max(0, draft.priceAmount);
  const requirements = buildOrganizeActivityRequirements(draft);
  const startTime =
    draft.timeMode === 'flexible' ? '09:00' : draft.meetingTime.trim() || draft.time;
  const planSpec = composeFlowSpecForOrganizeKind(kind);

  return {
    activityType,
    locationId,
    title: resolveActivityTitle(draft),
    description: structured
      ? draft.aboutTrail.trim() || defaultDescription(kind)
      : activityHost
        ? draft.joinKit.trim() || defaultDescription(kind)
        : draft.description.trim() || defaultDescription(kind),
    date: draft.date,
    time: startTime,
    endDate: hiking && draft.timeMode === 'specific' ? draft.date : undefined,
    endTime: hiking && draft.timeMode === 'specific' ? draft.endTime : undefined,
    capacity: draft.capacity,
    pricing: {
      pricingMode: isPaid ? 'paid' : isShared ? 'shared' : 'free',
      price: isPaid || isShared ? priceAmount : 0,
      paymentTerms: isShared && draft.sharedCostNote.trim() ? draft.sharedCostNote.trim() : null,
    },
    location: {
      meetingPoint: structuredLike
        ? meetingLine
        : draft.meetingPointInfo.trim()
          ? `${fromLabel} — ${draft.meetingPointInfo.trim()}`
          : fromLabel,
      meetingLat: structuredLike ? meetLat : fromLat,
      meetingLng: structuredLike ? meetLng : fromLng,
      startPoint: toLabel,
      startLat: toLat,
      startLng: toLng,
      meetingDifferent: structuredLike ? meetingDifferent : false,
    },
    requirements,
    joinMode: draft.kind === 'carpool' ? 'open' : draft.joinMode,
    participationMode: draft.kind === 'carpool' ? 'approval' : draft.participationMode,
    outingCategory: planSpec.outingCategory,
    outingTopic:
      kind === 'activity' && draft.activityTopic
        ? activityOrganizeTopicToOutingTopic(draft.activityTopic)
        : null,
    images: [],
    hostId: userId,
    carpool: isCarpool
      ? {
          carPoolFree: !isShared && !isPaid,
          carPoolPriceAed: isShared || isPaid ? priceAmount : null,
          carPoolSeats: draft.capacity,
          carPoolDetails: 'Carpool — confirm pickup and drop-off details after joining.',
        }
      : draft.carPoolEnabled
        ? {
            carPoolEnabled: true,
            carPoolFree: true,
            carPoolDetails: 'Host offers carpool — coordinate seats in activity chat after joining.',
          }
        : undefined,
  };
};

export const publishOrganizeActivity = async (input: {
  draft: CreateActivityDraft;
  tenantId: string;
  userId: string;
  participantIntentId?: string | null;
  sourceActivityId?: string | null;
  linkToParentActivityId?: string | null;
}): Promise<ActivityDTO> => {
  const { draft, tenantId, userId, participantIntentId, sourceActivityId, linkToParentActivityId } = input;
  if (!draft.kind) throw new Error('Choose an activity type.');
  const structured = isStructuredOrganizeFlow(draft.kind, draft.genericBuddy);
  const event = isEventOrganizeFlow(draft.kind, draft.genericBuddy);
  const activityHost = isActivityOrganizeFlow(draft.kind, draft.genericBuddy);
  const goingFrom = usesGoingFromOrganizeStep(draft.kind, draft.genericBuddy);
  const effectiveFromLat = draft.latitude ?? draft.meetingLatitude;
  const effectiveFromLng = draft.longitude ?? draft.meetingLongitude;
  if (goingFrom && (effectiveFromLat == null || effectiveFromLng == null)) {
    throw new Error('Drop a going-from pin on the map first.');
  }
  if (event && (draft.meetingLatitude == null || draft.meetingLongitude == null)) {
    throw new Error('Drop a meeting point pin on the map first.');
  }
  if (activityHost && (draft.meetingLatitude == null || draft.meetingLongitude == null)) {
    throw new Error('Drop a meeting point pin on the map first.');
  }
  if (!event && !activityHost && !goingFrom && draft.latitude == null && draft.longitude == null) {
    throw new Error('Drop a pin on the map first.');
  }
  if (goingFrom && structured && (draft.meetingLatitude == null || draft.meetingLongitude == null)) {
    throw new Error('Drop a meeting point pin on the map.');
  }
  if (draft.kind === 'carpool' && (draft.toLatitude == null || draft.toLongitude == null)) {
    throw new Error('Drop a destination pin on the map.');
  }
  if (!draft.title.trim()) {
    throw new Error('Enter a title for your plan.');
  }

  const ctx: OrganizePublishContext = { draft, tenantId, userId };
  const locationId = await resolveOrganizeActivityLocationId(ctx);
  const payload = buildOrganizeActivityPublishInput({ ...ctx, locationId });
  const parentLinkId = linkToParentActivityId?.trim() || null;
  const publishBody = buildOrganisationActivityPublishPayload({
    ...payload,
    clonedFromActivityId: sourceActivityId?.trim() || null,
    linkedActivityId: draft.kind === 'carpool' && parentLinkId ? parentLinkId : null,
  });
  const created = await api.createOrganisationActivity(tenantId, publishBody);
  await api.publishOrganisationActivity(tenantId, created.data.id);

  if (participantIntentId) {
    await api.fulfillParticipantIntent(tenantId, participantIntentId, created.data.id);
  }

  if (parentLinkId && draft.kind === 'carpool') {
    await linkParentToRideshareActivity(tenantId, parentLinkId, created.data.id);
  }

  return created.data;
};
