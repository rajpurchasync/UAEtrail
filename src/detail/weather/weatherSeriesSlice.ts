import type { WeatherDailySnapshotDTO, WeatherForecastResponseDTO } from '@uaetrail/shared-types';

export const dailySnapshotFromForecastResponse = (
  response: WeatherForecastResponseDTO,
  date: string
): WeatherDailySnapshotDTO | null => {
  if (response.date === date) return response.daily;
  const series = response.series;
  const time = series?.time;
  if (!time?.length) return null;
  const idx = time.indexOf(date);
  if (idx < 0) return null;
  return {
    weatherCode: series.weathercode?.[idx] ?? null,
    tempMaxC: series.temperature_2m_max?.[idx] ?? null,
    tempMinC: series.temperature_2m_min?.[idx] ?? null,
    precipProbabilityMax: series.precipitation_probability_max?.[idx] ?? null,
  };
};
