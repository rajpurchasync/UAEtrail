import { describe, expect, it } from 'vitest';
import {
  filterMigratedPlaceholderGear,
  migrateInstructionAndPlanLinesToGear,
} from './activity-detail-revamp-migrate.js';

describe('filterMigratedPlaceholderGear', () => {
  it('removes gear rows that only mirror legacy requirements migration', () => {
    const requirements = ['No pets', 'Packing item: water ×1|must'];
    const migrated = migrateInstructionAndPlanLinesToGear(requirements);
    const withRealItem = [
      ...migrated,
      { key: 'headlamp', label: 'Headlamp', level: 'mandatory' as const, spec: null },
    ];
    const filtered = filterMigratedPlaceholderGear(withRealItem, requirements);
    expect(filtered).toEqual([
      { key: 'headlamp', label: 'Headlamp', level: 'mandatory', spec: null },
    ]);
  });

  it('keeps host-defined gear when requirements are empty', () => {
    const gear = [{ key: 'boots', label: 'Hiking boots', level: 'recommended' as const, spec: null }];
    expect(filterMigratedPlaceholderGear(gear, [])).toEqual(gear);
  });
});
