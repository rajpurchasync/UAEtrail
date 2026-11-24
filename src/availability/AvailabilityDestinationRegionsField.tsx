import { mergeVenueStateFilterOptionsWithAreas } from '../config/regions';
import type { AreaPublicDTO } from '@uaetrail/shared-types';

type AvailabilityDestinationRegionsFieldProps = {
  publishedAreas: readonly AreaPublicDTO[];
  selected: readonly string[];
  onChange: (regions: string[]) => void;
  legend?: string;
  hint?: string;
};

/** Multi emirate pick — slot `destinationRegions` (OR). Empty = open to any. */
export const AvailabilityDestinationRegionsField = ({
  publishedAreas,
  selected,
  onChange,
  legend = 'Destination',
  hint = 'Pick one or more emirates, or leave empty for anywhere in the UAE.',
}: AvailabilityDestinationRegionsFieldProps) => {
  const options = mergeVenueStateFilterOptionsWithAreas(publishedAreas, 'AE').map((row) => row.key);

  const toggle = (key: string) => {
    if (selected.includes(key)) {
      onChange(selected.filter((r) => r !== key));
      return;
    }
    onChange([...selected, key]);
  };

  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-semibold text-slate-900">{legend}</legend>
      <p className="text-xs text-slate-600">{hint}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((name) => {
          const active = selected.includes(name);
          return (
            <button
              key={name}
              type="button"
              onClick={() => toggle(name)}
              className={`rounded-full px-3 py-1 text-sm font-medium ${
                active ? 'bg-emerald-700 text-white' : 'bg-slate-100 text-slate-700'
              }`}
              aria-pressed={active}
            >
              {name}
            </button>
          );
        })}
      </div>
      {selected.length > 0 ? (
        <p className="text-xs text-slate-600">
          <span className="font-semibold text-slate-800">Selected: </span>
          {selected.join(' · ')}
        </p>
      ) : (
        <p className="text-xs font-medium text-slate-500">Any emirate</p>
      )}
    </fieldset>
  );
};