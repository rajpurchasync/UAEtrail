import { useEffect, useMemo } from 'react';
import L from 'leaflet';
import { MapContainer, Polyline, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { MapTileLayers } from '../ui/MapTileLayers';
import { decodeGooglePolyline } from '../../utils/decodeGooglePolyline';

const FitRoute = ({
  latlngs,
  bbox,
}: {
  latlngs: [number, number][];
  bbox: [number, number, number, number] | null;
}) => {
  const map = useMap();

  useEffect(() => {
    if (latlngs.length >= 2) {
      map.fitBounds(L.latLngBounds(latlngs), { padding: [20, 20], maxZoom: 14, animate: false });
      return;
    }
    if (bbox) {
      const [west, south, east, north] = bbox;
      map.fitBounds(
        [
          [south, west],
          [north, east],
        ],
        { padding: [20, 20], maxZoom: 14, animate: false }
      );
    }
  }, [map, latlngs, bbox]);

  return null;
};

const MapResize = () => {
  const map = useMap();
  useEffect(() => {
    const invalidate = () => map.invalidateSize();
    invalidate();
    const t = window.setTimeout(invalidate, 150);
    window.addEventListener('resize', invalidate);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener('resize', invalidate);
    };
  }, [map]);
  return null;
};

export type PlaceTrackPreviewMapProps = {
  polyline: string | null;
  bbox: [number, number, number, number] | null;
  className?: string;
};

/** Read-only map strip showing the public route polyline (no GPX download). */
export const PlaceTrackPreviewMap = ({ polyline, bbox, className }: PlaceTrackPreviewMapProps) => {
  const latlngs = useMemo<[number, number][]>(() => {
    if (!polyline?.trim()) return [];
    return decodeGooglePolyline(polyline);
  }, [polyline]);

  const center: [number, number] = useMemo(() => {
    if (latlngs.length > 0) return latlngs[Math.floor(latlngs.length / 2)];
    if (bbox) {
      const [west, south, east, north] = bbox;
      return [(south + north) / 2, (west + east) / 2];
    }
    return [25.2, 55.27];
  }, [latlngs, bbox]);

  const zoom = latlngs.length >= 2 || bbox ? 12 : 10;

  if (latlngs.length < 2 && !bbox) {
    return null;
  }

  return (
    <div
      className={`relative overflow-hidden rounded-xl border border-neutral-200 bg-neutral-100 aspect-[16/9] ${className ?? ''}`}
    >
      <MapContainer
        center={center}
        zoom={zoom}
        scrollWheelZoom={false}
        dragging
        attributionControl={false}
        className="z-0 h-full w-full"
        style={{ height: '100%', width: '100%' }}
      >
        <MapTileLayers attribution="" />
        <MapResize />
        {latlngs.length >= 2 ? (
          <>
            <Polyline positions={latlngs} pathOptions={{ color: '#059669', weight: 4, opacity: 0.9 }} />
            <FitRoute latlngs={latlngs} bbox={bbox} />
          </>
        ) : (
          <FitRoute latlngs={[]} bbox={bbox} />
        )}
      </MapContainer>
    </div>
  );
};
