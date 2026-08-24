import { useEffect, useMemo, useState } from 'react';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { LocationDTO } from '@uaetrail/shared-types';
import { MapPinFields, parseCoord } from './MeetingPointMap';
import { ImageUpload } from './ImageUpload';
import { AssetKeyUpload } from './AssetKeyUpload';
import { api } from '../../api/services';
import { DEFAULT_COUNTRY } from '../../config/regions';
import { UAE_EMIRATES, getStatesForEmirate } from '../../config/uaeRegions';
import {
  HIKING_ACCESSIBLE,
  HIKING_SURFACES,
  LOCATION_TAG_OPTIONS,
  SUITABLE_FOR_OPTIONS,
} from '../../constants/locationForm';
import type { ActivityType } from '../../config/activityTypes';
import { ACTIVITY_TYPE_LABELS } from '../../config/activityTypes';

type WizardStep = 'search' | 'overview' | 'conditions' | 'location' | 'premium';

const STEPS: { id: WizardStep; label: string }[] = [
  { id: 'search', label: 'Find' },
  { id: 'overview', label: 'Overview' },
  { id: 'conditions', label: 'Conditions' },
  { id: 'location', label: 'Map' },
  { id: 'premium', label: 'Premium' },
];

export interface SubmitLocationPayload {
  name: string;
  countryCode: string;
  emirate?: string;
  region: string;
  activityType: ActivityType;
  description: string;
  difficulty?: 'easy' | 'moderate' | 'hard';
  distance?: number;
  duration?: number;
  elevation?: number;
  surfaceType?: string[];
  highlights?: string[];
  tags?: string[];
  accessibleBy?: string[];
  latitude?: number;
  longitude?: number;
  parkingLat?: number;
  parkingLng?: number;
  images: string[];
  gpxKey?: string | null;
  guidePdfKey?: string | null;
  guideMarkdown?: string | null;
  premiumImages?: string[];
}

interface SubmitLocationFormProps {
  tenantId?: string;
  defaultActivityType?: ActivityType;
  onSubmitted?: (location: LocationDTO) => void;
  onCancel?: () => void;
  compact?: boolean;
}

const emptyForm = {
  name: '',
  emirate: '',
  region: '',
  activityType: 'hiking' as ActivityType,
  description: '',
  difficulty: 'moderate' as 'easy' | 'moderate' | 'hard',
  distance: '',
  duration: '',
  elevation: '',
  surfaceType: [] as string[],
  highlights: [] as string[],
  tags: [] as string[],
  accessibleBy: [] as string[],
  pinLat: '',
  pinLng: '',
  parkingLat: '',
  parkingLng: '',
  images: [] as string[],
  gpxKey: null as string | null,
  guidePdfKey: null as string | null,
  guideMarkdown: '',
  premiumImages: [] as string[],
};

const toggleInList = (list: string[], value: string) =>
  list.includes(value) ? list.filter((v) => v !== value) : [...list, value];

export const SubmitLocationForm = ({
  tenantId,
  defaultActivityType = 'hiking',
  onSubmitted,
  onCancel,
}: SubmitLocationFormProps) => {
  const [step, setStep] = useState<WizardStep>('search');
  const [form, setForm] = useState({ ...emptyForm, activityType: defaultActivityType });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<LocationDTO[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);

  useEffect(() => {
    setForm({ ...emptyForm, activityType: defaultActivityType });
    setStep('search');
    setError(null);
    setSearchQuery('');
    setSearchResults([]);
  }, [defaultActivityType, tenantId]);

  const stateOptions = useMemo(
    () => (form.emirate ? getStatesForEmirate(form.emirate) : []),
    [form.emirate]
  );

  const runSearch = async () => {
    setSearchLoading(true);
    setError(null);
    try {
      const res = await api.getPublicLocations();
      const q = searchQuery.trim().toLowerCase();
      const matches = (res.data ?? []).filter((loc) => {
        if (!q) return true;
        return (
          loc.name.toLowerCase().includes(q) ||
          loc.region.toLowerCase().includes(q) ||
          (loc.emirate?.toLowerCase().includes(q) ?? false)
        );
      });
      setSearchResults(matches.slice(0, 8));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  useEffect(() => {
    if (step === 'search') {
      void runSearch();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  const stepIndex = STEPS.findIndex((s) => s.id === step);

  const validateStep = (current: WizardStep): string | null => {
    if (current === 'overview') {
      if (!form.name.trim()) return 'Enter a title for this location.';
      if (!form.emirate) return 'Select an emirate.';
      if (!form.region) return 'Select a state / area.';
      if (form.description.trim().length < 20) return 'Description must be at least 20 characters.';
      if (!form.images.length) return 'Add at least one photo.';
    }
    if (current === 'location') {
      if (!parseCoord(form.pinLat) || !parseCoord(form.pinLng)) {
        return 'Set the trail location pin on the map.';
      }
    }
    return null;
  };

  const goNext = () => {
    const msg = validateStep(step);
    if (msg) {
      setError(msg);
      return;
    }
    setError(null);
    const next = STEPS[stepIndex + 1];
    if (next) setStep(next.id);
  };

  const goBack = () => {
    setError(null);
    const prev = STEPS[stepIndex - 1];
    if (prev) setStep(prev.id);
  };

  const buildPayload = (): SubmitLocationPayload => ({
    name: form.name.trim(),
    countryCode: DEFAULT_COUNTRY,
    emirate: form.emirate,
    region: form.region,
    activityType: form.activityType,
    description: form.description.trim(),
    difficulty: form.difficulty,
    distance: form.distance ? Number(form.distance) : undefined,
    duration: form.duration ? Number(form.duration) : undefined,
    elevation: form.elevation ? Number(form.elevation) : undefined,
    surfaceType: form.surfaceType,
    highlights: form.highlights,
    tags: form.tags,
    accessibleBy: form.accessibleBy,
    latitude: parseCoord(form.pinLat),
    longitude: parseCoord(form.pinLng),
    parkingLat: parseCoord(form.parkingLat),
    parkingLng: parseCoord(form.parkingLng),
    images: form.images,
    gpxKey: form.gpxKey,
    guidePdfKey: form.guidePdfKey,
    guideMarkdown: form.guideMarkdown.trim() || null,
    premiumImages: form.premiumImages,
  });

  const handleSubmit = async () => {
    const msg = validateStep('overview');
    if (msg) {
      setError(msg);
      setStep('overview');
      return;
    }
    const locMsg = validateStep('location');
    if (locMsg) {
      setError(locMsg);
      setStep('location');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const payload = buildPayload();
      const res = tenantId
        ? await api.submitLocation(tenantId, payload as Partial<LocationDTO>)
        : await api.submitUserLocation(payload as Partial<LocationDTO>);
      onSubmitted?.(res.data);
      setForm({ ...emptyForm, activityType: defaultActivityType });
      setStep('search');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit location');
    } finally {
      setSaving(false);
    }
  };

  const mapCenterLat = parseCoord(form.pinLat) ?? parseCoord(form.parkingLat);
  const mapCenterLng = parseCoord(form.pinLng) ?? parseCoord(form.parkingLng);

  return (
    <div className="space-y-5">
      <div className="flex gap-1 overflow-x-auto pb-1">
        {STEPS.map((s, i) => (
          <div
            key={s.id}
            className={`shrink-0 px-2.5 py-1 rounded-full text-xs font-medium ${
              s.id === step
                ? 'bg-emerald-600 text-white'
                : i < stepIndex
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-gray-100 text-gray-500'
            }`}
          >
            {s.label}
          </div>
        ))}
      </div>

      {step === 'search' && (
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Search existing trails and spots first. If yours isn&apos;t listed, add a new location for admin review.
          </p>
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), runSearch())}
                placeholder="Search by name or area…"
                className="w-full border rounded-xl pl-9 pr-3 py-2.5 text-sm"
              />
            </div>
            <button
              type="button"
              onClick={runSearch}
              className="px-4 py-2.5 rounded-xl bg-gray-100 text-sm font-medium hover:bg-gray-200"
            >
              Search
            </button>
          </div>
          {searchLoading ? (
            <p className="text-sm text-gray-500">Searching…</p>
          ) : searchResults.length > 0 ? (
            <ul className="border rounded-xl divide-y max-h-48 overflow-y-auto">
              {searchResults.map((loc) => (
                <li key={loc.id} className="px-3 py-2.5 text-sm">
                  <span className="font-medium text-gray-900">{loc.name}</span>
                  <span className="text-gray-500"> · {loc.region}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-500">No matching locations found.</p>
          )}
          <button
            type="button"
            onClick={() => { setError(null); setStep('overview'); }}
            className="w-full py-3 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700"
          >
            Add new location
          </button>
        </div>
      )}

      {step === 'overview' && (
        <div className="space-y-4">
          <p className="text-sm font-medium text-emerald-800 bg-emerald-50 rounded-lg px-3 py-2">
            {ACTIVITY_TYPE_LABELS[form.activityType]} location — overview
          </p>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Title *</label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full border rounded-xl px-3 py-2.5 text-sm"
              placeholder="e.g. Jebel Jais Summit Trail"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Emirate *</label>
              <select
                required
                value={form.emirate}
                onChange={(e) => setForm({ ...form, emirate: e.target.value, region: '' })}
                className="w-full border rounded-xl px-3 py-2.5 text-sm"
              >
                <option value="">Select emirate…</option>
                {UAE_EMIRATES.map((e) => (
                  <option key={e} value={e}>{e}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">State / Area *</label>
              <select
                required
                value={form.region}
                disabled={!form.emirate}
                onChange={(e) => setForm({ ...form, region: e.target.value })}
                className="w-full border rounded-xl px-3 py-2.5 text-sm disabled:bg-gray-50"
              >
                <option value="">Select state…</option>
                {stateOptions.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Description *</label>
            <textarea
              required
              minLength={20}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full border rounded-xl px-3 py-2.5 text-sm"
              rows={4}
              placeholder="Describe the trail, access, and what hikers can expect…"
            />
          </div>
          <div>
            <ImageUpload
              label="Photos * (minimum 1)"
              images={form.images}
              onChange={(urls) => setForm((prev) => ({ ...prev, images: urls }))}
              max={6}
              keyPrefix="locations"
              tenantId={tenantId}
              kind="location-image"
              preset="location"
            />
          </div>
        </div>
      )}

      {step === 'conditions' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Difficulty</label>
              <select
                value={form.difficulty}
                onChange={(e) => setForm({ ...form, difficulty: e.target.value as typeof form.difficulty })}
                className="w-full border rounded-xl px-3 py-2.5 text-sm"
              >
                <option value="easy">Easy</option>
                <option value="moderate">Moderate</option>
                <option value="hard">Hard</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Route length (km)</label>
              <input
                type="number"
                min={0}
                step="0.1"
                value={form.distance}
                onChange={(e) => setForm({ ...form, distance: e.target.value })}
                className="w-full border rounded-xl px-3 py-2.5 text-sm"
                placeholder="e.g. 8.5"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Duration (hours, approx)</label>
              <input
                type="number"
                min={0}
                step="0.5"
                value={form.duration}
                onChange={(e) => setForm({ ...form, duration: e.target.value })}
                className="w-full border rounded-xl px-3 py-2.5 text-sm"
                placeholder="e.g. 3"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Elevation (m)</label>
              <input
                type="number"
                min={0}
                value={form.elevation}
                onChange={(e) => setForm({ ...form, elevation: e.target.value })}
                className="w-full border rounded-xl px-3 py-2.5 text-sm"
                placeholder="e.g. 450"
              />
            </div>
          </div>

          <CheckboxGroup
            title="Surface type"
            options={HIKING_SURFACES}
            selected={form.surfaceType}
            onChange={(surfaceType) => setForm({ ...form, surfaceType })}
          />
          <CheckboxGroup
            title="Suitable for"
            options={SUITABLE_FOR_OPTIONS}
            selected={form.highlights}
            onChange={(highlights) => setForm({ ...form, highlights })}
          />
          <CheckboxGroup
            title="Access / transport"
            options={HIKING_ACCESSIBLE}
            selected={form.accessibleBy}
            onChange={(accessibleBy) => setForm({ ...form, accessibleBy })}
          />
          <CheckboxGroup
            title="Tags"
            options={LOCATION_TAG_OPTIONS}
            selected={form.tags}
            onChange={(tags) => setForm({ ...form, tags })}
          />
        </div>
      )}

      {step === 'location' && (
        <div className="space-y-6">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">Trail location pin *</label>
            <MapPinFields
              lat={form.pinLat}
              lng={form.pinLng}
              onLatChange={(pinLat) => setForm({ ...form, pinLat })}
              onLngChange={(pinLng) => setForm({ ...form, pinLng })}
              centerLat={mapCenterLat}
              centerLng={mapCenterLng}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">Parking location pin</label>
            <p className="text-xs text-gray-500 mb-2">Optional — where hikers can park before the trail.</p>
            <MapPinFields
              lat={form.parkingLat}
              lng={form.parkingLng}
              onLatChange={(parkingLat) => setForm({ ...form, parkingLat })}
              onLngChange={(parkingLng) => setForm({ ...form, parkingLng })}
              centerLat={parseCoord(form.pinLat) ?? mapCenterLat}
              centerLng={parseCoord(form.pinLng) ?? mapCenterLng}
            />
          </div>
        </div>
      )}

      {step === 'premium' && (
        <div className="space-y-4">
          <p className="text-sm text-gray-600 bg-gray-50 rounded-xl px-3 py-2.5">
            Optional premium content for members. Access is included with <strong>Pro / GOAT</strong> membership —
            pricing is set platform-wide by admin, not per location.
          </p>
          <AssetKeyUpload
            label="Route map (GPX download)"
            value={form.gpxKey}
            onChange={(gpxKey) => setForm({ ...form, gpxKey })}
            accept=".gpx"
            keyPrefix="locations"
            kind="location-gpx"
          />
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Expert guide (text)</label>
            <textarea
              value={form.guideMarkdown}
              onChange={(e) => setForm({ ...form, guideMarkdown: e.target.value })}
              className="w-full border rounded-xl px-3 py-2.5 text-sm"
              rows={5}
              placeholder="Detailed route notes, hazards, seasonal tips…"
            />
          </div>
          <AssetKeyUpload
            label="Guide attachment (PDF)"
            value={form.guidePdfKey}
            onChange={(guidePdfKey) => setForm({ ...form, guidePdfKey })}
            accept=".pdf"
            keyPrefix="locations"
            kind="location-guide-pdf"
          />
          <ImageUpload
            label="Premium photos (optional)"
            images={form.premiumImages}
            onChange={(premiumImages) => setForm((prev) => ({ ...prev, premiumImages }))}
            max={6}
            keyPrefix="locations"
            tenantId={tenantId}
            kind="location-premium-image"
            preset="location"
          />
        </div>
      )}

      {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

      <div className="flex gap-3 pt-1">
        {step !== 'search' && (
          <button
            type="button"
            onClick={goBack}
            className="inline-flex items-center justify-center gap-1 px-4 py-2.5 border rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <ChevronLeft className="w-4 h-4" /> Back
          </button>
        )}
        {onCancel && step === 'search' && (
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 px-4 py-2.5 border rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
        )}
        {step !== 'premium' && step !== 'search' && (
          <button
            type="button"
            onClick={goNext}
            className="flex-1 inline-flex items-center justify-center gap-1 px-4 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700"
          >
            Next <ChevronRight className="w-4 h-4" />
          </button>
        )}
        {step === 'premium' && (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving}
            className="flex-1 px-4 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 disabled:opacity-60"
          >
            {saving ? 'Submitting…' : 'Submit for review'}
          </button>
        )}
      </div>
    </div>
  );
};

function CheckboxGroup({
  title,
  options,
  selected,
  onChange,
}: {
  title: string;
  options: string[];
  selected: string[];
  onChange: (next: string[]) => void;
}) {
  return (
    <div>
      <p className="text-sm font-medium text-gray-700 mb-2">{title}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => (
          <label
            key={opt}
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs cursor-pointer ${
              selected.includes(opt)
                ? 'border-emerald-500 bg-emerald-50 text-emerald-800'
                : 'border-gray-200 text-gray-600 hover:border-gray-300'
            }`}
          >
            <input
              type="checkbox"
              className="sr-only"
              checked={selected.includes(opt)}
              onChange={() => onChange(toggleInList(selected, opt))}
            />
            {opt}
          </label>
        ))}
      </div>
    </div>
  );
}
