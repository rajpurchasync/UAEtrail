import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, MapPin, Plus, Search } from 'lucide-react';
import { LocationDTO } from '@uaetrail/shared-types';
import type { ActivityType } from '../../config/activityTypes';
import { api } from '../../api/services';

interface LocationSelectProps {
  value: string;
  onChange: (locationId: string) => void;
  tenantId?: string;
  activityType?: ActivityType;
  locations?: LocationDTO[];
  required?: boolean;
  className?: string;
  placeholder?: string;
  /** Shown when the list is empty — use to point users to the add-venue flow. */
  emptyHelp?: ReactNode;
  /** Always-visible link to create a new venue. */
  addNewHref?: string;
  addNewLabel?: string;
  /** When set, runs before navigating to add a venue (e.g. persist form draft). */
  onAddNew?: () => void;
}

/** Pick an existing venue from the catalog. Use VenueSelect in activity forms. */
export const LocationSelect = ({
  value,
  onChange,
  tenantId,
  activityType,
  locations: locationsOverride,
  required = true,
  placeholder = 'Select venue…',
  emptyHelp,
  addNewHref,
  addNewLabel = 'Add location',
  onAddNew,
}: LocationSelectProps) => {
  const [activeLocations, setActiveLocations] = useState<LocationDTO[]>(locationsOverride ?? []);
  const [pendingLocations, setPendingLocations] = useState<LocationDTO[]>([]);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const rootRef = useRef<HTMLDivElement>(null);

  const loadLocations = async () => {
    if (locationsOverride) {
      setActiveLocations(locationsOverride);
      setPendingLocations([]);
      return;
    }
    try {
      const [publicRes, pendingRes] = await Promise.all([
        api.getPublicLocations(),
        tenantId ? api.getHostSubmittedLocations(tenantId) : Promise.resolve({ data: [] as LocationDTO[] }),
      ]);
      setActiveLocations(publicRes.data);
      setPendingLocations(pendingRes.data.filter((l) => l.status === 'draft'));
    } catch {
      /* non-critical */
    }
  };

  useEffect(() => {
    void loadLocations();
  }, [tenantId, locationsOverride]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  const { active, pending } = useMemo(() => {
    const matchType = (l: LocationDTO) => !activityType || l.activityType === activityType;
    const matchQuery = (l: LocationDTO) => {
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

  const listEmpty = active.length === 0 && pending.length === 0;

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-2 border border-gray-200 rounded-lg px-3 py-2 text-sm text-left bg-white"
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
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
          <div className="p-2 border-b border-gray-100 bg-white sticky top-0 z-10">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search venues…"
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                autoFocus
              />
            </div>
          </div>

          <ul className="max-h-52 overflow-y-auto py-1">
            {listEmpty && (
              <li className="px-3 py-4 text-sm text-gray-500 text-center space-y-2">
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
