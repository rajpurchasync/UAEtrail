import type { ComposeFlowId } from '../composeFlowCatalog';
import type { ExploreCompose } from '../compose';
import { composeFlowIdFromRoute } from '../composeFlowCatalog';
import type { CreateActivityDraft, CreateActivityKind } from './organizeFlow';
import type { DemandDraft, DemandKind } from './demandFlow';
import type { ContributeDraft } from './contributeFlow';
import type { ContributeVenueKind } from '../contributeTypes';

const STORAGE_PREFIX = 'uaetrail:compose-wizard:v1';

export type OrganizeWizardSession = {
  step: string;
  draft: CreateActivityDraft;
  selectedKind: CreateActivityKind | null;
};

export type DemandWizardSession = {
  step: string;
  draft: DemandDraft;
  selectedKind: DemandKind | null;
};

export type ContributeWizardSession = {
  step: string;
  draft: ContributeDraft;
};

const sessionKey = (flowId: ComposeFlowId, scope?: string) =>
  `${STORAGE_PREFIX}:${flowId}${scope ? `:${scope}` : ''}`;

export const organizeWizardSessionScope = (prefill?: {
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

export const readOrganizeWizardSession = (
  flowId: ComposeFlowId,
  scope?: string
): OrganizeWizardSession | null => readJson(sessionKey(flowId, scope));

export const writeOrganizeWizardSession = (
  flowId: ComposeFlowId,
  data: OrganizeWizardSession,
  scope?: string
): void => writeJson(sessionKey(flowId, scope), data);

export const clearOrganizeWizardSession = (flowId: ComposeFlowId, scope?: string): void => {
  try {
    sessionStorage.removeItem(sessionKey(flowId, scope));
  } catch {
    /* ignore */
  }
};

export const readDemandWizardSession = (flowId: ComposeFlowId): DemandWizardSession | null =>
  readJson(sessionKey(flowId));

export const writeDemandWizardSession = (flowId: ComposeFlowId, data: DemandWizardSession): void =>
  writeJson(sessionKey(flowId), data);

export const clearDemandWizardSession = (flowId: ComposeFlowId): void => {
  try {
    sessionStorage.removeItem(sessionKey(flowId));
  } catch {
    /* ignore */
  }
};

const contributeFlowId = (kind: ContributeVenueKind): ComposeFlowId | null =>
  composeFlowIdFromRoute({ intent: 'add', kind });

export const readContributeWizardSession = (
  kind: ContributeVenueKind
): ContributeWizardSession | null => {
  const flowId = contributeFlowId(kind);
  return flowId ? readJson(sessionKey(flowId)) : null;
};

export const writeContributeWizardSession = (
  kind: ContributeVenueKind,
  data: ContributeWizardSession
): void => {
  const flowId = contributeFlowId(kind);
  if (flowId) writeJson(sessionKey(flowId), data);
};

export const clearContributeWizardSession = (kind: ContributeVenueKind): void => {
  const flowId = contributeFlowId(kind);
  if (!flowId) return;
  try {
    sessionStorage.removeItem(sessionKey(flowId));
  } catch {
    /* ignore */
  }
};

/** Drop saved draft when the user fully dismisses compose (not back-to-menu). */
export const clearComposeWizardSessionForRoute = (route: ExploreCompose | null): void => {
  const flowId = composeFlowIdFromRoute(route);
  if (!flowId) return;
  if (route && 'intent' in route) {
    if (route.intent === 'organize') clearOrganizeWizardSession(flowId);
    else if (route.intent === 'find') clearDemandWizardSession(flowId);
    else if (route.intent === 'add' && 'kind' in route && route.kind) {
      clearContributeWizardSession(route.kind);
    }
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

function writeJson(key: string, value: unknown): void {
  try {
    sessionStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* quota / private mode */
  }
}
