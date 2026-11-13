import { useEffect, useState } from 'react';
import type { WeatherForecastResponseDTO } from '@uaetrail/shared-types';
import { formatDate } from '../../utils';
import { formatExploreCalendarDateShort } from '@uaetrail/shared-types';
import {
  formatTempRange,
  gccTodayIsoDate,
  openMeteoWeatherCodeLabel,
} from './weatherDisplayUtils';
import { fetchConsumerDayWeather } from './fetchConsumerDayWeather';
import { isOpenMeteoForecastDateInRange } from './openMeteoClientForecast';
import { AsyncLoadingState } from '../../components/ui/AsyncLoadingState';
import { LOADING_FORECAST } from '../../content/detailLoadingCopy';

type Props = {
  lat: number;
  lng: number;
  /** `YYYY-MM-DD` for the outing / place day. */
  date: string;
  /** Shown in attribution line — e.g. "near the meeting area". */
  contextLabel?: string;
  /** Detail sections use a single compact row (default). */
  variant?: 'compact' | 'default';
};

const rainLine = (daily: WeatherForecastResponseDTO['daily'] | undefined): string | null => {
  if (daily?.precipProbabilityMax == null || Number.isNaN(daily.precipProbabilityMax)) return null;
  if (daily.precipProbabilityMax <= 0) return null;
  if (daily.precipProbabilityMax >= 100) return 'Rain recorded';
  return `${Math.round(daily.precipProbabilityMax)}% rain`;
};

/**
 * Lazy Open-Meteo for one calendar day (forecast or archive) — browser only.
 */
export const ConsumerOpenMeteoWeatherBlock = ({
  lat,
  lng,
  date,
  contextLabel,
  variant = 'compact',
}: Props) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [snapshot, setSnapshot] = useState<WeatherForecastResponseDTO | null>(null);
  const [outOfRange, setOutOfRange] = useState(false);
  const [retryKey, setRetryKey] = useState(0);
  const today = gccTodayIsoDate();

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setOutOfRange(false);
    setSnapshot(null);

    const isFutureBeyondForecast =
      date > today && !isOpenMeteoForecastDateInRange(date, today);

    if (isFutureBeyondForecast) {
      setLoading(false);
      setOutOfRange(true);
      return () => {
        cancelled = true;
      };
    }

    void fetchConsumerDayWeather({ lat, lng, date })
      .then((data) => {
        if (!cancelled) setSnapshot(data);
      })
      .catch((err) => {
        if (cancelled) return;
        const code =
          err && typeof err === 'object' && 'code' in err
            ? String((err as { code?: string }).code)
            : err instanceof Error
              ? err.message
              : '';
        if (code === 'weather_date_out_of_range') {
          setOutOfRange(true);
          return;
        }
        setError('Forecast could not be loaded.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [lat, lng, date, today, retryKey]);

  const dateStamp = formatExploreCalendarDateShort(date) ?? formatDate(date);
  const attribution = (
    <p className={variant === 'compact' ? 'text-[10px] leading-snug text-neutral-500' : 'text-[11px] text-neutral-500'}>
      {contextLabel ? `${contextLabel} · ` : null}
      <span className="tabular-nums">{dateStamp}</span>
    </p>
  );

  const retryButton = (
    <button
      type="button"
      onClick={() => setRetryKey((n) => n + 1)}
      className="text-[12px] font-semibold text-emerald-800 underline-offset-2 hover:underline"
    >
      Try again
    </button>
  );

  if (loading) {
    return variant === 'compact' ? (
      <AsyncLoadingState variant="inline" label={LOADING_FORECAST} className="!py-1" />
    ) : (
      <AsyncLoadingState variant="section" label={LOADING_FORECAST} rows={2} className="!py-0" />
    );
  }

  if (outOfRange) {
    return (
      <div className="space-y-1">
        <p className={variant === 'compact' ? 'text-[12px] text-neutral-600' : 'text-sm text-neutral-600'}>
          Forecast for {dateStamp} is not available yet — check again closer to your outing.
        </p>
        {attribution}
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-1">
        <p className={variant === 'compact' ? 'text-[12px] text-neutral-600' : 'text-sm text-neutral-600'}>
          {error}
        </p>
        {retryButton}
        {attribution}
      </div>
    );
  }

  const daily = snapshot?.daily;
  const headline = daily ? openMeteoWeatherCodeLabel(daily.weatherCode) : null;
  const tempRange = daily ? formatTempRange(daily.tempMinC, daily.tempMaxC) : null;
  const rain = rainLine(daily ?? undefined);
  const isPast = date < today;

  if (!headline && !tempRange && !rain) {
    return (
      <div className="space-y-1">
        <p className={variant === 'compact' ? 'text-[12px] text-neutral-600' : 'text-sm text-neutral-600'}>
          No summary for {formatDate(date)}.
        </p>
        {attribution}
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div className="space-y-1">
        <div
          className="inline-flex max-w-full flex-wrap items-center gap-x-2 gap-y-0.5 rounded-lg border border-sky-200/85 bg-sky-50/95 px-2.5 py-1.5 text-[12px] leading-snug text-neutral-800 shadow-sm dark:border-sky-900/45 dark:bg-sky-950/30 dark:text-neutral-100"
          role="status"
        >
          {headline ? (
            <span className="font-semibold text-neutral-900 dark:text-neutral-50">{headline}</span>
          ) : null}
          {tempRange ? <span className="tabular-nums font-medium">{tempRange}</span> : null}
          {rain ? <span className="text-neutral-600 dark:text-neutral-300">{rain}</span> : null}
          {isPast ? (
            <span className="rounded-md bg-neutral-200/80 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400">
              Past
            </span>
          ) : null}
        </div>
        {attribution}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {headline ? (
        <p className="text-base font-semibold text-neutral-900 lg:text-[15px]">{headline}</p>
      ) : null}
      <div className="flex flex-wrap gap-x-3 gap-y-1 text-sm text-neutral-700 lg:text-[13px]">
        {tempRange ? <span className="font-medium tabular-nums">{tempRange}</span> : null}
        {rain ? <span>{rain}</span> : null}
      </div>
      {attribution}
    </div>
  );
};
