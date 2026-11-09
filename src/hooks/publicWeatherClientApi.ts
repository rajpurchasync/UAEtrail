import type { WeatherForecastResponse } from '@uaetrail/shared-types';
import { weatherApi } from '../api/domains/weather';

/** Public cached forecast for detail pages (`GET /weather`). */
export const fetchPublicWeatherForecast = (params: {
  lat: number;
  lng: number;
  date: string;
}): Promise<WeatherForecastResponse> => weatherApi.getWeatherForecast(params);
