import { isFacilityPlaceKind, PLACE_KIND_LABELS, placeKindFromLocationRow } from '@uaetrail/shared-types';
import type { PlaceDetailKind } from '../../pages/placeDetailConfig';
import type { Place } from '../../types/place';
import {
  resolvePlacePeekAudienceFromPlace,
  resolvePlacePeekCampFactsFromPlace,
  resolvePlacePeekEventFactsFromPlace,
  resolvePlacePeekTrailFactsFromPlace,
} from '../peek/resolvePlacePeekCatalogFacts';
import { StatGrid, StatTile } from '../../detail/shell';
import { keyFactIconFromLabel } from '../../detail/shell/keyFactIcons';

const labelChipClass =
  'inline-flex rounded-lg border border-neutral-200 bg-white px-2.5 py-1 text-xs font-semibold text-neutral-800';

const factGrid = (cells: { label: string; value: string }[]) =>
  cells.length > 0 ? (
    <StatGrid label="">
      {cells.map((cell) => (
        <StatTile
          key={cell.label}
          label={cell.label}
          value={cell.value}
          icon={keyFactIconFromLabel(cell.label)}
        />
      ))}
    </StatGrid>
  ) : null;

export const PlaceConsumerKindFacts = ({
  kind,
  place,
  showAudience = true,
}: {
  kind: PlaceDetailKind;
  place: Place;
  showAudience?: boolean;
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
      </StatGrid>
    );
  }

  const audience = resolvePlacePeekAudienceFromPlace(place);

  if (kind === 'trail') {
    const facts = resolvePlacePeekTrailFactsFromPlace(place);
    const cells: { label: string; value: string }[] = [];
    if (facts.distanceKm) cells.push({ label: 'Length', value: facts.distanceKm });
    if (facts.difficulty) cells.push({ label: 'Difficulty', value: facts.difficulty });
    if (facts.durationHours) cells.push({ label: 'Duration', value: facts.durationHours });
    if (facts.elevationM) cells.push({ label: 'Elevation', value: facts.elevationM });
    if (cells.length === 0 && audience.length === 0) return null;
    return (
      <div className="space-y-2">
        {factGrid(cells)}
        {showAudience && audience.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {audience.map((label) => (
              <span key={label} className={labelChipClass}>
                {label}
              </span>
            ))}
          </div>
        ) : null}
      </div>
    );
  }

  if (kind === 'camp') {
    const facts = resolvePlacePeekCampFactsFromPlace(place);
    const cells: { label: string; value: string }[] = [];
    if (facts.surface) cells.push({ label: 'Surface', value: facts.surface });
    if (facts.campingStyle) cells.push({ label: 'Camping', value: facts.campingStyle });
    if (cells.length === 0 && audience.length === 0) return null;
    return (
      <div className="space-y-2">
        {factGrid(cells)}
        {showAudience && audience.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {audience.map((label) => (
              <span key={label} className={labelChipClass}>
                {label}
              </span>
            ))}
          </div>
        ) : null}
      </div>
    );
  }

  if (kind === 'event') {
    const facts = resolvePlacePeekEventFactsFromPlace(place);
    const cells: { label: string; value: string }[] = [];
    if (facts.routeKm) cells.push({ label: 'Route', value: facts.routeKm });
    if (facts.durationHours) cells.push({ label: 'Duration', value: facts.durationHours });
    if (facts.capacity) cells.push({ label: 'Capacity', value: facts.capacity });
    if (cells.length === 0 && audience.length === 0) return null;
    return (
      <div className="space-y-2">
        {factGrid(cells)}
        {showAudience && audience.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {audience.map((label) => (
              <span key={label} className={labelChipClass}>
                {label}
              </span>
            ))}
          </div>
        ) : null}
      </div>
    );
  }

  if (audience.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1.5">
      {audience.map((label) => (
        <span key={label} className={labelChipClass}>
          {label}
        </span>
      ))}
    </div>
  );
};
