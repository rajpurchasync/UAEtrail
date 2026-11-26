import { useEffect, useState } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { fetchGeoSummary } from '../hooks/geoHierarchyClientApi';
import { detailBackPath, geoCountryPath, geoNodePath, GEO_TREE_PATH } from '../config/routingCatalog';
import type { GeoSummaryDTO } from '@uaetrail/shared-types';
import { GeoHubView } from '../geo/GeoHubView';
import { geoCountsTotal } from '../geo/GeoCountChips';
import { geoStore } from '../geo/geoStore';
import { geoKindLabel } from '../geo/geoKindLabel';
import { useGeoDetailTab } from '../geo/useGeoDetailTab';
import { ConsumerEntityDetailLoading } from '../detail/shell/ConsumerEntityDetailLoading';
import { DETAIL_LOADING_GEO } from '../content/detailLoadingCopy';
import { readDetailBackToFromLocation } from '@/discovery/discoveryPortExploreMapPeekNav';
import { parseMobileBackNavState } from '../utils/mobileBackNav';
import {
  GEO_TREE_HEADER_CHROME,
  resolveGeoConsumerDetailHeaderChrome,
} from '../geo/resolveGeoConsumerDetailHeaderChrome';

const childrenHeading = (kind: GeoSummaryDTO['node']['kind']): string => {
  if (kind === 'country') return 'Emirates';
  if (kind === 'state') return 'Areas';
  if (kind === 'area') return 'Venues';
  return 'Nearby';
};

const nodeMapCenter = (node: GeoSummaryDTO['node']): { lat: number; lng: number } | null => {
  const pair = node.c;
  if (!Array.isArray(pair) || pair.length < 2) return null;
  const lng = pair[0];
  const lat = pair[1];
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return { lat, lng };
};

export const GeoNodePage = () => {
  const { id = '' } = useParams();
  const location = useLocation();
  const { activeTab, onTabChange } = useGeoDetailTab();
  const [summary, setSummary] = useState<GeoSummaryDTO | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setSummary(null);
    setError(null);
    void (async () => {
      try {
        const res = await fetchGeoSummary(id);
        if (!cancelled) setSummary(res.data);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Not found');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const loadingBackTo = readDetailBackToFromLocation(location.state) ?? GEO_TREE_PATH;
  const loadingBackLabel = parseMobileBackNavState(location.state)?.backLabel ?? 'Places';
  const loadingChrome = GEO_TREE_HEADER_CHROME;

  if (error) {
    return (
      <ConsumerEntityDetailLoading
        backTo={detailBackPath('explore')}
        backLabel="Explore"
        headerChrome={loadingChrome}
        label={error}
      />
    );
  }

  const summaryReady = summary?.node.id === id;

  if (!summaryReady) {
    const chrome =
      summary && summary.node.id !== id
        ? loadingChrome
        : resolveGeoConsumerDetailHeaderChrome(
            summary?.node.kind ?? geoStore.byId.get(id)?.kind ?? 'country'
          );
    return (
      <ConsumerEntityDetailLoading
        backTo={loadingBackTo}
        backLabel={loadingBackLabel}
        headerChrome={chrome}
        label={DETAIL_LOADING_GEO}
      />
    );
  }

  const ancestorCrumbs = summary.breadcrumbs.filter((crumb) => crumb.id !== summary.node.id);
  const parent = ancestorCrumbs[ancestorCrumbs.length - 1];
  const backTo = parent
    ? parent.kind === 'country' && parent.iso
      ? geoCountryPath(parent.iso)
      : geoNodePath(parent.id)
    : GEO_TREE_PATH;
  const heading = childrenHeading(summary.node.kind);
  const parentName = parent?.n;
  const summaryCopy =
    parentName
      ? `${geoKindLabel(summary.node.kind)} in ${parentName} — places, events, spots, and outings.`
      : `${geoKindLabel(summary.node.kind)} — places, events, spots, and outings.`;

  return (
    <GeoHubView
      title={summary.node.n}
      path={geoNodePath(summary.node.id)}
      summary={summaryCopy}
      parentLinks={ancestorCrumbs.map((crumb) => ({
        label: crumb.n,
        href:
          crumb.kind === 'country' && crumb.iso ? geoCountryPath(crumb.iso) : geoNodePath(crumb.id),
      }))}
      parentFallback={geoKindLabel(summary.node.kind)}
      backTo={backTo}
      backLabel={parent?.n ?? 'Places'}
      counts={{
        activities: geoCountsTotal(summary.counts.act),
        places: geoCountsTotal(summary.counts.pl),
        facilities: geoCountsTotal(summary.counts.fac),
        children: summary.children.length,
      }}
      childNodes={summary.children}
      childrenHeading={heading}
      catalogNodeId={summary.node.id}
      catalogNodeKind={summary.node.kind}
      mapCenter={nodeMapCenter(summary.node)}
      destinationSlug={summary.node.kind === 'area' ? summary.node.s : null}
      activeTab={activeTab}
      onTabChange={onTabChange}
    />
  );
};
