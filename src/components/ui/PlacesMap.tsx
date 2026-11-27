import { useMemo, useRef } from 'react';
import { isGeographyMapSource } from '@uaetrail/shared-types';
import { Link } from 'react-router-dom';
import { MapContainer, Marker, Popup, Tooltip } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import { formatActivityType } from '../../utils/activityIdentity';
import { MAP_CONFIG } from '../../config/platform';
import {
  CAMPING_ACTIVITY_EMOJI,
  CAMPING_VENUE_EMOJI,
  HIKING_VENUE_EMOJI,
  MAP_FILTER_EMOJI,
} from '@/discovery/discoveryPortExploreMapPin';
import { MapTileLayers } from './MapTileLayers';
import { mapTileLoadOptions } from './mapTileLoadOptions';
import type {
  ColocatedMapPinEntry,
  MapBounds,
  MapPinKind,
  MapPinSource,
  PlaceMapPin,
  PlacesMapProps,
} from './placesMapTypes';
export type { ColocatedMapPinEntry, MapBounds, MapPinKind, MapPinSource, PlaceMapPin };
import {
  boundsFromPins,
  isPinEmphasized,
  MAP_PIN_TOOLTIP_OPTIONS,
  markerZIndex,
  pinIcon,
  pinsKey,
  resolveExploreMapPinTooltipLabel,
  resolvePinClick,
} from './placesMapPinIcons';
import {
  ProductMapInitialView,
  MapDeviceLocationMarker,
  MapHoverViewportSync,
  FitMapBounds,
  FlyToSelectedPin,
  SidecarMapViewportSync,
  MapPeekDismissOnMapClick,
  MapReadyBridge,
  MapResize,
  MapVisibleBoundsReporter,
  MapZoomReporter,
  RecenterMap,
  SelectedPinScreenReporter,
  SidecarSessionZoom,
} from './placesMapLeafletChrome';
import { ClusteredMarkers } from './placesMapClusteredMarkers';

/** Interactive map with location pins anchored to coordinates (Leaflet map tiles). */
export const PlacesMap = ({
  pins,
  bounds,
  className = '',
  minHeight = 420,
  fill = false,
  allowEmpty = false,
  selectedPinId,
  selectedExploreItemId,
  highlightedExploreItemId,
  onPinClick,
  showLegend = true,
  tileUrl,
  labelTileUrl,
  recenterTo = null,
  exploreMode = false,
  exploreMapCenter = null,
  onZoomChange,
  onVisibleBoundsChange,
  tileAttribution,
  minZoom,
  onMapReady,
  layoutRevision,
  flyToHighlightedPin = false,
  onSelectedPinScreenPoint,
  deviceLocation = null,
  onDismissMapPeek,
  exploreMapStyle = 'satellite',
}: PlacesMapProps) => {
  const sidecarSessionZoomRef = useRef<number | null>(null);
  const mapBounds = useMemo(() => boundsFromPins(pins, bounds), [pins, bounds]);
  const pinsKeyValue = useMemo(() => pinsKey(pins), [pins]);
  const exploreCenter: [number, number] = exploreMapCenter
    ? [exploreMapCenter.lat, exploreMapCenter.lng]
    : [MAP_CONFIG.exploreDefaultCenter.lat, MAP_CONFIG.exploreDefaultCenter.lng];

  if (pins.length === 0 && !allowEmpty) {
    return (
      <div
        className={`flex items-center justify-center rounded-2xl border border-emerald-100 bg-emerald-50/50 text-sm text-neutral-600 ${className}`}
        style={{ minHeight }}
      >
        No locations with map coordinates match your filters.
      </div>
    );
  }

  const exploreFillMinPx = 280;
  const mapHeight = fill ? '100%' : minHeight;
  const resolvedFillMinHeight = fill ? Math.max(minHeight || 0, exploreFillMinPx) : minHeight;
  const activeSelection = selectedExploreItemId ?? selectedPinId;

  const renderMarker = (pin: PlaceMapPin) => {
    const tooltipLabel = resolveExploreMapPinTooltipLabel(pin);
    return (
    <Marker
      key={pin.id}
      position={[pin.latitude, pin.longitude]}
      icon={pinIcon(
        pin.activityType,
        isPinEmphasized(pin, activeSelection, highlightedExploreItemId),
        pin,
        pin.rideshareEndpoint,
        activeSelection,
        MAP_CONFIG.exploreDefaultZoom,
        highlightedExploreItemId,
        !exploreMode
      )}
      zIndexOffset={markerZIndex(pin, activeSelection, highlightedExploreItemId)}
      eventHandlers={
        onPinClick
          ? {
              click: (event) => onPinClick(resolvePinClick(pin, event)),
            }
          : undefined
      }
    >
      {tooltipLabel ? (
        <Tooltip {...MAP_PIN_TOOLTIP_OPTIONS}>{tooltipLabel}</Tooltip>
      ) : null}
      {onPinClick ? null : (
        <Popup>
          <div className="min-w-[140px]">
            <p className="text-sm font-semibold text-neutral-900">{pin.name}</p>
            <p className="mt-0.5 text-xs text-neutral-500">
              {isGeographyMapSource(pin.source)
                ? `${formatActivityType(pin.activityType)} spot`
                : pin.activityType === 'shop'
                  ? 'Shop'
                  : formatActivityType(pin.activityType)}
            </p>
            <Link
              to={pin.path}
              className="mt-2 inline-block text-xs font-semibold text-emerald-700 hover:text-emerald-800"
            >
              View details
            </Link>
          </div>
        </Popup>
      )}
    </Marker>
    );
  };

  const resolvedMinZoom = minZoom ?? (exploreMode ? MAP_CONFIG.exploreMinZoom : 9);
  const tileLoad = mapTileLoadOptions(exploreMode);

  const mapSurfaceClass = exploreMode
    ? `explore-map-rich${exploreMapStyle === 'map' ? ' explore-map-basemap-map' : ''}${
        activeSelection ? ' explore-map-peek-open' : ''
      } `
    : '';

  return (
    <div
      className={`relative overflow-hidden bg-[#2a3441] ${mapSurfaceClass}${fill ? '' : 'rounded-2xl border border-emerald-100'} ${className}`}
      style={
        fill
          ? { height: '100%', minHeight: resolvedFillMinHeight }
          : { minHeight: resolvedFillMinHeight }
      }
    >
      <MapContainer
        center={exploreMode ? exploreCenter : [MAP_CONFIG.defaultCenter.lat, MAP_CONFIG.defaultCenter.lng]}
        zoom={exploreMode ? MAP_CONFIG.exploreDefaultZoom : MAP_CONFIG.defaultZoom}
        minZoom={resolvedMinZoom}
        maxZoom={18}
        scrollWheelZoom
        fadeAnimation={!exploreMode}
        zoomControl={!fill}
        attributionControl={!fill}
        className="z-0 h-full w-full"
        style={{
          height: mapHeight,
          minHeight: fill ? resolvedFillMinHeight : mapHeight,
          width: '100%',
        }}
      >
        <MapTileLayers
          tileUrl={tileUrl}
          labelTileUrl={labelTileUrl}
          attribution={tileAttribution}
          maxZoom={18}
          detectRetina={tileLoad.detectRetina}
          keepBuffer={tileLoad.keepBuffer}
          updateWhenIdle={tileLoad.updateWhenIdle}
          deferLabels={tileLoad.deferLabels}
        />
        {exploreMode ? (
          <ProductMapInitialView />
        ) : (
          <FitMapBounds mapBounds={mapBounds} maxZoom={14} pinCount={pins.length} pinsKeyValue={pinsKeyValue} />
        )}
        <MapResize layoutRevision={layoutRevision} />
        <RecenterMap target={recenterTo} />
        <MapZoomReporter onZoomChange={onZoomChange} />
        {onVisibleBoundsChange ? (
          <MapVisibleBoundsReporter onVisibleBoundsChange={onVisibleBoundsChange} />
        ) : null}
        {flyToHighlightedPin ? (
          <>
            <SidecarSessionZoom sessionZoomRef={sidecarSessionZoomRef} />
            <SidecarMapViewportSync
              pins={pins}
              highlightedExploreItemId={highlightedExploreItemId}
              selectedExploreItemId={activeSelection}
              sessionZoomRef={sidecarSessionZoomRef}
            />
          </>
        ) : (
          <>
            <FlyToSelectedPin pins={pins} selectedExploreItemId={activeSelection} />
            <MapHoverViewportSync
              pins={pins}
              highlightedExploreItemId={highlightedExploreItemId}
            />
          </>
        )}
        {onSelectedPinScreenPoint ? (
          <SelectedPinScreenReporter
            pins={pins}
            selectedExploreItemId={activeSelection}
            onChange={onSelectedPinScreenPoint}
          />
        ) : null}
        {exploreMode && onMapReady ? <MapReadyBridge onReady={onMapReady} /> : null}
        {exploreMode && onDismissMapPeek ? (
          <MapPeekDismissOnMapClick onDismiss={onDismissMapPeek} />
        ) : null}
        {exploreMode ? (
          <ClusteredMarkers
            pins={pins}
            selectedExploreItemId={activeSelection}
            highlightedExploreItemId={highlightedExploreItemId}
            onPinClick={onPinClick}
            exploreMapStyle={exploreMapStyle}
          />
        ) : (
          pins.map(renderMarker)
        )}
        {exploreMode && deviceLocation ? (
          <MapDeviceLocationMarker location={deviceLocation} />
        ) : null}
      </MapContainer>
      {showLegend && (
        <div className="pointer-events-none absolute bottom-3 left-3 z-[1000] flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-1 rounded-full bg-white/95 px-2 py-1 text-[10px] font-semibold text-emerald-700 shadow-sm">
            <span className="font-emoji">{MAP_FILTER_EMOJI.hiking}</span> Hikes
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-white/95 px-2 py-1 text-[10px] font-semibold text-slate-600 shadow-sm">
            <span className="font-emoji">{HIKING_VENUE_EMOJI}</span> Trails
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-white/95 px-2 py-1 text-[10px] font-semibold text-amber-700 shadow-sm">
            <span className="font-emoji">{CAMPING_ACTIVITY_EMOJI}</span> Camps
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-white/95 px-2 py-1 text-[10px] font-semibold text-amber-800 shadow-sm">
            <span className="font-emoji">{CAMPING_VENUE_EMOJI}</span> Camp spots
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-white/95 px-2 py-1 text-[10px] font-semibold text-violet-700 shadow-sm">
            <span className="font-emoji">🏃</span> Events
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-white/95 px-2 py-1 text-[10px] font-semibold text-amber-700 shadow-sm">
            <span className="font-emoji">🛍️</span> Shops
          </span>
        </div>
      )}
    </div>
  );
};

