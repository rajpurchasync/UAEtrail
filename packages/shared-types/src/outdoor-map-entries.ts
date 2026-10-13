/** Filter tabs on the personal journey map (`/profile/history/map`), not Explore. */

export type JourneyMapFilterCategory = 'all' | 'wishlist' | 'joined' | 'hosted' | 'self';

export type JourneyMapEntryCategory = 'wishlist' | 'joined' | 'hosted' | 'self';

export interface JourneyMapEntryDTO {
  id: string;
  categories: JourneyMapEntryCategory[];
  title: string;
  placeDate: string;
  latitude: number | null;
  longitude: number | null;
  activityType: string | null;
  statusLabel: string | null;
  activityPath: string | null;
  pinId: string | null;
  activityId: string | null;
}

/** @deprecated Use {@link JourneyMapFilterCategory} */
export type OutdoorMapFilterCategory = JourneyMapFilterCategory;

/** @deprecated Use {@link JourneyMapEntryCategory} */
export type OutdoorMapEntryCategory = JourneyMapEntryCategory;

/** @deprecated Use {@link JourneyMapEntryDTO} */
export type OutdoorMapEntryDTO = JourneyMapEntryDTO;
