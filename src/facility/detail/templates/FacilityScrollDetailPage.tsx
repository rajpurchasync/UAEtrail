import { Link } from 'react-router-dom';
import { ChevronRight, MapPin } from 'lucide-react';
import type { FacilityDTO } from '@uaetrail/shared-types';
import {
  PLACE_KIND_LABELS,
  canonicalPlaceDetailPath,
  facilityDetailPath,
  facilityPlaceKindPinEmoji,
} from '@uaetrail/shared-types';
import { MobileDetailScrollShell } from '../../../components/mobile/MobileDetailScrollShell';
import {
  DETAIL_SCROLL_MEDIA_BLEED,
  DETAIL_SCROLL_PANEL,
  DETAIL_SCROLL_SECTION_TITLE,
} from '../../../components/mobile/detailScrollSectionStyles';
import { EnvironmentImage } from '../../../components/ui/EnvironmentImage';
import { DirectionsControl, MeetingPointMap, ShareButton } from '../../../components/ui';
import { PageMeta } from '../../../components/seo/PageMeta';
import { detailBackPath } from '../../../config/routingCatalog';
import { EXPLORE_PEEK_CTA } from '../../../config/exploreTheme';

export type FacilityScrollDetailPageProps = {
  facility: FacilityDTO;
  facilityId: string;
};

export const FacilityScrollDetailPage = ({
  facility,
  facilityId,
}: FacilityScrollDetailPageProps) => {
  const kind = facility.facilityKind;
  const label = PLACE_KIND_LABELS[kind];
  const detailPath = facilityDetailPath(facilityId);
  const cover = facility.images?.[0] ?? null;
  const latitude = facility.latitude;
  const longitude = facility.longitude;
  const hasCoords = latitude != null && longitude != null;
  const backTo = detailBackPath('explore');
  const parentPath = facility.parentPlaceId
    ? canonicalPlaceDetailPath(facility.parentPlaceId)
    : null;

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

  return (
    <>
      <PageMeta title={facility.name} description={facility.description ?? undefined} path={detailPath} />
      <MobileDetailScrollShell
        backTo={backTo}
        backLabel=""
        headerChrome={{ emoji: facilityPlaceKindPinEmoji(kind), label }}
        headerAction={<ShareButton title={facility.name} path={detailPath} iconOnly light />}
        footer={footer}
      >
        <div className={`relative mb-4 h-[min(28dvh,200px)] md:mb-6 md:h-[min(36dvh,300px)] lg:mb-3 lg:h-[10rem] ${DETAIL_SCROLL_MEDIA_BLEED}`}>
          {cover ? (
            <EnvironmentImage src={cover} alt={facility.name} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-5xl">
              {facilityPlaceKindPinEmoji(kind)}
            </div>
          )}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-black/15 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 px-4 pb-4 text-white md:px-6 md:pb-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-white/80">{label}</p>
            <h1 className="mt-1 text-[1.5rem] font-bold leading-snug md:text-[1.85rem] lg:text-lg">{facility.name}</h1>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:gap-3">
          <section className={`${DETAIL_SCROLL_PANEL.social} space-y-4`}>
            {facility.description ? (
              <div>
                <h2 className={`mb-2 ${DETAIL_SCROLL_SECTION_TITLE}`}>About</h2>
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-neutral-700 md:text-[15px]">
                  {facility.description}
                </p>
              </div>
            ) : (
              <p className="text-sm text-neutral-500">A mapped amenity near an outdoor place.</p>
            )}
            {parentPath ? (
              <Link
                to={parentPath}
                className={`${DETAIL_SCROLL_PANEL.place} !px-3 !py-3`}
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-900">
                  <MapPin className="h-5 w-5" aria-hidden />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-bold uppercase tracking-wide text-emerald-800/80">Parent place</p>
                  <p className="text-sm font-semibold text-neutral-950">View the trail or camp this belongs to</p>
                </div>
                <ChevronRight className="h-5 w-5 shrink-0 text-emerald-700/50" aria-hidden />
              </Link>
            ) : null}
          </section>

          {hasCoords ? (
            <section>
              <h2 className={`mb-2 ${DETAIL_SCROLL_SECTION_TITLE}`}>Location</h2>
              <div className="overflow-hidden rounded-2xl ring-1 ring-neutral-200">
                <MeetingPointMap lat={latitude as number} lng={longitude as number} label={facility.name} />
              </div>
            </section>
          ) : null}
        </div>
      </MobileDetailScrollShell>
    </>
  );
};
