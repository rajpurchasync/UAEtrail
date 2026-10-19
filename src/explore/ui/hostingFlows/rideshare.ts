import type { CreateActivityDraft, CreateFlowStepId } from '../hostingFlowEngine';
import type { HostingKindFlow } from './types';
import { parseRideshareRiderRules } from '../rideshareRiderRules';
import {
  validateHostingAudienceOthers,
  validateHostingPrice,
  validateHostingTitle,
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
  if (step === 'when' && draft.timeMode === 'specific' && !draft.time) {
    return 'Choose a start time.';
  }
  if (step === 'meeting' && (draft.latitude == null || draft.longitude == null)) {
    return 'Drop a pin on the map.';
  }
  if (step === 'to' && (draft.toLatitude == null || draft.toLongitude == null)) {
    return 'Drop a destination pin on the map.';
  }
  if (step === 'spots') {
    if (draft.capacity < 1) return 'Choose at least one seat.';
    if (draft.capacity > 10) return 'Maximum 10 seats.';
    return null;
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
  id: 'host.rideshare',
  createKind: 'rideshare',
  defaultSteps: DEFAULT_STEPS,
  postPublishRideshare: false,
  getSteps: () => [...DEFAULT_STEPS],
  validateStep,
};
