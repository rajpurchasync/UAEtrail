/** Re-export — implementation lives in `.tsx` (JSX provider). Keeps stale Vite HMR `.ts` URLs working. */
export {
  EffectiveLocationProvider,
  useEffectiveLocation,
  useProductLocation,
} from './useEffectiveLocation.tsx';
