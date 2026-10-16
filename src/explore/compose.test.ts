import { describe, expect, it } from 'vitest';
import {
  clearExploreComposeParams,
  formatComposeQuery,
  migrateLegacyExploreComposeParams,
  parseExploreCompose,
  setExploreComposeParam,
} from './compose';

describe('explore compose routing', () => {
  it('formats and parses menu + wizard routes (v3)', () => {
    expect(formatComposeQuery({ surface: 'menu' })).toBe('1');
    expect(formatComposeQuery({ surface: 'menu', intent: 'host' })).toBe('host');
    expect(formatComposeQuery({ intent: 'host', kind: 'hiking' })).toBe('host:hiking');
    expect(formatComposeQuery({ intent: 'seek', mode: 'fixed', kind: 'rideshare' })).toBe(
      'seek:fixed:rideshare'
    );
    expect(formatComposeQuery({ intent: 'seek', mode: 'flexible' })).toBe('seek:flexible');
    expect(formatComposeQuery({ intent: 'add', target: 'place', kind: 'hiking' })).toBe(
      'add:place:hiking'
    );
    expect(formatComposeQuery({ intent: 'add', target: 'facility', kind: 'toilet' })).toBe(
      'add:facility:toilet'
    );

    expect(parseExploreCompose(new URLSearchParams('compose=host:hiking'))).toEqual({
      intent: 'host',
      kind: 'hiking',
    });
    expect(parseExploreCompose(new URLSearchParams('compose=seek:fixed:camping'))).toEqual({
      intent: 'seek',
      mode: 'fixed',
      kind: 'camping',
    });
    expect(parseExploreCompose(new URLSearchParams('compose=add:place:hiking'))).toEqual({
      intent: 'add',
      target: 'place',
      kind: 'hiking',
    });
    expect(parseExploreCompose(new URLSearchParams('compose=add:facility:toilet'))).toEqual({
      intent: 'add',
      target: 'facility',
      kind: 'toilet',
    });

    expect(parseExploreCompose(new URLSearchParams('compose=1'))).toEqual({ surface: 'menu' });
    expect(parseExploreCompose(new URLSearchParams('compose=host'))).toEqual({
      surface: 'menu',
      intent: 'host',
    });
    expect(parseExploreCompose(new URLSearchParams('compose=host:activity'))).toEqual({
      intent: 'host',
      kind: 'activity',
    });
  });

  it('canonicalizes legacy compose wire on parse', () => {
    expect(parseExploreCompose(new URLSearchParams('compose=organize:hiking'))).toEqual({
      intent: 'host',
      kind: 'hiking',
    });
    expect(parseExploreCompose(new URLSearchParams('compose=find:rideshare'))).toEqual({
      intent: 'seek',
      mode: 'fixed',
      kind: 'rideshare',
    });
    expect(parseExploreCompose(new URLSearchParams('compose=plan:hiking:hosting'))).toEqual({
      intent: 'host',
      kind: 'hiking',
    });
    expect(parseExploreCompose(new URLSearchParams('compose=organize'))).toEqual({
      surface: 'menu',
      intent: 'host',
    });
  });

  it('reads legacy request/contribute/addLocation params', () => {
    expect(parseExploreCompose(new URLSearchParams('request=1'))).toEqual({
      surface: 'menu',
      intent: 'seek',
    });
    expect(parseExploreCompose(new URLSearchParams('contribute=shop'))).toEqual({
      intent: 'add',
      target: 'facility',
      kind: 'outdoor_shop',
    });
    expect(parseExploreCompose(new URLSearchParams('addLocation=1'))).toEqual({
      surface: 'menu',
      intent: 'add',
    });
  });

  it('sets and clears compose params', () => {
    const params = new URLSearchParams('request=1&contribute=shop&addLocation=1');
    setExploreComposeParam(params, { intent: 'host', kind: 'event' });
    expect(params.get('compose')).toBe('host:event');
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
    expect(migrated!.get('compose')).toBe('seek');
    expect(migrated!.has('request')).toBe(false);
    expect(migrated!.get('q')).toBe('hike');
  });
});
