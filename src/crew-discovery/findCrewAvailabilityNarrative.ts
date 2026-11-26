import type { MemberAvailabilitySlotDTO } from '@uaetrail/shared-types';
import { formatAvailabilitySlotLogisticsLine, isFixedAvailabilitySlot } from '@uaetrail/shared-types';
import {
  CREW_BROWSE_DESTINATIONS_ANY,
  type CrewBrowseAvailabilityDetail,
} from './availabilityBrowseCardCopy';
import {
  EXPLORE_CREWS_AVAILABILITY_FIXED_LABEL,
  EXPLORE_CREWS_AVAILABILITY_FLEXIBLE_LABEL,
  formatCrewBrowseAvailabilitySlotLineMinimal,
} from '../content/exploreCrewsCopy';
import {
  FIND_CREW_CARD_ACTIVITY_OPEN_HEADLINE,
  FIND_CREW_CARD_ACTIVITY_RIDESHARE,
  FIND_CREW_CARD_LABEL_DESTINATION,
  FIND_CREW_CARD_LABEL_FROM,
  FIND_CREW_CARD_LABEL_TO,
  FIND_CREW_CARD_ACTIVITY_PREFIX,
} from '@/discovery/discoverySessionListFindCrewCopy';

export type FindCrewAvailabilityCapacityKind = 'crew' | 'guide' | 'mixed';

export type FindCrewCardDateRow = {
  scheduleLabel: string;
  range: string;
};

export type FindCrewActivityDisplay = {
  headline: string;
  detail: string | null;
};

export type FindCrewAvailabilityNarrative = {
  activity: FindCrewActivityDisplay;
  destinationLabel: string;
  /** One or more regions / areas of interest (publish may list several). */
  destinationValues: string[];
  destinationMoreCount: number;
  toLabel: string | null;
  toValue: string | null;
  /** Primary + additional windows when member picked multiple date ranges. */
  dateRows: FindCrewCardDateRow[];
  dateMoreCount: number;
  capacityKind: FindCrewAvailabilityCapacityKind;
  /** Party size + transport from slot wire (null when absent). */
  logisticsLine: string | null;
};

const MAX_DESTINATIONS_LIST = 4;
const MAX_DATE_ROWS_LIST = 3;

const isRideshareDetail = (detail: CrewBrowseAvailabilityDetail): boolean =>
  detail.forLabels.some((label) => label.toLowerCase() === 'rideshare') ||
  (detail.activityOpen === false &&
    detail.forLabels.length === 0 &&
    detail.for.toLowerCase().includes('rideshare'));

const resolveCapacityKind = (asLabels: string[]): FindCrewAvailabilityCapacityKind => {
  const lower = new Set(asLabels.map((l) => l.toLowerCase()));
  const hasGuide = lower.has('guide');
  const hasCrew = lower.has('crew');
  if (hasGuide && hasCrew) return 'mixed';
  if (hasGuide) return 'guide';
  return 'crew';
};

const capacitySuffix = (kind: FindCrewAvailabilityCapacityKind): string => {
  if (kind === 'mixed') return 'as guide or crew';
  if (kind === 'guide') return 'as guide';
  return '';
};

const destinationValuesFromDetail = (
  detail: CrewBrowseAvailabilityDetail
): { values: string[]; moreCount: number } => {
  const areas = detail.destinationLabels.filter((label) => label !== CREW_BROWSE_DESTINATIONS_ANY);
  if (areas.length === 0) return { values: ['Open to areas'], moreCount: 0 };
  const shown = areas.slice(0, MAX_DESTINATIONS_LIST);
  const moreCount = Math.max(0, areas.length - shown.length);
  return { values: shown, moreCount };
};

const rideRouteFromSlot = (
  slot: MemberAvailabilitySlotDTO | undefined
): { from: string | null; to: string | null } => {
  const title = slot?.title?.trim();
  if (!title) return { from: null, to: null };
  const arrow = title.split(/\s*→\s*|\s+to\s+/i);
  if (arrow.length >= 2) {
    return { from: arrow[0]!.trim() || null, to: arrow[1]!.trim() || null };
  }
  return { from: null, to: title };
};

const stripWindowPrefix = (text: string): string =>
  text.replace(/^Flexible · /, '').replace(/^Fixed · /, '');

const dateRowsFromDetail = (
  detail: CrewBrowseAvailabilityDetail,
  slots: MemberAvailabilitySlotDTO[]
): { rows: FindCrewCardDateRow[]; moreCount: number } => {
  const fromWindows: FindCrewCardDateRow[] = detail.dateWindows.map((window) => ({
    scheduleLabel:
      window.kind === 'fixed'
        ? EXPLORE_CREWS_AVAILABILITY_FIXED_LABEL
        : EXPLORE_CREWS_AVAILABILITY_FLEXIBLE_LABEL,
    range: stripWindowPrefix(window.text),
  }));
  if (fromWindows.length > 0) {
    const capped = fromWindows.slice(0, MAX_DATE_ROWS_LIST);
    const moreCount = Math.max(0, fromWindows.length - capped.length + detail.dateMoreCount);
    return { rows: capped, moreCount };
  }
  const fromSlots = slots.map((slot) => ({
    scheduleLabel: isFixedAvailabilitySlot(slot)
      ? EXPLORE_CREWS_AVAILABILITY_FIXED_LABEL
      : EXPLORE_CREWS_AVAILABILITY_FLEXIBLE_LABEL,
    range: formatCrewBrowseAvailabilitySlotLineMinimal(slot),
  }));
  if (fromSlots.length === 0 && detail.datesLine) {
    return {
      rows: [{ scheduleLabel: EXPLORE_CREWS_AVAILABILITY_FLEXIBLE_LABEL, range: detail.datesLine }],
      moreCount: 0,
    };
  }
  const capped = fromSlots.slice(0, MAX_DATE_ROWS_LIST);
  return { rows: capped, moreCount: Math.max(0, fromSlots.length - capped.length) };
};

const activityDisplay = (
  detail: CrewBrowseAvailabilityDetail,
  capacityKind: FindCrewAvailabilityCapacityKind
): FindCrewActivityDisplay => {
  const suffix = capacitySuffix(capacityKind);
  const detailWithSuffix = (core: string): string => (suffix ? `${core} · ${suffix}` : core);

  if (isRideshareDetail(detail)) {
    return {
      headline: FIND_CREW_CARD_ACTIVITY_RIDESHARE,
      detail: suffix || null,
    };
  }
  if (detail.activityOpen) {
    return {
      headline: FIND_CREW_CARD_ACTIVITY_OPEN_HEADLINE,
      detail: detailWithSuffix('Open'),
    };
  }
  const acts =
    detail.forLabels.length > 0
      ? detail.forLabels.join(' / ')
      : detail.for !== '—'
        ? detail.for
        : 'Outdoor plans';
  return {
    headline: FIND_CREW_CARD_ACTIVITY_PREFIX,
    detail: detailWithSuffix(acts),
  };
};

/** Structured Find crew card copy — People lane (no commercial hire lines; see For Hire lane later). */
export const findCrewAvailabilityNarrativeFromDetail = (
  detail: CrewBrowseAvailabilityDetail,
  slots: MemberAvailabilitySlotDTO[] = []
): FindCrewAvailabilityNarrative => {
  const capacityKind = resolveCapacityKind(detail.asLabels);
  const rideshare = isRideshareDetail(detail);
  const primarySlot = slots[0];
  const route = rideshare ? rideRouteFromSlot(primarySlot) : { from: null, to: null };

  const { values: destinationValues, moreCount: destinationMoreCount } = destinationValuesFromDetail(detail);
  const { rows: dateRows, moreCount: dateMoreCount } = dateRowsFromDetail(detail, slots);

  const destinationLabel = rideshare ? FIND_CREW_CARD_LABEL_FROM : FIND_CREW_CARD_LABEL_DESTINATION;
  const fromValues = rideshare
    ? route.from
      ? [route.from]
      : destinationValues
    : destinationValues;

  const toValue =
    rideshare && route.to ? route.to : rideshare ? (primarySlot?.title?.trim() || 'Flexible') : null;

  const logisticsSlot =
  slots.find((slot) => formatAvailabilitySlotLogisticsLine(slot)) ?? primarySlot;
  const logisticsLine = logisticsSlot ? formatAvailabilitySlotLogisticsLine(logisticsSlot) : null;

  return {
    activity: activityDisplay(detail, capacityKind),
    destinationLabel,
    destinationValues: fromValues,
    destinationMoreCount: rideshare ? 0 : destinationMoreCount,
    toLabel: rideshare ? FIND_CREW_CARD_LABEL_TO : null,
    toValue: rideshare ? toValue : null,
    dateRows,
    dateMoreCount,
    capacityKind,
    logisticsLine,
  };
};