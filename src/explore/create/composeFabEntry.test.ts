import { describe, expect, it } from 'vitest';
import { BROWSE_LIST_CREATE_TRIP, BROWSE_LIST_CREATE_VENUE } from '../../list/browse/browseListCopy';
import { resolveBrowseListCreateFabLabel } from '../../list/browse/browseListCopy';
import {
  resolveCreateFabComposeEntry,
  resolveExploreMapCreateFabHints,
} from './composeFabEntry';

describe('resolveCreateFabComposeEntry', () => {
  it('opens activity kinds on trips context', () => {
    expect(resolveCreateFabComposeEntry('/list', '?listCat=activities')).toEqual({
      surface: 'menu',
      composeKind: 'activity',
    });
    expect(resolveCreateFabComposeEntry('/explore', '')).toEqual({
      surface: 'menu',
      composeKind: 'activity',
    });
  });

  it('opens place venue kind grid on venues context', () => {
    expect(resolveCreateFabComposeEntry('/list', '?listCat=venues')).toEqual({
      surface: 'menu',
      composeKind: 'place',
    });
    expect(resolveCreateFabComposeEntry('/explore', '?panel=venues&pinKind=places')).toEqual({
      surface: 'menu',
      composeKind: 'place',
    });
  });

  it('opens find crew on crews context', () => {
    expect(resolveCreateFabComposeEntry('/list', '?listCat=people')).toEqual({
      surface: 'menu',
      composeKind: 'intent',
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
      composeKind: 'place',
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