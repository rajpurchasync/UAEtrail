import { TileLayer } from 'react-leaflet';
import { MAP_CONFIG } from '../../config/platform';

interface MapTileLayersProps {
  tileUrl?: string;
  labelTileUrl?: string | null;
  attribution?: string;
  maxZoom?: number;
}

/** Base map + optional English label overlay (shared across Leaflet maps). */
export const MapTileLayers = ({
  tileUrl,
  labelTileUrl,
  attribution,
  maxZoom = 19,
}: MapTileLayersProps) => {
  const labelUrl =
    labelTileUrl === null ? null : (labelTileUrl ?? MAP_CONFIG.labelTileUrl);
  const resolvedTileUrl = tileUrl ?? MAP_CONFIG.tileUrl;
  const resolvedAttribution = attribution ?? MAP_CONFIG.tileAttribution;

  return (
    <>
      <TileLayer
        attribution={resolvedAttribution}
        url={resolvedTileUrl}
        maxZoom={maxZoom}
        maxNativeZoom={19}
        detectRetina
        keepBuffer={3}
        updateWhenIdle={false}
      />
      {labelUrl && (
        <TileLayer url={labelUrl} pane="overlayPane" maxZoom={maxZoom} maxNativeZoom={19} detectRetina keepBuffer={3} />
      )}
    </>
  );
};
