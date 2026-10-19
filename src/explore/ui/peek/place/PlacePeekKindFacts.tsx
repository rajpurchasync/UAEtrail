import type { DiscoveryCardModel } from '../../../../discovery/discoveryCardModel';
import {
  resolvePlacePeekAudienceFromCard,
  resolvePlacePeekCampFactsFromCard,
  resolvePlacePeekTrailFactsFromCard,
} from '../../../../place/peek/resolvePlacePeekCatalogFacts';

const factCellClass =
  'rounded-xl border border-neutral-100 bg-neutral-50/90 px-3 py-2.5 text-sm text-neutral-900';
const factLabelClass = 'text-[11px] font-semibold uppercase tracking-wide text-neutral-500';
const labelChipClass =
  'inline-flex rounded-lg border border-neutral-200 bg-white px-2.5 py-1 text-xs font-semibold text-neutral-800';

export const PlacePeekKindFacts = ({ card }: { card: DiscoveryCardModel }) => {
  const audience = resolvePlacePeekAudienceFromCard(card);

  if (card.kind === 'hiking') {
    const facts = resolvePlacePeekTrailFactsFromCard(card);
    const cells: { label: string; value: string }[] = [];
    if (facts.distanceKm) cells.push({ label: 'Length', value: facts.distanceKm });
    if (facts.difficulty) cells.push({ label: 'Difficulty', value: facts.difficulty });
    if (facts.durationHours) cells.push({ label: 'Duration', value: facts.durationHours });
    if (facts.elevationM) cells.push({ label: 'Elevation', value: facts.elevationM });
    if (cells.length === 0 && audience.length === 0) return null;

    return (
      <div className="space-y-2">
        {cells.length > 0 ? (
          <div className="grid grid-cols-2 gap-2">
            {cells.map((cell) => (
              <div key={cell.label} className={factCellClass}>
                <p className={factLabelClass}>{cell.label}</p>
                <p className="mt-0.5 font-semibold">{cell.value}</p>
              </div>
            ))}
          </div>
        ) : null}
        {audience.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {audience.map((label) => (
              <span key={label} className={labelChipClass}>{label}</span>
            ))}
          </div>
        ) : null}
      </div>
    );
  }

  if (card.kind === 'camping') {
    const facts = resolvePlacePeekCampFactsFromCard(card);
    const cells: { label: string; value: string }[] = [];
    if (facts.surface) cells.push({ label: 'Surface', value: facts.surface });
    if (facts.campingStyle) cells.push({ label: 'Camping', value: facts.campingStyle });
    if (cells.length === 0 && audience.length === 0) return null;

    return (
      <div className="space-y-2">
        {cells.length > 0 ? (
          <div className="grid grid-cols-2 gap-2">
            {cells.map((cell) => (
              <div key={cell.label} className={factCellClass}>
                <p className={factLabelClass}>{cell.label}</p>
                <p className="mt-0.5 font-semibold">{cell.value}</p>
              </div>
            ))}
          </div>
        ) : null}
        {audience.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {audience.map((label) => (
              <span key={label} className={labelChipClass}>{label}</span>
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
        <span key={label} className={labelChipClass}>{label}</span>
      ))}
    </div>
  );
};
