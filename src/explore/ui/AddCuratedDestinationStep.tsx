import type { DestinationPublicDTO } from '@uaetrail/shared-types';
import { AppSelect } from '../../components/ui/AppSelect';
import { EXPLORE_SHAPE } from '../../config/exploreTheme';
import { useExplorePublishedDestinations } from '../useExplorePublishedDestinations';

type AddCuratedDestinationStepProps = {
  destinationId: string | null;
  onDestinationIdChange: (destinationId: string | null) => void;
  proposedDestinationName?: string;
  onproposedDestinationNameChange?: (name: string) => void;
  allowNewDestination?: boolean;
};

/** Add place — pick a listed hub, or name a new destination for admin review. */
export const AddCuratedDestinationStep = ({
  destinationId,
  onDestinationIdChange,
  proposedDestinationName = '',
  onproposedDestinationNameChange,
  allowNewDestination = true,
}: AddCuratedDestinationStepProps) => {
  const destinations = useExplorePublishedDestinations();
  const proposingNew = allowNewDestination && proposedDestinationName.trim().length >= 2 && !destinationId;

  return (
    <div>
      <p className="mb-4 text-sm text-neutral-600">
        {allowNewDestination
          ? 'Pick a listed destination if this pin belongs there. If it is a new place — like Wadi Al Helo — name the new destination. Admin will approve the destination and the place together.'
          : 'Every facility belongs to a registered destination. You will pin the exact location on the next step.'}
      </p>
      <label htmlFor="add-destination-select" className="text-xs font-medium uppercase tracking-wide text-neutral-500">
        Listed destination
      </label>
      <AppSelect
        className="mt-2 w-full"
        value={proposingNew ? '' : destinationId ?? ''}
        disabled={destinations.length === 0}
        placeholder="Select destination…"
        options={[
          { value: '', label: 'Select destination…' },
          ...destinations.map((destination: DestinationPublicDTO) => ({
            value: destination.id,
            label: `${destination.name} · ${destination.region}`,
          })),
        ]}
        onChange={(next) => {
          const value = next.trim() ? next : null;
          onDestinationIdChange(value);
          if (value) onproposedDestinationNameChange?.('');
        }}
        inputClassName={`w-full ${EXPLORE_SHAPE.control} border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-900`}
        aria-label="Listed destination"
      />
      {allowNewDestination ? (
        <label className="mt-4 block">
          <span className="text-xs font-medium uppercase tracking-wide text-neutral-500">
            Or name a new destination
          </span>
          <input
            value={proposedDestinationName}
            onChange={(event) => {
              onproposedDestinationNameChange?.(event.target.value);
              if (event.target.value.trim()) onDestinationIdChange(null);
            }}
            placeholder="e.g. Wadi Al Helo"
            className={`mt-2 w-full ${EXPLORE_SHAPE.control} border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-900`}
            maxLength={80}
          />
        </label>
      ) : null}
      {proposingNew ? (
        <p className="mt-3 rounded-xl border border-sky-200 bg-sky-50 px-3 py-2 text-sm text-sky-950">
          “{proposedDestinationName.trim()}” will be submitted as a new destination. The place and the destination
          stay pending until an admin approves both.
        </p>
      ) : null}
    </div>
  );
};