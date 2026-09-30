import {
  readVenueArabicNameFromTags,
  readVenueEnglishNameFromTags,
  resolveVenueExploreLabels,
  VENUE_NAME_AR_TAG_PREFIX,
  VENUE_NAME_EN_TAG_PREFIX,
} from '@uaetrail/shared-types';

export {
  VENUE_NAME_AR_TAG_PREFIX,
  VENUE_NAME_EN_TAG_PREFIX,
  resolveVenueExploreLabels,
};

/** @deprecated Use readVenueEnglishNameFromTags from @uaetrail/shared-types */
export const readVenueEnglishNameFromLocationTags = readVenueEnglishNameFromTags;

/** @deprecated Use readVenueArabicNameFromTags from @uaetrail/shared-types */
export const readVenueArabicNameFromLocationTags = readVenueArabicNameFromTags;
