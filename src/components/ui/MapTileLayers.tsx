import { useEffect, useState } from 'react';
import { TileLayer } from 'react-leaflet';
import { MAP_CONFIG } from '../../config/platform';

interface MapTileLayersProps {
  tileUrl?: string;
  labelTileUrl?: string | null;
  attribution?: string;
  maxZoom?: number;
  detectRetina?: boolean;
  keepBuffer?: number;
  updateWhenIdle?: boolean;
  /** Start the label overlay after the base tiles paint, so the first view is one request set. */
  deferLabels?: boolean;
}

const LABEL_FALLBACK_MS = 2500;

/** Base map + optional English label overlay (shared across Leaflet maps). */
export const MapTileLayers = ({
  tileUrl,
  labelTileUrl,
  attribution,
  maxZoom = 19,
  detectRetina = true,
  keepBuffer = 3,
  updateWhenIdle = false,
  deferLabels = false,
}: MapTileLayersProps) => {
  const labelUrl = labelTileUrl === null ? null : (labelTileUrl ?? MAP_CONFIG.labelTileUrl);
  const resolvedTileUrl = tileUrl ?? MAP_CONFIG.tileUrl;
  const resolvedAttribution = attribution ?? MAP_CONFIG.tileAttribution;
  const [labelsReady, setLabelsReady] = useState(!deferLabels);

  useEffect(() => {
    if (!deferLabels) {
      setLabelsReady(true);
      return;
    }
    setLabelsReady(false);
    const timeoutId = window.setTimeout(() => setLabelsReady(true), LABEL_FALLBACK_MS);
    return () => window.clearTimeout(timeoutId);
  }, [deferLabels, resolvedTileUrl]);

  return (
    <>
      <TileLayer
        key={resolvedTileUrl}
        attribution={resolvedAttribution}
        url={resolvedTileUrl}
        maxZoom={maxZoom}
        maxNativeZoom={19}
        detectRetina={detectRetina}
        keepBuffer={keepBuffer}
        updateWhenIdle={updateWhenIdle}
        eventHandlers={
          deferLabels
            ? {
                load: () => setLabelsReady(true),
              }
            : undefined
        }
      />
      {labelUrl && labelsReady ? (
        <TileLayer
          key={labelUrl}
          url={labelUrl}
          pane="overlayPane"
          maxZoom={maxZoom}
          maxNativeZoom={19}
          detectRetina={detectRetina}
          keepBuffer={keepBuffer}
          updateWhenIdle={updateWhenIdle}
        />
      ) : null}
    </>
  );
};
