/**
 * B-UNIFY-04 — shared shell entry for map-first and list discovery orchestration hooks.
 * Thin wrapper today; both experience models compose surface-specific state on top.
 */
export { useDiscoveryProductSession as useDiscoveryExperienceShell } from './useDiscoveryProductSession';