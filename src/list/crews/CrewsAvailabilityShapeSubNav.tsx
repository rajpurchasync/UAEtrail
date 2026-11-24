import {
  EXPLORE_CREWS_AVAILABILITY_FIXED_LABEL,
  EXPLORE_CREWS_AVAILABILITY_FLEXIBLE_LABEL,
} from '@/content/exploreCrewsCopy';
import { MY_CREW_SUB_NAV_ROW, myCrewSubNavTabClass } from '@/my-crew/myCrewHubChrome';
import type { CrewsAvailabilityShapeFilter } from './crewsOpenSegment';
import { CREWS_AVAILABILITY_SHAPE_ORDER } from './crewsOpenSegment';

const SHAPE_LABELS: Record<CrewsAvailabilityShapeFilter, string> = {
  all: 'All',
  flexible: EXPLORE_CREWS_AVAILABILITY_FLEXIBLE_LABEL,
  fixed: EXPLORE_CREWS_AVAILABILITY_FIXED_LABEL,
};

type CrewsAvailabilityShapeSubNavProps = {
  active: CrewsAvailabilityShapeFilter;
  onChange: (filter: CrewsAvailabilityShapeFilter) => void;
  /** Omit “All” — Flexible · Fixed only. */
  omitAll?: boolean;
};

export const CrewsAvailabilityShapeSubNav = ({
  active,
  onChange,
  omitAll = false,
}: CrewsAvailabilityShapeSubNavProps) => {
  const order = omitAll
    ? CREWS_AVAILABILITY_SHAPE_ORDER.filter((k) => k !== 'all')
    : CREWS_AVAILABILITY_SHAPE_ORDER;

  return (
    <div className={`${MY_CREW_SUB_NAV_ROW} mt-1`} role="tablist" aria-label="Availability type">
      {order.map((key) => {
        const selected = active === key;
        return (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={selected}
            className={myCrewSubNavTabClass(selected)}
            onClick={() => onChange(key)}
          >
            {SHAPE_LABELS[key]}
          </button>
        );
      })}
    </div>
  );
};