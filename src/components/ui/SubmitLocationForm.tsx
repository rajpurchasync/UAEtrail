import { useEffect, useState } from 'react';
import { LocationDTO } from '@uaetrail/shared-types';
import { MapPinFields, parseCoord } from './MeetingPointMap';
import { ImageUpload } from './ImageUpload';
import { api } from '../../api/services';
import {
  CountryCode,
  DEFAULT_COUNTRY,
  SUPPORTED_COUNTRIES,
  getRegionsForCountry
} from '../../config/regions';

export interface SubmitLocationPayload {
  name: string;
  countryCode: CountryCode;
  region: string;
  activityType: 'hiking' | 'camping';
  description: string;
  latitude?: number;
  longitude?: number;
  images: string[];
}

interface SubmitLocationFormProps {
  tenantId: string;
  /** Pre-select activity type when opened from trip create */
  defaultActivityType?: 'hiking' | 'camping';
  onSubmitted?: (location: LocationDTO) => void;
  onCancel?: () => void;
  compact?: boolean;
}

const emptyForm = {
  name: '',
  countryCode: DEFAULT_COUNTRY as CountryCode,
  region: '',
  activityType: 'hiking' as 'hiking' | 'camping',
  description: '',
  meetingLat: '',
  meetingLng: '',
  images: [] as string[]
};

export const SubmitLocationForm = ({
  tenantId,
  defaultActivityType = 'hiking',
  onSubmitted,
  onCancel,
  compact = false
}: SubmitLocationFormProps) => {
  const [form, setForm] = useState({ ...emptyForm, activityType: defaultActivityType });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setForm({ ...emptyForm, activityType: defaultActivityType });
    setError(null);
  }, [defaultActivityType, tenantId]);

  const regions = getRegionsForCountry(form.countryCode);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.images.length) {
      setError('Add at least one photo.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const payload: SubmitLocationPayload = {
        name: form.name.trim(),
        countryCode: form.countryCode,
        region: form.region,
        activityType: form.activityType,
        description: form.description.trim(),
        images: form.images,
        latitude: parseCoord(form.meetingLat),
        longitude: parseCoord(form.meetingLng)
      };
      const res = await api.submitLocation(tenantId, payload as Partial<LocationDTO>);
      onSubmitted?.(res.data);
      setForm({ ...emptyForm, activityType: defaultActivityType });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit location');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={compact ? 'space-y-4' : 'space-y-5'}>
      <p className="text-sm text-gray-600">
        Submit a new location for admin review. Once approved, it appears in the location list for trips.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-gray-700 mb-1 block">Country *</label>
          <select
            required
            value={form.countryCode}
            onChange={(e) =>
              setForm({
                ...form,
                countryCode: e.target.value as CountryCode,
                region: ''
              })
            }
            className="w-full border rounded-xl px-3 py-2.5 text-sm"
          >
            {SUPPORTED_COUNTRIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 mb-1 block">State / Region *</label>
          <select
            required
            value={form.region}
            onChange={(e) => setForm({ ...form, region: e.target.value })}
            className="w-full border rounded-xl px-3 py-2.5 text-sm"
          >
            <option value="">Select region…</option>
            {regions.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-gray-700 mb-1 block">Type *</label>
          <select
            required
            value={form.activityType}
            onChange={(e) =>
              setForm({ ...form, activityType: e.target.value as 'hiking' | 'camping' })
            }
            className="w-full border rounded-xl px-3 py-2.5 text-sm"
          >
            <option value="hiking">Hike</option>
            <option value="camping">Camp</option>
          </select>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 mb-1 block">Location name *</label>
          <input
            type="text"
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full border rounded-xl px-3 py-2.5 text-sm"
            placeholder="e.g. Jebel Jais Summit"
          />
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
          rows={3}
          placeholder="Describe the trail or camp site…"
        />
      </div>

      <div>
        <label className="text-sm font-medium text-gray-700 mb-1 block">Map pin (optional)</label>
        <MapPinFields
          lat={form.meetingLat}
          lng={form.meetingLng}
          onLatChange={(meetingLat) => setForm({ ...form, meetingLat })}
          onLngChange={(meetingLng) => setForm({ ...form, meetingLng })}
        />
      </div>

      <div>
        <label className="text-sm font-medium text-gray-700 mb-2 block">Photos * (at least 1)</label>
        <ImageUpload
          images={form.images}
          onChange={(urls) => setForm((prev) => ({ ...prev, images: urls }))}
          max={6}
          keyPrefix="locations"
          tenantId={tenantId}
          kind="location-image"
        />
      </div>

      {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

      <div className={`flex gap-3 ${compact ? '' : 'pt-1'}`}>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 px-4 py-2.5 border rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={saving || !tenantId}
          className="flex-1 px-4 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 disabled:opacity-60"
        >
          {saving ? 'Submitting…' : 'Submit for review'}
        </button>
      </div>
    </form>
  );
};
