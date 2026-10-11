import type { AreaPublicDTO } from '@uaetrail/shared-types';
import { useExplorePublishedAreas } from '../useExplorePublishedAreas';
import { areaLabelForId } from '../organizePublishArea';

type OrganizePublishAreaFieldProps = {
  areaId: string | null;
  onChange: (areaId: string | null) => void;
  suggestedFromCatalog: boolean;
  disabled?: boolean;
};

/** Required on organize publish for public map outings — area from catalog place or explicit pick. */
export const OrganizePublishAreaField = ({
  areaId,
  onChange,
  suggestedFromCatalog,
  disabled,
}: OrganizePublishAreaFieldProps) => {
  const areas = useExplorePublishedAreas();
  const selectedName = areaLabelForId(areaId, areas);

  return (
    <div className="mt-4 border-t border-neutral-200 pt-4">
      <label htmlFor="organize-publish-area" className="text-xs font-medium uppercase tracking-wide text-gray-500">
        Area on the map
      </label>
      <p className="mt-1 text-xs text-gray-600">
        {suggestedFromCatalog && selectedName
          ? `From your catalog place: ${selectedName}. Change if needed.`
          : 'Pick the outdoor area this belongs to (e.g. Hatta). Meeting pin does not set this automatically.'}
      </p>
      <select
        id="organize-publish-area"
        className="mt-2 w-full rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-sm text-gray-900"
        value={areaId ?? ''}
        disabled={disabled || areas.length === 0}
        required
        onChange={(event) => onChange(event.target.value.trim() ? event.target.value : null)}
      >
        <option value="">Select area…</option>
        {areas.map((area) => (
          <option key={area.id} value={area.id}>
            {area.name} · {area.region}
          </option>
        ))}
      </select>
      {areas.length === 0 ? (
        <p className="mt-2 text-xs text-amber-800">Areas are loading. Try again in a moment.</p>
      ) : null}
    </div>
  );
};
