import { describe, expect, it } from 'vitest';
import {
  clearExploreComposeParams,
  formatComposeQuery,
  parseExploreCompose,
  setExploreComposeParam,
} from './compose';

describe('explore compose routing', () => {
  it('formats and parses menu + wizard routes (compose wire)', () => {
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
    expect(formatComposeQuery({ surface: 'menu', intent: 'add', target: 'place' })).toBe(
      'add:place'
    );
    expect(parseExploreCompose(new URLSearchParams('compose=add:place'))).toEqual({
      surface: 'menu',
      intent: 'add',
      target: 'place',
    });
    expect(parseExploreCompose(new URLSearchParams('compose=host:activity'))).toEqual({
      intent: 'host',
      kind: 'activity',
    });
  });

  it('rejects leftover organize/plan/find/contribute compose tokens', () => {
    expect(parseExploreCompose(new URLSearchParams('compose=organize:hiking'))).toBeNull();
    expect(parseExploreCompose(new URLSearchParams('compose=find:rideshare'))).toBeNull();
    expect(parseExploreCompose(new URLSearchParams('compose=plan:hiking:hosting'))).toBeNull();
    expect(parseExploreCompose(new URLSearchParams('compose=organize'))).toBeNull();
    expect(parseExploreCompose(new URLSearchParams('compose=contribute:place:hiking'))).toBeNull();
  });

  it('does not treat leftover request/contribute/addLocation params as compose', () => {
    expect(parseExploreCompose(new URLSearchParams('request=1'))).toBeNull();
    expect(parseExploreCompose(new URLSearchParams('contribute=shop'))).toBeNull();
    expect(parseExploreCompose(new URLSearchParams('addLocation=1'))).toBeNull();
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
});
