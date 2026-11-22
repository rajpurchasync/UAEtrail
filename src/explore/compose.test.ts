import { describe, expect, it } from 'vitest';
import {
  intentFixedCompose,
  intentOpenCompose,
  clearExploreComposeParams,
  formatComposeQuery,
  isIntentFixedWizard,
  isIntentOpenWizard,
  isComposeWizardRoute,
  parseExploreCompose,
  setExploreComposeParam,
} from './compose';

describe('explore compose routing', () => {
  it('formats and parses menu + wizard routes (compose wire)', () => {
    expect(formatComposeQuery({ surface: 'menu' })).toBe('1');
    expect(formatComposeQuery({ surface: 'menu', composeKind: 'activity' })).toBe('activity');
    expect(formatComposeQuery({ composeKind: 'activity', kind: 'hiking' })).toBe('activity:hiking');
    expect(formatComposeQuery({ composeKind: 'intent', mode: 'fixed', kind: 'rideshare' })).toBe(
      'intent:fixed:rideshare'
    );
    expect(formatComposeQuery({ composeKind: 'intent', mode: 'open' })).toBe('intent:open');
    expect(formatComposeQuery({ composeKind: 'place', target: 'place', kind: 'hiking' })).toBe(
      'place:hiking'
    );
    expect(formatComposeQuery({ composeKind: 'place', target: 'facility', kind: 'toilet' })).toBe(
      'place:facility:toilet'
    );

    expect(parseExploreCompose(new URLSearchParams('compose=activity:hiking'))).toEqual({
      composeKind: 'activity',
      kind: 'hiking',
    });
    expect(parseExploreCompose(new URLSearchParams('compose=intent:fixed:camping'))).toEqual({
      composeKind: 'intent',
      mode: 'fixed',
      kind: 'camping',
    });
    expect(parseExploreCompose(new URLSearchParams('compose=place:hiking'))).toEqual({
      composeKind: 'place',
      target: 'place',
      kind: 'hiking',
    });
    expect(parseExploreCompose(new URLSearchParams('compose=place:facility:toilet'))).toEqual({
      composeKind: 'place',
      target: 'facility',
      kind: 'toilet',
    });

    expect(parseExploreCompose(new URLSearchParams('compose=1'))).toEqual({ surface: 'menu' });
    expect(parseExploreCompose(new URLSearchParams('compose=activity'))).toEqual({
      surface: 'menu',
      composeKind: 'activity',
    });
    expect(formatComposeQuery({ surface: 'menu', composeKind: 'place', target: 'place' })).toBe(
      'place'
    );
    expect(parseExploreCompose(new URLSearchParams('compose=place'))).toEqual({
      surface: 'menu',
      composeKind: 'place',
      target: 'place',
    });
    expect(parseExploreCompose(new URLSearchParams('compose=activity:activity'))).toEqual({
      composeKind: 'activity',
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
    setExploreComposeParam(params, { composeKind: 'activity', kind: 'event' });
    expect(params.get('compose')).toBe('activity:event');
    expect(params.has('request')).toBe(false);
    expect(params.has('contribute')).toBe(false);
    expect(params.has('addLocation')).toBe(false);

    clearExploreComposeParams(params);
    expect(params.toString()).toBe('');
  });

  it('intent compose builders emit intent wire', () => {
    const fixed = intentFixedCompose('hiking');
    expect(formatComposeQuery(fixed)).toBe('intent:fixed:hiking');
    expect(formatComposeQuery(intentOpenCompose())).toBe('intent:open');
  });

  it('legacy host/availability/add/seek wire normalizes on parse', () => {
    expect(parseExploreCompose(new URLSearchParams('compose=host:hiking'))).toEqual({
      composeKind: 'activity',
      kind: 'hiking',
    });
    expect(parseExploreCompose(new URLSearchParams('compose=seek:fixed:camping'))).toEqual({
      composeKind: 'intent',
      mode: 'fixed',
      kind: 'camping',
    });
    expect(parseExploreCompose(new URLSearchParams('compose=seek:flexible'))).toEqual({
      composeKind: 'intent',
      mode: 'open',
    });
    expect(parseExploreCompose(new URLSearchParams('compose=add:place:hiking'))).toEqual({
      composeKind: 'place',
      target: 'place',
      kind: 'hiking',
    });
  });

  it('isComposeWizardRoute covers activity, place, and intent wizards', () => {
    expect(isComposeWizardRoute(null)).toBe(false);
    expect(isComposeWizardRoute({ surface: 'menu', composeKind: 'activity' })).toBe(false);
    expect(isComposeWizardRoute({ composeKind: 'activity', kind: 'hiking' })).toBe(true);
    expect(isComposeWizardRoute({ composeKind: 'place', target: 'place', kind: 'hiking' })).toBe(
      true
    );
    expect(isComposeWizardRoute({ composeKind: 'intent', mode: 'fixed', kind: 'camping' })).toBe(
      true
    );
    expect(isComposeWizardRoute({ composeKind: 'intent', mode: 'open' })).toBe(true);
    expect(isIntentFixedWizard({ composeKind: 'intent', mode: 'fixed', kind: 'hiking' })).toBe(
      true
    );
    expect(isIntentOpenWizard({ composeKind: 'intent', mode: 'open' })).toBe(true);
  });
});