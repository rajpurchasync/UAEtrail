import type { CreateActivityDraft, CreateFlowStepId } from '../organizeFlow';
import type { OrganizeCatalogFlow } from './types';
import {
  validateLimitedMinAge,
  validateOrganizeAudienceOthers,
  validateOrganizePrice,
  validateOrganizeTitle,
} from './validateShared';

const DEFAULT_STEPS: CreateFlowStepId[] = [
  'activity_type',
  'title',
  'when',
  'meeting_point',
  'spots',
  'audience',
  'price',
  'instructions',
  'meeting',
  'transportation',
  'publish',
];

const validateStep = (step: CreateFlowStepId, draft: CreateActivityDraft): string | null => {
  if (step === 'activity_type' && !draft.activityTopic) return 'Choose an activity type.';
  if (step === 'title') return validateOrganizeTitle(draft, 'Give your outing a title.');
  if (step === 'audience') return validateOrganizeAudienceOthers(draft);
  if (step === 'when' && draft.timeMode === 'specific' && !draft.time) {
    return 'Choose a start time.';
  }
  if (step === 'meeting') {
    if (draft.latitude == null || draft.longitude == null) {
      if (draft.meetingLatitude != null && draft.meetingLongitude != null) return null;
      return 'Drop a pin on the map.';
    }
    return null;
  }
  if (step === 'meeting_point' && (draft.meetingLatitude == null || draft.meetingLongitude == null)) {
    return 'Drop a meeting point pin on the map.';
  }
  if (step === 'spots') {
    if (draft.capacity < 1) return 'Choose at least one spot.';
    return validateLimitedMinAge(draft);
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
    if (!draft.activityTopic) return 'Choose an activity type.';
    return validateOrganizePrice(draft);
  }
  return null;
};

export const organizeActivitiesFlow: OrganizeCatalogFlow = {
  id: 'organize.activities',
  createKind: 'activity',
  defaultSteps: DEFAULT_STEPS,
  postPublishRideshare: true,
  getSteps: () => [...DEFAULT_STEPS],
  validateStep,
};
