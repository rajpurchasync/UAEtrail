import { describe, expect, it } from 'vitest';
import {
  canonicalizeComposeWire,
  formatComposeWire,
  parseComposeWire,
} from './compose-route.js';

describe('compose-route wire', () => {
  it('formats and parses host, seek, and add tokens', () => {
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

  it('leaves canonical add routes unchanged', () => {
    expect(
      canonicalizeComposeWire({ intent: 'add', target: 'facility', kind: 'toilet' })
    ).toEqual({ intent: 'add', target: 'facility', kind: 'toilet' });
    expect(
      canonicalizeComposeWire({ intent: 'add', target: 'place', kind: 'hiking' })
    ).toEqual({ intent: 'add', target: 'place', kind: 'hiking' });
  });
});
