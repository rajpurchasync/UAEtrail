/**
 * R8.1 — shared detection for Vitest api guards and ESLint `no-direct-api-facade`.
 * Keep in sync with eslint/r8-api-facade.mjs (AST checks cover the same cases).
 */
export const usesDirectApiFacade = (source: string): boolean =>
  /\bapiRequest\s*(?:<[^>]*>)?\s*\(/.test(source) ||
  /\bapi[\s\n]*\.[a-zA-Z]/.test(source);

export const isHooksApiFacadeModule = (posixPath: string): boolean =>
  /(?:ClientApi|Api)\.ts$/.test(posixPath);

/** Hook modules that are not facades — must not call `api.*` / `apiRequest`. */
export const HOOKS_NON_FACADE_API_ALLOWLIST = new Set([
  'src/hooks/activityJoinClientEffects.ts',
  'src/hooks/clientQueryKeys.ts',
  'src/hooks/exploreMapQuery.ts',
]);
