import { MapPin } from 'lucide-react';
import type { AreaPublicDTO } from '@uaetrail/shared-types';
import { useExplorePublishedAreas } from '../useExplorePublishedAreas';
import { areaLabelForId } from '../hostingPublishArea';

type SeekingCuratedAreaStepProps = {
  areaId: string | null;
  onAreaIdChange: (areaId: string | null) => void;
  pinPlaced: boolean;
  latitude: number | null;
  longitude: number | null;
  onOpenMap: () => void;
  intro?: string;
};

/** Find (looking for): pick admin **Area**, then drop a map pin for matching & notifications. */
export const SeekingCuratedAreaStep = ({
  areaId,
  onAreaIdChange,
  pinPlaced,
  latitude,
  longitude,
  onOpenMap,
  intro = 'Choose the outdoor area you are looking in, then pin where you are starting or meeting.',
}: SeekingCuratedAreaStepProps) => {
  const areas = useExplorePublishedAreas();
  const areaName = areaLabelForId(areaId, areas);

  return (
    <div>
      <p className="mb-4 text-sm text-gray-600">{intro}</p>
      <label htmlFor="seeking-area-select" className="text-xs font-medium uppercase tracking-wide text-gray-500">
        Area
      </label>
      <select
        id="seeking-area-select"
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
      <button
        type="button"
        disabled={!areaId}
        onClick={onOpenMap}
        className="mt-4 flex w-full items-center justify-between gap-3 rounded-2xl border-2 border-neutral-200 px-4 py-4 text-left hover:border-emerald-300 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <span className="flex items-center gap-2 text-gray-800">
          <MapPin className="h-5 w-5 text-emerald-500" />
          <span>
            <span className="block text-sm font-bold">
              {pinPlaced && latitude != null && longitude != null
                ? `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`
                : 'Pin on the map'}
            </span>
            <span className="text-xs text-gray-500">
              {areaName
                ? pinPlaced
                  ? `In ${areaName} — tap to adjust`
                  : `Show your spot in ${areaName}`
                : 'Select an area first'}
            </span>
          </span>
        </span>
        <span className="text-xs font-semibold text-emerald-600">{pinPlaced ? 'Edit' : 'Map'}</span>
      </button>
    </div>
  );
};
