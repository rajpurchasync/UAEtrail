import type { DestinationPublicDTO } from '@uaetrail/shared-types';
import { useExplorePublishedDestinations } from '../useExplorePublishedDestinations';

type AvailabilityCuratedDestinationStepProps = {
  destinationId: string | null;
  onDestinationIdChange: (destinationId: string | null) => void;
  intro?: string;
};

/** Find crew: pick the outdoor **destination** you want company in — not a trail pin. */
export const AvailabilityCuratedDestinationStep = ({
  destinationId,
  onDestinationIdChange,
  intro = 'Choose the destination you want to get outside in. Next you’ll pin where you are going from.',
}: AvailabilityCuratedDestinationStepProps) => {
  const destinations = useExplorePublishedDestinations();

  return (
    <div>
      <p className="mb-4 text-sm text-gray-600">{intro}</p>
      <label
        htmlFor="availability-destination-select"
        className="text-xs font-medium uppercase tracking-wide text-gray-500"
      >
        Destination
      </label>
      <select
        id="availability-destination-select"
        className="mt-2 w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm text-gray-900"
        value={destinationId ?? ''}
        disabled={destinations.length === 0}
        onChange={(event) => onDestinationIdChange(event.target.value.trim() ? event.target.value : null)}
      >
        <option value="">Select destination…</option>
        {destinations.map((destination: DestinationPublicDTO) => (
          <option key={destination.id} value={destination.id}>
            {destination.name} · {destination.region}
          </option>
        ))}
      </select>
    </div>
  );
};
