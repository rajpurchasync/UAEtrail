import { useMemo, type ReactNode } from 'react';
import { useActivePlatformAlerts } from '../../../hooks/useActivePlatformAlerts';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, MapPin, Store } from 'lucide-react';
import type { FacilityDTO } from '@uaetrail/shared-types';
import {
  PLACE_KIND_LABELS,
  canonicalPlaceDetailPath,
  facilityDetailPath,
} from '@uaetrail/shared-types';
import {
  ConsumerDetailSection,
  DetailPageShell,
  HeroBanner,
  SectionCard,
  StatGrid,
  StatTile,
} from '../../../detail/shell';
import { DetailHeroPhotoStrip } from '../../../detail/shared/DetailHeroPhotoStrip';
import { collectDetailHeroPhotos } from '../../../detail/shared/detailHeroPhotos';
import { DirectionsControl } from '../../../components/ui';
import { DetailHeroShareButton } from '../../../detail/shared/DetailHeroShareButton';
import { LazyMeetingPointMap } from '../../../detail/shared/LazyMeetingPointMap';
import { PageMeta } from '../../../components/seo/PageMeta';
import { detailBackPath, geoNodePath } from '../../../config/routingCatalog';
import {
  sendReferralClickBeacon,
} from '../../../hooks/publicPlatformAlertsClientApi';
import { ConsumerDetailPlatformAlertBanner } from '../../../detail/ConsumerDetailPlatformAlertBanner';
import { FACILITY_DETAIL_REPORT_SECTION_ID } from '../../facilityDetailAnchors';
import { FacilityAmenityReportForm } from '../FacilityAmenityReportForm';
import {
  CONSUMER_DETAIL_KEY_FACTS_LABEL,
  CONSUMER_DETAIL_OVERVIEW_LABEL,
} from '../../../content/consumerDetailSectionLabels';
import { keyFactIconFromLabel } from '../../../detail/shell/keyFactIcons';
import { PlaceDetailWeatherSection } from '../../../components/place/PlaceDetailWeatherSection';
import { parseMobileBackNavState } from '../../../utils/mobileBackNav';
import { resolveFacilityConsumerDetailHeaderChrome } from '../resolveFacilityConsumerDetailHeaderChrome';
import { ConsumerDetailHeroGeoLine } from '../../../detail/shared/ConsumerDetailHeroGeoLine';
import { resolveFacilityDetailDestinationHero } from '../../../detail/shared/resolveConsumerDetailDestinationHero';
import { useGeoAncestorLinks } from '../../../hooks/useGeoAncestorLinks';
import { useExplorePublishedDestinations } from '@/discovery/discoveryPortExploreBrowse';
import { consumerDetailChildLinkState } from '@/discovery/discoveryPortExploreRouting';
import { amenityConditionLabel } from '../../amenityConditionLabels';
import { FacilityDetailHeroParentLine } from '../FacilityDetailHeroParentLine';

const COMMERCIAL_FACILITY_KINDS = new Set<FacilityDTO['facilityKind']>([
  'grocery',
  'food',
  'gas_station',
  'outdoor_shop',
]);

export type FacilityDetailSectionsProps = {
  facility: FacilityDTO;
  facilityId: string;
};

export const FacilityDetailSections = ({
  facility,
  facilityId,
}: FacilityDetailSectionsProps) => {
  const location = useLocation();
  const amenityState = facility.amenityState;
  const lastCheckedAt = facility.amenityLastCheckedAt ?? null;
  const kind = facility.facilityKind;
  const label = PLACE_KIND_LABELS[kind];
  const headerChrome = resolveFacilityConsumerDetailHeaderChrome(kind);
  const publishedDestinations = useExplorePublishedDestinations();
  const curatedDestinationSlug = useMemo(() => {
    const id = facility.destinationId?.trim();
    if (!id) return null;
    return publishedDestinations.find((area) => area.id === id)?.slug ?? null;
  }, [facility.destinationId, publishedDestinations]);
  const { region, placeHubLabel, destinationSlug } = resolveFacilityDetailDestinationHero(
    facility,
    curatedDestinationSlug
  );
  const geoHubPath = useMemo(() => {
    const venueId = facility.geoRef?.venueId?.trim();
    return venueId && !destinationSlug ? geoNodePath(venueId) : null;
  }, [destinationSlug, facility.geoRef?.venueId]);
  const geoLinks = useGeoAncestorLinks({ region, geoRef: facility.geoRef ?? null });
  const areaLinkState = useMemo(() => {
    const returnTo = `${location.pathname}${location.search}`;
    return consumerDetailChildLinkState(returnTo, headerChrome.label);
  }, [headerChrome.label, location.pathname, location.search]);
  const heroGeoLine: ReactNode =
    region || placeHubLabel ? (
      <ConsumerDetailHeroGeoLine
        geoLinks={geoLinks}
        regionFallback={region}
        placeHubLabel={placeHubLabel}
        destinationSlug={destinationSlug}
        geoHubPath={geoHubPath}
        areaLinkState={areaLinkState}
        geoLinkBackLabel={headerChrome.label}
      />
    ) : null;
  const detailPath = facilityDetailPath(facilityId);
  const cover = facility.images?.[0] ?? null;
  const heroPhotos = useMemo(
    () =>
      collectDetailHeroPhotos([
        {
          srcs: facility.images ?? [],
          title: facility.name,
          kindLabel: label,
          href: detailPath,
        },
      ]),
    [detailPath, facility.images, facility.name, label]
  );
  const shareControl = (
    <DetailHeroShareButton title={facility.name} path={detailPath} shareSurface="place" />
  );
  const latitude = facility.latitude;
  const longitude = facility.longitude;
  const hasCoords = latitude != null && longitude != null;
  const backTo = detailBackPath('explore');
  const parentPath = facility.onSiteId
    ? canonicalPlaceDetailPath(facility.onSiteId)
    : null;
  const parentPlaceName = facility.parentPlaceName?.trim() || null;
  const parentHeroLine =
    parentPath && parentPlaceName ? (
      <FacilityDetailHeroParentLine
        parentPlaceName={parentPlaceName}
        parentPlacePath={parentPath}
        linkState={areaLinkState}
      />
    ) : null;
  const heroContextLines =
    parentHeroLine || heroGeoLine ? (
      <div className="mt-1 space-y-0.5">
        {parentHeroLine}
        {heroGeoLine}
      </div>
    ) : null;
  const isCommercial = COMMERCIAL_FACILITY_KINDS.has(kind);

  const partnerUrl = facility.partnerReferralUrl?.trim() || null;
  const showPartnerRow = Boolean(partnerUrl) && isCommercial;

  const platformAlerts = useActivePlatformAlerts({
    enabled: hasCoords,
    lat: latitude,
    lng: longitude,
    radiusKm: 120,
    region: facility.region,
  });

  const footer = hasCoords ? (
    <DirectionsControl
      lat={latitude as number}
      lng={longitude as number}
      variant="button"
      label="Get directions"
      className="w-full"
      showLeadingIcon
    />
  ) : undefined;

  const lastChecked = lastCheckedAt
    ? new Date(lastCheckedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
    : null;
  const lastReportedAt = facility.lastReportedAmenityAt?.trim()
    ? new Date(facility.lastReportedAmenityAt).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
      })
    : null;
  const lastReportedState = facility.lastReportedAmenityState ?? null;
  const pendingReview = facility.pendingAmenityReview ?? null;

  return (
    <>
      <PageMeta title={facility.name} description={facility.description ?? undefined} path={detailPath} />
      <DetailPageShell
        backTo={backTo}
        backLabel={parseMobileBackNavState(location.state)?.backLabel ?? 'Explore'}
        headerChrome={headerChrome}
        preferDeclaredBackLabel
        footer={footer}
        footerClassName={footer ? 'md:hidden' : undefined}
        aside={
          footer ? (
            <div className="space-y-3">
              <p className="text-[11px] font-bold uppercase tracking-wide text-neutral-500">Get there</p>
              {footer}
            </div>
          ) : undefined
        }
        hero={
          heroPhotos.length > 0 ? (
            <div className="-mx-4 mb-4 min-w-0 max-w-[calc(100%+2rem)] overflow-hidden md:-mx-6 md:max-w-[calc(100%+3rem)] lg:mx-0 lg:mb-2 lg:mt-0 lg:max-w-full lg:pt-0">
              <DetailHeroPhotoStrip
                photos={heroPhotos}
                topEndAction={shareControl}
                mobileOverlayLayout="centered"
                selfDetailPath={detailPath}
                ariaLabel={`${facility.name} photos`}
                overlay={
                  <>
                    <h1 className="landing-hero-headline font-black leading-[1.18] [overflow-wrap:anywhere] md:text-[2rem] md:leading-[1.15] lg:text-[2.125rem]">
                      {facility.name}
                    </h1>
                    {heroContextLines}
                  </>
                }
              />
            </div>
          ) : (
            <HeroBanner
              imageUrl={cover}
              topEndAction={shareControl}
              mobileTitleLayout="center"
              typeBadge={
                <span className="rounded-full border border-white/35 bg-white/15 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide">
                  {headerChrome.label}
                </span>
              }
              title={facility.name}
              subtitle={heroContextLines ?? undefined}
            />
          )
        }
        alerts={
          <ConsumerDetailPlatformAlertBanner
            alerts={platformAlerts}
            label="Safety and conditions"
            className="mb-4 md:mb-5 lg:mb-3"
          />
        }
        keyFacts={
          <ConsumerDetailSection
            title={CONSUMER_DETAIL_KEY_FACTS_LABEL}
            tone="slate"
            ariaLabel={CONSUMER_DETAIL_KEY_FACTS_LABEL}
            className="!mt-0"
            collapsible
            defaultExpanded
          >
            <StatGrid label="">
              {!isCommercial ? (
                <StatTile
                  label="Condition"
                  value={amenityConditionLabel(amenityState)}
                  icon={keyFactIconFromLabel('Condition')}
                />
              ) : null}
              {!isCommercial && lastReportedState && lastReportedAt ? (
                <StatTile
                  label="Last reported"
                  value={`${amenityConditionLabel(lastReportedState)} · ${lastReportedAt}`}
                  icon={keyFactIconFromLabel('Last reported')}
                />
              ) : null}
              {!isCommercial && pendingReview ? (
                <StatTile
                  label="Review in progress"
                  value={amenityConditionLabel(pendingReview.amenityState)}
                  icon={keyFactIconFromLabel('Review in progress')}
                />
              ) : null}
              {lastChecked ? (
                <StatTile
                  label="Last checked"
                  value={lastChecked}
                  icon={keyFactIconFromLabel('Last checked')}
                />
              ) : null}
              {facility.region ? (
                <StatTile
                  label="Region"
                  value={facility.region}
                  icon={keyFactIconFromLabel('Region')}
                />
              ) : null}
            </StatGrid>
          </ConsumerDetailSection>
        }
      >
        {facility.description ? (
          <SectionCard
            id="facility-detail-overview"
            title={CONSUMER_DETAIL_OVERVIEW_LABEL}
            tone="emerald"
            collapsible
            defaultExpanded
          >
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-neutral-700 dark:text-neutral-200">
              {facility.description}
            </p>
          </SectionCard>
        ) : null}

        {showPartnerRow && partnerUrl ? (
          <a
            href={partnerUrl}
            target="_blank"
            rel="noopener noreferrer sponsored"
            onClick={() =>
              sendReferralClickBeacon({
                entityKind: 'facility',
                entityId: facilityId,
                destinationUrl: partnerUrl,
              })
            }
            className="flex items-center gap-3 rounded-2xl border border-neutral-100 bg-white px-3 py-3 dark:border-neutral-800 dark:bg-neutral-900"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-900">
              <Store className="h-5 w-5" aria-hidden />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-bold uppercase tracking-wide text-violet-800/80">Partner</p>
              <p className="text-sm font-semibold text-neutral-950 dark:text-neutral-50">View partner offer (opens off-site)</p>
            </div>
            <ChevronRight className="h-5 w-5 shrink-0 text-violet-700/50" aria-hidden />
          </a>
        ) : null}

        {parentPath ? (
          <Link
            to={parentPath}
            className="flex items-center gap-3 rounded-2xl border border-neutral-100 bg-white px-3 py-3 dark:border-neutral-800 dark:bg-neutral-900"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-900">
              <MapPin className="h-5 w-5" aria-hidden />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-bold uppercase tracking-wide text-emerald-800/80">Parent place</p>
              <p className="text-sm font-semibold text-neutral-950 dark:text-neutral-50">
                {parentPlaceName ?? 'View the trail or camp this belongs to'}
              </p>
            </div>
            <ChevronRight className="h-5 w-5 shrink-0 text-emerald-700/50" aria-hidden />
          </Link>
        ) : null}

        {hasCoords ? (
          <ConsumerDetailSection
            id="facility-detail-weather"
            title="Weather"
            tone="sky"
            ariaLabel="Weather"
            collapsible
            defaultExpanded
          >
            <PlaceDetailWeatherSection
              lat={latitude as number}
              lng={longitude as number}
              forecastForName={facility.name}
              embedded
            />
          </ConsumerDetailSection>
        ) : null}

        {hasCoords ? (
          <SectionCard
            id="facility-detail-location"
            title="Location and directions"
            tone="emerald"
            collapsible
            defaultExpanded
          >
            <LazyMeetingPointMap lat={latitude as number} lng={longitude as number} label={facility.name} />
          </SectionCard>
        ) : null}

        {!isCommercial ? (
          <SectionCard
            id={FACILITY_DETAIL_REPORT_SECTION_ID}
            title="Report a problem"
            tone="violet"
            collapsible
            defaultExpanded={false}
          >
            <FacilityAmenityReportForm
              facilityId={facilityId}
              pendingAmenityReview={pendingReview}
            />
          </SectionCard>
        ) : null}
      </DetailPageShell>
    </>
  );
};
