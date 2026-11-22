import { describe, expect, it } from 'vitest';
import { BROWSE_LIST_CREATE_TRIP, BROWSE_LIST_CREATE_VENUE } from '../../list/browse/browseListCopy';
import { resolveBrowseListCreateFabLabel } from '../../list/browse/browseListCopy';
import {
  resolveCreateEntryPreset,
  resolveExploreMapCreateFabHints,
} from './composeFabEntry';

describe('resolveCreateEntryPreset', () => {
  it('opens activity kinds on trips context', () => {
    expect(resolveCreateEntryPreset('/list', '?listCat=activities')).toEqual({
      surface: 'menu',
      composeKind: 'activity',
    });
    expect(resolveCreateEntryPreset('/explore', '')).toEqual({
      surface: 'menu',
      composeKind: 'activity',
    });
  });

  it('opens place venue kind grid on venues context', () => {
    expect(resolveCreateEntryPreset('/list', '?listCat=venues')).toEqual({
      surface: 'menu',
      composeKind: 'place',
    });
    expect(resolveCreateEntryPreset('/explore', '?panel=venues&pinKind=places')).toEqual({
      surface: 'menu',
      composeKind: 'place',
    });
  });

  it('opens intent open compose on crews context', () => {
    expect(resolveCreateEntryPreset('/list', '?listCat=people')).toEqual({
      composeKind: 'intent',
      mode: 'open',
    });
  });
});

describe('resolveExploreMapCreateFabHints', () => {
  it('drives FAB label and compose when explore URL is bare but map scope is venues', () => {
    const hints = resolveExploreMapCreateFabHints({
      panel: 'venues',
      crewsBrowseOpen: false,
      listMode: 'default',
      pinKind: 'places',
      placesMode: true,
    });
    expect(resolveBrowseListCreateFabLabel('/explore', '', hints)).toBe(BROWSE_LIST_CREATE_VENUE);
    expect(resolveCreateEntryPreset('/explore', '', hints)).toEqual({
      surface: 'menu',
      composeKind: 'place',
    });
  });

  it('stays on create trip for activities scope without query params', () => {
    const hints = resolveExploreMapCreateFabHints({
      panel: 'activities',
      crewsBrowseOpen: false,
      listMode: 'default',
      pinKind: 'activities',
      placesMode: false,
    });
    expect(resolveBrowseListCreateFabLabel('/explore', '', hints)).toBe(BROWSE_LIST_CREATE_TRIP);
  });
});