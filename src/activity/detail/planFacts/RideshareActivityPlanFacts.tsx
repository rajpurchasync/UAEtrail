import { Link } from 'react-router-dom';
import type { ActivityDetailDTO } from '@uaetrail/shared-types';
import { activityDetailPath } from '../../../config/routingCatalog';
import { ActivityKindFactsGrid } from './ActivityKindFactsGrid';
import {
  ridesharePlanFactsHasContent,
  resolveRidesharePlanFacts,
} from '../activityKindRequirementFacts';

type Props = {
  activity: ActivityDetailDTO;
  panelClassName: string;
};

export const RideshareActivityPlanFacts = ({ activity, panelClassName }: Props) => {
  const facts = resolveRidesharePlanFacts(activity);
  if (!ridesharePlanFactsHasContent(facts)) return null;

  const priceLabel =
    facts.priceAed === 0
      ? 'Free seats'
      : facts.priceAed != null
        ? `AED ${facts.priceAed}`
        : null;

  return (
    <>
      <ActivityKindFactsGrid
        title="Ride share"
        panelClassName={panelClassName}
        accentClass="text-sky-700"
        items={[
          { label: 'Vehicle', value: facts.vehicle },
          {
            label: 'Seats',
            value: facts.seats != null ? String(facts.seats) : null,
          },
          { label: 'Contribution', value: priceLabel },
          {
            label: 'Linked outing',
            value: facts.linkedParentTitle && facts.linkedParentId ? (
              <Link to={activityDetailPath(facts.linkedParentId)} className="text-sky-800 underline">
                {facts.linkedParentTitle}
              </Link>
            ) : null,
          },
        ]}
      />
      {facts.rideshareDetails ? (
        <div className={`bg-white rounded-2xl border border-gray-100 p-5 sm:p-6 ${panelClassName}`}>
          <h2 className="text-lg font-bold text-gray-900 mb-2">Route notes</h2>
          <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{facts.rideshareDetails}</p>
        </div>
      ) : null}
    </>
  );
};
