import type { AreaPublicDTO } from '@uaetrail/shared-types';
import { useExplorePublishedDestinations } from '../useExplorePublishedDestinations';

type AvailabilityCuratedDestinationStepProps = {
  destinationId: string | null;
  onAreaIdChange: (destinationId: string | null) => void;
  intro?: string;
};

/** Find crew: pick the outdoor **Area** you want company in — not a trail pin. */
export const AvailabilityCuratedDestinationStep = ({
  destinationId,
  onAreaIdChange,
  intro = 'Choose the area you want to get outside in. Next you’ll pin where you are going from.',
}: AvailabilityCuratedDestinationStepProps) => {
  const areas = useExplorePublishedDestinations();

  return (
    <div>
      <p className="mb-4 text-sm text-gray-600">{intro}</p>
      <label htmlFor="availability-area-select" className="text-xs font-medium uppercase tracking-wide text-gray-500">
        Area
      </label>
      <select
        id="availability-area-select"
        className="mt-2 w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm text-gray-900"
        value={destinationId ?? ''}
        disabled={areas.length === 0}
        onChange={(event) => onAreaIdChange(event.target.value.trim() ? event.target.value : null)}
      >
        <option value="">Select area…</option>
        {areas.map((area: AreaPublicDTO) => (
          <option key={area.id} value={area.id}>
            {area.name} · {area.region}
          </option>
        ))}
      </select>
    </div>
  );
};
