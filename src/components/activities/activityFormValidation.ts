import type { ActivityType } from '../../config/activityTypes';
import { countWords } from '../../utils/activityFormHelpers';
import type { ActivityFormState } from './activityFormState';
import { FORM_TOTAL_STEPS } from './activityFormSteps';

export const MIN_ABOUT_WORDS = 10;

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
  const startPointLabel = options.activityType === 'camping' ? 'camp start point' : 'hike start point';

  if (targetStep >= 1) {
    if (!form.title.trim()) return 'Title is required.';
    if (titleWords > 5) return 'Title must be 5 words or fewer.';
    if (!form.locationId) return 'Select a venue.';
    if (options.activityType === 'camping' && !form.campingSurfaceType) {
      return 'Select a camping surface type (Sand or Grass).';
    }
    if (mode === 'publish') {
      if (!form.date || !form.time) return 'Date and start time are required.';
      if (!form.description.trim()) {
        return options.activityType === 'camping' ? 'About spot is required.' : 'About trip is required.';
      }
      if (aboutWords < MIN_ABOUT_WORDS) {
        return options.activityType === 'camping'
          ? `About spot must be at least ${MIN_ABOUT_WORDS} words.`
          : `About trip must be at least ${MIN_ABOUT_WORDS} words.`;
      }
      if (aboutWords > 100) {
        return options.activityType === 'camping'
          ? 'About spot must be 100 words or fewer.'
          : 'About trip must be 100 words or fewer.';
      }
      if (form.images.length === 0) return 'Add a cover image.';
    }
    if (options.canPickHostOrganization && !form.tenantId) return 'Select a host organization.';
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
    if (!hasStart) return `Set a ${startPointLabel} (map pin or Google Maps link).`;
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
