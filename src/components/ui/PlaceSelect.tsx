import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, MapPin, Plus, Search } from 'lucide-react';
import { PlaceDTO } from '@uaetrail/shared-types';
import type { ActivityType } from '../../config/activityTypes';
import { loadPlaceCatalogForPicker } from '../../hooks/placeCatalogReadsClientApi';

interface PlaceSelectProps {
  value: string;
  onChange: (placeId: string) => void;
  tenantId?: string;
  activityType?: ActivityType;
  /** Pre-loaded place options (e.g. host-approved submissions). */
  places?: PlaceDTO[];
  /** @deprecated Use places */
  locations?: PlaceDTO[];
  required?: boolean;
  className?: string;
  placeholder?: string;
  /** Shown when the list is empty — use to point users to the add-place flow. */
  emptyHelp?: ReactNode;
  /** Always-visible link to create a new place. */
  addNewHref?: string;
  addNewLabel?: string;
  /** When set, runs before navigating to add a place (e.g. persist form draft). */
  onAddNew?: () => void;
}

/** Pick an existing place from the catalog. */
export const PlaceSelect = ({
  value,
  onChange,
  tenantId,
  activityType,
  places: placesOverride,
  locations: inboundPlacesOverride,
  required = true,
  placeholder = 'Select place…',
  emptyHelp,
  addNewHref,
  addNewLabel = 'Add place',
  onAddNew,
}: PlaceSelectProps) => {
  const injectedPlaces = placesOverride ?? inboundPlacesOverride;
  const [activeLocations, setActiveLocations] = useState<PlaceDTO[]>(injectedPlaces ?? []);
  const [pendingLocations, setPendingLocations] = useState<PlaceDTO[]>([]);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const rootRef = useRef<HTMLDivElement>(null);

  const loadLocations = useCallback(async () => {
    if (injectedPlaces) {
      setActiveLocations(injectedPlaces);
      setPendingLocations([]);
      return;
    }
    try {
      const merged = await loadPlaceCatalogForPicker(activityType);
      setActiveLocations(merged.filter((place) => place.status !== 'draft'));
      setPendingLocations(merged.filter((place) => place.status === 'draft'));
    } catch {
      /* non-critical */
    }
  }, [activityType, injectedPlaces]);

  useEffect(() => {
    void loadLocations();
  }, [loadLocations, tenantId]);

  const { active, pending } = useMemo(() => {
    const matchType = (l: PlaceDTO) => !activityType || l.activityType === activityType;
    const matchQuery = (l: PlaceDTO) => {
      if (!query.trim()) return true;
      const q = query.toLowerCase();
      return l.name.toLowerCase().includes(q) || l.region.toLowerCase().includes(q);
    };
    return {
      active: activeLocations.filter((l) => matchType(l) && matchQuery(l)),
      pending: pendingLocations.filter((l) => matchType(l) && matchQuery(l)),
    };
  }, [activeLocations, pendingLocations, activityType, query]);

  const selected =
    activeLocations.find((l) => l.id === value) ?? pendingLocations.find((l) => l.id === value);

  const pick = (id: string) => {
    onChange(id);
    setOpen(false);
    setQuery('');
  };

  const openPanel = () => {
    setOpen(true);
    if (selected) setQuery('');
  };

  const closePanel = () => {
    setOpen(false);
    setQuery('');
  };

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) closePanel();
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  /** After a pick, only show options again when the user types in the search field. */
  const showOptions = open && (!selected || query.trim().length > 0);

  const listEmpty = active.length === 0 && pending.length === 0;

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => (open ? closePanel() : openPanel())}
        className="ios-input flex w-full items-center justify-between gap-2 rounded-2xl text-left"
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <span className={selected ? 'text-gray-900 truncate' : 'text-gray-400'}>
          {selected ? `${selected.name} (${selected.region})` : placeholder}
        </span>
        <ChevronDown className={`w-4 h-4 shrink-0 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {required && (
        <input
          tabIndex={-1}
          className="sr-only"
          value={value}
          onChange={() => undefined}
          required
        />
      )}

      {open && (
        <div className="absolute z-[7000] mt-1 w-full overflow-hidden rounded-2xl border border-neutral-200/90 bg-white shadow-lg shadow-neutral-900/10">
          <div className="border-b border-gray-100 bg-white p-2 sticky top-0 z-10">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={selected ? 'Type to find another venue…' : 'Search venues…'}
                className="w-full rounded-lg border border-gray-200 py-2 pl-9 pr-3 text-sm focus:border-transparent focus:ring-2 focus:ring-emerald-500"
                autoFocus
              />
            </div>
          </div>

          {!showOptions ? (
            <p className="px-3 py-3 text-sm text-gray-500">Type in the box above to see venues.</p>
          ) : null}

          {showOptions ? (
          <ul className="max-h-52 overflow-y-auto py-1" role="listbox">
            {listEmpty && (
              <li className="space-y-2 px-3 py-4 text-center text-sm text-gray-500">
                <p>No venues match your search.</p>
                {emptyHelp}
              </li>
            )}
            {active.map((loc) => (
              <li key={loc.id}>
                <button
                  type="button"
                  onClick={() => pick(loc.id)}
                  className={`w-full text-left px-3 py-2.5 text-sm hover:bg-gray-50 flex items-start gap-2 ${
                    value === loc.id ? 'bg-emerald-50 text-emerald-800 font-medium' : 'text-gray-800'
                  }`}
                >
                  <MapPin className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
                  <span>
                    {loc.name}
                    <span className="block text-xs text-gray-500">{loc.region}</span>
                  </span>
                </button>
              </li>
            ))}
            {pending.map((loc) => (
              <li key={loc.id}>
                <button
                  type="button"
                  onClick={() => pick(loc.id)}
                  className={`w-full text-left px-3 py-2.5 text-sm hover:bg-gray-50 flex items-start gap-2 ${
                    value === loc.id ? 'bg-amber-50 text-amber-900 font-medium' : 'text-gray-800'
                  }`}
                >
                  <MapPin className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
                  <span>
                    {loc.name}
                    <span className="block text-xs text-amber-700">Your submission — pending review</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
          ) : null}

          {addNewHref && (
            <div className="border-t border-gray-100 p-2 bg-gray-50">
              {onAddNew ? (
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    onAddNew();
                  }}
                  className="flex items-center justify-center gap-1.5 w-full px-3 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-50 rounded-lg"
                >
                  <Plus className="w-4 h-4" />
                  {addNewLabel}
                </button>
              ) : (
                <Link
                  to={addNewHref}
                  onClick={() => setOpen(false)}
                  className="flex items-center justify-center gap-1.5 w-full px-3 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-50 rounded-lg"
                >
                  <Plus className="w-4 h-4" />
                  {addNewLabel}
                </Link>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

