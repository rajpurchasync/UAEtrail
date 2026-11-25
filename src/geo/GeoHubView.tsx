import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { GuestFeatureUnlockPanel } from '../explore/ui/GuestFeatureUnlockPanel';
import { Compass, LayoutGrid, Layers, MapPin, Droplets } from 'lucide-react';
import { facilityDetailPath } from '@uaetrail/shared-types';
import type { GeoCountsDTO, GeoKind, GeoNodeLite } from '@uaetrail/shared-types';
import { destinationHubPath } from '@uaetrail/shared-types';
import { MobileDetailShell } from '../components/mobile/MobileDetailShell';
import { ConsumerEntityTabBar } from '../components/mobile/ConsumerEntityTabBar';
import { PageMeta } from '../components/seo/PageMeta';
import { DetailHeroPhotoStrip } from '../detail/shared/DetailHeroPhotoStrip';
import { GeoAncestorEyebrow } from '../detail/shared/GeoAncestorEyebrow';
import type { BrowseListBucket } from '../list/browse/browseListBucket';
import type { GeoAncestorLink } from './geoAncestorLinks';
import { GeoChildCards } from './GeoChildCards';
import { GeoGuestDrillLink } from './GeoGuestDrillLink';
import { geoHeroPhotosFromCatalog } from './geoHeroPhotos';
import { GeoBrowsePane } from './GeoBrowsePane';
import { geoActivitiesToExploreItems, geoPlacesToExploreItems } from './geoCatalogToExploreItems';
import {
  GEO_HUB_TAB_LABELS,
  geoHubTabsForNode,
  type GeoHubTabId,
} from './geoHubTab';
import { useGeoPagedActivities, useGeoPagedFacilities, useGeoPagedPlaces } from './useGeoPagedCatalog';
import {
  consumerDetailChildLinkState,
  readDetailBackToFromLocation,
} from '../explore/mapPeekDetailNavState';
import { parseMobileBackNavState } from '../utils/mobileBackNav';
import { resolveGeoConsumerDetailHeaderChrome } from './resolveGeoConsumerDetailHeaderChrome';
import { destinationGuideLinkLabel } from './destinationGuideLinkLabel';

const TAB_ICONS = {
  overview: LayoutGrid,
  places: MapPin,
  facilities: Droplets,
  explore: Compass,
} as const;

type GeoHubViewProps = {
  title: string;
  path: string;
  summary: string;
  parentLinks: GeoAncestorLink[];
  parentFallback?: string;
  backTo: string;
  backLabel: string;
  counts: { activities: number; places: number; facilities: number; children: number };
  childNodes: Array<GeoNodeLite & { counts?: GeoCountsDTO }>;
  childrenHeading: string;
  catalogNodeId: string | null;
  catalogNodeKind?: GeoKind | null;
  mapCenter?: { lat: number; lng: number } | null;
  destinationSlug?: string | null;
  activeTab: GeoHubTabId;
  onTabChange: (tab: GeoHubTabId) => void;
  /** Tree root uses "Places", not the catalog node's geo kind. */
  headerChromeOverride?: { emoji: string; label: string };
  /** Ignore drill-down router state on back (geo tree root after backing out of a country). */
  pinDeclaredBack?: boolean;
};

/** Hatta-style hub used by every public geo page. */
export const GeoHubView = ({
  title,
  path,
  summary,
  parentLinks,
  parentFallback,
  backTo,
  backLabel,
  counts,
  childNodes,
  childrenHeading,
  catalogNodeId,
  catalogNodeKind = null,
  destinationSlug,
  activeTab,
  onTabChange,
  headerChromeOverride,
  pinDeclaredBack = false,
}: GeoHubViewProps) => {
  const { user } = useAuth();
  const member = Boolean(user);
  const location = useLocation();
  const authReturnPath = `${location.pathname}${location.search}`;
  const destinationGuideLabel = destinationSlug ? destinationGuideLinkLabel(title) : null;
  const resolvedBackTo = pinDeclaredBack
    ? backTo
    : (readDetailBackToFromLocation(location.state) ?? backTo);
  const resolvedBackLabel = pinDeclaredBack
    ? backLabel
    : (parseMobileBackNavState(location.state)?.backLabel ?? backLabel);
  const headerChrome =
    headerChromeOverride ?? resolveGeoConsumerDetailHeaderChrome(catalogNodeKind);
  const childLinkState = useMemo(
    () =>
      consumerDetailChildLinkState(
        `${location.pathname}${location.search}`,
        headerChrome.label
      ),
    [headerChrome.label, location.pathname, location.search]
  );
  const visibleTabs = geoHubTabsForNode({
    childCount: childNodes.length,
    facilityCount: counts.facilities,
  });
  const tab = visibleTabs.includes(activeTab) ? activeTab : 'overview';
  const catalogEnabled = Boolean(catalogNodeId) && member;
  const facilitiesPage = useGeoPagedFacilities(
    catalogNodeId,
    catalogEnabled && counts.facilities > 0 && tab === 'facilities'
  );
  const [browseBucket, setBrowseBucket] = useState<BrowseListBucket>('events');

  useEffect(() => {
    if (activeTab === 'places' && childNodes.length === 0) onTabChange('overview');
  }, [activeTab, childNodes.length, onTabChange]);
  const placesPage = useGeoPagedPlaces(catalogNodeId, catalogEnabled);
  const activitiesPage = useGeoPagedActivities(catalogNodeId, catalogEnabled);
  const heroPhotos = useMemo(
    () => geoHeroPhotosFromCatalog(placesPage.items, activitiesPage.items),
    [placesPage.items, activitiesPage.items]
  );
  const placeItems = useMemo(() => geoPlacesToExploreItems(placesPage.items), [placesPage.items]);
  const activityItems = useMemo(
    () => geoActivitiesToExploreItems(activitiesPage.items),
    [activitiesPage.items]
  );
  const catalogItems = useMemo(() => [...activityItems, ...placeItems], [activityItems, placeItems]);
  const browseItems = browseBucket === 'places' ? placeItems : activityItems;
  const browseLoading = browseBucket === 'places' ? placesPage.loading : activitiesPage.loading;
  const browseError = browseBucket === 'places' ? placesPage.error : activitiesPage.error;
  const browseHasMore = Boolean(
    browseBucket === 'places' ? placesPage.nextCursor : activitiesPage.nextCursor
  );
  const browseLoadingMore =
    browseBucket === 'places' ? placesPage.loadingMore : activitiesPage.loadingMore;
  const browseLoadMore = browseBucket === 'places' ? placesPage.loadMore : activitiesPage.loadMore;

  const mobileTabs = visibleTabs.map((id) => ({
    id,
    label: GEO_HUB_TAB_LABELS[id],
    icon: TAB_ICONS[id],
  }));

  return (
    <MobileDetailShell
      backTo={resolvedBackTo}
      backLabel={resolvedBackLabel}
      headerChrome={headerChrome}
      preferDeclaredBackLabel
      lockBodyScroll
    >
      <PageMeta title={title} description={summary.slice(0, 160)} path={path} image={heroPhotos[0]?.src} />
      <div className="consumer-bg md:bg-gray-50 flex h-full min-h-0 w-full max-w-full flex-1 flex-col overflow-hidden">
        <div className="shrink-0">
          <DetailHeroPhotoStrip
            photos={heroPhotos}
            selfDetailPath={path}
            ariaLabel={`${title} photos`}
            overlay={
              <>
                <h1 className="landing-hero-headline font-black leading-[1.18] [overflow-wrap:anywhere] md:max-w-3xl md:text-[2rem] md:leading-[1.15] lg:text-[2.125rem]">
                  {title}
                </h1>
                <p className="text-sm font-medium text-emerald-100/95 md:text-[0.8125rem]">
                  <GeoAncestorEyebrow
                    links={parentLinks}
                    fallbackLabel={parentFallback}
                    linkState={childLinkState}
                  />
                </p>
                <p className="home-hero-intro max-w-2xl text-sm leading-snug text-white/85 md:text-sm md:leading-snug">
                  {summary}
                </p>
              </>
            }
          />
        </div>
        <div className="shrink-0 px-4 md:px-6">
          <ConsumerEntityTabBar
            tabs={mobileTabs}
            active={tab}
            onChange={onTabChange}
            ariaLabel="Geo sections"
            stickyTopClassName="top-0"
            className="-mx-4 mt-0 bg-white/95 px-4 md:bg-gray-50"
          />
          <div className="sticky top-0 z-20 mt-0 hidden min-w-0 flex-wrap gap-x-5 border-b bg-gray-50 md:flex">
            {visibleTabs.map((id) => (
              <button
                key={id}
                type="button"
                onClick={() => onTabChange(id)}
                className={`min-h-8 border-b-2 py-2 text-sm font-semibold transition-colors ${
                  tab === id
                    ? 'border-emerald-600 text-emerald-800'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                {GEO_HUB_TAB_LABELS[id]}
              </button>
            ))}
          </div>
        </div>

        {tab === 'overview' ? (
          <div className="min-h-0 min-w-0 flex-1 overflow-x-clip overflow-y-auto overscroll-y-contain [-webkit-overflow-scrolling:touch]">
            <div className="mx-auto box-border w-full min-h-0 min-w-0 max-w-lg px-4 pb-4 md:max-w-5xl md:px-6 md:pb-3 lg:max-w-6xl lg:px-5">
              <div className="mt-3 space-y-3 md:mt-2 md:space-y-2.5">
                {member ? (
                  <dl className="grid grid-cols-3 gap-2 text-center md:gap-2">
                    <div className="rounded-xl border border-white/60 bg-white/80 px-2 py-2.5 shadow-sm md:py-2 dark:border-neutral-700 dark:bg-neutral-900">
                      <dt className="flex flex-col items-center gap-0.5 text-[10px] uppercase tracking-wide text-slate-500 md:flex-row md:justify-center md:gap-1">
                        <Compass className="h-4 w-4 text-emerald-700" aria-hidden />
                        Activities
                      </dt>
                      <dd className="text-lg font-semibold text-slate-900 md:text-base">{counts.activities}</dd>
                    </div>
                    <div className="rounded-xl border border-white/60 bg-white/80 px-2 py-2.5 shadow-sm md:py-2 dark:border-neutral-700 dark:bg-neutral-900">
                      <dt className="flex flex-col items-center gap-0.5 text-[10px] uppercase tracking-wide text-slate-500 md:flex-row md:justify-center md:gap-1">
                        <MapPin className="h-4 w-4 text-emerald-700" aria-hidden />
                        Places
                      </dt>
                      <dd className="text-lg font-semibold text-slate-900 md:text-base">{counts.places}</dd>
                    </div>
                    <div className="rounded-xl border border-white/60 bg-white/80 px-2 py-2.5 shadow-sm md:py-2 dark:border-neutral-700 dark:bg-neutral-900">
                      <dt className="flex flex-col items-center gap-0.5 text-[10px] uppercase tracking-wide text-slate-500 md:flex-row md:justify-center md:gap-1">
                        <Layers className="h-4 w-4 text-emerald-700" aria-hidden />
                        {childrenHeading}
                      </dt>
                      <dd className="text-lg font-semibold text-slate-900 md:text-base">{counts.children}</dd>
                    </div>
                  </dl>
                ) : (
                  <GuestFeatureUnlockPanel
                    feature="geo-places"
                    presentation="inline"
                    authReturnPath={authReturnPath}
                  />
                )}
                {destinationSlug ? (
                  <GeoGuestDrillLink
                    to={destinationHubPath(destinationSlug)}
                    authReturnPath={destinationHubPath(destinationSlug)}
                    className="inline-flex min-h-8 items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-sm font-semibold text-emerald-900"
                  >
                    {destinationGuideLabel}
                  </GeoGuestDrillLink>
                ) : null}
                <GeoChildCards
                  nodes={childNodes}
                  heading={childrenHeading}
                  linkState={childLinkState}
                  showCounts={member}
                />
              </div>
            </div>
          </div>
        ) : null}

        {tab === 'places' ? (
          <div className="min-h-0 min-w-0 flex-1 overflow-x-clip overflow-y-auto overscroll-y-contain [-webkit-overflow-scrolling:touch]">
            <div className="mx-auto box-border w-full min-h-0 min-w-0 max-w-lg px-4 py-3 pb-4 md:max-w-5xl md:px-6 md:py-2 md:pb-3 lg:max-w-6xl lg:px-5">
              <GeoChildCards
                nodes={childNodes}
                heading={childrenHeading}
                linkState={childLinkState}
                showCounts={member}
              />
            </div>
          </div>
        ) : null}

        {tab === 'facilities' ? (
          <div className="min-h-0 min-w-0 flex-1 overflow-x-clip overflow-y-auto overscroll-y-contain [-webkit-overflow-scrolling:touch]">
            <div className="mx-auto box-border w-full min-h-0 min-w-0 max-w-lg px-4 py-3 pb-4 md:max-w-5xl md:px-6 md:py-2 md:pb-3 lg:max-w-6xl lg:px-5">
              {!member ? (
                <GuestFeatureUnlockPanel feature="geo-places" presentation="inline" authReturnPath={authReturnPath} />
              ) : null}
              {member && facilitiesPage.loading ? (
                <p className="text-sm text-slate-600">Loading facilities…</p>
              ) : null}
              {member && facilitiesPage.error ? (
                <p className="text-sm text-red-700">{facilitiesPage.error}</p>
              ) : null}
              {member && !facilitiesPage.loading && !facilitiesPage.error ? (
                <ul className="space-y-2">
                  {facilitiesPage.items.map((row) => {
                    const id = String(row._id ?? '');
                    if (!id) return null;
                    const label = row.name?.trim() || 'Facility';
                    return (
                      <li key={id}>
                        <GeoGuestDrillLink
                          to={facilityDetailPath(id)}
                          authReturnPath={facilityDetailPath(id)}
                          state={childLinkState}
                          className="flex min-h-10 items-center rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900 shadow-sm hover:border-emerald-200"
                        >
                          {label}
                        </GeoGuestDrillLink>
                      </li>
                    );
                  })}
                </ul>
              ) : null}
              {member && facilitiesPage.nextCursor ? (
                <button
                  type="button"
                  disabled={facilitiesPage.loadingMore}
                  onClick={facilitiesPage.loadMore}
                  className="mt-3 w-full rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-900"
                >
                  {facilitiesPage.loadingMore ? 'Loading…' : 'Load more'}
                </button>
              ) : null}
            </div>
          </div>
        ) : null}

        {tab === 'explore' ? (
          <div className="flex h-0 min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
            {!member ? (
              <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 md:px-6">
                <GuestFeatureUnlockPanel
                  feature="geo-places"
                  authReturnPath={authReturnPath}
                />
              </div>
            ) : null}
            {member ? (
            <GeoBrowsePane
              bucket={browseBucket}
              onBucketChange={setBrowseBucket}
              items={browseItems}
              catalogItems={catalogItems}
              loading={browseLoading}
              error={browseError}
              hasMore={browseHasMore}
              loadingMore={browseLoadingMore}
              onLoadMore={browseLoadMore}
              lockGeoId={catalogNodeId}
              lockGeoKind={catalogNodeKind}
            />
            ) : null}
          </div>
        ) : null}
      </div>
    </MobileDetailShell>
  );
};
