import type { AreaPublicDTO } from '@uaetrail/shared-types';
import { AppSelect } from '../../components/ui/AppSelect';
import { EXPLORE_SHAPE } from '../../config/exploreTheme';
import { useExplorePublishedAreas } from '../useExplorePublishedAreas';

type AddCuratedAreaStepProps = {
  destinationId: string | null;
  onAreaIdChange: (destinationId: string | null) => void;
  proposedAreaName?: string;
  onProposedAreaNameChange?: (name: string) => void;
  allowNewArea?: boolean;
};

/** Add place — pick a listed hub, or name a new area for admin review. */
export const AddCuratedAreaStep = ({
  destinationId,
  onAreaIdChange,
  proposedAreaName = '',
  onProposedAreaNameChange,
  allowNewArea = true,
}: AddCuratedAreaStepProps) => {
  const areas = useExplorePublishedAreas();
  const proposingNew = allowNewArea && proposedAreaName.trim().length >= 2 && !destinationId;

  return (
    <div>
      <p className="mb-4 text-sm text-neutral-600">
        {allowNewArea
          ? 'Pick a listed outdoor area if this pin belongs there. If it is a new place — like Wadi Al Helo — name the new area. Admin will approve the area and the place together.'
          : 'Every facility belongs to a registered outdoor area. You will pin the exact location on the next step.'}
      </p>
      <label htmlFor="add-area-select" className="text-xs font-medium uppercase tracking-wide text-neutral-500">
        Listed area
      </label>
      <AppSelect
        className="mt-2 w-full"
        value={proposingNew ? '' : destinationId ?? ''}
        disabled={areas.length === 0}
        placeholder="Select area…"
        options={[
          { value: '', label: 'Select area…' },
          ...areas.map((area: AreaPublicDTO) => ({
            value: area.id,
            label: `${area.name} · ${area.region}`,
          })),
        ]}
        onChange={(next) => {
          const value = next.trim() ? next : null;
          onAreaIdChange(value);
          if (value) onProposedAreaNameChange?.('');
        }}
        inputClassName={`w-full ${EXPLORE_SHAPE.control} border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-900`}
        aria-label="Listed area"
      />
      {allowNewArea ? (
        <label className="mt-4 block">
          <span className="text-xs font-medium uppercase tracking-wide text-neutral-500">Or name a new area</span>
          <input
            value={proposedAreaName}
            onChange={(event) => {
              onProposedAreaNameChange?.(event.target.value);
              if (event.target.value.trim()) onAreaIdChange(null);
            }}
            placeholder="e.g. Wadi Al Helo"
            className={`mt-2 w-full ${EXPLORE_SHAPE.control} border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-900`}
            maxLength={80}
          />
        </label>
      ) : null}
      {proposingNew ? (
        <p className="mt-3 rounded-xl border border-sky-200 bg-sky-50 px-3 py-2 text-sm text-sky-950">
          “{proposedAreaName.trim()}” will be submitted as a new area. The place and the area stay pending until
          an admin approves both.
        </p>
      ) : null}
    </div>
  );
};
