import { describe, expect, it } from 'vitest';
import {
  canonicalizeComposeWire,
  formatComposeWire,
  parseComposeWire,
} from './compose-route.js';

describe('compose-route wire', () => {
  it('formats and parses host, availability, and add tokens', () => {
    expect(formatComposeWire({ intent: 'host', kind: 'hiking' })).toBe('host:hiking');
    expect(formatComposeWire({ intent: 'availability', mode: 'fixed', kind: 'rideshare' })).toBe(
      'availability:fixed:rideshare'
    );
    expect(formatComposeWire({ intent: 'availability', mode: 'open' })).toBe('availability:open');
    expect(formatComposeWire({ intent: 'add', target: 'place', kind: 'hiking' })).toBe(
      'add:place:hiking'
    );
    expect(formatComposeWire({ intent: 'add', target: 'facility', kind: 'toilet' })).toBe(
      'add:facility:toilet'
    );
    expect(formatComposeWire({ surface: 'menu', intent: 'host' })).toBe('host');
    expect(formatComposeWire({ surface: 'menu', intent: 'availability', mode: 'fixed' })).toBe(
      'availability:fixed'
    );
    expect(formatComposeWire({ surface: 'menu', intent: 'add', target: 'place' })).toBe(
      'add:place'
    );

    expect(parseComposeWire('host:hiking')).toEqual({ intent: 'host', kind: 'hiking' });
    expect(parseComposeWire('availability:open')).toEqual({ intent: 'availability', mode: 'open' });
    expect(parseComposeWire('availability:fixed:hiking')).toEqual({
      intent: 'availability',
      mode: 'fixed',
      kind: 'hiking',
    });
    expect(parseComposeWire('availability:fixed')).toEqual({
      surface: 'menu',
      intent: 'availability',
      mode: 'fixed',
    });
    expect(parseComposeWire('add:place')).toEqual({
      surface: 'menu',
      intent: 'add',
      target: 'place',
    });
    expect(parseComposeWire('add:place:hiking')).toEqual({
      intent: 'add',
      target: 'place',
      kind: 'hiking',
    });
  });

  it('normalizes legacy seek tokens to availability on read', () => {
    expect(parseComposeWire('seek:flexible')).toEqual({ intent: 'availability', mode: 'open' });
    expect(parseComposeWire('seek:fixed:hiking')).toEqual({
      intent: 'availability',
      mode: 'fixed',
      kind: 'hiking',
    });
    expect(parseComposeWire('seek:fixed')).toEqual({
      surface: 'menu',
      intent: 'availability',
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