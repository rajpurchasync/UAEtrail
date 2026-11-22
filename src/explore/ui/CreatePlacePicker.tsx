import { useCallback, useEffect, useState } from 'react';
import { Circle, MapContainer, useMap, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { ChevronLeft, MapPin, Navigation, Pencil, Search, X } from 'lucide-react';
import { MAP_CONFIG } from '../../config/platform';
import { EXPLORE_COMPOSE } from '../../config/exploreTheme';
import { MapTileLayers } from '../../components/ui/MapTileLayers';
import { ViewOnMapLink } from '../../components/ui/ViewOnMapLink';
import { resolvePlaceSelection, searchPlaces, type PlaceSearchResult } from '../../lib/placeSearch';
import { formatCoord, parseCoord } from '../../utils/coords';
import type { LocationPrecision } from './createFlowShared';
import { useComposeWizardEnterSubmit } from './useComposeWizardEnterSubmit';
import { exploreComposeFlowCloseIconClass } from '../exploreDesktopPopup';

type PickerPhase = 'search' | 'adjust';

const MapFlyTo = ({ center, zoom }: { center: [number, number] | null; zoom: number }) => {
  const map = useMap();
  useEffect(() => {
    if (!center) return;
    map.flyTo(center, zoom, { animate: true });
  }, [map, center, zoom]);
  return null;
};

const MapResize = () => {
  const map = useMap();
  useEffect(() => {
    const invalidate = () => map.invalidateSize();
    invalidate();
    const timer = window.setTimeout(invalidate, 150);
    window.addEventListener('resize', invalidate);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('resize', invalidate);
    };
  }, [map]);
  return null;
};

const MapCenterTracker = ({
  onCenterChange,
}: {
  onCenterChange: (lat: number, lng: number) => void;
}) => {
  const map = useMap();
  useEffect(() => {
    const update = () => {
      const center = map.getCenter();
      onCenterChange(center.lat, center.lng);
    };
    update();
    map.on('moveend', update);
    return () => {
      map.off('moveend', update);
    };
  }, [map, onCenterChange]);
  return null;
};

const MapLocate = ({ onLocated }: { onLocated: (lat: number, lng: number) => void }) => {
  const map = useMap();
  useMapEvents({
    locationfound(event) {
      onLocated(event.latlng.lat, event.latlng.lng);
      map.setView(event.latlng, 14, { animate: true });
    },
  });
  return null;
};

export interface CreatePlacePickerProps {
  precision: LocationPrecision;
  latitude: number;
  longitude: number;
  onPrecisionChange: (precision: LocationPrecision) => void;
  onLocationChange: (lat: number, lng: number) => void;
  onBack: () => void;
  onClose: () => void;
  onConfirm: (lat: number, lng: number) => void;
  headerTitle?: string;
  confirmLabel?: string;
  hint?: string;
  initialZoom?: number;
  /** Skip search — adjust an existing pin. */
  openInAdjustMode?: boolean;
  /** Search, map pin, or coordinate edit. Overrides `openInAdjustMode` when set. */
  initialPhase?: 'search' | 'adjust';
  /** Open the coordinate fields on the map. */
  startCoordsEditing?: boolean;
  onPlaceLabel?: (label: string) => void;
}

export const CreatePlacePicker = ({
  precision,
  latitude,
  longitude,
  onPrecisionChange,
  onLocationChange,
  onBack,
  onClose,
  onConfirm,
  headerTitle = 'Drop your pin',
  confirmLabel = 'Confirm location',
  hint,
  initialZoom = 15,
  openInAdjustMode = false,
  initialPhase,
  startCoordsEditing = false,
  onPlaceLabel,
}: CreatePlacePickerProps) => {
  const [phase, setPhase] = useState<PickerPhase>(
    initialPhase ?? (openInAdjustMode ? 'adjust' : 'search')
  );
  const [mapReady, setMapReady] = useState(false);
  const [locating, setLocating] = useState(false);
  const [flyTo, setFlyTo] = useState<[number, number] | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<PlaceSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [resolvingPlace, setResolvingPlace] = useState(false);
  const [selectedPlaceLabel, setSelectedPlaceLabel] = useState<string | null>(null);
  const [coordsEditing, setCoordsEditing] = useState(startCoordsEditing);
  const [latInput, setLatInput] = useState(formatCoord(latitude));
  const [lngInput, setLngInput] = useState(formatCoord(longitude));

  const confirmPin = useCallback(
    () => onConfirm(latitude, longitude),
    [onConfirm, latitude, longitude]
  );
  useComposeWizardEnterSubmit(confirmPin, { enabled: phase === 'adjust' });

  useEffect(() => {
    setMapReady(true);
  }, []);

  useEffect(() => {
    if (!coordsEditing) {
      setLatInput(formatCoord(latitude));
      setLngInput(formatCoord(longitude));
    }
  }, [latitude, longitude, coordsEditing]);

  useEffect(() => {
    if (phase !== 'search') return;
    const q = searchQuery.trim();
    if (q.length < 2) {
      setSearchResults([]);
      return;
    }
    const timer = window.setTimeout(() => {
      setSearching(true);
      void searchPlaces(q)
        .then(setSearchResults)
        .catch(() => setSearchResults([]))
        .finally(() => setSearching(false));
    }, 200);
    return () => window.clearTimeout(timer);
  }, [searchQuery, phase]);

  const handleCenterChange = useCallback(
    (lat: number, lng: number) => {
      onLocationChange(lat, lng);
    },
    [onLocationChange]
  );

  const movePin = (lat: number, lng: number) => {
    onLocationChange(lat, lng);
    setFlyTo([lat, lng]);
  };

  const enterAdjustPhase = (label: string | null) => {
    setSelectedPlaceLabel(label);
    setCoordsEditing(false);
    setPhase('adjust');
  };

  const pickSearchResult = async (result: PlaceSearchResult) => {
    let lat = result.lat;
    let lng = result.lng;
    let label = result.label;

    if (lat == null || lng == null) {
      setResolvingPlace(true);
      const resolved = await resolvePlaceSelection({
        placeId: result.placeId,
        query: result.label,
      });
      setResolvingPlace(false);
      if (!resolved || resolved.lat == null || resolved.lng == null) return;
      lat = resolved.lat;
      lng = resolved.lng;
      label = resolved.label;
    }

    movePin(lat, lng);
    setSearchQuery(label);
    setSearchResults([]);
    onPlaceLabel?.(label);
    enterAdjustPhase(label);
  };

  const applyCoordInputs = () => {
    const lat = parseCoord(latInput);
    const lng = parseCoord(lngInput);
    if (lat == null || lng == null) return;
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return;
    movePin(lat, lng);
    setCoordsEditing(false);
  };

  const handleLocate = () => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        movePin(position.coords.latitude, position.coords.longitude);
        enterAdjustPhase('My location');
        setLocating(false);
      },
      () => setLocating(false),
      { timeout: 8000, enableHighAccuracy: true }
    );
  };

  const generalRadiusMeters = 1200;

  if (phase === 'search') {
    return (
      <div className="flex h-full min-h-0 flex-col bg-white">
        <header
          className={`shrink-0 border-b border-neutral-100 pb-3 pt-safe-plus-2 ${EXPLORE_COMPOSE.wizardStepHeader} mb-0`}
        >
          <button
            type="button"
            onClick={onBack}
            className={EXPLORE_COMPOSE.wizardStepBack}
            aria-label="Back"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={onClose}
            className={`${EXPLORE_COMPOSE.wizardStepClose} ${exploreComposeFlowCloseIconClass}`}
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
          <div className={`${EXPLORE_COMPOSE.wizardStepTitle} flex-col !items-center gap-0.5`}>
            <p className="text-pretty">{headerTitle}</p>
            <p className="text-xs font-normal text-gray-500">Search places</p>
          </div>
        </header>

        <div className="flex min-h-0 flex-1 flex-col px-4 py-4">
          <p className="text-sm text-gray-600">
            {hint ?? 'Search for a place, then drag the map to fine-tune the pin.'}
          </p>

          <label className="relative mt-4 block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search for a place or address"
              className="w-full rounded-2xl border border-neutral-200 bg-neutral-50 py-3 pl-10 pr-3 text-base text-gray-900 outline-none focus:border-emerald-400 focus:bg-white"
              autoComplete="off"
              autoFocus
            />
          </label>

          {(searching || resolvingPlace) && (
            <p className="mt-3 text-sm text-gray-500">
              {resolvingPlace ? 'Loading place…' : 'Searching places…'}
            </p>
          )}

          <ul className="mt-3 min-h-0 flex-1 overflow-y-auto rounded-2xl border border-neutral-100 bg-white shadow-sm">
            {searchResults.length === 0 && searchQuery.trim().length >= 2 && !searching && !resolvingPlace && (
              <li className="px-4 py-6 text-center text-sm text-gray-500">
                No places found. Try adding an area name (e.g. Dubai) or set the pin on the map.
              </li>
            )}
            {searchResults.map((result, index) => {
              const Icon = result.kind === 'query' ? Search : MapPin;
              const rowKey = result.placeId ?? `${result.label}-${index}`;
              return (
                <li key={rowKey} className="border-b border-neutral-100 last:border-0">
                  <button
                    type="button"
                    disabled={resolvingPlace}
                    onClick={() => void pickSearchResult(result)}
                    className="flex w-full items-start gap-3 px-4 py-3.5 text-left hover:bg-neutral-50 active:bg-neutral-100/80 disabled:opacity-60"
                  >
                    <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-gray-600">
                      <Icon className="h-4 w-4" aria-hidden />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-gray-900">{result.mainText}</span>
                      {result.secondaryText ? (
                        <span className="mt-0.5 block truncate text-sm text-gray-500">{result.secondaryText}</span>
                      ) : null}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>

          <div className="mt-4 shrink-0 space-y-2 pb-[var(--safe-bottom)]">
            <button
              type="button"
              onClick={() => enterAdjustPhase(null)}
              className="w-full rounded-2xl border-2 border-neutral-200 py-3.5 text-sm font-semibold text-gray-800 hover:border-emerald-300"
            >
              Set pin on map without search
            </button>
            <button
              type="button"
              onClick={handleLocate}
              className="w-full rounded-2xl bg-neutral-100 py-3.5 text-sm font-semibold text-gray-800"
            >
              Use my current location
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full overflow-hidden bg-neutral-200">
      {mapReady ? (
        <MapContainer
          center={[latitude, longitude]}
          zoom={initialZoom}
          minZoom={10}
          maxZoom={19}
          className="absolute inset-0 z-0 h-full w-full"
          zoomControl={false}
          attributionControl={false}
        >
          <MapTileLayers
            tileUrl={MAP_CONFIG.exploreTileUrl}
            labelTileUrl={MAP_CONFIG.exploreLabelTileUrl ?? MAP_CONFIG.labelTileUrl}
            attribution={MAP_CONFIG.exploreTileAttribution}
            maxZoom={19}
          />
          <MapFlyTo center={flyTo} zoom={Math.max(initialZoom, 16)} />
          <MapResize />
          <MapCenterTracker onCenterChange={handleCenterChange} />
          <MapLocate onLocated={(lat, lng) => movePin(lat, lng)} />
          {precision === 'general' && (
            <Circle
              center={[latitude, longitude]}
              radius={generalRadiusMeters}
              pathOptions={{
                color: '#f43f5e',
                fillColor: '#fb7185',
                fillOpacity: 0.18,
                weight: 2,
              }}
            />
          )}
        </MapContainer>
      ) : (
        <div className="absolute inset-0 animate-pulse bg-emerald-50" />
      )}

      <div className="pointer-events-none absolute inset-0 z-[500] flex items-center justify-center">
        <div className="relative -mt-8">
          <span
            className="flex h-11 w-11 items-center justify-center rounded-full border-4 border-white bg-emerald-600 text-white shadow-xl"
            aria-hidden
          >
            <MapPin className="h-5 w-5" />
          </span>
          <span className="absolute left-1/2 top-full h-3 w-3 -translate-x-1/2 rounded-full bg-emerald-600/80" />
        </div>
      </div>

      <header className="absolute inset-x-0 top-0 z-[600] space-y-2 px-4 pt-safe-plus-2">
        <div className="relative flex items-center justify-center">
          <div className="flex rounded-full bg-white/95 p-1 shadow-md">
            {(['general', 'specific'] as LocationPrecision[]).map((mode) => {
              const active = precision === mode;
              return (
                <button
                  key={mode}
                  type="button"
                  onClick={() => onPrecisionChange(mode)}
                  className={`rounded-full px-3 py-1.5 text-xs font-bold capitalize ${
                    active ? 'bg-emerald-600 text-white' : 'text-gray-600'
                  }`}
                >
                  {mode}
                </button>
              );
            })}
          </div>
          <button
            type="button"
            onClick={onClose}
            className={`absolute right-0 top-0 ${exploreComposeFlowCloseIconClass}`}
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mx-auto max-w-md rounded-2xl bg-white/95 px-3 py-3 shadow-lg">
          <p className="text-center text-sm font-bold text-gray-900">Edit pin location</p>
          <p className="mt-0.5 text-center text-xs text-gray-500">Drag the map to move the pin. Tap Edit to type GPS coordinates.</p>
          {selectedPlaceLabel && (
            <p className="mt-2 line-clamp-2 text-center text-xs font-medium text-emerald-800">{selectedPlaceLabel}</p>
          )}
          <button
            type="button"
            onClick={() => {
              setPhase('search');
              setCoordsEditing(false);
            }}
            className="mt-2 mx-auto block text-xs font-semibold text-emerald-700 underline-offset-2 hover:underline"
          >
            Search for a different place
          </button>
        </div>
      </header>

      <div className="absolute bottom-[calc(var(--safe-bottom)+16px)] left-4 right-4 z-[600] space-y-3">
        <div className="rounded-2xl bg-white/95 px-3 py-2.5 shadow-lg">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">GPS coordinates</p>
            <button
              type="button"
              onClick={() => {
                if (coordsEditing) applyCoordInputs();
                else setCoordsEditing(true);
              }}
              className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700"
            >
              <Pencil className="h-3.5 w-3.5" />
              {coordsEditing ? 'Apply' : 'Edit'}
            </button>
          </div>
          {coordsEditing ? (
            <div className="mt-2 grid grid-cols-2 gap-2">
              <label className="block">
                <span className="text-[10px] font-medium text-gray-500">Latitude</span>
                <input
                  value={latInput}
                  onChange={(event) => setLatInput(event.target.value)}
                  className="mt-0.5 w-full rounded-lg border border-neutral-200 px-2 py-1.5 font-mono text-xs"
                  inputMode="decimal"
                />
              </label>
              <label className="block">
                <span className="text-[10px] font-medium text-gray-500">Longitude</span>
                <input
                  value={lngInput}
                  onChange={(event) => setLngInput(event.target.value)}
                  className="mt-0.5 w-full rounded-lg border border-neutral-200 px-2 py-1.5 font-mono text-xs"
                  inputMode="decimal"
                />
              </label>
            </div>
          ) : (
            <p className="mt-1 font-mono text-sm text-gray-900">
              {formatCoord(latitude)}, {formatCoord(longitude)}
            </p>
          )}
          <ViewOnMapLink
            lat={latitude}
            lng={longitude}
            className="mt-1 inline-flex text-[11px] font-medium text-emerald-700 hover:text-emerald-800"
          >
            Open in Google Maps →
          </ViewOnMapLink>
        </div>

        <div className="flex items-end justify-between gap-3">
          <button
            type="button"
            onClick={handleLocate}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-white shadow-lg"
            aria-label="My location"
          >
            <Navigation className={`h-5 w-5 text-gray-800 ${locating ? 'animate-pulse' : ''}`} />
          </button>
          <button
            type="button"
            onClick={confirmPin}
            className="flex-1 rounded-2xl bg-emerald-600 py-4 text-center text-base font-bold text-white shadow-lg shadow-emerald-600/30"
          >
            {confirmLabel}
          </button>
        </div>
        <button
          type="button"
          onClick={onBack}
          className="-ml-1 inline-flex items-center gap-0.5 rounded-full py-2 pl-2 pr-3 text-sm font-semibold text-white drop-shadow-md"
        >
          <ChevronLeft className="h-5 w-5" aria-hidden />
          Back
        </button>
      </div>
    </div>
  );
};
