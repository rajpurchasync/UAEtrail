import type { WeatherForecastResponseDTO } from '@uaetrail/shared-types';

const OPEN_METEO_FORECAST = 'https://api.open-meteo.com/v1/forecast';
const OPEN_METEO_ARCHIVE = 'https://archive-api.open-meteo.com/v1/archive';

const roundCoord = (n: number, decimals: number): number => {
  const f = 10 ** decimals;
  return Math.round(n * f) / f;
};

/** True when `date` is today through +15 days (Open-Meteo `forecast_days=16`), Asia/Dubai calendar. */
export const isOpenMeteoForecastDateInRange = (date: string, todayIso: string): boolean => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;
  if (date < todayIso) return false;
  const start = new Date(`${todayIso}T12:00:00Z`);
  const target = new Date(`${date}T12:00:00Z`);
  const diffDays = Math.round((target.getTime() - start.getTime()) / 86_400_000);
  return diffDays >= 0 && diffDays <= 15;
};

/**
 * Browser → Open-Meteo (CORS). No UAE Trail API / Mongo — attribution in UI.
 */
export const fetchOpenMeteoClientForecast = async (input: {
  lat: number;
  lng: number;
  date: string;
}): Promise<WeatherForecastResponseDTO> => {
  const lat = roundCoord(input.lat, 4);
  const lng = roundCoord(input.lng, 4);
  const url = new URL(OPEN_METEO_FORECAST);
  url.searchParams.set('latitude', String(lat));
  url.searchParams.set('longitude', String(lng));
  url.searchParams.set('timezone', 'Asia/Dubai');
  url.searchParams.set(
    'daily',
    'weathercode,temperature_2m_max,temperature_2m_min,precipitation_probability_max'
  );
  url.searchParams.set('forecast_days', '16');

  const response = await fetch(url.toString(), { headers: { Accept: 'application/json' } });
  if (!response.ok) {
    throw new Error('weather_upstream_error');
  }

  const raw = (await response.json()) as Record<string, unknown>;
  const daily = raw.daily as Record<string, unknown> | undefined;
  const timeArr = daily?.time as string[] | undefined;
  if (!timeArr?.length) {
    throw new Error('weather_invalid_response');
  }

  const idx = timeArr.indexOf(input.date);
  if (idx < 0) {
    throw new Error('weather_date_out_of_range');
  }

  const codeArr = daily?.weathercode as number[] | undefined;
  const tMax = daily?.temperature_2m_max as number[] | undefined;
  const tMin = daily?.temperature_2m_min as number[] | undefined;
  const pProb = daily?.precipitation_probability_max as number[] | undefined;

  return {
    provider: 'open-meteo',
    latitude: lat,
    longitude: lng,
    date: input.date,
    daily: {
      weatherCode: codeArr?.[idx] ?? null,
      tempMaxC: tMax?.[idx] ?? null,
      tempMinC: tMin?.[idx] ?? null,
      precipProbabilityMax: pProb?.[idx] ?? null,
    },
    series: {
      time: timeArr,
      weathercode: codeArr ?? null,
      temperature_2m_max: tMax ?? null,
      temperature_2m_min: tMin ?? null,
      precipitation_probability_max: pProb ?? null,
    },
  };
};

const parseOpenMeteoDailyAt = (
  raw: Record<string, unknown>,
  date: string,
  lat: number,
  lng: number,
  precipFromProbability: boolean
): WeatherForecastResponseDTO => {
  const daily = raw.daily as Record<string, unknown> | undefined;
  const timeArr = daily?.time as string[] | undefined;
  if (!timeArr?.length) {
    throw new Error('weather_invalid_response');
  }
  const idx = timeArr.indexOf(date);
  if (idx < 0) {
    throw new Error('weather_date_out_of_range');
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
    date,
    daily: {
      weatherCode: codeArr?.[idx] ?? null,
      tempMaxC: tMax?.[idx] ?? null,
      tempMinC: tMin?.[idx] ?? null,
      precipProbabilityMax,
    },
    series: {
      time: timeArr,
      weathercode: codeArr ?? null,
      temperature_2m_max: tMax ?? null,
      temperature_2m_min: tMin ?? null,
      precipitation_probability_max: pProb ?? null,
    },
  };
};

/** Past outing days — archive API (browser, CORS). */
export const fetchOpenMeteoArchiveDay = async (input: {
  lat: number;
  lng: number;
  date: string;
}): Promise<WeatherForecastResponseDTO> => {
  const lat = roundCoord(input.lat, 4);
  const lng = roundCoord(input.lng, 4);
  const url = new URL(OPEN_METEO_ARCHIVE);
  url.searchParams.set('latitude', String(lat));
  url.searchParams.set('longitude', String(lng));
  url.searchParams.set('timezone', 'Asia/Dubai');
  url.searchParams.set('start_date', input.date);
  url.searchParams.set('end_date', input.date);
  url.searchParams.set('daily', 'weathercode,temperature_2m_max,temperature_2m_min,precipitation_sum');

  const response = await fetch(url.toString(), { headers: { Accept: 'application/json' } });
  if (!response.ok) {
    throw new Error('weather_upstream_error');
  }
  const raw = (await response.json()) as Record<string, unknown>;
  return parseOpenMeteoDailyAt(raw, input.date, lat, lng, false);
};

/**
 * Forecast (today → +15d) or archive (past) for one outing date.
 */
export const fetchOpenMeteoDaySnapshot = async (input: {
  lat: number;
  lng: number;
  date: string;
  todayIso: string;
}): Promise<WeatherForecastResponseDTO> => {
  if (input.date < input.todayIso) {
    return fetchOpenMeteoArchiveDay(input);
  }
  if (isOpenMeteoForecastDateInRange(input.date, input.todayIso)) {
    return fetchOpenMeteoClientForecast(input);
  }
  throw new Error('weather_date_out_of_range');
};
