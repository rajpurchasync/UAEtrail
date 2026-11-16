import type { ComposeFlowId } from '../composeFlowCatalog';
import type { ExploreCompose } from '../compose';
import { addComposeFromVenueKind } from '../compose';
import { composeFlowIdFromRoute } from '../composeFlowCatalog';
import type { CreateActivityDraft, CreateActivityKind } from './hostingFlowEngine';
import type { SeekingDraft, SeekingKind } from './availabilityFlowEngine';
import type { AddDraft } from './addFlow';
import type { FacilityAddDraft } from './addFacilityFlow';
import type { AddVenueKind } from '../addTypes';

const STORAGE_PREFIX = 'uaetrail:compose-wizard';

export type HostingWizardSession = {
  step: string;
  draft: CreateActivityDraft;
  selectedKind: CreateActivityKind | null;
};

export type SeekingWizardSession = {
  step: string;
  draft: SeekingDraft;
  selectedKind: SeekingKind | null;
};

export type AddWizardSession = {
  step: string;
  draft: AddDraft | FacilityAddDraft;
};

const sessionKey = (flowId: ComposeFlowId, scope?: string) =>
  `${STORAGE_PREFIX}:${flowId}${scope ? `:${scope}` : ''}`;

export const hostingWizardSessionScope = (prefill?: {
  participantIntentId?: string;
  sourceActivityId?: string;
  linkToParentActivityId?: string;
} | null): string | undefined => {
  if (!prefill) return undefined;
  if (prefill.participantIntentId) return `intent:${prefill.participantIntentId}`;
  if (prefill.linkToParentActivityId) return `link:${prefill.linkToParentActivityId}`;
  if (prefill.sourceActivityId) return `from:${prefill.sourceActivityId}`;
  return undefined;
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
  } catch {
    /* ignore */
  }
};

export const readSeekingWizardSession = (flowId: ComposeFlowId): SeekingWizardSession | null =>
  readSessionJson<SeekingWizardSession>(flowId);

export const writeSeekingWizardSession = (flowId: ComposeFlowId, data: SeekingWizardSession): void =>
  writeJson(sessionKey(flowId), data);

export const clearSeekingWizardSession = (flowId: ComposeFlowId): void => {
  try {
    sessionStorage.removeItem(sessionKey(flowId));
  } catch {
    /* ignore */
  }
};

const addFlowId = (kind: AddVenueKind): ComposeFlowId | null =>
  composeFlowIdFromRoute(addComposeFromVenueKind(kind));

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
  if (route.intent === 'host') {
    clearHostingWizardSession(flowId);
    return;
  }
  if (route.intent === 'availability') {
    clearSeekingWizardSession(flowId);
    return;
  }
  if (route.intent === 'add' && 'target' in route) {
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

const readSessionJson = <T>(flowId: ComposeFlowId, scope?: string): T | null =>
  readJson<T>(sessionKey(flowId, scope));

function writeJson(key: string, value: unknown): void {
  try {
    sessionStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* quota / private mode */
  }
}
