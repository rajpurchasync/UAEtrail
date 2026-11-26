import { useEffect, useLayoutEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { fetchGeoCounts, fetchGeoTreeIntoStore } from '../hooks/geoHierarchyClientApi';
import { geoStore } from '../geo/geoStore';
import { GEO_TREE_PATH } from '../config/routingCatalog';
import { explorePath } from '@/discovery/discoverySessionExploreRouting';
import { PageMeta } from '../components/seo/PageMeta';
import type { GeoCountsDTO, GeoNodeLite } from '@uaetrail/shared-types';
import { GeoHubView } from '../geo/GeoHubView';
import { geoCountsTotal } from '../geo/GeoCountChips';
import { useGeoDetailTab } from '../geo/useGeoDetailTab';
import { ConsumerEntityDetailLoading } from '../detail/shell/ConsumerEntityDetailLoading';
import { DETAIL_LOADING_GEO } from '../content/detailLoadingCopy';
import { GEO_TREE_HEADER_CHROME } from '../geo/resolveGeoConsumerDetailHeaderChrome';
const TREE_SUMMARY =
  'Start with a country, then an emirate, then an area — find places, events, and spots.';

const nodeMapCenter = (node?: GeoNodeLite): { lat: number; lng: number } | null => {
  const pair = node?.c;
  if (!Array.isArray(pair) || pair.length < 2) return null;
  const lng = pair[0];
  const lat = pair[1];
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return { lat, lng };
};

export const GeoTreePage = () => {
  const location = useLocation();
  const { activeTab, onTabChange } = useGeoDetailTab();
  const [countries, setCountries] = useState<GeoNodeLite[]>([]);
  const [counts, setCounts] = useState<Record<string, GeoCountsDTO>>({});
  const [ready, setReady] = useState(false);

  useLayoutEffect(() => {
    setReady(false);
    setCountries([]);
    setCounts({});
  }, [location.key]);

  useEffect(() => {
    let cancelled = false;
    void fetchGeoTreeIntoStore().then(async () => {
      const next = [...geoStore.byId.values()].filter((n) => n.kind === 'country');
      if (cancelled) return;
      setCountries(next);
      if (next.length === 0) {
        setReady(true);
        return;
      }
      try {
        const countRes = await fetchGeoCounts(next.map((n) => n.id));
        if (!cancelled) setCounts(countRes.data ?? {});
      } catch {
        if (!cancelled) setCounts({});
      } finally {
        if (!cancelled) setReady(true);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [location.key]);

  const treeBackTo = explorePath();
  const treeBackLabel = 'Explore';

  const childNodes = countries.map((country) => ({
    ...country,
    counts: counts[country.id],
  }));
  const catalogCountry =
    countries.find((country) => country.iso === 'AE' || country.iso === 'ae') ?? countries[0] ?? null;
  const totals = Object.values(counts).reduce(
    (acc, row) => ({
      activities: acc.activities + geoCountsTotal(row.act),
      places: acc.places + geoCountsTotal(row.pl),
    }),
    { activities: 0, places: 0 }
  );

  if (!ready) {
    return (
      <ConsumerEntityDetailLoading
        backTo={treeBackTo}
        backLabel={treeBackLabel}
        headerChrome={GEO_TREE_HEADER_CHROME}
        label={DETAIL_LOADING_GEO}
      />
    );
  }

  return (
    <>
      <PageMeta title="Places by area" path={GEO_TREE_PATH} />
      <GeoHubView
        title="Places"
        path={GEO_TREE_PATH}
        summary={TREE_SUMMARY}
        parentLinks={[{ label: 'Explore', href: explorePath() }]}
        backTo={treeBackTo}
        backLabel={treeBackLabel}
        pinDeclaredBack
        headerChromeOverride={GEO_TREE_HEADER_CHROME}
        counts={{
          activities: totals.activities,
          places: totals.places,
          facilities: 0,
          children: countries.length,
        }}
        childNodes={childNodes}
        childrenHeading="Countries"
        catalogNodeId={catalogCountry?.id ?? null}
        catalogNodeKind={catalogCountry?.kind ?? 'country'}
        mapCenter={nodeMapCenter(catalogCountry ?? undefined)}
        activeTab={activeTab}
        onTabChange={onTabChange}
      />
    </>
  );
};
