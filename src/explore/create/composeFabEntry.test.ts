import { describe, expect, it } from 'vitest';
import { resolveCreateFabComposeEntry } from './composeFabEntry';

describe('resolveCreateFabComposeEntry', () => {
  it('opens host kinds on trips context', () => {
    expect(resolveCreateFabComposeEntry('/list', '?listCat=activities')).toEqual({
      surface: 'menu',
      intent: 'host',
    });
    expect(resolveCreateFabComposeEntry('/explore', '')).toEqual({
      surface: 'menu',
      intent: 'host',
    });
  });

  it('opens add-on-map targets on venues context', () => {
    expect(resolveCreateFabComposeEntry('/list', '?listCat=venues')).toEqual({
      surface: 'menu',
      intent: 'add',
    });
    expect(resolveCreateFabComposeEntry('/explore', '?panel=venues&pinKind=places')).toEqual({
      surface: 'menu',
      intent: 'add',
    });
  });

  it('opens find crew on crews context', () => {
    expect(resolveCreateFabComposeEntry('/list', '?listCat=people')).toEqual({
      surface: 'menu',
      intent: 'seek',
    });
  });
});
