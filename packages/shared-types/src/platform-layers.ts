/**
 * Product platform layers — Publish · Discover · Join · Connect · Plan · Manage.
 * Contract: `platform-layers.test.ts` + `platformLayerSpineGuard.test.ts` (MIG-PLATFORM-LAYER-SPINE).
 * UI copy: `src/content/upl-glossary.ts` · wire: `wire-lexicon.ts`.
 */

export const PLATFORM_LAYERS = [
  'publish',
  'discover',
  'join',
  'connect',
  'plan',
  'manage',
] as const;

export type PlatformLayer = (typeof PLATFORM_LAYERS)[number];

export type ProductModule = 'activity' | 'place' | 'crew';

/** Which platform layers each product module may expose on consumer surfaces. */
export const MODULE_LAYER_MATRIX: Record<ProductModule, readonly PlatformLayer[]> = {
  activity: ['publish', 'discover', 'join', 'connect', 'plan', 'manage'],
  place: ['publish', 'discover', 'plan', 'manage'],
  crew: ['publish', 'discover', 'connect', 'plan', 'manage'],
};

export const isPlatformLayer = (value: string): value is PlatformLayer =>
  (PLATFORM_LAYERS as readonly string[]).includes(value);

/** Join applies only to hosted outings — not crew signals or club membership. */
export const JOIN_LAYER_MODULES: readonly ProductModule[] = ['activity'];