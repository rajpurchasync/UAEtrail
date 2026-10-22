import { describe, expect, it } from 'vitest';
import { mapTileLoadOptions } from './mapTileLoadOptions';

describe('mapTileLoadOptions', () => {
  it('keeps the explore overview to one light tile pass', () => {
    expect(mapTileLoadOptions(true)).toEqual({
      detectRetina: false,
      keepBuffer: 1,
      updateWhenIdle: true,
      deferLabels: true,
    });
  });

  it('leaves detail maps on the sharper tile settings', () => {
    expect(mapTileLoadOptions(false).detectRetina).toBe(true);
    expect(mapTileLoadOptions(false).deferLabels).toBe(false);
  });
});
