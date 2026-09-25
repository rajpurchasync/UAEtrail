import { describe, expect, it } from 'vitest';
import {
  clearExploreComposeParams,
  formatComposeQuery,
  migrateLegacyExploreComposeParams,
  parseExploreCompose,
  setExploreComposeParam,
} from './compose';

describe('explore compose routing', () => {
  it('formats and parses menu + wizard routes', () => {
    expect(formatComposeQuery({ surface: 'menu' })).toBe('1');
    expect(formatComposeQuery({ surface: 'menu', intent: 'organize' })).toBe('organize');
    expect(formatComposeQuery({ intent: 'organize', kind: 'hiking' })).toBe('organize:hiking');
    expect(formatComposeQuery({ intent: 'find', kind: 'carpool' })).toBe('find:carpool');
    expect(formatComposeQuery({ intent: 'find' })).toBe('find');
    expect(formatComposeQuery({ intent: 'add', kind: 'shop' })).toBe('add:shop');

    expect(parseExploreCompose(new URLSearchParams('compose=1'))).toEqual({ surface: 'menu' });
    expect(parseExploreCompose(new URLSearchParams('compose=organize'))).toEqual({
      surface: 'menu',
      intent: 'organize',
    });
    expect(parseExploreCompose(new URLSearchParams('compose=organize:activity'))).toEqual({
      intent: 'organize',
      kind: 'activity',
    });
  });

  it('reads legacy request/contribute/addLocation params', () => {
    expect(parseExploreCompose(new URLSearchParams('request=1'))).toEqual({ intent: 'find' });
    expect(parseExploreCompose(new URLSearchParams('contribute=shop'))).toEqual({
      intent: 'add',
      kind: 'shop',
    });
    expect(parseExploreCompose(new URLSearchParams('addLocation=1'))).toEqual({
      surface: 'menu',
      intent: 'add',
    });
  });

  it('sets and clears compose params', () => {
    const params = new URLSearchParams('request=1&contribute=shop&addLocation=1');
    setExploreComposeParam(params, { intent: 'organize', kind: 'event' });
    expect(params.get('compose')).toBe('organize:event');
    expect(params.has('request')).toBe(false);
    expect(params.has('contribute')).toBe(false);
    expect(params.has('addLocation')).toBe(false);

    clearExploreComposeParams(params);
    expect(params.toString()).toBe('');
  });

  it('migrateLegacyExploreComposeParams canonicalizes legacy keys', () => {
    expect(migrateLegacyExploreComposeParams(new URLSearchParams('filter=all'))).toBeNull();

    const migrated = migrateLegacyExploreComposeParams(new URLSearchParams('request=1&q=hike'));
    expect(migrated).not.toBeNull();
    expect(migrated!.get('compose')).toBe('find');
    expect(migrated!.has('request')).toBe(false);
    expect(migrated!.get('q')).toBe('hike');
  });
});
