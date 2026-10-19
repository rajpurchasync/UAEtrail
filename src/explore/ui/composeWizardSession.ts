import type { ComposeFlowId } from '../composeFlowCatalog';
import { canonicalizeComposeWire } from '@uaetrail/shared-types';
import type { ExploreCompose } from '../compose';
import { composeFlowIdFromRoute } from '../composeFlowCatalog';
import { legacyComposeFlowIdsFor, normalizeComposeFlowId } from '../composeFlowIds';
import type { CreateActivityDraft, CreateActivityKind } from './hostingFlowEngine';
import type { SeekingDraft, SeekingKind } from './seekingFlowEngine';
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

const sessionKey = (flowId: ComposeFlowId, scope?: string) => {
  const canonical = normalizeComposeFlowId(flowId);
  return `${STORAGE_PREFIX}:${canonical}${scope ? `:${scope}` : ''}`;
};

/** Older builds used a suffixed storage namespace — read once, then write under canonical keys. */
const legacySessionKey = (flowId: ComposeFlowId, scope?: string) =>
  `uaetrail:compose-wizard:v1:${flowId}${scope ? `:${scope}` : ''}`;

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
  composeFlowIdFromRoute({ intent: 'add', kind });

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
  const canonical = canonicalizeComposeWire(route);
  const flowId = composeFlowIdFromRoute(canonical);
  if (!flowId || 'surface' in canonical) return;
  if (canonical.intent === 'host') {
    clearHostingWizardSession(flowId);
    return;
  }
  if (canonical.intent === 'seek') {
    clearSeekingWizardSession(flowId);
    return;
  }
  if (canonical.intent === 'add' && 'target' in canonical) {
    if (canonical.target === 'facility') {
      clearAddWizardSession('facility');
      return;
    }
    const kind =
      canonical.kind === 'outdoor_other' || canonical.kind === 'event'
        ? 'event'
        : (canonical.kind as AddVenueKind);
    clearAddWizardSession(kind);
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
