import { useCallback, useEffect, useState } from 'react';
import { ViewOnMapLink } from './ViewOnMapLink';

interface MapPinPickerProps {
  latitude?: number | null;
  longitude?: number | null;
  onChange: (lat: number | null, lng: number | null) => void;
}

const UAE_CENTER = { lat: 24.4539, lng: 54.3773 };

export const MapPinPicker = ({ latitude, longitude, onChange }: MapPinPickerProps) => {
  const [manualLat, setManualLat] = useState(latitude?.toString() ?? '');
  const [manualLng, setManualLng] = useState(longitude?.toString() ?? '');
  const [mapOpen, setMapOpen] = useState(false);

  useEffect(() => {
    setManualLat(latitude != null ? String(latitude) : '');
    setManualLng(longitude != null ? String(longitude) : '');
  }, [latitude, longitude]);

  const hasPin = latitude != null && longitude != null;

  const applyManual = useCallback(() => {
    const lat = parseFloat(manualLat);
    const lng = parseFloat(manualLng);
    if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
      onChange(lat, lng);
    }
  }, [manualLat, manualLng, onChange]);

  const clearPin = () => {
    onChange(null, null);
    setManualLat('');
    setManualLng('');
  };

  // Google Maps embed URL for display
  const mapLat = latitude ?? UAE_CENTER.lat;
  const mapLng = longitude ?? UAE_CENTER.lng;
  const zoom = hasPin ? 13 : 7;
  const mapSrc = hasPin
    ? `https://maps.google.com/maps?q=${mapLat},${mapLng}&z=${zoom}&output=embed`
    : `https://maps.google.com/maps?q=${UAE_CENTER.lat},${UAE_CENTER.lng}&z=${zoom}&output=embed`;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-sm font-medium text-gray-700">📍 Map Location</span>
        {hasPin && (
          <span className="text-xs text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
            Pin set
          </span>
        )}
      </div>

      {/* Manual coordinate entry */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium text-gray-600 mb-1 block">Latitude</label>
          <input
            type="number"
            step="any"
            min={-90}
            max={90}
            value={manualLat}
            onChange={(e) => {
              setManualLat(e.target.value);
              const lat = parseFloat(e.target.value);
              const lng = parseFloat(manualLng);
              if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
                onChange(lat, lng);
              }
            }}
            placeholder="e.g. 25.276987"
            className="w-full border rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-600 mb-1 block">Longitude</label>
          <input
            type="number"
            step="any"
            min={-180}
            max={180}
            value={manualLng}
            onChange={(e) => {
              setManualLng(e.target.value);
              const lat = parseFloat(manualLat);
              const lng = parseFloat(e.target.value);
              if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
                onChange(lat, lng);
              }
            }}
            placeholder="e.g. 55.296249"
            className="w-full border rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          />
        </div>
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={applyManual}
          className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded text-xs font-medium hover:bg-emerald-200"
        >
          Set Pin
        </button>
        {hasPin && (
          <button
            type="button"
            onClick={clearPin}
            className="px-3 py-1 bg-red-100 text-red-700 rounded text-xs font-medium hover:bg-red-200"
          >
            Clear Pin
          </button>
        )}
      </div>

      {hasPin && (
        <p className="text-xs text-gray-500">
          📌 {latitude!.toFixed(6)}, {longitude!.toFixed(6)}
        </p>
      )}

      {hasPin ? (
        <ViewOnMapLink
          lat={latitude!}
          lng={longitude!}
          className="inline-flex text-xs font-medium text-emerald-700 hover:text-emerald-800"
        >
          Open pin in Google Maps →
        </ViewOnMapLink>
      ) : null}

      {mapOpen ? (
        <div className="rounded-lg overflow-hidden border border-gray-200 bg-gray-100">
          <iframe
            title="Location Map"
            src={mapSrc}
            width="100%"
            height="220"
            style={{ border: 0 }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setMapOpen(true)}
          className="flex min-h-[5.5rem] w-full items-center justify-center rounded-xl border border-dashed border-gray-300 bg-gray-50 px-3 py-3 text-sm font-semibold text-emerald-800 hover:border-emerald-300 hover:bg-emerald-50/60"
          aria-label="Show map preview"
        >
          Show map
        </button>
      )}
      {mapOpen ? (
        <button
          type="button"
          onClick={() => setMapOpen(false)}
          className="text-xs font-medium text-gray-500 hover:text-gray-700"
        >
          Hide map
        </button>
      ) : null}
    </div>
  );
};
