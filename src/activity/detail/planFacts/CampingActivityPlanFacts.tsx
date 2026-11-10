import type { ActivityDetailDTO } from '@uaetrail/shared-types';
import { resolveActivityDetailDirectionsCoords } from '../activityDetailDirectionsCoords';
import { ActivityKindFactsGrid } from './ActivityKindFactsGrid';
import { ActivityFactMeetLocation } from './ActivityFactMeetLocation';
import { ActivityFactLinkedPlaceName } from './ActivityFactLinkedPlaceName';
import {
  campingPlanFactsHasContent,
  resolveCampingPlanFacts,
} from '../activityKindRequirementFacts';

type Props = {
  activity: ActivityDetailDTO;
  panelClassName: string;
  consumerSection?: boolean;
};

export const CampingActivityPlanFacts = ({ activity, panelClassName, consumerSection = false }: Props) => {
  const facts = resolveCampingPlanFacts(activity);
  if (!campingPlanFactsHasContent(facts)) return null;
  const { lat, lng } = resolveActivityDetailDirectionsCoords(activity);

  const meetValue = facts.goingFrom ? (
    <ActivityFactMeetLocation text={facts.goingFrom} lat={lat} lng={lng} />
  ) : null;

  const siteValue = facts.campName ? (
    <ActivityFactLinkedPlaceName activity={activity} name={facts.campName} />
  ) : null;

  return (
    <ActivityKindFactsGrid
      title="Camp spot"
      panelClassName={panelClassName}
      consumerSection={consumerSection}
      sectionId="activity-detail-camp-facts"
      accentClass="text-amber-700"
      items={[
        { label: 'Site', value: siteValue },
        {
          label: 'Surface',
          value: facts.surfaceTypes.length ? facts.surfaceTypes.join(' · ') : null,
        },
        { label: 'Camp style', value: facts.campingType },
        {
          label: 'Season',
          value: facts.season.length ? facts.season.join(' · ') : null,
        },
        { label: 'Access', value: facts.accessibility },
        { label: 'Getting there', value: facts.reachBy },
        { label: 'Meet / convoy', value: meetValue },
      ]}
    />
  );
};
