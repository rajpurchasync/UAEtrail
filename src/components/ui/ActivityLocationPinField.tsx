import { MapLocationPicker } from './MapLocationPicker';
import { isGoogleMapsUrl, parseGoogleMapsUrl } from '../../utils/googleMapsUrl';
import type { LocationPinForm } from '../activities/activityFormState';
import { FORM_INPUT, FORM_LABEL } from '../activities/activityFormState';

interface ActivityLocationPinFieldProps {
  label: string;
  value: LocationPinForm;
  onChange: (patch: Partial<LocationPinForm>) => void;
  centerLat?: number | null;
  centerLng?: number | null;
  required?: boolean;
  hideLabel?: boolean;
}

/** Map pin or Google Maps URL — no manual lat/lng inputs. */
export const ActivityLocationPinField = ({
  label,
  value,
  onChange,
  centerLat,
  centerLng,
  required,
  hideLabel,
}: ActivityLocationPinFieldProps) => {
  const applyMapsUrl = (url: string) => {
    const coords = parseGoogleMapsUrl(url);
    onChange({
      mapsUrl: url,
      ...(coords.lat != null && coords.lng != null
        ? { lat: String(coords.lat), lng: String(coords.lng) }
        : {}),
    });
  };

  const hasPin = Boolean(value.lat.trim() && value.lng.trim());

  return (
    <div className={`space-y-3 ${hideLabel ? '' : 'rounded-lg border border-gray-200 p-4 bg-gray-50/50'}`}>
      {!hideLabel && (
        <p className="text-sm font-medium text-gray-900">
          {label}
          {required && <span className="text-red-500"> *</span>}
        </p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className={FORM_LABEL}>Place name</label>
          <input
            type="text"
            value={value.label}
            onChange={(e) => onChange({ label: e.target.value })}
            className={FORM_INPUT}
            placeholder="e.g. Trailhead gate"
          />
        </div>

        <div>
          <label className={FORM_LABEL}>Google Maps link (optional)</label>
          <input
            type="url"
            value={value.mapsUrl}
            onChange={(e) => applyMapsUrl(e.target.value)}
            className={FORM_INPUT}
            placeholder="https://maps.google.com/…"
          />
          {value.mapsUrl.trim() && !hasPin && isGoogleMapsUrl(value.mapsUrl) && (
            <p className="text-xs text-amber-700 mt-1">
              Link saved. Drop a pin on the map below if coordinates could not be read from the URL.
            </p>
          )}
        </div>
      </div>

      <MapLocationPicker
        lat={value.lat}
        lng={value.lng}
        onLatChange={(lat) => onChange({ lat })}
        onLngChange={(lng) => onChange({ lng })}
        centerLat={centerLat}
        centerLng={centerLng}
        minHeight={240}
      />

      {hasPin && (
        <p className="text-xs text-emerald-700">Pin set on map</p>
      )}
    </div>
  );
};
