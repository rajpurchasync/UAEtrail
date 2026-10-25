import { Link } from 'react-router-dom';
import type { FacilityDTO } from '@uaetrail/shared-types';
import {
  PLACE_KIND_LABELS,
  canonicalPlaceDetailPath,
  facilityDetailPath,
  facilityPlaceKindPinEmoji,
} from '@uaetrail/shared-types';
import { ActivityConsumerDetailModalShell } from '../../../activity/detail/templates/ActivityConsumerDetailModalShell';
import {
  CONSUMER_DETAIL_PANEL,
  CONSUMER_DETAIL_SECTION_TITLE,
} from '../../../activity/detail/templates/activityConsumerDetailSectionStyles';
import { EnvironmentImage } from '../../../components/ui/EnvironmentImage';
import { MeetingPointMap, ShareButton } from '../../../components/ui';
import { PageMeta } from '../../../components/seo/PageMeta';
import { detailBackPath } from '../../../config/routingCatalog';

export type FacilityConsumerDetailPageProps = {
  facility: FacilityDTO;
  facilityId: string;
};

export const FacilityConsumerDetailPage = ({
  facility,
  facilityId,
}: FacilityConsumerDetailPageProps) => {
  const kind = facility.facilityKind;
  const label = PLACE_KIND_LABELS[kind];
  const detailPath = facilityDetailPath(facilityId);
  const cover = facility.images?.[0] ?? null;
  const latitude = facility.latitude;
  const longitude = facility.longitude;
  const backTo = detailBackPath('event');

  return (
    <>
      <PageMeta title={facility.name} description={facility.description ?? undefined} path={detailPath} />
      <ActivityConsumerDetailModalShell
        backTo={backTo}
        backLabel="Map"
        headerChrome={{ emoji: facilityPlaceKindPinEmoji(kind), label }}
        headerAction={<ShareButton title={facility.name} path={detailPath} />}
      >
        <div className="relative -mx-4 mb-4 h-[min(28dvh,200px)] w-[calc(100%+2rem)] overflow-hidden bg-neutral-100">
          {cover ? (
            <EnvironmentImage src={cover} alt={facility.name} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-4xl">
              {facilityPlaceKindPinEmoji(kind)}
            </div>
          )}
        </div>
        <h1 className="text-xl font-bold text-neutral-900">{facility.name}</h1>
        <section className={`mt-4 ${CONSUMER_DETAIL_PANEL.social} space-y-4`}>
          {facility.description ? (
            <p className="text-sm text-neutral-700 whitespace-pre-wrap">{facility.description}</p>
          ) : null}
          {facility.parentPlaceId ? (
            <p className="text-sm">
              <Link
                to={canonicalPlaceDetailPath(facility.parentPlaceId)}
                className="font-semibold text-emerald-800 hover:text-emerald-900"
              >
                View parent place
              </Link>
            </p>
          ) : null}
          {latitude != null && longitude != null ? (
            <div>
              <h2 className={CONSUMER_DETAIL_SECTION_TITLE}>Location</h2>
              <MeetingPointMap lat={latitude} lng={longitude} label={facility.name} />
            </div>
          ) : null}
        </section>
      </ActivityConsumerDetailModalShell>
    </>
  );
};
