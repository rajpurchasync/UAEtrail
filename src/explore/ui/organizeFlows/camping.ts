import type { CreateActivityDraft, CreateFlowStepId } from '../organizeFlow';
import type { OrganizeCatalogFlow } from './types';
import { applyRegistryVenueStepOmit } from './registry';
import {
  validateLimitedMinAge,
  validateOrganizeAudienceOthers,
  validateOrganizePrice,
  validateOrganizeTitle,
  validateStructuredAboutTrail,
  validateStructuredDestination,
  validateStructuredPublishVenue,
} from './validateShared';

const DEFAULT_STEPS: CreateFlowStepId[] = [
  'title',
  'when',
  'meeting',
  'audience',
  'spots',
  'price',
  'destination',
  'about_trail',
  'meeting_point',
  'join_kit',
  'transportation',
  'publish',
];

const REGISTRY_OMIT: CreateFlowStepId[] = ['about_trail'];

const validateStep = (step: CreateFlowStepId, draft: CreateActivityDraft): string | null => {
  if (step === 'title') return validateOrganizeTitle(draft, 'Give your outing a title.');
  if (step === 'audience') return validateOrganizeAudienceOthers(draft);
  if (step === 'when' && draft.timeMode === 'specific' && !draft.time) {
    return 'Choose a start time.';
  }
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
  if (step === 'price') return validateOrganizePrice(draft);
  if (step === 'publish') {
    const effectiveFromLat = draft.latitude ?? draft.meetingLatitude;
    const effectiveFromLng = draft.longitude ?? draft.meetingLongitude;
    if (effectiveFromLat == null || effectiveFromLng == null) {
      return 'Drop a going-from pin on the map.';
    }
    if (draft.meetingLatitude == null || draft.meetingLongitude == null) {
      return 'Drop a meeting point pin on the map.';
    }
    const titleErr = validateOrganizeTitle(draft, 'Enter a title.');
    if (titleErr) return titleErr;
    const venueErr = validateStructuredPublishVenue(draft);
    if (venueErr) return venueErr;
    return validateOrganizePrice(draft);
  }
  return null;
};

export const organizeCampingFlow: OrganizeCatalogFlow = {
  id: 'organize.camping',
  createKind: 'camping',
  defaultSteps: DEFAULT_STEPS,
  registryVenue: { placeType: 'camping', omitWhenRegistry: REGISTRY_OMIT },
  postPublishCarpool: false,
  getSteps: (draft) => applyRegistryVenueStepOmit(DEFAULT_STEPS, REGISTRY_OMIT, draft),
  validateStep,
};
