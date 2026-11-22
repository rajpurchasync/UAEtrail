import type { CreateActivityDraft, CreateFlowStepId } from '../hostingFlowEngine';
import type { HostingKindFlow } from './types';
import { applyRegistryVenueStepOmit } from './registry';
import {
  validateLimitedMinAge,
  validateHostingAudienceOthers,
  validateHostingPrice,
  validateHostingTitle,
  validateStructuredAboutTrail,
  validateStructuredDestination,
  validateStructuredPublishVenue,
  validateHostingWhenSchedule,
} from './validateShared';

const DEFAULT_STEPS: CreateFlowStepId[] = [
  'title',
  'when',
  'destination',
  'meeting_point',
  'audience',
  'spots',
  'price',
  'difficulty',
  'about_trail',
  'join_kit',
  'transportation',
  'meeting',
  'publish',
];

const REGISTRY_OMIT: CreateFlowStepId[] = ['about_trail'];

const validateStep = (step: CreateFlowStepId, draft: CreateActivityDraft): string | null => {
  if (step === 'title') return validateHostingTitle(draft, 'Give your outing a title.');
  if (step === 'audience') return validateHostingAudienceOthers(draft);
  if (step === 'when') return validateHostingWhenSchedule(draft);
  if (step === 'meeting') {
    if (draft.genericBuddy) {
      if (draft.latitude == null || draft.longitude == null) return 'Drop a pin on the map.';
      return null;
    }
    if (!draft.fromLabel.trim() || draft.latitude == null || draft.longitude == null) {
      return 'Choose the area you start from.';
    }
  }
  if (step === 'spots') {
    if (draft.capacity < 1) return 'Choose at least one spot.';
    return validateLimitedMinAge(draft);
  }
  if (step === 'destination') return validateStructuredDestination(draft);
  if (step === 'difficulty') {
    if (!draft.difficulty) return 'Choose trail difficulty.';
    if (draft.trailDistanceKm == null || draft.trailDistanceKm <= 0) {
      return 'Enter trail length (km).';
    }
    if (draft.trailElevationM == null || draft.trailElevationM < 0) {
      return 'Enter elevation gain (m).';
    }
    return null;
  }
  if (step === 'about_trail') return validateStructuredAboutTrail(draft, step);
  if (step === 'meeting_point' && (draft.meetingLatitude == null || draft.meetingLongitude == null)) {
    return 'Drop a meeting point pin on the map.';
  }
  if (step === 'price') return validateHostingPrice(draft);
  if (step === 'join_kit') {
    if ((draft.packingItems ?? []).filter((item) => item.label.trim()).length < 1) {
      return 'Add at least one item to bring.';
    }
    return null;
  }
  if (step === 'publish') {
    const effectiveFromLat = draft.latitude ?? draft.meetingLatitude;
    const effectiveFromLng = draft.longitude ?? draft.meetingLongitude;
    if (effectiveFromLat == null || effectiveFromLng == null) {
      return 'Choose the area you start from.';
    }
    if (draft.meetingLatitude == null || draft.meetingLongitude == null) {
      return 'Drop a meeting point pin on the map.';
    }
    const titleErr = validateHostingTitle(draft, 'Enter a title.');
    if (titleErr) return titleErr;
    const venueErr = validateStructuredPublishVenue(draft);
    if (venueErr) return venueErr;
    if (
      draft.joinMode !== 'private' &&
      (draft.packingItems ?? []).filter((item) => item.label.trim()).length < 1 &&
      !draft.joinKit.trim()
    ) {
      return 'Add what joiners should bring, or a short note.';
    }
    return validateHostingPrice(draft);
  }
  return null;
};

export const hikingHostingFlow: HostingKindFlow = {
  id: 'activity.hiking',
  createKind: 'hiking',
  defaultSteps: DEFAULT_STEPS,
  registryVenue: { placeType: 'hiking', omitWhenRegistry: REGISTRY_OMIT },
  postPublishRideshare: true,
  getSteps: (draft) =>
    draft.genericBuddy
      ? ['title', 'when', 'meeting', 'audience', 'price', 'publish']
      : applyRegistryVenueStepOmit(DEFAULT_STEPS, REGISTRY_OMIT, draft),
  validateStep,
};
