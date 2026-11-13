import { describe, expect, it } from 'vitest';
import { BROWSE_LIST_CREATE_TRIP, BROWSE_LIST_CREATE_VENUE } from '../../list/browseListCopy';
import { resolveBrowseListCreateFabLabel } from '../../list/browseListCopy';
import {
  resolveCreateFabComposeEntry,
  resolveExploreMapCreateFabHints,
} from './composeFabEntry';

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

  it('opens add venue kind grid on venues context', () => {
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

describe('resolveExploreMapCreateFabHints', () => {
  it('drives FAB label and compose when explore URL is bare but map scope is venues', () => {
    const hints = resolveExploreMapCreateFabHints({
      panel: 'venues',
      peopleBrowseOpen: false,
      listMode: 'default',
      pinKind: 'places',
      placesMode: true,
    });
    expect(resolveBrowseListCreateFabLabel('/explore', '', hints)).toBe(BROWSE_LIST_CREATE_VENUE);
    expect(resolveCreateFabComposeEntry('/explore', '', hints)).toEqual({
      surface: 'menu',
      intent: 'add',
    });
  });

  it('stays on create trip for activities scope without query params', () => {
    const hints = resolveExploreMapCreateFabHints({
      panel: 'activities',
      peopleBrowseOpen: false,
      listMode: 'default',
      pinKind: 'activities',
      placesMode: false,
    });
    expect(resolveBrowseListCreateFabLabel('/explore', '', hints)).toBe(BROWSE_LIST_CREATE_TRIP);
  });
});
