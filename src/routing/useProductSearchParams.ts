import { useSearchParams, type SetURLSearchParams } from 'react-router-dom';

/**
 * Product query reads — use React Router as the single source of truth.
 * Compose/browse writers use `applyProductSearchMutation` to commit changes.
 */
export const useProductSearchParams = (): readonly [URLSearchParams, SetURLSearchParams] =>
  useSearchParams();
