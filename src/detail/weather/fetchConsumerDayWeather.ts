import type { WeatherForecastResponseDTO } from '@uaetrail/shared-types';
import { fetchPublicWeatherForecast } from '../../hooks/publicWeatherClientApi';
import { fetchOpenMeteoDaySnapshot } from './openMeteoClientForecast';
import { gccTodayIsoDate } from './weatherDisplayUtils';

/**
 * Detail weather — UAE Trail API (cached) first; direct Open-Meteo only as fallback
 * when the API is unreachable (e.g. offline dev without API).
 */
export const fetchConsumerDayWeather = async (input: {
  lat: number;
  lng: number;
  date: string;
}): Promise<WeatherForecastResponseDTO> => {
  try {
    const response = await fetchPublicWeatherForecast(input);
    return response.data;
  } catch (err) {
    const code =
      err && typeof err === 'object' && 'code' in err
        ? String((err as { code?: string }).code)
        : err instanceof Error
          ? err.message
          : '';
    if (code === 'weather_date_out_of_range') {
      const out = new Error('weather_date_out_of_range') as Error & { cause?: unknown };
      out.cause = err;
      throw out;
    }
    return fetchOpenMeteoDaySnapshot({
      ...input,
      todayIso: gccTodayIsoDate(),
    });
  }
};
