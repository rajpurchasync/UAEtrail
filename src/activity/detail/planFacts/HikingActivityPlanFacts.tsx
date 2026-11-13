import type { ActivityDetailDTO } from '@uaetrail/shared-types';
import { resolveActivityDetailDirectionsCoords } from '../activityDetailDirectionsCoords';
import { ActivityKindFactsGrid } from './ActivityKindFactsGrid';
import { ActivityFactMeetLocation } from './ActivityFactMeetLocation';
import { ActivityFactLinkedPlaceName } from './ActivityFactLinkedPlaceName';
import {
  hikingPlanFactsHasContent,
  resolveHikingPlanFacts,
} from '../activityKindRequirementFacts';

type Props = {
  activity: ActivityDetailDTO;
  panelClassName: string;
  consumerSection?: boolean;
};

export const HikingActivityPlanFacts = ({ activity, panelClassName, consumerSection = false }: Props) => {
  const facts = resolveHikingPlanFacts(activity);
  if (!hikingPlanFactsHasContent(facts)) return null;
  const { lat, lng } = resolveActivityDetailDirectionsCoords(activity);

  const meetValue = facts.goingFrom ? (
    <ActivityFactMeetLocation text={facts.goingFrom} lat={lat} lng={lng} />
  ) : null;

  const trailValue = facts.trailName ? (
    <ActivityFactLinkedPlaceName activity={activity} name={facts.trailName} />
  ) : null;

  return (
    <ActivityKindFactsGrid
      title="Trail & hike"
      panelClassName={panelClassName}
      consumerSection={consumerSection}
      sectionId="activity-detail-trail-facts"
      items={[
        { label: 'Trail', value: trailValue },
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
        { label: 'Meet / start', value: meetValue },
      ]}
    />
  );
};
