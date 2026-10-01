/** Filter tabs on the personal outdoor map (not Explore). */

export type OutdoorMapFilterCategory = 'all' | 'wishlist' | 'joined' | 'hosted' | 'self';

export type OutdoorMapEntryCategory = 'wishlist' | 'joined' | 'hosted' | 'self';

export interface OutdoorMapEntryDTO {
  id: string;
  categories: OutdoorMapEntryCategory[];
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
