import { useEffect, useState } from 'react';
import { formatExploreCalendarDateShort } from '@uaetrail/shared-types';
import { gccTodayIsoDate } from './weatherDisplayUtils';
import {
  fetchConsumerWeatherForDates,
  type ConsumerWeatherDayRow,
} from './fetchConsumerWeatherForDates';
import { AsyncLoadingState } from '../../components/ui/AsyncLoadingState';
import { LOADING_FORECAST } from '../../content/detailLoadingCopy';
import { ConsumerWeatherDayChip } from './ConsumerWeatherDayChip';

type Props = {
  lat: number;
  lng: number;
  dates: string[];
  /** Fallback when the weather API has no reverse-geocoded pin label. */
  forecastForName?: string;
  variant?: 'compact' | 'default';
};

export const ConsumerWeatherMultiDayBlock = ({
  lat,
  lng,
  dates,
  forecastForName,
  variant = 'compact',
}: Props) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<ConsumerWeatherDayRow[]>([]);
  const [resolvedLocationName, setResolvedLocationName] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);
  const today = gccTodayIsoDate();

  useEffect(() => {
    let cancelled = false;
    if (dates.length === 0) {
      setRows([]);
      setLoading(false);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    setResolvedLocationName(null);
    void fetchConsumerWeatherForDates({ lat, lng, dates })
      .then((data) => {
        if (!cancelled) {
          setRows(data.rows);
          setResolvedLocationName(data.locationName);
        }
      })
      .catch(() => {
        if (!cancelled) setError('Forecast could not be loaded.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [lat, lng, dates, retryKey]);

  if (dates.length === 0) {
    return null;
  }

  if (loading) {
    return variant === 'compact' ? (
      <AsyncLoadingState variant="inline" label={LOADING_FORECAST} className="!py-1" />
    ) : (
      <AsyncLoadingState variant="section" label={LOADING_FORECAST} rows={3} className="!py-0" />
    );
  }

  if (error) {
    return (
      <div className="space-y-1">
        <p className="text-[12px] text-neutral-600 dark:text-neutral-400">{error}</p>
        <button
          type="button"
          onClick={() => setRetryKey((n) => n + 1)}
          className="text-[12px] font-semibold text-emerald-800 underline-offset-2 hover:underline dark:text-emerald-400"
        >
          Try again
        </button>
      </div>
    );
  }

  const hasAnyDaily = rows.some((r) => r.daily);
  if (!hasAnyDaily && rows.every((r) => r.unavailable)) {
    return (
      <p className="text-[12px] text-neutral-600 dark:text-neutral-400">
        Forecast is not available yet for these dates — check again closer to your outing.
      </p>
    );
  }

  const headlineName = resolvedLocationName?.trim() || forecastForName?.trim() || null;

  return (
    <div className="min-w-0 space-y-2">
      {headlineName ? (
        <p className="truncate text-[10px] font-semibold leading-snug text-neutral-700 dark:text-neutral-200">
          Forecast for{' '}
          <span className="font-bold text-neutral-900 dark:text-neutral-50">{headlineName}</span>
        </p>
      ) : null}
      <ul
        className="-mx-0.5 flex list-none gap-1.5 overflow-x-auto overscroll-x-contain scroll-touch pb-0.5 pt-0.5 m-0 p-0"
        aria-label="Daily forecast"
      >
        {rows.map((row) => (
          <ConsumerWeatherDayChip
            key={row.date}
            date={row.date}
            daily={row.daily}
            unavailable={row.unavailable}
            isToday={row.date === today}
          />
        ))}
      </ul>
      {rows.length > 1 ? (
        <p className="sr-only">
          {rows
            .map((row) => {
              const label = formatExploreCalendarDateShort(row.date) ?? row.date;
              if (!row.daily) return `${label}: unavailable`;
              const max = row.daily.tempMaxC != null ? `${Math.round(row.daily.tempMaxC)}°C` : '';
              return `${label}: ${max}`;
            })
            .join('; ')}
        </p>
      ) : null}
    </div>
  );
};
