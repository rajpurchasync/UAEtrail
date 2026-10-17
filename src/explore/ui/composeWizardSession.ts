import type { ComposeFlowId } from '../composeFlowCatalog';
import type { ExploreCompose } from '../compose';
import { composeFlowIdFromRoute } from '../composeFlowCatalog';
import { legacyComposeFlowIdsFor, normalizeComposeFlowId } from '../composeFlowIds';
import type { CreateActivityDraft, CreateActivityKind } from './hostingFlowEngine';
import type { DemandDraft, DemandKind } from './seekingFlowEngine';
import type { ContributeDraft } from './contributeFlow';
import type { FacilityContributeDraft } from './contributeFacilityFlow';
import type { ContributeVenueKind } from '../contributeTypes';

const STORAGE_PREFIX = 'uaetrail:compose-wizard';

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
  draft: ContributeDraft | FacilityContributeDraft;
};

const sessionKey = (flowId: ComposeFlowId, scope?: string) => {
  const canonical = normalizeComposeFlowId(flowId);
  return `${STORAGE_PREFIX}:${canonical}${scope ? `:${scope}` : ''}`;
};

/** Older builds used a suffixed storage namespace — read once, then write under canonical keys. */
const legacySessionKey = (flowId: ComposeFlowId, scope?: string) =>
  `uaetrail:compose-wizard:v1:${flowId}${scope ? `:${scope}` : ''}`;

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
): OrganizeWizardSession | null => readSessionJson<OrganizeWizardSession>(flowId, scope);

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
  readSessionJson<DemandWizardSession>(flowId);

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
  return flowId ? readSessionJson<ContributeWizardSession>(flowId) : null;
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
  if (!flowId || !route || 'surface' in route) return;
  if (route.intent === 'plan' && 'mode' in route) {
    if (route.mode === 'hosting') clearOrganizeWizardSession(flowId);
    else clearDemandWizardSession(flowId);
    return;
  }
  if (route.intent === 'contribute' && 'target' in route) {
    if (route.target === 'facility') {
      clearContributeWizardSession('facility');
      return;
    }
    const kind =
      route.kind === 'outdoor_other' || route.kind === 'event'
        ? 'event'
        : (route.kind as ContributeVenueKind);
    clearContributeWizardSession(kind);
    return;
  }
  if (route.intent === 'organize') clearOrganizeWizardSession(flowId);
  else if (route.intent === 'find') clearDemandWizardSession(flowId);
  else if (route.intent === 'add' && 'kind' in route && route.kind) {
    clearContributeWizardSession(route.kind);
  }
};

function readJson<T>(key: string, legacyKey?: string): T | null {
  try {
    let raw = sessionStorage.getItem(key);
    if (!raw && legacyKey) {
      raw = sessionStorage.getItem(legacyKey);
      if (raw) {
        try {
          sessionStorage.setItem(key, raw);
          sessionStorage.removeItem(legacyKey);
        } catch {
          /* quota / private mode */
        }
      }
    }
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

const readSessionJson = <T>(flowId: ComposeFlowId, scope?: string): T | null => {
  const canonical = normalizeComposeFlowId(flowId);
  const primary = sessionKey(canonical, scope);
  const fromPrimary = readJson<T>(primary, legacySessionKey(canonical, scope));
  if (fromPrimary) return fromPrimary;
  for (const legacyId of legacyComposeFlowIdsFor(canonical)) {
    const legacyFlowKey = `${STORAGE_PREFIX}:${legacyId}${scope ? `:${scope}` : ''}`;
    const migrated = readJson<T>(legacyFlowKey);
    if (migrated) {
      writeJson(primary, migrated);
      try {
        sessionStorage.removeItem(legacyFlowKey);
      } catch {
        /* ignore */
      }
      return migrated;
    }
  }
  return null;
};

function writeJson(key: string, value: unknown): void {
  try {
    sessionStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* quota / private mode */
  }
}
