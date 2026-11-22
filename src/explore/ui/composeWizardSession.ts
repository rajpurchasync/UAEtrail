import type { ComposeFlowId } from '../composeFlowCatalog';
import { priorCatalogComposeFlowId } from '../composeFlowIds';
import type { ExploreCompose } from '../compose';
import { placeComposeFromVenueKind } from '../compose';
import { composeFlowIdFromRoute } from '../composeFlowCatalog';
import type { CreateActivityDraft, CreateActivityKind } from './hostingFlowEngine';
import type { AvailabilityFixedDraft, AvailabilityFixedKind } from './availabilityFlowEngine';
import type { AddDraft } from './addFlow';
import type { FacilityAddDraft } from './addFacilityFlow';
import type { AddVenueKind } from '../addTypes';

const STORAGE_PREFIX = 'uaetrail:compose-wizard';

export type HostingWizardSession = {
  step: string;
  draft: CreateActivityDraft;
  selectedKind: CreateActivityKind | null;
  /** Post-publish graph link — survives sessionStorage when compose opens off explore. */
  linkToParentActivityId?: string;
  sourceActivityId?: string;
};

export type AvailabilityWizardSession = {
  step: string;
  draft: AvailabilityFixedDraft;
  selectedKind: AvailabilityFixedKind | null;
};

export type AddWizardSession = {
  step: string;
  draft: AddDraft | FacilityAddDraft;
};

const sessionKey = (flowId: ComposeFlowId, scope?: string) =>
  `${STORAGE_PREFIX}:${flowId}${scope ? `:${scope}` : ''}`;

export const hostingWizardSessionScope = (prefill?: {
  sourceActivityId?: string;
  linkToParentActivityId?: string;
} | null): string | undefined => {
  if (!prefill) return undefined;
  if (prefill.linkToParentActivityId) return `link:${prefill.linkToParentActivityId}`;
  if (prefill.sourceActivityId) return `from:${prefill.sourceActivityId}`;
  return undefined;
};

const findLinkScopeForFlowPrefix = (flowId: string): string | undefined => {
  try {
    const prefix = `${STORAGE_PREFIX}:${flowId}:link:`;
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key?.startsWith(prefix)) {
        return key.slice(`${STORAGE_PREFIX}:${flowId}:`.length);
      }
    }
  } catch {
    /* ignore */
  }
  return undefined;
};

/** Session scope `link:{parentId}` written by `launchLinkedRideshareFromParentActivity`. */
export const findHostingWizardLinkSessionScope = (flowId: ComposeFlowId): string | undefined => {
  const found = findLinkScopeForFlowPrefix(flowId);
  if (found) return found;
  const priorId = priorCatalogComposeFlowId(flowId);
  return priorId ? findLinkScopeForFlowPrefix(priorId) : undefined;
};

export const readHostingWizardSession = (
  flowId: ComposeFlowId,
  scope?: string
): HostingWizardSession | null => readSessionJson<HostingWizardSession>(flowId, scope);

export const writeHostingWizardSession = (
  flowId: ComposeFlowId,
  data: HostingWizardSession,
  scope?: string
): void => writeJson(sessionKey(flowId, scope), data);

export const clearHostingWizardSession = (flowId: ComposeFlowId, scope?: string): void => {
  try {
    sessionStorage.removeItem(sessionKey(flowId, scope));
    const priorId = priorCatalogComposeFlowId(flowId);
    if (priorId) sessionStorage.removeItem(sessionKey(priorId as ComposeFlowId, scope));
  } catch {
    /* ignore */
  }
};

export const readAvailabilityWizardSession = (flowId: ComposeFlowId): AvailabilityWizardSession | null =>
  readSessionJson<AvailabilityWizardSession>(flowId);

export const writeAvailabilityWizardSession = (flowId: ComposeFlowId, data: AvailabilityWizardSession): void =>
  writeJson(sessionKey(flowId), data);

export const clearAvailabilityWizardSession = (flowId: ComposeFlowId): void => {
  try {
    sessionStorage.removeItem(sessionKey(flowId));
    const priorId = priorCatalogComposeFlowId(flowId);
    if (priorId) sessionStorage.removeItem(sessionKey(priorId as ComposeFlowId));
  } catch {
    /* ignore */
  }
};

const addFlowId = (kind: AddVenueKind): ComposeFlowId | null =>
  composeFlowIdFromRoute(placeComposeFromVenueKind(kind));

export const readAddWizardSession = (
  kind: AddVenueKind
): AddWizardSession | null => {
  const flowId = addFlowId(kind);
  return flowId ? readSessionJson<AddWizardSession>(flowId) : null;
};

export const writeAddWizardSession = (
  kind: AddVenueKind,
  data: AddWizardSession
): void => {
  const flowId = addFlowId(kind);
  if (flowId) writeJson(sessionKey(flowId), data);
};

export const clearAddWizardSession = (kind: AddVenueKind): void => {
  const flowId = addFlowId(kind);
  if (!flowId) return;
  try {
    sessionStorage.removeItem(sessionKey(flowId));
  } catch {
    /* ignore */
  }
};

/** Drop saved draft when the user fully dismisses compose (not back-to-menu). */
export const clearComposeWizardSessionForRoute = (route: ExploreCompose | null): void => {
  if (!route) return;
  const flowId = composeFlowIdFromRoute(route);
  if (!flowId || 'surface' in route) return;
  if (route.composeKind === 'activity') {
    clearHostingWizardSession(flowId);
    return;
  }
  if (route.composeKind === 'intent') {
    clearAvailabilityWizardSession(flowId);
    return;
  }
  if (route.composeKind === 'place' && 'target' in route) {
    if (route.target === 'facility') {
      clearAddWizardSession('facility');
      return;
    }
    const kind =
      route.kind === 'outdoor_other' || route.kind === 'event'
        ? 'event'
        : (route.kind as AddVenueKind);
    clearAddWizardSession(kind);
  }
};

function readJson<T>(key: string): T | null {
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

const readSessionJson = <T>(flowId: ComposeFlowId, scope?: string): T | null => {
  const primary = readJson<T>(sessionKey(flowId, scope));
  if (primary) return primary;
  const priorId = priorCatalogComposeFlowId(flowId);
  if (!priorId) return null;
  return readJson<T>(sessionKey(priorId as ComposeFlowId, scope));
};

function writeJson(key: string, value: unknown): void {
  try {
    sessionStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* quota / private mode */
  }
}
