import type { ActivityType } from '../../config/activityTypes';
import { countWords } from '../../utils/activityFormHelpers';
import type { ActivityFormState } from './activityFormState';
import { FORM_TOTAL_STEPS } from './activityFormSteps';

export const MIN_ABOUT_WORDS = 10;

export const isValidHttpUrl = (value: string): boolean => {
  const trimmed = value.trim();
  if (!trimmed) return false;
  try {
    const url = new URL(trimmed);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
};

export const aboutFieldLabel = (activityType: ActivityType): string => {
  if (activityType === 'camping') return 'About spot';
  if (activityType === 'event') return 'About event';
  return 'About hike';
};

const startPointLabel = (activityType: ActivityType): string => {
  if (activityType === 'camping') return 'camp start point';
  if (activityType === 'event') return 'event start point';
  return 'hike start point';
};

export const validateActivityFormStep = (
  form: ActivityFormState,
  targetStep: number,
  mode: 'draft' | 'publish',
  options: {
    activityType: ActivityType;
    canPickHostOrganization: boolean;
    totalSteps?: number;
  }
): string | null => {
  const totalSteps = options.totalSteps ?? FORM_TOTAL_STEPS;
  const titleWords = countWords(form.title);
  const aboutWords = countWords(form.description);
  const aboutLabel = aboutFieldLabel(options.activityType);
  const isEvent = options.activityType === 'event';

  if (targetStep >= 1) {
    if (!form.title.trim()) return 'Title is required.';
    if (titleWords > 5) return 'Title must be 5 words or fewer.';
    if (isEvent) {
      if (!form.eventEmirate.trim()) return 'Select an emirate.';
      if (!form.eventState.trim()) return 'Select a state.';
      if (!form.eventVenueDetail.trim()) return 'Enter location details for the event venue.';
    } else if (!form.locationId) {
      return 'Select a venue.';
    }
    if (options.activityType === 'camping' && !form.campingSurfaceType) {
      return 'Select a camping surface type (Sand or Grass).';
    }
    if (isEvent && mode === 'publish' && !form.eventHostOrganization.trim()) {
      return 'Host organization is required.';
    }
    if (mode === 'publish') {
      if (!form.date || !form.time) return 'Date and start time are required.';
      if (!form.description.trim()) return `${aboutLabel} is required.`;
      if (aboutWords < MIN_ABOUT_WORDS) {
        return `${aboutLabel} must be at least ${MIN_ABOUT_WORDS} words.`;
      }
      if (aboutWords > 100) {
        return `${aboutLabel} must be 100 words or fewer.`;
      }
      if (form.images.length === 0) return 'Add a cover image.';
      if (isEvent && !isValidHttpUrl(form.signupUrl)) {
        return 'Enter a valid event URL (https://…).';
      }
    }
    if (options.canPickHostOrganization && !form.tenantId && !isEvent) {
      return 'Select a host organization.';
    }
  }

  if (targetStep >= 2 && mode === 'publish') {
    if (form.capacity < 1) return 'Available spots must be at least 1.';
    if (form.pricingMode === 'shared') {
      if (form.sharedAmount <= 0) return 'Enter the shared cost amount.';
      if (!form.sharedCostInfo.trim()) return 'Let participants know why this cost is shared among participants.';
    }
    if (form.pricingMode === 'paid') {
      if (form.price <= 0) return 'Enter the trip price.';
      if (!form.paymentTerms.trim()) return 'Payment terms are required for paid trips.';
    }
  }

  if (targetStep >= 3 && mode === 'publish') {
    const hasStart =
      form.start.label.trim() || form.start.mapsUrl.trim() || (form.start.lat && form.start.lng);
    if (!hasStart) return `Set a ${startPointLabel(options.activityType)} (map pin or Google Maps link).`;
  }

  if (targetStep >= 5 && mode === 'publish' && form.carPoolEnabled) {
    if (form.carPoolSeats < 1) return 'Enter how many car pool seats are available.';
    if (form.carPoolPricing === 'shared' && form.carPoolSharedAmount <= 0) {
      return 'Enter the shared car pool amount.';
    }
  }

  if (targetStep > totalSteps) return null;

  return null;
};

/** Step-1 "Next" navigation: draft fields plus summary content required before leaving step 1. */
export const validateActivityFormStepNavigation = (
  form: ActivityFormState,
  fromStep: number,
  options: Parameters<typeof validateActivityFormStep>[3]
): string | null => {
  if (fromStep !== 1) return null;

  const draftErr = validateActivityFormStep(form, 1, 'draft', options);
  if (draftErr) return draftErr;

  const isEvent = options.activityType === 'event';
  const aboutLabel = aboutFieldLabel(options.activityType);
  const aboutWords = countWords(form.description);

  if (isEvent && !form.eventHostOrganization.trim()) {
    return 'Host organization is required.';
  }
  if (isEvent && !isValidHttpUrl(form.signupUrl)) {
    return 'Enter a valid event URL (https://…).';
  }
  if (!form.description.trim()) {
    return `${aboutLabel} is required.`;
  }
  if (aboutWords < MIN_ABOUT_WORDS) {
    return `${aboutLabel} must be at least ${MIN_ABOUT_WORDS} words.`;
  }
  if (form.images.length === 0) {
    return 'Add a cover image.';
  }

  return null;
};

export const validateAllActivityFormSteps = (
  form: ActivityFormState,
  mode: 'draft' | 'publish',
  options: Parameters<typeof validateActivityFormStep>[3]
): string | null => {
  for (let s = 1; s <= (options.totalSteps ?? FORM_TOTAL_STEPS); s++) {
    const err = validateActivityFormStep(form, s, mode, options);
    if (err) return err;
  }
  return null;
};
