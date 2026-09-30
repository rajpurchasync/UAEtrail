import type { CreateActivityDraft, CreateFlowStepId } from '../organizeFlow';
import type { OrganizeCatalogFlow } from './types';
import {
  validateOrganizeAudienceOthers,
  validateOrganizePrice,
  validateOrganizeTitle,
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
  if (step === 'title') return validateOrganizeTitle(draft, 'Enter a title.');
  if (step === 'audience') {
    const others = validateOrganizeAudienceOthers(draft);
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
  if (step === 'price') return validateOrganizePrice(draft);
  if (step === 'publish') {
    if (draft.latitude == null && draft.longitude == null) return 'Drop a pin on the map.';
    if (draft.toLatitude == null || draft.toLongitude == null) {
      return 'Drop a destination pin on the map.';
    }
    const titleErr = validateOrganizeTitle(draft, 'Enter a title.');
    if (titleErr) return titleErr;
    return validateOrganizePrice(draft);
  }
  return null;
};

export const organizeRideshareFlow: OrganizeCatalogFlow = {
  id: 'organize.rideshare',
  createKind: 'carpool',
  defaultSteps: DEFAULT_STEPS,
  postPublishCarpool: false,
  getSteps: () => [...DEFAULT_STEPS],
  validateStep,
};
