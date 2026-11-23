/**
 * Shared availability ↔ hosted outing fit rules (retrieval predicates).
 * Used by Discover/Plan reads (`match-preview`) and matching notify — not a public HTTP route.
 */
import type { MemberAvailabilityDTO } from '@uaetrail/shared-types';
import {
  availabilityKindMatchesActivityType,
  memberAvailabilityCalendarDays,
  prunePastAvailabilitySlots,
} from '@uaetrail/shared-types';

export const activityCalendarDay = (startAt: Date): string =>
  new Date(startAt).toISOString().slice(0, 10);

export const memberAvailabilityDaySet = (
  availability: Pick<MemberAvailabilityDTO, 'slots'>,
  todayIso: string
): Set<string> => {
  const days = memberAvailabilityCalendarDays(
    prunePastAvailabilitySlots(availability.slots ?? [], todayIso)
  );
  return new Set(days);
};

export type HostedExploreEventLike = {
  id: string;
  title: string;
  activityMode?: string | null;
  startAt?: Date | null;
  activityType?: string | null;
};

/** Hosted published outing overlaps member calendar days + activity kinds. */
export const hostedEventFitsMemberAvailability = (
  availability: Pick<MemberAvailabilityDTO, 'kinds' | 'slots' | 'visibility'>,
  event: HostedExploreEventLike,
  daySet: Set<string>
): boolean => {
  if (availability.visibility === 'hidden') return false;
  if (availability.kinds.length === 0) return false;
  if (event.activityMode === 'seeking') return false;
  if (!event.startAt) return false;
  if (!daySet.has(activityCalendarDay(event.startAt))) return false;
  return availabilityKindMatchesActivityType(availability.kinds, event.activityType);
};

export const filterHostedEventsForMemberAvailability = (
  events: HostedExploreEventLike[],
  availability: Pick<MemberAvailabilityDTO, 'kinds' | 'slots' | 'visibility'>,
  options: { todayIso: string; max: number }
): HostedExploreEventLike[] => {
  const daySet = memberAvailabilityDaySet(availability, options.todayIso);
  if (daySet.size === 0 || availability.kinds.length === 0) return [];
  return events
    .filter((event) => hostedEventFitsMemberAvailability(availability, event, daySet))
    .slice(0, options.max);
};