/**
 * **Hosting** activity wizard (publish scheduled `activities` row).
 *
 * - **Engine:** `hostingFlowEngine.ts` (`organizeFlow.ts` re-exports for legacy imports).
 * - **Per-kind flows:** `hostingFlows/*` (`HostingKindFlow` — not place/facility catalog).
 * - **UI:** `CreateHostingActivityFlow.tsx` via `create/hosting/HostingFlowHost.tsx`.
 *
 * **Plan** is FAB UI (hosting + seeking). **Seeking** → `seekingFlow.ts` / `seekingFlowEngine.ts`.
 * Shared primitives → `createFlowShared.ts`.
 */

export type {
  CreateActivityKind as HostingActivityKind,
  CreateFlowStepId as HostingFlowStepId,
  CreateActivityDraft as HostingActivityDraft,
  CreateFlowStepsOptions as HostingFlowStepsOptions,
} from './hostingFlowEngine';

export {
  emptyCreateActivityDraft as emptyHostingActivityDraft,
  getCreateFlowSteps as getHostingFlowSteps,
  validateDraftStep as validateHostingDraftStep,
  createDraftFromSeekingMapItem,
  isHikingOrganizeFlow as isHikingHostingFlow,
  isCampingOrganizeFlow as isCampingHostingFlow,
  isEventOrganizeFlow as isEventHostingFlow,
  isActivityOrganizeFlow as isActivityHostingFlow,
  isRideshareOrganizeFlow as isRideshareHostingFlow,
  isStructuredOrganizeFlow as isStructuredHostingFlow,
} from './hostingFlowEngine';

export type {
  HostingKindFlow,
  HostingCatalogFlow,
  OrganizeCatalogFlow,
} from './hostingFlows';
export {
  HOSTING_KIND_FLOWS,
  hostingFlowForComposeKind,
  getHostingKindFlowSteps,
  validateHostingKindStep,
  registryPlaceTypeForHostingKindFlow,
  HOSTING_CATALOG_FLOWS,
  hostingCatalogFlowForPlanKind,
  getHostingCatalogFlowSteps,
  ORGANIZE_CATALOG_FLOWS,
  organizeCatalogFlowForComposeKind,
  getOrganizeCatalogFlowSteps,
} from './hostingFlows';
