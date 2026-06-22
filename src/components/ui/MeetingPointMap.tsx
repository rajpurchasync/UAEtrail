import { MapLocationPicker } from './MapLocationPicker';
import { parseCoord } from '../../utils/coords';

interface MeetingPointMapProps {
  lat?: number | null;
  lng?: number | null;
  label?: string | null;
}

/** Lightweight map preview + external maps link for meeting points. */
export const MeetingPointMap = ({ lat, lng, label }: MeetingPointMapProps) => {
  if (lat == null || lng == null) return null;

  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
  const delta = 0.012;
  const bbox = `${lng - delta},${lat - delta},${lng + delta},${lat + delta}`;
  const embedUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${encodeURIComponent(bbox)}&layer=mapnik&marker=${lat}%2C${lng}`;

  return (
    <div className="mt-3 space-y-2">
      <div className="rounded-xl overflow-hidden border border-gray-200 aspect-[16/10] bg-gray-100">
        <iframe
          title={label ? `Map: ${label}` : 'Meeting point map'}
          src={embedUrl}
          className="w-full h-full border-0"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
      </div>
      <a
        href={mapsUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center text-sm font-medium text-emerald-700 hover:text-emerald-800"
      >
        Open in Google Maps →
      </a>
    </div>
  );
};

interface MapPinFieldsProps {
  lat: string;
  lng: string;
  onLatChange: (value: string) => void;
  onLngChange: (value: string) => void;
  centerLat?: number | null;
  centerLng?: number | null;
}

export const MapPinFields = ({
  lat,
  lng,
  onLatChange,
  onLngChange,
  centerLat,
  centerLng,
}: MapPinFieldsProps) => (
  <div className="space-y-3">
    <MapLocationPicker
      lat={lat}
      lng={lng}
      onLatChange={onLatChange}
      onLngChange={onLngChange}
      centerLat={centerLat}
      centerLng={centerLng}
    />
    <div className="grid grid-cols-2 gap-3">
      <div>
        <label className="text-xs font-medium text-gray-600 mb-1 block">Latitude</label>
        <input
          type="number"
          step="any"
          min={-90}
          max={90}
          value={lat}
          onChange={(e) => onLatChange(e.target.value)}
          className="w-full border rounded-lg px-3 py-2 text-sm"
          placeholder="e.g. 25.0657"
        />
      </div>
      <div>
        <label className="text-xs font-medium text-gray-600 mb-1 block">Longitude</label>
        <input
          type="number"
          step="any"
          min={-180}
          max={180}
          value={lng}
          onChange={(e) => onLngChange(e.target.value)}
          className="w-full border rounded-lg px-3 py-2 text-sm"
          placeholder="e.g. 56.1221"
        />
      </div>
    </div>
  </div>
);

export { parseCoord };
