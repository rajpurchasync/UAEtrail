import type { CreateActivityDraft, CreateFlowStepId } from '../hostingFlowEngine';
import type { HostingKindFlow } from './types';
import { parseRideshareRiderRules } from '../rideshareRiderRules';
import {
  validateHostingAudienceOthers,
  validateHostingPrice,
  validateHostingTitle,
  validateHostingWhenSchedule,
} from './validateShared';

const DEFAULT_STEPS: CreateFlowStepId[] = [
  'title',
  'when',
  'meeting',
  'to',
  'audience',
  'spots',
  'price',
  'instructions',
  'transportation',
  'publish',
];

const validateStep = (step: CreateFlowStepId, draft: CreateActivityDraft): string | null => {
  if (step === 'title') return validateHostingTitle(draft, 'Enter a title.');
  if (step === 'audience') {
    const others = validateHostingAudienceOthers(draft);
    if (others) return others;
    if (!draft.participantsOpenToAll && draft.limitedMinAgeEnabled && draft.ageMin < 1) {
      return 'Enter a minimum age.';
    }
    return null;
  }
  if (step === 'when') return validateHostingWhenSchedule(draft, { rideshare: true });
  if (step === 'meeting' && (draft.latitude == null || draft.longitude == null)) {
    return 'Drop a pin on the map.';
  }
  if (step === 'to') {
    if (draft.toLatitude == null || draft.toLongitude == null) {
      return 'Choose a ride destination.';
    }
    if (
      draft.rideshareDestinationKind === 'activity_meeting' &&
      !draft.rideshareDestinationActivityId?.trim()
    ) {
      return 'Select an outing meeting point from search (not another ride).';
    }
    if (
      (draft.rideshareDestinationKind === 'catalog_place' ||
        draft.rideshareDestinationKind === 'pending_place') &&
      !draft.rideshareDestinationPlaceId?.trim()
    ) {
      return 'Select a catalog place or submit a new place for approval.';
    }
    if (draft.rideshareDestinationKind === 'map') {
      return null;
    }
    if (!draft.rideshareDestinationKind) {
      return 'Select an outing meeting point or catalog place from search.';
    }
  }
  if (step === 'spots') {
    if (draft.capacity < 1) return 'Choose at least one seat.';
    if (draft.capacity > 10) return 'Maximum 10 seats.';
    return null;
  }
  if (step === 'transportation' && !draft.memberVehicleId) {
    return 'Select which car you are driving.';
  }
  if (step === 'transportation') return null;
  if (step === 'instructions') {
    if (parseRideshareRiderRules(draft.description).length < 1) {
      return 'Add at least one rule for riders.';
    }
    return null;
  }
  if (step === 'price') return validateHostingPrice(draft);
  if (step === 'publish') {
    if (draft.latitude == null && draft.longitude == null) return 'Drop a pin on the map.';
    if (draft.toLatitude == null || draft.toLongitude == null) {
      return 'Drop a destination pin on the map.';
    }
    const titleErr = validateHostingTitle(draft, 'Enter a title.');
    if (titleErr) return titleErr;
    return validateHostingPrice(draft);
  }
  return null;
};

export const rideshareHostingFlow: HostingKindFlow = {
  id: 'activity.rideshare',
  createKind: 'rideshare',
  defaultSteps: DEFAULT_STEPS,
  postPublishRideshare: false,
  getSteps: () => [...DEFAULT_STEPS],
  validateStep,
};
