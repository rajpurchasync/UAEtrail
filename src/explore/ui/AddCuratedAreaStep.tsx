import type { AreaPublicDTO } from '@uaetrail/shared-types';
import { useExplorePublishedAreas } from '../useExplorePublishedAreas';

type AddCuratedAreaStepProps = {
  areaId: string | null;
  onAreaIdChange: (areaId: string | null) => void;
};

/** Add place — pick admin **Area** before dropping the location pin. */
export const AddCuratedAreaStep = ({ areaId, onAreaIdChange }: AddCuratedAreaStepProps) => {
  const areas = useExplorePublishedAreas();

  return (
    <div>
      <p className="mb-4 text-sm text-gray-600">
        Every trail, camp, shop, or spot belongs to a registered outdoor area (e.g. Hatta). You will pin the exact
        location on the next step.
      </p>
      <label htmlFor="add-area-select" className="text-xs font-medium uppercase tracking-wide text-gray-500">
        Area
      </label>
      <select
        id="add-area-select"
        className="mt-2 w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm text-gray-900"
        value={areaId ?? ''}
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
