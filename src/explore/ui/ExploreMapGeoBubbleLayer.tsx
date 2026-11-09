import { useEffect, useMemo, useRef } from 'react';
import L from 'leaflet';
import { useMap } from 'react-leaflet';
import { geoStore } from '../../geo/geoStore';
import {
  buildGeoBubbleHtml,
  exploreGeoBubblesForZoom,
  type ExploreGeoBubble,
} from './exploreMapGeoBubbles';

const bubbleIcon = (bubble: ExploreGeoBubble): L.DivIcon => {
  const layout = buildGeoBubbleHtml(bubble.name, bubble.count);
  return L.divIcon({
    className: 'uaetrail-map-geo-bubble-wrap',
    html: layout.html,
    iconSize: [layout.width, layout.height],
    iconAnchor: [layout.width / 2, layout.height / 2],
  });
};

/** Low-zoom area/state/country count circles from GeoStore (one /geo/tree hydrate). */
export const ExploreMapGeoBubbleLayer = ({ zoom, treeVersion }: { zoom: number; treeVersion: number }) => {
  const map = useMap();
  const groupRef = useRef<L.LayerGroup | null>(null);

  const bubbles = useMemo(() => {
    void treeVersion;
    return exploreGeoBubblesForZoom(geoStore, zoom);
  }, [zoom, treeVersion]);

  useEffect(() => {
    const group = L.layerGroup();
    groupRef.current = group;
    for (const bubble of bubbles) {
      const marker = L.marker([bubble.lat, bubble.lng], {
        icon: bubbleIcon(bubble),
        keyboard: true,
        title: `${bubble.name} (${bubble.count})`,
      });
      marker.on('click', (event) => {
        L.DomEvent.stopPropagation(event);
        map.flyTo([bubble.lat, bubble.lng], bubble.flyToZoom, { duration: 0.45 });
      });
      group.addLayer(marker);
    }
    map.addLayer(group);
    return () => {
      groupRef.current = null;
      try {
        group.clearLayers();
        if (map.hasLayer(group)) map.removeLayer(group);
      } catch {
        /* map may already be torn down */
      }
    };
  }, [map, bubbles]);

  return null;
};
