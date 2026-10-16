import type { CreateActivityDraft, CreateFlowStepId } from '../hostingFlowEngine';
import { usesRegistryCatalogVenue } from './registry';

export const validateOrganizeTitle = (draft: CreateActivityDraft, emptyMessage: string): string | null => {
  const titleTrimmed = draft.title.trim();
  if (!titleTrimmed) return emptyMessage;
  if (titleTrimmed.length < 4) return 'Title must be at least 4 characters.';
  return null;
};

export const validateOrganizeAudienceOthers = (draft: CreateActivityDraft): string | null => {
  if (draft.audienceAccess === 'others' && !draft.audienceOtherNote.trim()) {
    return 'Describe who can attend.';
  }
  return null;
};

export const validateOrganizePrice = (draft: CreateActivityDraft): string | null => {
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
    if (!draft.trailName.trim()) {
      if (draft.kind === 'camping') return 'Name the camp or area.';
      if (draft.kind === 'event') return 'Name the venue or area.';
      return 'Name the trail or where you are going.';
    }
    return null;
  }
  if (!draft.registryPlaceId) {
    if (draft.kind === 'camping') return 'Choose a camp from the registry.';
    if (draft.kind === 'event') return 'Choose a venue from the registry.';
    return 'Choose a trail from the registry.';
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
