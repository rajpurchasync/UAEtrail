import { useCallback, useEffect, useMemo, useRef } from 'react';
import L from 'leaflet';
import { useMap, useMapEvents } from 'react-leaflet';
import type { ExploreMapStyle } from '../../config/platform';
import {
  EXPLORE_MAP_CLUSTER_DISABLE_AT_ZOOM,
  exploreMapClusterRadiusPx,
  exploreMapClusterSpiderPolylineOptions,
  scheduleExploreMapClusterSpiderExpand,
  syncExploreMapClusterSpiderCollapse,
} from '@/discovery/discoveryPortExploreMapChrome';
import { resolveClusterClickExploreItemId } from '@/discovery/discoveryPortExploreMapPin';
import type { PlaceMapPin } from './placesMapTypes';
import {
  aggregateClusterPinEntries,
  attachExploreMapClusterTooltip,
  attachExploreMapPinTooltip,
  clusterCollidedLeafIcon,
  clusterPinForExploreItemId,
  isPinEmphasized,
  markerZIndex,
  pinIcon,
  pinsFromCluster,
  pinsKey,
  resolvePinClick,
  type MarkerWithPin,
} from './placesMapPinIcons';
import { panMapToLatLngBoundsAtCurrentZoom } from './placesMapPinViewport';

export const ClusteredMarkers = ({
  pins,
  selectedExploreItemId,
  highlightedExploreItemId,
  onPinClick,
  exploreMapStyle = 'satellite',
}: {
  pins: PlaceMapPin[];
  selectedExploreItemId?: string;
  highlightedExploreItemId?: string;
  onPinClick?: (pin: PlaceMapPin) => void;
  exploreMapStyle?: ExploreMapStyle;
}) => {
  const map = useMap();
  const mapZoomRef = useRef(map.getZoom());
  const clusterGroupRef = useRef<L.MarkerClusterGroup | null>(null);
  const pinsKeyValue = useMemo(() => pinsKey(pins), [pins]);
  const onPinClickRef = useRef(onPinClick);
  const selectedRef = useRef(selectedExploreItemId);
  const highlightedRef = useRef(highlightedExploreItemId);
  selectedRef.current = selectedExploreItemId;
  highlightedRef.current = highlightedExploreItemId;

  const refreshClusterPinEmphasis = useCallback(() => {
    const group = clusterGroupRef.current;
    if (!group) return;
    const activeSelected = selectedRef.current;
    const activeHighlighted = highlightedRef.current;
    let index = 0;
    group.eachLayer((layer) => {
      const marker = layer as MarkerWithPin;
      const pin = marker.options.uaetrailPin;
      if (!pin) return;
      marker.setIcon(
        pinIcon(
          pin.activityType,
          isPinEmphasized(pin, activeSelected, activeHighlighted),
          pin,
          pin.rideshareEndpoint,
          activeSelected,
          mapZoomRef.current,
          activeHighlighted,
          false,
          exploreMapStyle
        )
      );
      marker.setZIndexOffset(markerZIndex(pin, activeSelected, activeHighlighted) + index);
      index += 1;
    });
    group.refreshClusters();
  }, [exploreMapStyle]);

  useMapEvents({
    zoomend: () => {
      mapZoomRef.current = map.getZoom();
      refreshClusterPinEmphasis();
      clusterGroupRef.current?.refreshClusters();
    },
    load: () => {
      mapZoomRef.current = map.getZoom();
    },
  });

  useEffect(() => {
    onPinClickRef.current = onPinClick;
  }, [onPinClick]);

  useEffect(() => {
    refreshClusterPinEmphasis();
  }, [exploreMapStyle, highlightedExploreItemId, selectedExploreItemId, refreshClusterPinEmphasis]);

  useEffect(() => {
    if (!map?.getContainer()) return;
    mapZoomRef.current = map.getZoom();

    let group: L.MarkerClusterGroup | null = null;

    try {
      group = L.markerClusterGroup({
        chunkedLoading: true,
        showCoverageOnHover: false,
        maxClusterRadius: exploreMapClusterRadiusPx,
        disableClusteringAtZoom: EXPLORE_MAP_CLUSTER_DISABLE_AT_ZOOM,
        spiderfyOnMaxZoom: false,
        spiderfyDistanceMultiplier: 1.6,
        spiderLegPolylineOptions: exploreMapClusterSpiderPolylineOptions(),
        zoomToBoundsOnClick: false,
        iconCreateFunction: (cluster) => {
          const clusterPins = pinsFromCluster(cluster);
          const entries = aggregateClusterPinEntries(
            clusterPins,
            selectedRef.current,
            highlightedRef.current
          );
          attachExploreMapClusterTooltip(cluster, clusterPins, entries);

          if (clusterPins.length > 1) {
            return clusterCollidedLeafIcon(entries, clusterPins.length, mapZoomRef.current, false);
          }

          const pin = clusterPins[0]!;
          return pinIcon(
            pin.activityType,
            isPinEmphasized(pin, selectedRef.current, highlightedRef.current),
            pin,
            pin.rideshareEndpoint,
            selectedRef.current,
            mapZoomRef.current,
            highlightedRef.current,
            false,
            exploreMapStyle
          );
        },
      });

      type SpiderClusterGroup = L.MarkerClusterGroup & {
        _spiderfied?: L.MarkerCluster | null;
        _unspiderfy?: (event?: L.LeafletEvent) => void;
      };
      const spiderGroup = group as SpiderClusterGroup;
      const unspiderfy = spiderGroup._unspiderfy?.bind(spiderGroup);
      if (unspiderfy) {
        spiderGroup._unspiderfy = (event) => {
          const expanded = spiderGroup._spiderfied;
          if (expanded) {
            syncExploreMapClusterSpiderCollapse(expanded.getAllChildMarkers());
          }
          unspiderfy(event);
        };
      }

      group.on('clusterclick', (event) => {
        L.DomEvent.stopPropagation(event);
        const cluster = event.layer as L.MarkerCluster;
        const clusterPins = pinsFromCluster(cluster);

        if (clusterPins.length > 1) {
          type SpiderifiedCluster = L.MarkerCluster & { _spiderfied?: boolean };
          const layer = cluster as SpiderifiedCluster;

          const panToRing = () => {
            const spiderMarkers = cluster.getAllChildMarkers() as L.Marker[];
            if (spiderMarkers.length === 0) return;
            const bounds = L.latLngBounds(spiderMarkers.map((marker) => marker.getLatLng()));
            panMapToLatLngBoundsAtCurrentZoom(map, bounds);
          };

          if (layer._spiderfied) {
            panToRing();
            return;
          }

          cluster.once('spiderfied', panToRing);
          const ringMarkers = cluster.getAllChildMarkers() as L.Marker[];
          cluster.spiderfy();
          scheduleExploreMapClusterSpiderExpand(ringMarkers);
          return;
        }

        const entries = aggregateClusterPinEntries(
          clusterPins,
          selectedRef.current,
          highlightedRef.current
        );
        const exploreItemId = resolveClusterClickExploreItemId(
          entries,
          (event as { originalEvent?: MouseEvent }).originalEvent
        );
        const pin =
          (exploreItemId ? clusterPinForExploreItemId(clusterPins, exploreItemId) : null) ??
          clusterPins[0];
        if (pin) onPinClickRef.current?.(pin);
      });

      for (let index = 0; index < pins.length; index += 1) {
        const pin = pins[index]!;
        const marker = L.marker([pin.latitude, pin.longitude], {
          icon: pinIcon(
            pin.activityType,
            isPinEmphasized(pin, selectedRef.current, highlightedRef.current),
            pin,
            pin.rideshareEndpoint,
            selectedRef.current,
            mapZoomRef.current,
            highlightedRef.current,
            false,
            exploreMapStyle
          ),
          zIndexOffset: markerZIndex(pin, selectedRef.current, highlightedRef.current) + index,
        }) as MarkerWithPin;
        marker.options.uaetrailPin = pin;
        marker.on('click', (event: L.LeafletMouseEvent) =>
          onPinClickRef.current?.(resolvePinClick(pin, event))
        );
        attachExploreMapPinTooltip(marker, pin);
        group.addLayer(marker);
      }

      map.addLayer(group);
      clusterGroupRef.current = group;
      refreshClusterPinEmphasis();
    } catch (error) {
      console.error('[ClusteredMarkers] failed to mount cluster layer', error);
      return;
    }

    return () => {
      clusterGroupRef.current = null;
      if (!group) return;
      try {
        group.clearLayers();
        if (map.hasLayer(group)) {
          map.removeLayer(group);
        }
      } catch {
        // Map may already be torn down during route changes / StrictMode.
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- remount cluster layer only when pin set changes
  }, [map, pins, pinsKeyValue, refreshClusterPinEmphasis]);

  return null;
};