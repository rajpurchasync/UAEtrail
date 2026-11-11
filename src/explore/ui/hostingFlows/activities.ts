import type { CreateActivityDraft, CreateFlowStepId } from '../hostingFlowEngine';
import type { HostingKindFlow } from './types';
import {
  validateLimitedMinAge,
  validateHostingAudienceOthers,
  validateHostingPrice,
  validateHostingTitle,
  validateHostingWhenSchedule,
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
  if (step === 'title') return validateHostingTitle(draft, 'Give your outing a title.');
  if (step === 'audience') return validateHostingAudienceOthers(draft);
  if (step === 'when') return validateHostingWhenSchedule(draft);
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
    if (!draft.activityTopic) return 'Choose an activity type.';
    return validateHostingPrice(draft);
  }
  return null;
};

export const activitiesHostingFlow: HostingKindFlow = {
  id: 'host.activity',
  createKind: 'activity',
  defaultSteps: DEFAULT_STEPS,
  postPublishRideshare: true,
  getSteps: () => [...DEFAULT_STEPS],
  validateStep,
};
