import { TRIPS_PATH } from '../constants';

export type TripsSegment = 'upcoming' | 'completed' | 'wishlist';

export type TripsRole = 'joined' | 'hosted' | 'self';

export const parseTripsSegment = (raw: string | null): TripsSegment => {
  if (raw === 'wishlist') return 'wishlist';
  if (raw === 'past' || raw === 'completed') return 'completed';
  return 'upcoming';
};

export const parseTripsRole = (
  raw: string | null,
  segment: TripsSegment,
  options: { canHost: boolean; legacyTab: string | null }
): TripsRole => {
  if (raw === 'self') return 'self';
  if (raw === 'hosted' && options.canHost) return 'hosted';
  if (raw === 'joined') return 'joined';
  if (options.legacyTab === 'hosted' && options.canHost) return 'hosted';
  if (segment === 'completed' && options.legacyTab === 'joined') return 'joined';
  return 'joined';
};

/** Normalize legacy `tab` / `sub` into segment + role (mutates params). */
export const normalizeTripsSearchParams = (
  params: URLSearchParams,
  canHost: boolean
): { changed: boolean } => {
  let changed = false;
  const legacyTab = params.get('tab');
  const legacySub = params.get('sub');

  if (params.get('segment') === 'past') {
    params.set('segment', 'completed');
    changed = true;
  }

  if (!params.get('segment') && (legacyTab || legacySub)) {
    if (legacySub === 'attended' || legacyTab === 'joined') {
      params.set('segment', 'completed');
      changed = true;
    }
  }

  const resolvedSegment = parseTripsSegment(params.get('segment'));

  if (!params.get('role')) {
    const role = parseTripsRole(null, resolvedSegment, { canHost, legacyTab });
    params.set('role', role);
    changed = true;
  }

  if (legacyTab || legacySub) {
    params.delete('tab');
    params.delete('sub');
    changed = true;
  }

  return { changed };
};

export const tripsPath = (input?: {
  segment?: TripsSegment;
  role?: TripsRole;
}): string => {
  const params = new URLSearchParams();
  if (input?.segment && input.segment !== 'upcoming') {
    params.set('segment', input.segment);
  }
  if (input?.role && input.role !== 'joined') {
    params.set('role', input.role);
  }
  const qs = params.toString();
  return qs ? `${TRIPS_PATH}?${qs}` : TRIPS_PATH;
};

export const tripsMapPath = () => '/trips/map';

export const TRIPS_SEGMENT_TABS: { id: TripsSegment; label: string }[] = [
  { id: 'upcoming', label: 'Upcoming' },
  { id: 'completed', label: 'Completed' },
  { id: 'wishlist', label: 'Wishlist' },
];

export const tripsRoleChips = (
  segment: TripsSegment,
  canHost: boolean
): { id: TripsRole; label: string }[] => {
  if (segment === 'upcoming') {
    const chips: { id: TripsRole; label: string }[] = [
      { id: 'joined', label: 'Joined' },
    ];
    if (canHost) chips.push({ id: 'hosted', label: 'Hosted' });
    chips.push({ id: 'self', label: 'My plans' });
    return chips;
  }
  if (segment === 'completed') {
    const chips: { id: TripsRole; label: string }[] = [
      { id: 'joined', label: 'Joined' },
    ];
    if (canHost) chips.push({ id: 'hosted', label: 'Hosted' });
    chips.push({ id: 'self', label: 'My plans' });
    return chips;
  }
  return [];
};
