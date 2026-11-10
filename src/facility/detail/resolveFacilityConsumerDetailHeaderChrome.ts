import {
  PLACE_KIND_LABELS,
  facilityPlaceKindPinEmoji,
  type FacilityKind,
} from '@uaetrail/shared-types';

/** Sticky center chrome on facility consumer detail — type emoji + label (not the facility name). */
export const resolveFacilityConsumerDetailHeaderChrome = (kind: FacilityKind) => ({
  emoji: facilityPlaceKindPinEmoji(kind),
  label: PLACE_KIND_LABELS[kind],
});
