import type { WeatherForecastResponse } from '@uaetrail/shared-types';
import { apiRequest } from '../client';

/** Cached daily weather for activity/place detail (server uses `weather_cache`). */
export const weatherApi = {
  getWeatherForecast: (params: { lat: number; lng: number; date: string }) =>
    apiRequest<WeatherForecastResponse>(
      `/weather?lat=${encodeURIComponent(String(params.lat))}&lng=${encodeURIComponent(String(params.lng))}&date=${encodeURIComponent(params.date)}`
    ),
} as const;
