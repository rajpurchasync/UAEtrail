import { Link } from 'react-router-dom';
import { ArrowRight, Calendar, MapPin, Users } from 'lucide-react';
import { resolveActivityTypeCoverImage } from '../../config/activityCoverImages';
import type { HomeLandingActivity } from '../../content/homeLanding';
import { HOME_LIVE_SECTION } from '../../content/homeLanding';
import { EXPLORE_MAP_PATH } from '../../config/platform';
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
        <p className="text-[15px] font-semibold leading-snug text-neutral-900">{activity.title}</p>
        <p className="mt-1.5 flex items-center gap-1.5 text-[12px] text-neutral-500">
          <Calendar className="h-3.5 w-3.5 shrink-0" aria-hidden />
          {activity.date}
        </p>
        <div className="mt-3 flex items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1 text-[12px] font-medium text-emerald-800">
            <Users className="h-3.5 w-3.5" aria-hidden />
            {activity.slotsAvailable > 0
              ? `${activity.slotsAvailable} spot${activity.slotsAvailable === 1 ? '' : 's'} left`
              : 'Waitlist'}
          </span>
          <ArrowRight className="h-4 w-4 text-neutral-300" aria-hidden />
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
  <section className="home-landing-sheet bg-white pb-8 pt-6 md:py-14" aria-label="Activities on the map">
    <LandingShell>
      <header className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
          <h2 className="landing-section-title">{HOME_LIVE_SECTION.title}</h2>
          {fromLiveApi && !loading ? (
            <span className="landing-live-badge shrink-0" aria-label="Live listings">
              Live
            </span>
          ) : null}
        </div>
        <p className="landing-section-lead">
          {fromLiveApi
            ? HOME_LIVE_SECTION.subtitle
            : 'Sample outings — open the map for live listings.'}
        </p>
      </header>

      {loading ? (
        <div className="mt-5 space-y-3 md:grid md:grid-cols-3 md:gap-4 md:space-y-0">
          {[0, 1, 2].map((key) => (
            <div key={key} className="h-52 animate-pulse rounded-2xl bg-neutral-100 md:h-60" />
          ))}
        </div>
      ) : (
        <div className="mt-5 space-y-3 md:grid md:grid-cols-3 md:gap-4 md:space-y-0">
          {activities.slice(0, 6).map((activity) => (
            <ActivityCard key={activity.id} activity={activity} />
          ))}
        </div>
      )}

      <Link to={EXPLORE_MAP_PATH} className="landing-text-cta mt-5 inline-flex items-center gap-1">
        See everything on the map
        <ArrowRight className="h-4 w-4" aria-hidden />
      </Link>
    </LandingShell>
  </section>
);
