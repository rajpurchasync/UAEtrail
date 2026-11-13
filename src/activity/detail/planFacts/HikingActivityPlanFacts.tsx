import type { ActivityDetailDTO } from '@uaetrail/shared-types';
import { ActivityKindFactsGrid } from './ActivityKindFactsGrid';
import {
  hikingPlanFactsHasContent,
  resolveHikingPlanFacts,
} from '../activityKindRequirementFacts';

type Props = {
  activity: ActivityDetailDTO;
  panelClassName: string;
};

export const HikingActivityPlanFacts = ({ activity, panelClassName }: Props) => {
  const facts = resolveHikingPlanFacts(activity);
  if (!hikingPlanFactsHasContent(facts)) return null;

  return (
    <ActivityKindFactsGrid
      title="Trail & hike"
      panelClassName={panelClassName}
      items={[
        { label: 'Trail', value: facts.trailName },
        { label: 'Difficulty', value: facts.difficulty },
        {
          label: 'Distance',
          value: facts.distanceKm != null && facts.distanceKm > 0 ? `${facts.distanceKm} km` : null,
        },
        {
          label: 'Elevation',
          value: facts.elevationM != null && facts.elevationM > 0 ? `${facts.elevationM} m` : null,
        },
        { label: 'Getting there', value: facts.reachBy },
        { label: 'Meet / start', value: facts.goingFrom },
      ]}
    />
  );
};
