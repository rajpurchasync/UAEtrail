import type { WeatherForecastResponseDTO } from '@uaetrail/shared-types';
import { gccCalendarDate } from '@uaetrail/shared-types';
import { ApiError } from '../lib/api-error.js';
import { findWeatherCacheById, upsertWeatherCache, weatherCacheKey } from '../lib/weather-cache-store.js';
import { reversePlaceLocality } from '../lib/place-search.js';
import { formatWeatherForecastLocationName } from '../lib/weather-location-label.js';

const WEATHER_TTL_MS = 60 * 60 * 1000;

const OPEN_METEO_FORECAST_BASE = 'https://api.open-meteo.com/v1/forecast';
const OPEN_METEO_ARCHIVE_BASE = 'https://archive-api.open-meteo.com/v1/archive';

export type WeatherQuery = {
  lat: number;
  lng: number;
  /** `YYYY-MM-DD` in Asia/Dubai (caller validates). */
  date: string;
};

const roundCoord = (n: number, decimals: number): number => {
  const f = 10 ** decimals;
  return Math.round(n * f) / f;
};

const parseDailyAt = (
  raw: Record<string, unknown>,
  input: WeatherQuery,
  lat: number,
  lng: number,
  precipFromProbability: boolean
): WeatherForecastResponseDTO => {
  const daily = raw.daily as Record<string, unknown> | undefined;
  const timeArr = daily?.time as string[] | undefined;
  if (!timeArr || !Array.isArray(timeArr)) {
    throw new ApiError(502, 'weather_invalid_response', 'Weather response was incomplete.');
  }

  const idx = timeArr.indexOf(input.date);
  if (idx < 0) {
    throw new ApiError(
      400,
      'weather_date_out_of_range',
      'Date must be within the supported forecast window and use YYYY-MM-DD.'
    );
  }

  const codeArr = daily?.weathercode as number[] | undefined;
  const tMax = daily?.temperature_2m_max as number[] | undefined;
  const tMin = daily?.temperature_2m_min as number[] | undefined;
  const pProb = precipFromProbability
    ? (daily?.precipitation_probability_max as number[] | undefined)
    : undefined;

  let precipProbabilityMax: number | null = pProb?.[idx] ?? null;
  if (!precipFromProbability) {
    const precipSum = (daily?.precipitation_sum as number[] | undefined)?.[idx];
    precipProbabilityMax =
      typeof precipSum === 'number' && precipSum > 0.1 ? 100 : precipSum === 0 ? 0 : null;
  }

  return {
    provider: 'open-meteo',
    latitude: lat,
    longitude: lng,
    date: input.date,
    daily: {
      weatherCode: codeArr?.[idx] ?? null,
      tempMaxC: tMax?.[idx] ?? null,
      tempMinC: tMin?.[idx] ?? null,
      precipProbabilityMax,
    },
    series: precipFromProbability
      ? {
          time: timeArr,
          weathercode: codeArr ?? null,
          temperature_2m_max: tMax ?? null,
          temperature_2m_min: tMin ?? null,
          precipitation_probability_max: pProb ?? null,
        }
      : {
          time: timeArr,
          weathercode: codeArr ?? null,
          temperature_2m_max: tMax ?? null,
          temperature_2m_min: tMin ?? null,
          precipitation_probability_max: null,
        },
  };
};

const fetchOpenMeteoJson = async (url: URL): Promise<Record<string, unknown>> => {
  let response: Response;
  try {
    response = await fetch(url, { headers: { Accept: 'application/json' } });
  } catch {
    throw new ApiError(502, 'weather_upstream_unavailable', 'Weather service temporarily unavailable.');
  }
  if (!response.ok) {
    throw new ApiError(502, 'weather_upstream_error', 'Weather service returned an error.');
  }
  return (await response.json()) as Record<string, unknown>;
};

const loadForecastWindow = async (
  input: WeatherQuery,
  lat: number,
  lng: number
): Promise<WeatherForecastResponseDTO> => {
  const url = new URL(OPEN_METEO_FORECAST_BASE);
  url.searchParams.set('latitude', String(lat));
  url.searchParams.set('longitude', String(lng));
  url.searchParams.set('timezone', 'Asia/Dubai');
  url.searchParams.set(
    'daily',
    'weathercode,temperature_2m_max,temperature_2m_min,precipitation_probability_max'
  );
  url.searchParams.set('forecast_days', '16');
  const raw = await fetchOpenMeteoJson(url);
  return parseDailyAt(raw, input, lat, lng, true);
};

const loadArchiveDay = async (
  input: WeatherQuery,
  lat: number,
  lng: number
): Promise<WeatherForecastResponseDTO> => {
  const url = new URL(OPEN_METEO_ARCHIVE_BASE);
  url.searchParams.set('latitude', String(lat));
  url.searchParams.set('longitude', String(lng));
  url.searchParams.set('timezone', 'Asia/Dubai');
  url.searchParams.set('start_date', input.date);
  url.searchParams.set('end_date', input.date);
  url.searchParams.set('daily', 'weathercode,temperature_2m_max,temperature_2m_min,precipitation_sum');
  const raw = await fetchOpenMeteoJson(url);
  return parseDailyAt(raw, input, lat, lng, false);
};

/**
 * Public weather read — Mongo cache first (60 min), then Open-Meteo (forecast or archive).
 * Keys: `_id` = `lat|lng|date` with 4-decimal rounding (plan §13.6).
 */
export const loadPublicWeatherForecast = async (input: WeatherQuery): Promise<WeatherForecastResponseDTO> => {
  const lat = roundCoord(input.lat, 4);
  const lng = roundCoord(input.lng, 4);
  const id = weatherCacheKey({ lat, lng, date: input.date });

  const cached = await findWeatherCacheById(id);
  if (cached && cached.expiresAt > new Date()) {
    const data = cached.data as WeatherForecastResponseDTO;
    if (data.locationName?.trim()) return data;
    const locality = await reversePlaceLocality(lat, lng).catch(() => null);
    const locationName = formatWeatherForecastLocationName(locality);
    if (locationName) {
      const hydrated = { ...data, locationName };
      await upsertWeatherCache({ id, data: hydrated, expiresAt: cached.expiresAt });
      return hydrated;
    }
    return data;
  }

  const today = gccCalendarDate(null, 'AE');
  const [payload, locality] = await Promise.all([
    input.date < today
      ? loadArchiveDay(input, lat, lng)
      : loadForecastWindow(input, lat, lng),
    reversePlaceLocality(lat, lng).catch(() => null),
  ]);
  const locationName = formatWeatherForecastLocationName(locality);
  const withLocation =
    locationName != null ? ({ ...payload, locationName } satisfies WeatherForecastResponseDTO) : payload;

  const expiresAt = new Date(Date.now() + WEATHER_TTL_MS);
  await upsertWeatherCache({ id, data: withLocation, expiresAt });
  return withLocation;
};
