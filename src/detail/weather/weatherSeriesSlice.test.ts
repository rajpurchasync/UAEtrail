import { describe, expect, it } from 'vitest';
import type { WeatherForecastResponseDTO } from '@uaetrail/shared-types';
import { dailySnapshotFromForecastResponse } from './weatherSeriesSlice';

describe('dailySnapshotFromForecastResponse', () => {
  it('reads matching date from series', () => {
    const response: WeatherForecastResponseDTO = {
      provider: 'open-meteo',
      latitude: 25,
      longitude: 55,
      date: '2026-11-09',
      daily: { weatherCode: 0, tempMaxC: 30, tempMinC: 22, precipProbabilityMax: 0 },
      series: {
        time: ['2026-11-09', '2026-11-10'],
        weathercode: [0, 3],
        temperature_2m_max: [30, 28],
        temperature_2m_min: [22, 20],
        precipitation_probability_max: [0, 10],
      },
    };
    const day2 = dailySnapshotFromForecastResponse(response, '2026-11-10');
    expect(day2?.weatherCode).toBe(3);
    expect(day2?.tempMaxC).toBe(28);
  });
});
