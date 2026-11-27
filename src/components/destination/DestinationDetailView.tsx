import { useEffect, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import type { DestinationDetailPayload } from '../../hooks/destinationHubClientApi';
import type { ExploreAvailabilityIndex } from '../../hooks/memberPeopleClientApi';
import { PageMeta } from '../seo/PageMeta';
import { activityCompose, intentFixedCompose, placeCompose } from '@/discovery/discoveryPortExploreCompose';
import { explorePath } from '@/discovery/discoveryPortExploreRouting';
import { destinationHubPath } from '@uaetrail/shared-types';
import { type DestinationDetailTabId } from '../../destinationDetail/destinationDetailTab';
import { DestinationHubMapStrip } from './DestinationHubMapStrip';
import { DestinationHubPreviewSections } from './DestinationHubPreviewSections';
import { collectDestinationHeroPhotos } from './collectDestinationHeroPhotos';
import { DetailHeroPhotoStrip } from '../../detail/shared/DetailHeroPhotoStrip';
import { GeoAncestorEyebrow } from '../../detail/shared/GeoAncestorEyebrow';
import { useGeoAncestorLinks } from '../../hooks/useGeoAncestorLinks';
import {
  ConsumerDetailSection,
  ConsumerDetailSectionJumpNav,
  DetailPageShell,
  StatGrid,
  StatTile,
} from '../../detail/shell';
import { detailBackPath } from '../../config/routingCatalog';
import { readDetailBackToFromLocation } from '@/discovery/discoveryPortExploreRouting';
import { parseMobileBackNavState } from '../../utils/mobileBackNav';
import { resolveDestinationConsumerDetailHeaderChrome } from '../../destinationDetail/detail/resolveDestinationConsumerDetailHeaderChrome';
import { EXPLORE_PEEK_CTA } from '../../config/exploreTheme';
import { DetailHeroShareButton } from '../../detail/shared/DetailHeroShareButton';
import { ExploreWishlistSaveButton } from '@/discovery/discoveryPortExploreCardChrome';
import { buildDestinationDetailDiscoveryCard } from '../../destinationDetail/detail/buildDestinationDetailDiscoveryCard';
import { CONSUMER_DETAIL_OVERVIEW_LABEL } from '../../content/consumerDetailSectionLabels';
import { keyFactIconFromLabel } from '../../detail/shell/keyFactIcons';
import { DestinationDetailMobileActionBar } from './DestinationDetailMobileActionBar';
import { PlaceDetailWeatherSection } from '../place/PlaceDetailWeatherSection';

const AREA_TAB_SCROLL_ANCHORS: Record<DestinationDetailTabId, string> = {
  overview: 'area-detail-overview',
  places: 'area-detail-places',
  activities: 'area-detail-activities',
};

type DestinationDetailViewProps = {
  slug: string;
  data: DestinationDetailPayload;
  availabilityIndex?: ExploreAvailabilityIndex | null;
  activeTab: DestinationDetailTabId;
  onTabChange: (tab: DestinationDetailTabId) => void;
};

export const DestinationDetailView = ({
  slug: _slug,
  data,
  availabilityIndex,
  activeTab,
  onTabChange: _onTabChange,
}: DestinationDetailViewProps) => {
  const location = useLocation();
  const { destination: area, counts, preview } = data;
  const headerChrome = resolveDestinationConsumerDetailHeaderChrome();
  const backTo = readDetailBackToFromLocation(location.state) ?? detailBackPath('explore');
  const backLabel = parseMobileBackNavState(location.state)?.backLabel ?? 'Explore';
  const summary =
    area.summary?.trim() ||
    'Outings, trails, and people looking for crew in this zone — filter the map to what is happening here.';
  const detailPath = destinationHubPath(area.slug);
  const geoLinks = useGeoAncestorLinks({
    region: area.region,
    countryCode: area.countryCode,
  });
  const wishlistCard = useMemo(
    () =>
      buildDestinationDetailDiscoveryCard({
        destination: area,
        shareText: summary.slice(0, 160),
      }),
    [area, summary]
  );

  const heroPhotos = useMemo(
    () =>
      collectDestinationHeroPhotos({
        places: preview?.places ?? [],
        activities: preview?.activities ?? [],
        areaImageUrl: area.imageUrl,
        destinationName: area.name,
        areaHref: detailPath,
      }),
    [preview?.places, preview?.activities, area.imageUrl, area.name, detailPath]
  );

  const jumpLinks = useMemo(
    () => [
      {
        href: '#area-detail-overview',
        label: CONSUMER_DETAIL_OVERVIEW_LABEL,
        sectionId: 'area-detail-overview',
      },
      ...(area.center
        ? [{ href: '#area-detail-weather', label: 'Weather', sectionId: 'area-detail-weather' }]
        : []),
      { href: '#area-detail-places', label: 'Places', sectionId: 'area-detail-places' },
      { href: '#area-detail-activities', label: 'Activities', sectionId: 'area-detail-activities' },
    ],
    [area.center]
  );

  useEffect(() => {
    const anchor = AREA_TAB_SCROLL_ANCHORS[activeTab];
    if (!anchor || activeTab === 'overview') return;
    const el = document.getElementById(anchor);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [activeTab, area.slug]);

  const findCrewPath = explorePath({
    destination: area.slug,
    compose: intentFixedCompose('hiking'),
  });
  const hostPath = explorePath({
    destination: area.slug,
    compose: activityCompose('hiking'),
  });
  const addPlacePath = explorePath({
    destination: area.slug,
    compose: placeCompose('hiking'),
  });

  const mobileFooter = (
    <DestinationDetailMobileActionBar
      findCrewPath={findCrewPath}
      hostPath={hostPath}
      addPlacePath={addPlacePath}
    />
  );

  const aside = (
    <div className="space-y-3">
      <p className="text-[11px] font-bold uppercase tracking-wide text-neutral-500">Go together</p>
      <Link to={findCrewPath} className={`${EXPLORE_PEEK_CTA.primary} block text-center lg:!rounded-lg lg:!py-2 lg:!text-[13px]`}>
        Find crew
      </Link>
      <Link
        to={hostPath}
        className="flex w-full items-center justify-center rounded-lg border border-neutral-200 bg-white px-3 py-2 text-[13px] font-semibold text-neutral-900 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
      >
        Host an outing
      </Link>
      <Link
        to={addPlacePath}
        className="flex w-full items-center justify-center rounded-lg border border-neutral-200 bg-white px-3 py-2 text-[13px] font-semibold text-neutral-900 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
      >
        Add a place
      </Link>
    </div>
  );

  return (
    <DetailPageShell
      backTo={backTo}
      backLabel={backLabel}
      headerChrome={headerChrome}
      preferDeclaredBackLabel
      footer={mobileFooter}
      footerClassName="md:hidden"
      aside={aside}
      jumpRow={<ConsumerDetailSectionJumpNav links={jumpLinks} />}
      hero={
        <div className="-mx-4 mb-3 min-w-0 max-w-[calc(100%+2rem)] overflow-hidden md:-mx-6 md:mb-4 md:max-w-[calc(100%+3rem)] lg:mx-0 lg:mb-3 lg:mt-0 lg:max-w-full lg:pt-0">
          <DetailHeroPhotoStrip
            photos={heroPhotos}
            selfDetailPath={detailPath}
            mobileOverlayLayout="centered"
            topEndAction={
              <div className="flex items-center gap-1.5">
                <ExploreWishlistSaveButton card={wishlistCard} bare />
                <DetailHeroShareButton
                  title={area.name}
                  text={summary.slice(0, 120)}
                  path={detailPath}
                  shareSurface="destination"
                />
              </div>
            }
            ariaLabel={`${area.name} photos`}
            overlay={
              <>
                <h1 className="landing-hero-headline font-black leading-[1.18] [overflow-wrap:anywhere] md:max-w-3xl md:text-[2rem] md:leading-[1.15] lg:text-[2.125rem]">
                  {area.name}
                </h1>
                <p className="text-sm font-medium text-emerald-100/95">
                  <GeoAncestorEyebrow links={geoLinks} fallbackLabel={area.region} />
                </p>
                <p className="home-hero-intro max-w-2xl text-sm leading-snug text-white/85 md:text-[0.9375rem] md:leading-relaxed">
                  {summary}
                </p>
              </>
            }
          />
        </div>
      }
      keyFacts={
        <StatGrid>
          <StatTile
            label="Activities"
            value={String(counts.activities)}
            icon={keyFactIconFromLabel('Activities')}
          />
          <StatTile
            label="Places"
            value={String(counts.places)}
            icon={keyFactIconFromLabel('Places')}
          />
          <StatTile
            label="Available"
            value={String(counts.availability)}
            icon={keyFactIconFromLabel('Available')}
          />
        </StatGrid>
      }
    >
      <PageMeta
        title={area.name}
        description={summary.slice(0, 160)}
        path={detailPath}
        image={heroPhotos[0]?.src ?? area.imageUrl}
      />

      <ConsumerDetailSection
        id="area-detail-overview"
        title={CONSUMER_DETAIL_OVERVIEW_LABEL}
        tone="emerald"
        collapsible
        defaultExpanded
      >
        <DestinationHubMapStrip
          destinationSlug={area.slug}
          destinationName={area.name}
          center={area.center}
          boundsRing={area.bounds}
          places={preview?.places ?? []}
        />

        {area.center ? (
          <PlaceDetailWeatherSection
            lat={area.center.latitude}
            lng={area.center.longitude}
            sectionId="area-detail-weather"
            forecastForName={area.name}
            className="mt-4"
          />
        ) : null}

        {availabilityIndex && availabilityIndex.people.length > 0 ? (
          <section className="mt-4 space-y-2">
            <h3 className="text-base font-semibold text-slate-900 lg:text-sm">Available this week</h3>
            <ul className="max-h-48 divide-y overflow-y-auto rounded-2xl border border-slate-200 bg-white dark:border-neutral-700 dark:bg-neutral-900">
              {availabilityIndex.people.slice(0, 8).map((person) => (
                <li key={person.userId} className="px-4 py-2.5 text-sm text-slate-800">
                  {person.displayName} · {person.kinds.join(', ')}
                </li>
              ))}
            </ul>
            <Link
              to={explorePath({ crews: true, destination: area.slug, list: true })}
              className="text-sm font-semibold text-emerald-800"
            >
              Browse people on the map
            </Link>
          </section>
        ) : null}
      </ConsumerDetailSection>

      <div id="area-detail-places" className="min-w-0 scroll-mt-28">
        <h2 className="sr-only">Places in this destination</h2>
        <DestinationHubPreviewSections
          destinationSlug={area.slug}
          activities={preview?.activities ?? []}
          places={preview?.places ?? []}
          operators={preview?.operators ?? []}
          mode="places"
        />
      </div>

      <div id="area-detail-activities" className="min-w-0 scroll-mt-28">
        <h2 className="sr-only">Activities</h2>
        <DestinationHubPreviewSections
          destinationSlug={area.slug}
          activities={preview?.activities ?? []}
          places={preview?.places ?? []}
          operators={preview?.operators ?? []}
          mode="activities"
        />
      </div>
    </DetailPageShell>
  );
};
