export type ExploreMapStyle = 'satellite' | 'map';

export type ExploreBasemapProvider = 'custom' | 'maptiler' | 'mapbox' | 'esri';

export type ExploreMapTileSet = {
  tileUrl: string;
  labelTileUrl: string | null;
  attribution: string;
  provider: ExploreBasemapProvider;
};

const ESRI_ATTRIBUTION =
  'Tiles &copy; <a href="https://www.esri.com/">Esri</a> &mdash; Esri, TomTom, Garmin, FAO, NOAA, USGS';

const MAPTILER_ATTRIBUTION =
  '&copy; <a href="https://www.maptiler.com/copyright/" target="_blank" rel="noreferrer">MapTiler</a> &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors';

const MAPBOX_ATTRIBUTION =
  '&copy; <a href="https://www.mapbox.com/about/maps/" target="_blank" rel="noreferrer">Mapbox</a> &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a>';

const readEnvString = (raw: unknown): string | undefined => {
  if (typeof raw !== 'string') return undefined;
  const trimmed = raw.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

type ResolvedExploreBasemapProvider = Exclude<ExploreBasemapProvider, 'custom'>;

const resolveBasemapProvider = (): ResolvedExploreBasemapProvider => {
  const explicit = readEnvString(import.meta.env.VITE_MAP_BASEMAP_PROVIDER)?.toLowerCase();
  if (explicit === 'esri' || explicit === 'maptiler' || explicit === 'mapbox') {
    return explicit;
  }
  if (readEnvString(import.meta.env.VITE_MAPTILER_API_KEY)) return 'maptiler';
  if (readEnvString(import.meta.env.VITE_MAPBOX_ACCESS_TOKEN)) return 'mapbox';
  return 'esri';
};

export type EsriExploreStylePreset = {
  tileUrl: string;
  labelTileUrl: string | null;
};

export const resolveEsriExploreStylePreset = (style: ExploreMapStyle): EsriExploreStylePreset =>
  style === 'satellite'
    ? {
        tileUrl:
          'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        labelTileUrl:
          'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
      }
    : {
        tileUrl:
          'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
        labelTileUrl: null,
      };

const mapTilerMapStyleId = (): string => {
  const raw = readEnvString(import.meta.env.VITE_MAPTILER_MAP_STYLE);
  if (raw === 'outdoor-v2' || raw === 'streets-v2' || raw === 'basic-v2' || raw === 'topo-v2') {
    return raw;
  }
  /** Neutral streets — closer to Booking light map than pale outdoor-v2. */
  return 'streets-v2';
};

const mapTilerTiles = (style: ExploreMapStyle, apiKey: string): ExploreMapTileSet => {
  const keyParam = `key=${encodeURIComponent(apiKey)}`;
  if (style === 'satellite') {
    return {
      provider: 'maptiler',
      tileUrl: `https://api.maptiler.com/maps/hybrid/256/{z}/{x}/{y}.jpg?${keyParam}`,
      labelTileUrl: null,
      attribution: MAPTILER_ATTRIBUTION,
    };
  }
  return {
    provider: 'maptiler',
    tileUrl: `https://api.maptiler.com/maps/${mapTilerMapStyleId()}/256/{z}/{x}/{y}.png?${keyParam}`,
    labelTileUrl: null,
    attribution: MAPTILER_ATTRIBUTION,
  };
};

const mapboxTiles = (style: ExploreMapStyle, accessToken: string): ExploreMapTileSet => {
  const tokenParam = `access_token=${encodeURIComponent(accessToken)}`;
  if (style === 'satellite') {
    return {
      provider: 'mapbox',
      tileUrl: `https://api.mapbox.com/styles/v1/mapbox/satellite-streets-v12/tiles/256/{z}/{x}/{y}?${tokenParam}`,
      labelTileUrl: null,
      attribution: MAPBOX_ATTRIBUTION,
    };
  }
  return {
    provider: 'mapbox',
    tileUrl: `https://api.mapbox.com/styles/v1/mapbox/outdoors-v12/tiles/256/{z}/{x}/{y}?${tokenParam}`,
    labelTileUrl: null,
    attribution: MAPBOX_ATTRIBUTION,
  };
};

const esriTiles = (style: ExploreMapStyle): ExploreMapTileSet => {
  const preset = resolveEsriExploreStylePreset(style);
  return {
    provider: 'esri',
    tileUrl: preset.tileUrl,
    labelTileUrl: preset.labelTileUrl,
    attribution: ESRI_ATTRIBUTION,
  };
};

/**
 * Explore browse basemap — outdoor-first when a tile key is configured, Esri fallback for dev/CI.
 * Override entirely with VITE_MAP_TILE_URL (+ optional VITE_MAP_LABEL_TILE_URL).
 */
export const resolveExploreMapTiles = (style: ExploreMapStyle): ExploreMapTileSet => {
  const customTileUrl = readEnvString(import.meta.env.VITE_MAP_TILE_URL);
  if (customTileUrl) {
    const customLabel = readEnvString(import.meta.env.VITE_MAP_LABEL_TILE_URL) ?? null;
    return {
      provider: 'custom',
      tileUrl: customTileUrl,
      labelTileUrl: customLabel,
      attribution: ESRI_ATTRIBUTION,
    };
  }

  const provider = resolveBasemapProvider();

  if (provider === 'maptiler') {
    const apiKey = readEnvString(import.meta.env.VITE_MAPTILER_API_KEY);
    if (apiKey) return mapTilerTiles(style, apiKey);
  }

  if (provider === 'mapbox') {
    const token = readEnvString(import.meta.env.VITE_MAPBOX_ACCESS_TOKEN);
    if (token) return mapboxTiles(style, token);
  }

  return esriTiles(style);
};