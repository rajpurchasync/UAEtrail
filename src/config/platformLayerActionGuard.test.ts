import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  layerForCatalogAction,
  layerForPeekAction,
  projectSurfaceActions,
} from '../../packages/shared-types/src/platform-surface-action.js';

const ROOT = process.cwd();
const read = (rel: string) => readFileSync(join(ROOT, rel), 'utf8');

describe('platformLayerActionGuard (PLS-3)', () => {
  it('LAYER-10: platform-surface-action contract shipped', () => {
    expect(read('packages/shared-types/src/platform-surface-action.ts')).toMatch(/LAYER_ACTION_WIRE/);
    expect(read('packages/shared-types/src/platform-surface-action.ts')).toMatch(/projectSurfaceActions/);
    expect(read('packages/shared-types/src/platform-surface-action.test.ts')).toMatch(/PLS-3/);
  });

  it('LAYER-12: join wire not on crew publish surface', () => {
    const publishCrew = projectSurfaceActions('crew', 'publish');
    expect(publishCrew.some((a) => a.id === 'compose_intent')).toBe(true);
    expect(publishCrew.some((a) => a.wire.includes('/activities/:id/requests'))).toBe(false);
    expect(layerForPeekAction('request_join')).toBe('join');
    expect(layerForCatalogAction('arrange_trip')).toBe('plan');
  });
});