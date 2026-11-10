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
  if (step === 'meeting' && (draft.latitude == null || draft.longitude == null)) {
    return 'Drop a pin on the map.';
  }
  if (step === 'spots') {
    if (draft.capacity < 1) return 'Choose at least one spot.';
    return validateLimitedMinAge(draft);
  }
  if (step === 'destination') return validateStructuredDestination(draft);
  if (step === 'about_trail') return validateStructuredAboutTrail(draft, step);
  if (step === 'meeting_point' && (draft.meetingLatitude == null || draft.meetingLongitude == null)) {
    return 'Drop a meeting point pin on the map.';
  }
  if (step === 'price') return validateHostingPrice(draft);
  if (step === 'publish') {
    const effectiveFromLat = draft.latitude ?? draft.meetingLatitude;
    const effectiveFromLng = draft.longitude ?? draft.meetingLongitude;
    if (effectiveFromLat == null || effectiveFromLng == null) {
      return 'Drop a going-from pin on the map.';
    }
    if (draft.meetingLatitude == null || draft.meetingLongitude == null) {
      return 'Drop a meeting point pin on the map.';
    }
    const titleErr = validateHostingTitle(draft, 'Enter a title.');
    if (titleErr) return titleErr;
    const venueErr = validateStructuredPublishVenue(draft);
    if (venueErr) return venueErr;
    if (draft.joinMode !== 'private' && !draft.joinKit.trim()) {
      return 'Add what joiners should know before joining.';
    }
    return validateHostingPrice(draft);
  }
  return null;
};

export const campingHostingFlow: HostingKindFlow = {
  id: 'host.camping',
  createKind: 'camping',
  defaultSteps: DEFAULT_STEPS,
  registryVenue: { placeType: 'camping', omitWhenRegistry: REGISTRY_OMIT },
  postPublishRideshare: true,
  getSteps: (draft) => applyRegistryVenueStepOmit(DEFAULT_STEPS, REGISTRY_OMIT, draft),
  validateStep,
};
