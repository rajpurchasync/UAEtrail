import { activityHostTopicToOutingTopic, type ActivityDTO } from '@uaetrail/shared-types';
import { fetchPublishedAreas } from '../hooks/areaHubClientApi';
import { createActivity, publishActivity, updateActivity } from '../hooks/tenantActivityClientApi';
import { linkSeekingPostToActivity } from '../hooks/seekingClientApi';
import { submitMemberPlace } from '../hooks/memberCatalogSubmitClientApi';
import { HOME_HERO_OG_PATH } from '../config/seo';
import { resolvePublishedAreaIdForPoint } from '../explore/hostingPublishArea';
import {
  buildHostActivityPublishPayload,
  type ActivityPublishInput,
} from '../utils/activityPublishPayload';
import type { CreateActivityDraft } from '../explore/ui/hostingFlowEngine';
import { composeFlowSpecForHostKind } from '../explore/composeFlowCatalog';
import { linkParentToRideshareActivity } from '../explore/linkActivityRideshareOffer';
import {
  buildHostingActivityRequirements,
  defaultDescription,
  isActivityHostingFlow,
  isEventHostingFlow,
  isHikingHostingFlow,
  isStructuredHostingFlow,
  resolveActivityTitle,
  resolveActivityType,
  usesGoingFromHostingStep,
} from '../explore/ui/hostingFlowEngine';

const formatCoord = (value: number): string => Number(value.toFixed(6)).toString();

const resolveFromLabel = (draft: CreateActivityDraft, lat: number, lng: number): string => {
  if (draft.fromLabel.trim()) return draft.fromLabel.trim();
  const coordLabel = `${formatCoord(lat)}, ${formatCoord(lng)}`;
  return draft.kind === 'rideshare' ? `From · ${coordLabel}` : coordLabel;
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

/** Resolve `locationId` for explore organize publish — catalog place with `place.areaId` only. */
export const resolveOrganizeActivityLocationId = async (
  ctx: OrganizePublishContext
): Promise<string> => {
  const { draft, tenantId } = ctx;
  if (!draft.kind) throw new Error('Choose an activity type.');
  const activityType = resolveActivityType(draft.kind);
  const structured = isStructuredHostingFlow(draft.kind, draft.genericBuddy);

  const registryVenueId =
    structured && draft.registryPlaceId && draft.placeLabelSource === 'registry'
      ? draft.registryPlaceId
      : null;

  if (registryVenueId) return registryVenueId;

  if (structured) {
    throw new Error(
      'Choose a catalog place linked to an area, or add your spot via Explore → Add (select an area first).'
    );
  }

  const event = isEventHostingFlow(draft.kind, draft.genericBuddy);
  const activityHost = isActivityHostingFlow(draft.kind, draft.genericBuddy);
  const anchorLat = event || activityHost ? draft.meetingLatitude : draft.latitude;
  const anchorLng = event || activityHost ? draft.meetingLongitude : draft.longitude;

  if (anchorLat == null || anchorLng == null) {
    throw new Error(event ? 'Drop a meeting point pin on the map first.' : 'Drop a pin on the map first.');
  }

  const publishedAreas = await fetchPublishedAreas();
  const areaId = resolvePublishedAreaIdForPoint(anchorLat, anchorLng, publishedAreas);
  if (!areaId) {
    throw new Error(
      'Could not match a registered area for this pin. Add your spot via Explore → Add (select an area first), then organize from the catalog.'
    );
  }

  const lat = anchorLat;
  const lng = anchorLng;
  const fromLabel = resolveFromLabel(draft, lat, lng);
  const anchorName = `Outing · ${fromLabel}`.slice(0, 120);
  const anchorDescription =
    (activityHost ? draft.joinKit.trim() : draft.description.trim()) || defaultDescription(draft.kind);

  const place = await submitMemberPlace(
    {
      name: anchorName,
      countryCode: 'AE',
      emirate: 'Dubai',
      region: 'Dubai',
      areaId,
      activityType,
      description: anchorDescription.slice(0, 3000),
      latitude: lat,
      longitude: lng,
      images: [HOME_HERO_OG_PATH],
      activityAnchor: true,
    } as Record<string, unknown>,
    tenantId
  );

  return place.id;
};

/** Build canonical host activity payload from an organize draft (shared publish pipeline). */
export const buildHostingActivityPublishInput = (
  ctx: OrganizePublishContext & { locationId: string }
): ActivityPublishInput => {
  const { draft, userId, locationId } = ctx;
  if (!draft.kind) throw new Error('Choose an activity type.');
  const hiking = isHikingHostingFlow(draft.kind, draft.genericBuddy);
  const activityHost = isActivityHostingFlow(draft.kind, draft.genericBuddy);
  const goingFrom = usesGoingFromHostingStep(draft.kind, draft.genericBuddy);
  const structured = isStructuredHostingFlow(draft.kind, draft.genericBuddy);
  const structuredLike = structured || activityHost;
  const kind = draft.kind;
  const activityType = resolveActivityType(kind);
  const isRideshare = kind === 'rideshare';

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
  const toLat = isRideshare ? draft.toLatitude! : trailStartLat;
  const toLng = isRideshare ? draft.toLongitude! : trailStartLng;
  const trailOrFrom =
    structured && draft.trailName.trim() ? draft.trailName.trim() : fromLabel;
  const toLabel = isRideshare ? resolveToLabel(draft, toLat, toLng) : trailOrFrom;

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
  const requirements = buildHostingActivityRequirements(draft);
  const startTime =
    draft.timeMode === 'flexible' ? '09:00' : draft.meetingTime.trim() || draft.time;
  const planSpec = composeFlowSpecForHostKind(kind);

  return {
    activityType,
    locationId,
    title: resolveActivityTitle(draft),
    description: structured
      ? draft.aboutTrail.trim() || defaultDescription(kind)
      : activityHost
        ? draft.joinKit.trim() || defaultDescription(kind)
        : isRideshare
          ? draft.description.trim().length >= 20
            ? draft.description.trim()
            : defaultDescription(kind)
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
    ...(hiking &&
    !draft.genericBuddy &&
    draft.fromLabel.trim() &&
    draft.latitude != null &&
    draft.longitude != null
      ? {
          originLabel: draft.fromLabel.trim(),
          originLat: draft.latitude,
          originLng: draft.longitude,
        }
      : {}),
    requirements,
    joinMode: draft.kind === 'rideshare' ? 'open' : draft.joinMode,
    participationMode:
      draft.kind === 'rideshare'
        ? 'approval'
        : draft.joinMode === 'private'
          ? 'rsvp'
          : draft.participationMode,
    outingCategory: planSpec.outingCategory,
    outingTopic:
      kind === 'activity' && draft.activityTopic
        ? activityHostTopicToOutingTopic(draft.activityTopic)
        : null,
    images: [],
    hostId: userId,
    rideshare: isRideshare
      ? {
          rideshareFree: !isShared && !isPaid,
          ridesharePriceAed: isShared || isPaid ? priceAmount : null,
          rideshareSeats: draft.capacity,
          rideshareDetails: 'Rideshare — confirm pickup and drop-off details after joining.',
          rideshareVehicleId: draft.memberVehicleId,
        }
      : draft.rideshareEnabled
        ? {
            rideshareEnabled: true,
            rideshareFree: true,
            rideshareDetails: 'Host offers rideshare — coordinate seats in activity chat after joining.',
          }
        : undefined,
    groupChatPostPolicy: draft.groupChatPostPolicy,
  };
};

export const publishHostingActivity = async (input: {
  draft: CreateActivityDraft;
  tenantId: string;
  userId: string;
  participantIntentId?: string | null;
  sourceActivityId?: string | null;
  linkToParentActivityId?: string | null;
}): Promise<ActivityDTO> => {
  const { draft, tenantId, userId, participantIntentId, sourceActivityId, linkToParentActivityId } = input;
  if (!draft.kind) throw new Error('Choose an activity type.');
  const structured = isStructuredHostingFlow(draft.kind, draft.genericBuddy);
  const event = isEventHostingFlow(draft.kind, draft.genericBuddy);
  const activityHost = isActivityHostingFlow(draft.kind, draft.genericBuddy);
  const goingFrom = usesGoingFromHostingStep(draft.kind, draft.genericBuddy);
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
  if (draft.kind === 'rideshare' && (draft.toLatitude == null || draft.toLongitude == null)) {
    throw new Error('Drop a destination pin on the map.');
  }
  if (draft.kind === 'rideshare' && !draft.memberVehicleId) {
    throw new Error('Add and select a car for this ride.');
  }
  if (!draft.title.trim()) {
    throw new Error('Enter a title for your plan.');
  }

  const ctx: OrganizePublishContext = { draft, tenantId, userId };
  const locationId = await resolveOrganizeActivityLocationId(ctx);
  const payload = buildHostingActivityPublishInput({ ...ctx, locationId });
  const parentLinkId = linkToParentActivityId?.trim() || null;
  const publishBody = buildHostActivityPublishPayload({
    ...payload,
    clonedFromActivityId: sourceActivityId?.trim() || null,
    linkedActivityId: draft.kind === 'rideshare' && parentLinkId ? parentLinkId : null,
  });
  const created = await createActivity(tenantId, publishBody);
  const pendingPlaceDestination =
    draft.kind === 'rideshare' && draft.rideshareDestinationKind === 'pending_place';
  if (!pendingPlaceDestination) {
    await publishActivity(tenantId, created.id);
  }

  // Graduate find crew onto a new hosted outing only — never when publishing a transport child.
  if (participantIntentId && draft.kind !== 'rideshare') {
    await linkSeekingPostToActivity(participantIntentId, created.id);
  }

  if (parentLinkId && draft.kind === 'rideshare') {
    await linkParentToRideshareActivity(tenantId, parentLinkId, created.id);
  }

  return created;
};

/** Update an existing hosted outing in place (Plan manage edit — same draft pipeline as publish). */
export const updateHostingActivity = async (input: {
  activityId: string;
  draft: CreateActivityDraft;
  tenantId: string;
  userId: string;
}): Promise<ActivityDTO> => {
  const { activityId, draft, tenantId, userId } = input;
  if (!draft.kind) throw new Error('Choose an activity type.');
  if (!draft.title.trim()) {
    throw new Error('Enter a title for your plan.');
  }

  const ctx: OrganizePublishContext = { draft, tenantId, userId };
  const locationId = await resolveOrganizeActivityLocationId(ctx);
  const payload = buildHostingActivityPublishInput({ ...ctx, locationId });
  const body = buildHostActivityPublishPayload(payload);
  delete body.clonedFromActivityId;
  delete body.linkedActivityId;

  return updateActivity(tenantId, activityId, body);
};
