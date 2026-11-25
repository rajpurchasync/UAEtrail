import type { CreateActivityDraft, CreateFlowStepId } from '../hostingFlowEngine';
import { validateHostingWhenSchedule } from '../hostingScheduleDraft';

export { validateHostingWhenSchedule };
import { validateCustomVenueDetails } from '../../hostingPublishDestination';
import { usesRegistryCatalogVenue } from './registry';

export const validateHostingTitle = (draft: CreateActivityDraft, emptyMessage: string): string | null => {
  const titleTrimmed = draft.title.trim();
  if (!titleTrimmed) return emptyMessage;
  if (titleTrimmed.length < 4) return 'Title must be at least 4 characters.';
  return null;
};

export const validateHostingAudienceOthers = (draft: CreateActivityDraft): string | null => {
  if (draft.audienceAccess === 'others' && !draft.audienceOtherNote.trim()) {
    return 'Describe who can attend.';
  }
  return null;
};

export const validateHostingPrice = (draft: CreateActivityDraft): string | null => {
  if (draft.priceMode === 'paid' && draft.priceAmount <= 0) return 'Enter a price amount.';
  if (draft.priceMode === 'shared' && draft.priceAmount <= 0) return 'Enter a shared cost amount.';
  return null;
};

export const validateStructuredAboutTrail = (
  draft: CreateActivityDraft,
  _step: CreateFlowStepId
): string | null => {
  if (usesRegistryCatalogVenue(draft)) return null;
  const aboutTrimmed = draft.aboutTrail.trim();
  if (!aboutTrimmed) {
    if (draft.kind === 'camping') return 'Tell joiners about the camp.';
    if (draft.kind === 'event') return 'Tell joiners about the event.';
    return 'Tell joiners about the trail.';
  }
  if (aboutTrimmed.length < 20) {
    return 'Description must be at least 20 characters.';
  }
  return null;
};

export const validateStructuredDestination = (draft: CreateActivityDraft): string | null => {
  if (draft.placeLabelSource === 'custom') {
    return validateCustomVenueDetails(draft);
  }
  if (!draft.venueCascadeState?.trim()) return 'Select a state.';
  if (!draft.registryPlaceDestinationId?.trim()) return 'Select an area.';
  if (!draft.venueCascadePlaceGroup?.trim()) return 'Select a place.';
  if (!draft.registryPlaceId?.trim()) {
    if (draft.kind === 'camping') return 'Select a camp spot or add a new one.';
    if (draft.kind === 'event') return 'Select a venue or add a new one.';
    return 'Select a trail or add a new one.';
  }
  return null;
};

export const validateStructuredPublishVenue = (draft: CreateActivityDraft): string | null => {
  const aboutErr = validateStructuredAboutTrail(draft, 'publish');
  if (aboutErr) return aboutErr;
  return validateStructuredDestination(draft);
};

export const validateLimitedMinAge = (draft: CreateActivityDraft): string | null => {
  if (!draft.participantsOpenToAll && draft.limitedMinAgeEnabled && draft.ageMin < 1) {
    return 'Enter a minimum age.';
  }
  return null;
};
