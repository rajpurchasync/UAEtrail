import { isFacilityPlaceKind, PLACE_KIND_LABELS, placeKindFromLocationRow } from '@uaetrail/shared-types';
import type { PlaceDetailKind } from '../../pages/placeDetailConfig';
import type { Place } from '../../types/place';
import {
  resolvePlacePeekAudienceFromPlace,
  resolvePlacePeekCampFactsFromPlace,
  resolvePlacePeekEventFactsFromPlace,
  resolvePlacePeekTrailFactsFromPlace,
} from '../peek/resolvePlacePeekCatalogFacts';
import { RatingStatTile, StatGrid, StatTile } from '../../detail/shell';
import { keyFactIconFromLabel } from '../../detail/shell/keyFactIcons';

const labelChipClass =
  'inline-flex rounded-lg border border-neutral-200 bg-white px-2.5 py-1 text-xs font-semibold text-neutral-800';

export type PlaceConsumerRatingFacts = {
  average: number | null;
  count: number;
  rateHref?: string;
};

const factGrid = (
  cells: { label: string; value: string }[],
  rating?: PlaceConsumerRatingFacts | null
) => {
  if (cells.length === 0 && !rating) return null;
  return (
    <StatGrid label="">
      {cells.map((cell) => (
        <StatTile
          key={cell.label}
          label={cell.label}
          value={cell.value}
          icon={keyFactIconFromLabel(cell.label)}
        />
      ))}
      {rating ? (
        <RatingStatTile
          average={rating.average}
          count={rating.count}
          rateHref={rating.rateHref}
        />
      ) : null}
    </StatGrid>
  );
};

export const PlaceConsumerKindFacts = ({
  kind,
  place,
  showAudience = true,
  rating = null,
}: {
  kind: PlaceDetailKind;
  place: Place;
  showAudience?: boolean;
  rating?: PlaceConsumerRatingFacts | null;
}) => {
  const catalogKind = placeKindFromLocationRow({
    activityType: place.activityType,
    tags: place.tags,
  });
  if (isFacilityPlaceKind(catalogKind)) {
    return (
      <StatGrid label="">
        <StatTile
          label="Facility"
          value={PLACE_KIND_LABELS[catalogKind]}
          icon={keyFactIconFromLabel('Facility')}
        />
        {rating ? (
          <RatingStatTile
            average={rating.average}
            count={rating.count}
            rateHref={rating.rateHref}
          />
        ) : null}
      </StatGrid>
    );
  }

  const audience = resolvePlacePeekAudienceFromPlace(place);
  const audienceRow =
    showAudience && audience.length > 0 ? (
      <div className="flex flex-wrap gap-1.5">
        {audience.map((label) => (
          <span key={label} className={labelChipClass}>
            {label}
          </span>
        ))}
      </div>
    ) : null;

  if (kind === 'trail') {
    const facts = resolvePlacePeekTrailFactsFromPlace(place);
    const cells: { label: string; value: string }[] = [];
    if (facts.distanceKm) cells.push({ label: 'Length', value: facts.distanceKm });
    if (facts.difficulty) cells.push({ label: 'Difficulty', value: facts.difficulty });
    if (facts.durationHours) cells.push({ label: 'Duration', value: facts.durationHours });
    if (facts.elevationM) cells.push({ label: 'Elevation', value: facts.elevationM });
    if (cells.length === 0 && audience.length === 0 && !rating) return null;
    return (
      <div className="space-y-2">
        {factGrid(cells, rating)}
        {audienceRow}
      </div>
    );
  }

  if (kind === 'camp') {
    const facts = resolvePlacePeekCampFactsFromPlace(place);
    const cells: { label: string; value: string }[] = [];
    if (facts.surface) cells.push({ label: 'Surface', value: facts.surface });
    if (facts.campingStyle) cells.push({ label: 'Camping', value: facts.campingStyle });
    if (cells.length === 0 && audience.length === 0 && !rating) return null;
    return (
      <div className="space-y-2">
        {factGrid(cells, rating)}
        {audienceRow}
      </div>
    );
  }

  if (kind === 'event') {
    const facts = resolvePlacePeekEventFactsFromPlace(place);
    const cells: { label: string; value: string }[] = [];
    if (facts.routeKm) cells.push({ label: 'Route', value: facts.routeKm });
    if (facts.durationHours) cells.push({ label: 'Duration', value: facts.durationHours });
    if (facts.capacity) cells.push({ label: 'Capacity', value: facts.capacity });
    if (cells.length === 0 && audience.length === 0 && !rating) return null;
    return (
      <div className="space-y-2">
        {factGrid(cells, rating)}
        {audienceRow}
      </div>
    );
  }

  if (audience.length === 0 && !rating) return null;
  return (
    <div className="space-y-2">
      {rating ? factGrid([], rating) : null}
      {audienceRow}
    </div>
  );
};
