import type { WeatherDailySnapshotDTO } from '@uaetrail/shared-types';
import { fetchConsumerDayWeather } from './fetchConsumerDayWeather';
import { isOpenMeteoForecastDateInRange } from './openMeteoClientForecast';
import { dailySnapshotFromForecastResponse } from './weatherSeriesSlice';
import { gccTodayIsoDate } from './weatherDisplayUtils';

export type ConsumerWeatherDayRow = {
  date: string;
  daily: WeatherDailySnapshotDTO | null;
  /** Forecast window does not cover this date yet. */
  unavailable?: boolean;
};

export type ConsumerWeatherDatesResult = {
  rows: ConsumerWeatherDayRow[];
  /** Reverse-geocoded pin label from the weather API (when available). */
  locationName: string | null;
};

/**
 * Loads one row per date — one forecast-window fetch when possible, then per-day for gaps (archive / edge dates).
 */
export const fetchConsumerWeatherForDates = async (input: {
  lat: number;
  lng: number;
  dates: string[];
}): Promise<ConsumerWeatherDatesResult> => {
  const unique = [...new Set(input.dates.filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d)))].sort();
  if (unique.length === 0) return { rows: [], locationName: null };

  const today = gccTodayIsoDate();
  const byDate = new Map<string, ConsumerWeatherDayRow>();
  let locationName: string | null = null;

  for (const date of unique) {
    if (date > today && !isOpenMeteoForecastDateInRange(date, today)) {
      byDate.set(date, { date, daily: null, unavailable: true });
    }
  }

  const needsFetch = unique.filter((d) => !byDate.has(d));
  const needsForecastSeries = needsFetch.some((d) => d >= today);

  if (needsForecastSeries) {
    try {
      const anchor = needsFetch.find((d) => d >= today) ?? today;
      const response = await fetchConsumerDayWeather({ lat: input.lat, lng: input.lng, date: anchor });
      locationName = response.locationName?.trim() || locationName;
      for (const date of needsFetch) {
        if (date < today) continue;
        const daily = dailySnapshotFromForecastResponse(response, date);
        if (daily) byDate.set(date, { date, daily });
      }
    } catch {
      /* per-day fallback below */
    }
  }

  const stillMissing = needsFetch.filter((d) => !byDate.has(d));
  await Promise.all(
    stillMissing.map(async (date) => {
      try {
        const response = await fetchConsumerDayWeather({ lat: input.lat, lng: input.lng, date });
        locationName = response.locationName?.trim() || locationName;
        byDate.set(date, { date, daily: response.daily });
      } catch {
        byDate.set(date, { date, daily: null, unavailable: date > today });
      }
    })
  );

  return {
    rows: unique.map((date) => byDate.get(date) ?? { date, daily: null }),
    locationName,
  };
};
