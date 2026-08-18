import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, MapPin, Plus, Search } from 'lucide-react';
import { LocationDTO } from '@uaetrail/shared-types';
import type { ActivityType } from '../../config/activityTypes';
import { api } from '../../api/services';
import { SubmitLocationForm } from './SubmitLocationForm';

interface LocationSelectProps {
  value: string;
  onChange: (locationId: string) => void;
  tenantId?: string;
  activityType?: ActivityType;
  required?: boolean;
  className?: string;
}

export const LocationSelect = ({
  value,
  onChange,
  tenantId,
  activityType,
  required = true,
}: LocationSelectProps) => {
  const [activeLocations, setActiveLocations] = useState<LocationDTO[]>([]);
  const [pendingLocations, setPendingLocations] = useState<LocationDTO[]>([]);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [showAddNew, setShowAddNew] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  const loadLocations = async () => {
    try {
      const [publicRes, pendingRes] = await Promise.all([
        api.getPublicLocations(),
        tenantId ? api.getOrganizerSubmittedLocations(tenantId) : Promise.resolve({ data: [] as LocationDTO[] }),
      ]);
      setActiveLocations(publicRes.data);
      setPendingLocations(pendingRes.data.filter((l) => l.status === 'draft'));
    } catch {
      /* non-critical */
    }
  };

  useEffect(() => {
    void loadLocations();
  }, [tenantId]);

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

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`w-full flex items-center justify-between gap-2 border rounded-xl px-3 py-2.5 text-sm text-left bg-white ${
          !value && required ? 'border-gray-200' : 'border-gray-200'
        }`}
      >
        <span className={selected ? 'text-gray-900 truncate' : 'text-gray-400'}>
          {selected ? `${selected.name} (${selected.region})` : 'Select location…'}
        </span>
        <ChevronDown className={`w-4 h-4 shrink-0 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {/* Hidden input for native form validation */}
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
          <div className="p-2 border-b border-gray-100 space-y-2 bg-white sticky top-0 z-10">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search locations…"
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                autoFocus
              />
            </div>
            {tenantId ? (
              <button
                type="button"
                onClick={() => {
                  setShowAddNew(true);
                  setOpen(false);
                }}
                className="w-full flex items-center justify-center gap-1.5 py-2 text-sm font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add new location
              </button>
            ) : (
              <p className="text-xs text-amber-800 bg-amber-50 rounded-lg px-2 py-1.5">
                Select your organization to add a new location.
              </p>
            )}
          </div>

          <ul className="max-h-52 overflow-y-auto py-1">
            {active.length === 0 && pending.length === 0 && (
              <li className="px-3 py-4 text-sm text-gray-500 text-center">No locations match your search.</li>
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
        </div>
      )}

      {notice && <p className="text-xs text-emerald-700 bg-emerald-50 rounded-lg px-3 py-2 mt-2">{notice}</p>}

      {showAddNew && tenantId && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-[70] p-4"
          onClick={() => setShowAddNew(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-gray-900 mb-4">Add new location</h3>
            <SubmitLocationForm
              tenantId={tenantId}
              defaultActivityType={activityType ?? 'hiking'}
              compact
              onCancel={() => setShowAddNew(false)}
              onSubmitted={(loc) => {
                setShowAddNew(false);
                onChange(loc.id);
                setNotice(
                  `"${loc.name}" added — you can use it now while our team reviews the listing.`
                );
                void loadLocations();
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};
