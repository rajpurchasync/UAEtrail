import { describe, expect, it } from 'vitest';
import {
  availabilityFixedCompose,
  availabilityOpenCompose,
  clearExploreComposeParams,
  formatComposeQuery,
  isAvailabilityFixedWizard,
  isAvailabilityOpenWizard,
  isComposeWizardRoute,
  isSeekFixedWizard,
  isSeekFlexibleWizard,
  parseExploreCompose,
  seekFixedCompose,
  setExploreComposeParam,
} from './compose';

describe('explore compose routing', () => {
  it('formats and parses menu + wizard routes (compose wire)', () => {
    expect(formatComposeQuery({ surface: 'menu' })).toBe('1');
    expect(formatComposeQuery({ surface: 'menu', intent: 'host' })).toBe('host');
    expect(formatComposeQuery({ intent: 'host', kind: 'hiking' })).toBe('host:hiking');
    expect(formatComposeQuery({ intent: 'availability', mode: 'fixed', kind: 'rideshare' })).toBe(
      'availability:fixed:rideshare'
    );
    expect(formatComposeQuery({ intent: 'availability', mode: 'open' })).toBe('availability:open');
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
    expect(parseExploreCompose(new URLSearchParams('compose=availability:fixed:camping'))).toEqual({
      intent: 'availability',
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

  it('availability compose builders are canonical; seek names alias wire', () => {
    const fixed = availabilityFixedCompose('hiking');
    expect(seekFixedCompose('hiking')).toEqual(fixed);
    expect(formatComposeQuery(fixed)).toBe('availability:fixed:hiking');
    expect(formatComposeQuery(availabilityOpenCompose())).toBe('availability:open');
  });

  it('legacy seek wire normalizes to availability on parse', () => {
    expect(parseExploreCompose(new URLSearchParams('compose=seek:fixed:camping'))).toEqual({
      intent: 'availability',
      mode: 'fixed',
      kind: 'camping',
    });
    expect(parseExploreCompose(new URLSearchParams('compose=seek:flexible'))).toEqual({
      intent: 'availability',
      mode: 'open',
    });
  });

  it('seek wire predicates alias availability implementations', () => {
    const fixed = {
      intent: 'availability' as const,
      mode: 'fixed' as const,
      kind: 'hiking' as const,
    };
    const open = { intent: 'availability' as const, mode: 'open' as const };
    expect(isSeekFixedWizard(fixed)).toBe(isAvailabilityFixedWizard(fixed));
    expect(isSeekFlexibleWizard(open)).toBe(isAvailabilityOpenWizard(open));
  });

  it('isComposeWizardRoute covers host, add, and availability wizards', () => {
    expect(isComposeWizardRoute(null)).toBe(false);
    expect(isComposeWizardRoute({ surface: 'menu', intent: 'host' })).toBe(false);
    expect(isComposeWizardRoute({ intent: 'host', kind: 'hiking' })).toBe(true);
    expect(isComposeWizardRoute({ intent: 'add', target: 'place', kind: 'hiking' })).toBe(true);
    expect(isComposeWizardRoute({ intent: 'availability', mode: 'fixed', kind: 'camping' })).toBe(
      true
    );
    expect(isComposeWizardRoute({ intent: 'availability', mode: 'open' })).toBe(true);
  });
});