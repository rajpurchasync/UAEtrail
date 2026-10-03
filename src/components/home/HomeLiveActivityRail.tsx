import { EXPLORE_MAP_PATH } from '../../config/routingCatalog';
import { Link } from 'react-router-dom';
import { ArrowRight, Clock, MapPin } from 'lucide-react';
import { resolveActivityTypeCoverImage } from '../../config/activityCoverImages';
import type { HomeLandingActivity } from '../../content/homeLanding';
import { HOME_LIVE_SECTION } from '../../content/homeLanding';

import { activityPricingBadge } from '../../utils/activityPricing';
import { LandingShell } from './LandingShell';

interface HomeLiveActivityRailProps {
  activities: readonly HomeLandingActivity[];
  loading?: boolean;
  fromLiveApi?: boolean;
}

const ActivityCard = ({ activity }: { activity: HomeLandingActivity }) => {
  const cover = resolveActivityTypeCoverImage(activity.activityType, null, {
    activityId: activity.id,
  });
  const href = activity.path.startsWith('/') ? activity.path : `/activity/${activity.id}`;
  const pricingBadge = activityPricingBadge(activity);

  return (
    <Link to={href} className="landing-activity-card group block w-full">
      <div className="relative h-36 overflow-hidden sm:h-40">
        <img
          src={cover}
          alt=""
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover transition duration-500 group-active:scale-[1.02]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
        <span className="absolute bottom-2.5 left-3 inline-flex items-center gap-1 text-[11px] font-medium text-white/95">
          <MapPin className="h-3 w-3" aria-hidden />
          {activity.region}
        </span>
      </div>
      <div className="flex flex-col p-4">
        <p className="landing-type-body line-clamp-2 font-semibold leading-snug text-neutral-900">
          {activity.title}
        </p>
        <p className="landing-type-caption mt-2 flex items-center gap-1.5 text-neutral-500">
          <Clock className="h-3.5 w-3.5 shrink-0" aria-hidden />
          {activity.whenLabel}
        </p>
        <div className="mt-3 flex items-end justify-between gap-2">
          <span
            className={`landing-type-micro inline-flex max-w-[calc(100%-1.5rem)] rounded-lg px-2 py-0.5 font-bold leading-snug ${pricingBadge.bg} ${pricingBadge.text}`}
          >
            {pricingBadge.label}
          </span>
          <ArrowRight className="h-4 w-4 shrink-0 text-neutral-300" aria-hidden />
        </div>
      </div>
    </Link>
  );
};

export const HomeLiveActivityRail = ({
  activities,
  loading = false,
  fromLiveApi = false,
}: HomeLiveActivityRailProps) => (
  <section className="landing-live-rail bg-white pb-6 pt-5 md:py-14" aria-label="Activities on the map">
    <LandingShell className="min-w-0">
      <header className="flex items-start justify-between gap-3 md:gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            {fromLiveApi && !loading ? (
              <span className="landing-live-badge shrink-0">{HOME_LIVE_SECTION.liveBadgeLabel}</span>
            ) : null}
            <h2 className="landing-section-title min-w-0">{HOME_LIVE_SECTION.title}</h2>
          </div>
          <p className="landing-section-lead mt-1 pr-1 md:mt-1.5">
            {fromLiveApi ? (
              <>
                <span className="md:hidden">{HOME_LIVE_SECTION.subtitleMobileLive}</span>
                <span className="hidden md:inline">{HOME_LIVE_SECTION.subtitle}</span>
              </>
            ) : (
              'Sample outings — open the map for live listings.'
            )}
          </p>
        </div>
        <Link
          to={EXPLORE_MAP_PATH}
          className="landing-text-cta shrink-0 pt-0.5"
        >
          {HOME_LIVE_SECTION.viewAllLabel}
        </Link>
      </header>

      {loading ? (
        <div className="landing-live-rail-scroll mt-5 md:mt-5">
          <div className="landing-live-rail-track md:grid md:grid-cols-3 md:gap-4">
            {[0, 1, 2].map((key) => (
              <div
                key={key}
                className={`landing-live-rail-card h-52 animate-pulse rounded-2xl bg-neutral-100 md:h-60 ${
                  key >= 2 ? 'max-md:hidden' : ''
                }`}
              />
            ))}
          </div>
        </div>
      ) : (
        <div className="landing-live-rail-scroll mt-4 md:mt-5">
          <div className="landing-live-rail-track md:grid md:grid-cols-3 md:gap-4">
            {activities.slice(0, 6).map((activity, index) => (
              <div
                key={activity.id}
                className={`landing-live-rail-card ${index >= 2 ? 'max-md:hidden' : ''}`}
              >
                <ActivityCard activity={activity} />
              </div>
            ))}
          </div>
        </div>
      )}
    </LandingShell>
  </section>
);
