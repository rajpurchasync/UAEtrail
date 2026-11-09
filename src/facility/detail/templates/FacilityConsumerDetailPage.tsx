import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, MapPin, Store } from 'lucide-react';
import type { AmenityState, FacilityDTO, PublicActiveAlertDTO } from '@uaetrail/shared-types';
import {
  PLACE_KIND_LABELS,
  canonicalPlaceDetailPath,
  facilityDetailPath,
  facilityPlaceKindPinEmoji,
} from '@uaetrail/shared-types';
import { DetailPageShell, HeroBanner, SectionCard, StatGrid, StatTile } from '../../../detail/shell';
import { DetailHeroPhotoStrip } from '../../../detail/shared/DetailHeroPhotoStrip';
import { collectDetailHeroPhotos } from '../../../detail/shared/detailHeroPhotos';
import { DirectionsControl } from '../../../components/ui';
import { DetailHeroShareButton } from '../../../detail/shared/DetailHeroShareButton';
import { LazyMeetingPointMap } from '../../../detail/shared/LazyMeetingPointMap';
import { PageMeta } from '../../../components/seo/PageMeta';
import { detailBackPath } from '../../../config/routingCatalog';
import { EXPLORE_PEEK_CTA } from '../../../config/exploreTheme';
import {
  getActivePlatformAlerts,
  sendReferralClickBeacon,
} from '../../../hooks/publicPlatformAlertsClientApi';
import { ConsumerDetailPlatformAlertBanner } from '../../../detail/ConsumerDetailPlatformAlertBanner';
import { FacilityAmenityReportForm } from '../FacilityAmenityReportForm';
import { CONSUMER_DETAIL_OVERVIEW_LABEL } from '../../../content/consumerDetailSectionLabels';
import { keyFactIconFromLabel } from '../../../detail/shell/keyFactIcons';
import { PlaceDetailWeatherSection } from '../../../components/place/PlaceDetailWeatherSection';

const COMMERCIAL_FACILITY_KINDS = new Set<FacilityDTO['facilityKind']>([
  'grocery',
  'food',
  'gas_station',
  'outdoor_shop',
]);

const amenityLabel = (state: AmenityState | undefined): string => {
  if (state === 'working') return 'Working';
  if (state === 'not_working') return 'Not working';
  return 'Unknown';
};

export type FacilityConsumerDetailPageProps = {
  facility: FacilityDTO;
  facilityId: string;
};

export const FacilityConsumerDetailPage = ({
  facility,
  facilityId,
}: FacilityConsumerDetailPageProps) => {
  const [platformAlerts, setPlatformAlerts] = useState<PublicActiveAlertDTO[]>([]);
  const amenityState = facility.amenityState;
  const lastCheckedAt = facility.amenityLastCheckedAt ?? null;
  const kind = facility.facilityKind;
  const label = PLACE_KIND_LABELS[kind];
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
  const parentPath = facility.parentPlaceId
    ? canonicalPlaceDetailPath(facility.parentPlaceId)
    : null;
  const isCommercial = COMMERCIAL_FACILITY_KINDS.has(kind);

  const partnerUrl = facility.partnerReferralUrl?.trim() || null;
  const showPartnerRow = Boolean(partnerUrl) && isCommercial;

  useEffect(() => {
    if (!hasCoords) {
      setPlatformAlerts([]);
      return;
    }
    let cancelled = false;
    void getActivePlatformAlerts({
        lat: latitude as number,
        lng: longitude as number,
        radiusKm: 120,
        ...(facility.region?.trim() ? { region: facility.region.trim() } : {}),
      })
      .then((res) => {
        if (!cancelled) setPlatformAlerts(res.data ?? []);
      })
      .catch(() => {
        if (!cancelled) setPlatformAlerts([]);
      });
    return () => {
      cancelled = true;
    };
  }, [hasCoords, latitude, longitude, facility.region]);

  const footer = hasCoords ? (
    <DirectionsControl
      lat={latitude as number}
      lng={longitude as number}
      variant="button"
      label="Get directions"
      showAppPickerAffordance={false}
      buttonClassName={`${EXPLORE_PEEK_CTA.primary} lg:!rounded-lg lg:!py-2 lg:!text-[13px]`}
    />
  ) : undefined;

  const lastChecked = lastCheckedAt
    ? new Date(lastCheckedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
    : null;

  return (
    <>
      <PageMeta title={facility.name} description={facility.description ?? undefined} path={detailPath} />
      <DetailPageShell
        backTo={backTo}
        headerChrome={{ emoji: facilityPlaceKindPinEmoji(kind), label }}
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
            <div className="-mx-4 mb-3 min-w-0 max-w-[calc(100%+2rem)] overflow-hidden md:-mx-6 md:mb-4 md:max-w-[calc(100%+3rem)] lg:mx-0 lg:mb-3 lg:max-w-full">
              <DetailHeroPhotoStrip
                photos={heroPhotos}
                topEndAction={shareControl}
                selfDetailPath={detailPath}
                ariaLabel={`${facility.name} photos`}
                overlay={
                  <>
                    <span className="rounded-full border border-white/35 bg-white/15 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide">
                      {label}
                    </span>
                    <h1 className="text-[1.55rem] font-bold leading-tight md:text-[1.85rem] lg:text-[1.4rem]">
                      {facility.name}
                    </h1>
                    <p className="text-sm text-white/90">{facility.region}</p>
                  </>
                }
              />
            </div>
          ) : (
            <HeroBanner
              imageUrl={cover}
              topEndAction={shareControl}
              typeBadge={
                <span className="rounded-full border border-white/35 bg-white/15 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide">
                  {label}
                </span>
              }
              status={
                !isCommercial ? (
                  <span className="rounded-full border border-white/30 bg-black/30 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide">
                    {amenityLabel(amenityState)}
                  </span>
                ) : null
              }
              title={facility.name}
              subtitle={facility.region}
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
          <StatGrid>
            {!isCommercial ? (
              <StatTile
                label="Condition"
                value={amenityLabel(amenityState)}
                icon={keyFactIconFromLabel('Condition')}
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
        }
      >
        {facility.description ? (
          <SectionCard title={CONSUMER_DETAIL_OVERVIEW_LABEL}>
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
              <p className="text-sm font-semibold text-neutral-950 dark:text-neutral-50">View the trail or camp this belongs to</p>
            </div>
            <ChevronRight className="h-5 w-5 shrink-0 text-emerald-700/50" aria-hidden />
          </Link>
        ) : null}

        {hasCoords ? (
          <PlaceDetailWeatherSection
            lat={latitude as number}
            lng={longitude as number}
            sectionId="facility-detail-weather"
            forecastForName={facility.name}
          />
        ) : null}

        {hasCoords ? (
          <SectionCard title="Location and directions">
            <div className="overflow-hidden rounded-2xl ring-1 ring-neutral-200">
              <LazyMeetingPointMap lat={latitude as number} lng={longitude as number} label={facility.name} />
            </div>
          </SectionCard>
        ) : null}

        {!isCommercial ? (
          <SectionCard title="Report a problem">
            <FacilityAmenityReportForm
              facilityId={facilityId}
              onQueued={() => {
                /* curator confirms before amenityState changes */
              }}
            />
          </SectionCard>
        ) : null}
      </DetailPageShell>
    </>
  );
};
