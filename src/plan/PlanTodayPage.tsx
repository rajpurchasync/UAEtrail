import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ConsumerShell } from '../components/mobile/ConsumerShell';
import { PageMeta } from '../components/seo/PageMeta';
import { PLAN_PATH, PLAN_TODAY_PATH, activityDetailPath, messagesGroupChatPath } from '../config/routingCatalog';
import { fetchJoinedUpcomingPlanData } from '../hooks/planUpcomingApi';
import { fetchPublicActivityDetail } from '../hooks/publicActivityClientApi';
import { getActivePlatformAlerts } from '../hooks/publicPlatformAlertsClientApi';
import { fetchPublicWeatherForecast } from '../hooks/publicWeatherClientApi';
import { DirectionsControl } from '../components/ui';
import { LazyMeetingPointMap } from '../detail/shared/LazyMeetingPointMap';
import { useAuth } from '../context/AuthContext';
import { precacheJoinedTrip, registerJoinedTripServiceWorker } from '../offline/joinedTripOffline';
import { ConsumerDetailPlatformAlertBanner } from '../detail/ConsumerDetailPlatformAlertBanner';
import type { ActivityDetailDTO, MyActivityDTO, PublicActiveAlertDTO, WeatherForecastResponseDTO } from '@uaetrail/shared-types';
import { gccCalendarDate, hasPackingList } from '@uaetrail/shared-types';

export const PlanTodayPage = () => {
  const { user } = useAuth();
  const [activity, setActivity] = useState<MyActivityDTO | null>(null);
  const [detail, setDetail] = useState<ActivityDetailDTO | null>(null);
  const [alerts, setAlerts] = useState<PublicActiveAlertDTO[]>([]);
  const [weather, setWeather] = useState<WeatherForecastResponseDTO | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const { activities } = await fetchJoinedUpcomingPlanData();
        const gccToday = gccCalendarDate(null, 'AE');
        const onCalendarDay = activities.filter((row) => gccCalendarDate(row.date, 'AE') === gccToday);
        const upcoming =
          [...onCalendarDay].sort(
            (a, b) => gccCalendarDate(a.date, 'AE').localeCompare(gccCalendarDate(b.date, 'AE')) || (a.time ?? '').localeCompare(b.time ?? '')
          )[0] ?? null;
        if (cancelled) return;
        setActivity(upcoming);
        if (!upcoming) return;
        const payload = await fetchPublicActivityDetail(upcoming.id);
        if (cancelled) return;
        setDetail(payload.activity);
        if (user) {
          void registerJoinedTripServiceWorker().then(() => precacheJoinedTrip(upcoming.id));
        }
        const lat = payload.activity.displayLatitude ?? payload.activity.locationLatitude;
        const lng = payload.activity.displayLongitude ?? payload.activity.locationLongitude;
        if (typeof lat === 'number' && typeof lng === 'number') {
          const banners = await getActivePlatformAlerts({ lat, lng, radiusKm: 80 });
          if (!cancelled) setAlerts(banners.data ?? []);
          if (payload.activity.date) {
            try {
              const forecast = await fetchPublicWeatherForecast({
                lat,
                lng,
                date: gccCalendarDate(payload.activity.date, 'AE'),
              });
              if (!cancelled) setWeather(forecast.data);
            } catch {
              if (!cancelled) setWeather(null);
            }
          }
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Could not load today.');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const gear = useMemo(() => detail?.gear ?? [], [detail]);
  const packing = Boolean(detail && hasPackingList(detail.requirements));

  return (
    <ConsumerShell layout="stack" showJourney={false} back={{ fallbackTo: PLAN_PATH, label: 'My Plans' }}>
      <PageMeta title="Today" path={PLAN_TODAY_PATH} />
      <div className="space-y-4 px-4 pb-10 pt-3" dir="inherit">
        <h1 className="text-xl font-bold">Today</h1>
        {error ? <p className="text-sm text-red-700">{error}</p> : null}
        {!activity ? (
          <p className="text-sm text-neutral-600">Nothing on the calendar today in the UAE. Check My Plans for what is next.</p>
        ) : (
          <>
            <ConsumerDetailPlatformAlertBanner alerts={alerts} label="Safety" />
            <section className="rounded-2xl border border-neutral-100 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
              <p className="text-xs font-bold uppercase tracking-wide text-neutral-500">Today</p>
              <Link to={activityDetailPath(activity.id)} className="mt-1 block text-lg font-bold text-emerald-900">
                {activity.title}
              </Link>
              <p className="text-sm text-neutral-600">
                {activity.date} {activity.time}
              </p>
              <p className="mt-2 text-sm text-neutral-800">
                Meeting: {activity.meetingPoint || activity.locationName || 'Area confirmed after you join'}
              </p>
              {activity.displayLatitude != null && activity.displayLongitude != null ? (
                <div className="mt-2 space-y-2">
                  <LazyMeetingPointMap
                    lat={activity.displayLatitude}
                    lng={activity.displayLongitude}
                    label={activity.meetingPoint || activity.locationName}
                    hideExternalLink
                  />
                  <DirectionsControl
                    lat={activity.displayLatitude}
                    lng={activity.displayLongitude}
                    variant="button"
                    label="Directions"
                  />
                </div>
              ) : null}
              {activity.hostName ? (
                <p className="mt-2 text-sm">Host: {activity.hostName}</p>
              ) : null}
              {activity.groupChatId ? (
                <Link
                  to={messagesGroupChatPath(activity.groupChatId, activity.id)}
                  className="mt-2 inline-block text-sm font-semibold text-emerald-800"
                >
                  Open group chat
                </Link>
              ) : null}
            </section>
            {weather?.daily ? (
              <section className="rounded-2xl border border-neutral-100 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
                <h2 className="text-sm font-bold">Weather</h2>
                <p className="mt-1 text-sm text-neutral-800">
                  {weather.daily.tempMinC != null && weather.daily.tempMaxC != null
                    ? `${Math.round(weather.daily.tempMinC)}–${Math.round(weather.daily.tempMaxC)}°C`
                    : 'Forecast available'}
                  {weather.daily.precipProbabilityMax != null
                    ? ` · ${Math.round(weather.daily.precipProbabilityMax)}% rain`
                    : ''}
                </p>
              </section>
            ) : null}
            {gear.length > 0 || packing ? (
              <section className="rounded-2xl border border-neutral-100 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
                <h2 className="text-sm font-bold">Gear</h2>
                <ul className="mt-2 list-disc ps-5 text-sm text-neutral-800">
                  {gear.map((item) => (
                    <li key={item.key}>{item.label}</li>
                  ))}
                </ul>
              </section>
            ) : null}
          </>
        )}
      </div>
    </ConsumerShell>
  );
};
