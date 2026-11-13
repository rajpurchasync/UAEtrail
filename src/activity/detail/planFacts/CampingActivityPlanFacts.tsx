import type { ActivityDetailDTO } from '@uaetrail/shared-types';
import { ActivityKindFactsGrid } from './ActivityKindFactsGrid';
import {
  campingPlanFactsHasContent,
  resolveCampingPlanFacts,
} from '../activityKindRequirementFacts';

type Props = {
  activity: ActivityDetailDTO;
  panelClassName: string;
};

export const CampingActivityPlanFacts = ({ activity, panelClassName }: Props) => {
  const facts = resolveCampingPlanFacts(activity);
  if (!campingPlanFactsHasContent(facts)) return null;

  return (
    <ActivityKindFactsGrid
      title="Camp spot"
      panelClassName={panelClassName}
      accentClass="text-amber-700"
      items={[
        { label: 'Site', value: facts.campName },
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
        { label: 'Meet / convoy', value: facts.goingFrom },
      ]}
    />
  );
};
