import type { AvailabilityKind } from '@uaetrail/shared-types';
import { loadExploreAvailabilityIndex } from '../lib/member-availability-store.js';

/** Explore people availability index (`GET /explore/people/availability`). */
export const loadExplorePeopleAvailability = async (input: {
  viewerUserId: string | null;
  rangeStart: string;
  rangeEnd: string;
  kind: AvailabilityKind | null;
  areaSlug: string | null;
  region: string | null;
  friendsOnly: boolean;
}) => {
  return loadExploreAvailabilityIndex({
    viewerUserId: input.viewerUserId,
    rangeStart: input.rangeStart,
    rangeEnd: input.rangeEnd,
    kind: input.kind,
    areaSlug: input.areaSlug,
    region: input.region,
    friendsOnly: input.friendsOnly,
  });
};
