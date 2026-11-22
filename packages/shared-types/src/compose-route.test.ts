import { describe, expect, it } from 'vitest';
import {
  canonicalizeComposeWire,
  formatComposeWire,
  migrateLegacyComposeWire,
  parseComposeWire,
} from './compose-route.js';

describe('compose-route wire', () => {
  it('formats and parses activity, intent, and place tokens', () => {
    expect(formatComposeWire({ composeKind: 'activity', kind: 'hiking' })).toBe('activity:hiking');
    expect(formatComposeWire({ composeKind: 'intent', mode: 'fixed', kind: 'rideshare' })).toBe(
      'intent:fixed:rideshare'
    );
    expect(formatComposeWire({ composeKind: 'intent', mode: 'open' })).toBe('intent:open');
    expect(formatComposeWire({ composeKind: 'place', target: 'place', kind: 'hiking' })).toBe(
      'place:hiking'
    );
    expect(formatComposeWire({ composeKind: 'place', target: 'facility', kind: 'toilet' })).toBe(
      'place:facility:toilet'
    );
    expect(formatComposeWire({ surface: 'menu', composeKind: 'activity' })).toBe('activity');
    expect(formatComposeWire({ surface: 'menu', composeKind: 'intent', mode: 'fixed' })).toBe(
      'intent:fixed'
    );
    expect(formatComposeWire({ surface: 'menu', composeKind: 'place', target: 'place' })).toBe(
      'place'
    );

    expect(parseComposeWire('activity:hiking')).toEqual({ composeKind: 'activity', kind: 'hiking' });
    expect(parseComposeWire('intent:open')).toEqual({ composeKind: 'intent', mode: 'open' });
    expect(parseComposeWire('intent:fixed:hiking')).toEqual({
      composeKind: 'intent',
      mode: 'fixed',
      kind: 'hiking',
    });
    expect(parseComposeWire('intent:fixed')).toEqual({
      surface: 'menu',
      composeKind: 'intent',
      mode: 'fixed',
    });
    expect(parseComposeWire('place')).toEqual({
      surface: 'menu',
      composeKind: 'place',
      target: 'place',
    });
    expect(parseComposeWire('place:hiking')).toEqual({
      composeKind: 'place',
      target: 'place',
      kind: 'hiking',
    });
  });

  it('normalizes legacy host, availability, add, and seek tokens on read', () => {
    expect(parseComposeWire('host:hiking')).toEqual({ composeKind: 'activity', kind: 'hiking' });
    expect(parseComposeWire('availability:open')).toEqual({ composeKind: 'intent', mode: 'open' });
    expect(parseComposeWire('add:place:hiking')).toEqual({
      composeKind: 'place',
      target: 'place',
      kind: 'hiking',
    });
    expect(parseComposeWire('seek:flexible')).toEqual({ composeKind: 'intent', mode: 'open' });
    expect(parseComposeWire('seek:fixed:hiking')).toEqual({
      composeKind: 'intent',
      mode: 'fixed',
      kind: 'hiking',
    });
    expect(migrateLegacyComposeWire('host:rideshare')).toBe('activity:rideshare');
    expect(migrateLegacyComposeWire('add:facility:toilet')).toBe('place:facility:toilet');
  });

  it('rejects leftover plan/contribute/organize/find tokens', () => {
    expect(parseComposeWire('plan:hiking:hosting')).toBeNull();
    expect(parseComposeWire('plan:camping:seeking')).toBeNull();
    expect(parseComposeWire('contribute:facility:toilet')).toBeNull();
    expect(parseComposeWire('organize:hiking')).toBeNull();
    expect(parseComposeWire('organize:carpool')).toBeNull();
    expect(parseComposeWire('find:rideshare')).toBeNull();
    expect(parseComposeWire('find')).toBeNull();
    expect(parseComposeWire('add:shop')).toBeNull();
    expect(parseComposeWire('organize')).toBeNull();
    expect(parseComposeWire('plan')).toBeNull();
    expect(parseComposeWire('contribute')).toBeNull();
  });

  it('leaves canonical place routes unchanged', () => {
    expect(
      canonicalizeComposeWire({ composeKind: 'place', target: 'facility', kind: 'toilet' })
    ).toEqual({ composeKind: 'place', target: 'facility', kind: 'toilet' });
    expect(
      canonicalizeComposeWire({ composeKind: 'place', target: 'place', kind: 'hiking' })
    ).toEqual({ composeKind: 'place', target: 'place', kind: 'hiking' });
  });
});