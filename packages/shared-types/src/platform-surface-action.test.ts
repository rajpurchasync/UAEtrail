import { describe, expect, it } from 'vitest';
import {
  LAYER_ACTION_WIRE,
  layerForCatalogAction,
  layerForPeekAction,
  projectSurfaceActions,
} from './platform-surface-action.js';

describe('platform surface actions (PLS-3)', () => {
  it('crew module has no join layer actions', () => {
    expect(projectSurfaceActions('crew', 'join')).toEqual([]);
    expect(LAYER_ACTION_WIRE.join.activity_request).toBe('POST /activities/:id/requests');
  });

  it('wishlist maps to plan wire', () => {
    expect(LAYER_ACTION_WIRE.plan.wishlist_save).toBe('POST /me/wishlist');
    expect(projectSurfaceActions('place', 'plan').some((a) => a.id === 'wishlist_save')).toBe(true);
  });

  it('classifies activity peek join vs connect', () => {
    expect(layerForPeekAction('request_join')).toBe('join');
    expect(layerForPeekAction('message_host')).toBe('connect');
    expect(layerForPeekAction('manage_activity')).toBe('manage');
  });

  it('classifies place catalog actions onto layers', () => {
    expect(layerForCatalogAction('arrange_trip')).toBe('plan');
    expect(layerForCatalogAction('open_maps')).toBe('discover');
    expect(layerForCatalogAction('edit_submission')).toBe('manage');
  });
});