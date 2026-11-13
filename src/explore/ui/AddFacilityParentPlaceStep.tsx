import { useEffect, useMemo, useState } from 'react';
import type { PlaceDTO } from '@uaetrail/shared-types';
import { AppSelect } from '../../components/ui/AppSelect';
import { EXPLORE_FLOW } from '../../config/exploreTheme';
import { fetchPlaceCatalog } from '../../hooks/placeCatalogReadsClientApi';
import {
  FACILITY_ADD_PARENT_PLACE_HINT,
  FACILITY_ADD_PARENT_PLACE_SKIP,
  type FacilityAddDraft,
} from './addFacilityFlow';

type Props = {
  draft: FacilityAddDraft;
  onChange: (patch: Partial<FacilityAddDraft>) => void;
};

const catalogRowsInArea = (places: PlaceDTO[], areaId: string | null): PlaceDTO[] => {
  if (!areaId?.trim()) return places;
  return places.filter((row) => row.areaId?.trim() === areaId.trim());
};

/** Optional link facility to a trail/camp row (`parentPlaceId`). Pin step sets exact coords. */
export const AddFacilityParentPlaceStep = ({ draft, onChange }: Props) => {
  const [catalog, setCatalog] = useState<PlaceDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setLoadError(null);
    void fetchPlaceCatalog()
      .then((rows) => {
        if (!cancelled) setCatalog(rows);
      })
      .catch(() => {
        if (!cancelled) setLoadError('Could not load trails in this area.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const rows = useMemo(() => catalogRowsInArea(catalog, draft.areaId), [catalog, draft.areaId]);

  const selectOptions = useMemo(
    () => [
      { value: '', label: FACILITY_ADD_PARENT_PLACE_SKIP },
      ...rows.map((row) => ({
        value: row.id,
        label: row.name,
      })),
    ],
    [rows]
  );

  const selectedId = draft.parentPlaceId?.trim() ?? '';

  return (
    <div className="space-y-3">
      <p className="text-sm text-neutral-600">{FACILITY_ADD_PARENT_PLACE_HINT}</p>
      {draft.parentPlaceName?.trim() && selectedId ? (
        <p className="rounded-xl border border-emerald-200 bg-emerald-50/80 px-3 py-2 text-sm text-emerald-950">
          Linked to <span className="font-semibold">{draft.parentPlaceName}</span>
        </p>
      ) : null}
      <label className="block">
        <span className={EXPLORE_FLOW.composeFieldLabel}>Trail or camp</span>
        <AppSelect
          className="mt-1 w-full"
          value={selectedId}
          disabled={loading || Boolean(loadError)}
          placeholder={loading ? 'Loading trails…' : 'Choose a trail or skip'}
          options={selectOptions}
          onChange={(next) => {
            const id = next.trim();
            if (!id) {
              onChange({ parentPlaceId: null, parentPlaceName: null });
              return;
            }
            const row = rows.find((place) => place.id === id);
            onChange({
              parentPlaceId: id,
              parentPlaceName: row?.name.trim() ?? null,
            });
          }}
          inputClassName={`${EXPLORE_FLOW.composeField} w-full`}
        />
      </label>
      {loadError ? <p className="text-sm text-amber-800">{loadError}</p> : null}
      {!loading && rows.length === 0 ? (
        <p className="text-xs text-neutral-500">No published trails in this area yet — you can skip and pin the amenity.</p>
      ) : null}
    </div>
  );
};
