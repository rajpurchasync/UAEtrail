import { describe, expect, it } from 'vitest';
import {
  canonicalizeComposeWire,
  formatComposeWire,
  parseComposeWire,
} from './compose-route.js';

describe('compose-route wire', () => {
  it('formats and parses v3 host, seek, and add tokens', () => {
    expect(formatComposeWire({ intent: 'host', kind: 'hiking' })).toBe('host:hiking');
    expect(formatComposeWire({ intent: 'seek', mode: 'fixed', kind: 'rideshare' })).toBe(
      'seek:fixed:rideshare'
    );
    expect(formatComposeWire({ intent: 'seek', mode: 'flexible' })).toBe('seek:flexible');
    expect(formatComposeWire({ intent: 'add', target: 'place', kind: 'hiking' })).toBe(
      'add:place:hiking'
    );
    expect(formatComposeWire({ intent: 'add', target: 'facility', kind: 'toilet' })).toBe(
      'add:facility:toilet'
    );
    expect(formatComposeWire({ surface: 'menu', intent: 'host' })).toBe('host');
    expect(formatComposeWire({ surface: 'menu', intent: 'seek', mode: 'fixed' })).toBe(
      'seek:fixed'
    );

    expect(parseComposeWire('host:hiking')).toEqual({ intent: 'host', kind: 'hiking' });
    expect(parseComposeWire('seek:flexible')).toEqual({ intent: 'seek', mode: 'flexible' });
    expect(parseComposeWire('seek:fixed:hiking')).toEqual({
      intent: 'seek',
      mode: 'fixed',
      kind: 'hiking',
    });
    expect(parseComposeWire('seek:fixed')).toEqual({
      surface: 'menu',
      intent: 'seek',
      mode: 'fixed',
    });
  });

  it('formats leftover plan/contribute/organize objects as canonical tokens', () => {
    expect(formatComposeWire({ intent: 'plan', kind: 'hiking', mode: 'hosting' })).toBe(
      'host:hiking'
    );
    expect(formatComposeWire({ intent: 'plan', kind: 'camping', mode: 'seeking' })).toBe(
      'seek:fixed:camping'
    );
    expect(
      formatComposeWire({
        intent: 'contribute',
        target: 'facility',
        kind: 'rest_area',
      })
    ).toBe('add:facility:rest_area');
    expect(formatComposeWire({ intent: 'organize', kind: 'hiking' })).toBe('host:hiking');
    expect(formatComposeWire({ intent: 'find' })).toBe('seek');
  });

  it('parses leftover plan and contribute tokens inbound', () => {
    expect(parseComposeWire('plan:hiking:hosting')).toEqual({
      intent: 'plan',
      kind: 'hiking',
      mode: 'hosting',
    });
    expect(parseComposeWire('contribute:facility:toilet')).toEqual({
      intent: 'contribute',
      target: 'facility',
      kind: 'toilet',
    });
  });

  it('parses legacy organize, find, and add tokens', () => {
    expect(parseComposeWire('organize:hiking')).toEqual({
      intent: 'organize',
      kind: 'hiking',
    });
    expect(parseComposeWire('find:rideshare')).toEqual({
      intent: 'find',
      kind: 'rideshare',
    });
    expect(parseComposeWire('find')).toEqual({ surface: 'menu', intent: 'find' });
    expect(parseComposeWire('add:shop')).toEqual({ intent: 'add', kind: 'shop' });
    expect(parseComposeWire('organize:carpool')).toEqual({
      intent: 'organize',
      kind: 'rideshare',
    });
  });

  it('canonicalizes legacy and v2 routes to v3', () => {
    expect(
      canonicalizeComposeWire({ intent: 'plan', kind: 'hiking', mode: 'hosting' })
    ).toEqual({ intent: 'host', kind: 'hiking' });
    expect(
      canonicalizeComposeWire({ intent: 'plan', kind: 'rideshare', mode: 'seeking' })
    ).toEqual({ intent: 'seek', mode: 'fixed', kind: 'rideshare' });
    expect(canonicalizeComposeWire({ intent: 'find' })).toEqual({
      surface: 'menu',
      intent: 'seek',
    });
    expect(
      canonicalizeComposeWire({
        intent: 'contribute',
        target: 'place',
        kind: 'hiking',
      })
    ).toEqual({ intent: 'add', target: 'place', kind: 'hiking' });
    expect(
      canonicalizeComposeWire({ intent: 'add', target: 'facility', kind: 'toilet' })
    ).toEqual({ intent: 'add', target: 'facility', kind: 'toilet' });
    expect(
      canonicalizeComposeWire({ intent: 'add', target: 'place', kind: 'hiking' })
    ).toEqual({ intent: 'add', target: 'place', kind: 'hiking' });
  });

});
