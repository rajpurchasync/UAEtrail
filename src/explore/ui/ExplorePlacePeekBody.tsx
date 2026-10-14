import { useState } from 'react';
import type { ActivityDTO } from '@uaetrail/shared-types';
import { areaDetailPath } from '@uaetrail/shared-types';
import { MapPin } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import type { ExploreCardModel } from '../exploreCardModel';
import {
  ExploreCardHeadline,
  ExploreCardRatingRow,
  ExploreCardRequirementBadges,
} from './ExploreCardPresentation';
import {
  resolveCatalogEntityName,
  resolvePlaceCatalogFactLabels,
} from '../../list/listVenuePosterPresentation';
import {
  resolvePlacePeekCuratedArea,
  resolvePlacePeekLocalLabel,
  resolvePlacePeekRegionLabel,
} from '../../place/placePeekPresentation';
import {
  PLACE_PEEK_AREA_LABEL,
  PLACE_PEEK_SECTION_FACTS,
  PLACE_PEEK_SECTION_OUTINGS,
  PLACE_PEEK_SECTION_REVIEWS,
} from '../../content/placePeekCopy';
import { EXPLORE_TYPE } from '../../config/exploreTheme';
import { fetchPlaceActivities } from '../../hooks/placeDetailClientApi';
import { useSafeAsyncEffect } from '../../hooks/useSafeAsyncEffect';
import type { ExplorePeekDetailAccess } from '../../access/mapViewerAccessToUi';
const peekSectionShell = 'mt-3 rounded-xl border border-neutral-100 bg-neutral-50/80 px-3 py-2.5';
const peekSectionLabel =
  'mb-2 text-[11px] font-semibold uppercase tracking-wide text-neutral-500';

const formatHostedActivityMeta = (activity: ActivityDTO): string => {
  const datePart = new Date(activity.date).toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
  const parts: string[] = [datePart];
  if (activity.time?.trim()) parts.push(activity.time.trim());
  return parts.join(' · ');
};

const ExplorePlacePeekHostedActivities = ({
  locationId,
  onNavigate,
}: {
  locationId: string | null | undefined;
  onNavigate?: () => void;
}) => {
  const navigate = useNavigate();
  const [activities, setActivities] = useState<ActivityDTO[]>([]);

  useSafeAsyncEffect(
    async (isActive) => {
      const id = locationId?.trim();
      if (!id) {
        if (isActive()) setActivities([]);
        return;
      }
      const rows = await fetchPlaceActivities(id).catch(() => []);
      if (!isActive()) return;
      setActivities(rows.filter((row) => row.status === 'published').slice(0, 6));
    },
    [locationId]
  );

  if (activities.length === 0) return null;

  return (
    <section className={peekSectionShell} aria-label={PLACE_PEEK_SECTION_OUTINGS}>
      <div className={peekSectionLabel}>{PLACE_PEEK_SECTION_OUTINGS}</div>
      <ul className="divide-y divide-neutral-100 rounded-lg border border-neutral-100 bg-white">
        {activities.map((activity) => (
          <li key={activity.id}>
            <button
              type="button"
              onClick={() => {
                onNavigate?.();
                navigate(`/activity/${activity.id}`);
              }}
              className="flex w-full flex-col gap-0.5 px-3 py-2.5 text-left hover:bg-neutral-50"
            >
              <span className="text-sm font-semibold text-neutral-900 line-clamp-2">
                {activity.title?.trim() || 'Outdoor plan'}
              </span>
              <span className="text-xs text-neutral-500">{formatHostedActivityMeta(activity)}</span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
};

const ExplorePlacePeekLocationBlock = ({
  card,
  onBeforeDetailNavigate,
}: {
  card: ExploreCardModel;
  onBeforeDetailNavigate?: () => void;
}) => {
  const region = resolvePlacePeekRegionLabel(card);
  const curated = resolvePlacePeekCuratedArea(card);
  const localLabel = resolvePlacePeekLocalLabel(card);

  if (!region && !curated && !localLabel) return null;

  return (
    <div className="mt-2 space-y-1.5">
      {region ? (
        <p className={`flex items-center gap-1.5 text-sm font-semibold ${EXPLORE_TYPE.body}`}>
          <MapPin className="h-4 w-4 shrink-0 text-gray-400" aria-hidden />
          {region}
        </p>
      ) : null}
      {curated ? (
        <p className={`text-sm ${EXPLORE_TYPE.body}`}>
          <span className={`font-medium ${EXPLORE_TYPE.muted}`}>{PLACE_PEEK_AREA_LABEL} · </span>
          {curated.slug ? (
            <Link
              to={areaDetailPath(curated.slug)}
              onClick={() => onBeforeDetailNavigate?.()}
              className="font-semibold text-emerald-700 underline decoration-emerald-700/30 underline-offset-2 hover:text-emerald-800"
            >
              {curated.name}
            </Link>
          ) : (
            <span className="font-semibold text-neutral-800">{curated.name}</span>
          )}
        </p>
      ) : null}
      {localLabel ? (
        <p className={`text-sm font-medium ${EXPLORE_TYPE.muted}`} dir="auto">
          {localLabel}
        </p>
      ) : null}
    </div>
  );
};

/** Catalog place map peek — title, region/area, facts, reviews, hosted plans. */
export const ExplorePlacePeekBody = ({
  card,
  detailAccess,
  onGuestGatedDetail,
  onBeforeDetailNavigate,
}: {
  card: ExploreCardModel;
  detailAccess?: ExplorePeekDetailAccess | null;
  onGuestGatedDetail?: () => void;
  onBeforeDetailNavigate?: () => void;
}) => {
  const titleSections = {
    ...card.sections,
    plainTitle: resolveCatalogEntityName(card),
  };
  const factLabels = resolvePlaceCatalogFactLabels(card);

  return (
    <>
      <ExploreCardHeadline
        sections={titleSections}
        size="lg"
        tone={card.tone}
        detailAccess={detailAccess}
        onGuestGatedDetail={onGuestGatedDetail}
        onBeforeDetailNavigate={onBeforeDetailNavigate}
      />
      <ExplorePlacePeekLocationBlock card={card} onBeforeDetailNavigate={onBeforeDetailNavigate} />

      {factLabels.length > 0 ? (
        <section className={peekSectionShell} aria-label={PLACE_PEEK_SECTION_FACTS}>
          <div className={peekSectionLabel}>{PLACE_PEEK_SECTION_FACTS}</div>
          <ExploreCardRequirementBadges badges={factLabels} />
        </section>
      ) : null}

      <section className={peekSectionShell} aria-label={PLACE_PEEK_SECTION_REVIEWS}>
        <div className={peekSectionLabel}>{PLACE_PEEK_SECTION_REVIEWS}</div>
        <ExploreCardRatingRow card={card} compact />
      </section>

      <ExplorePlacePeekHostedActivities
        locationId={card.locationId}
        onNavigate={onBeforeDetailNavigate}
      />
    </>
  );
};
