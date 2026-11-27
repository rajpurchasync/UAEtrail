import { useEffect, useRef } from 'react';
import type { ActivityDTO } from '@uaetrail/shared-types';
import { hostingPublishSeed } from '../compose';
import { defaultParticipationForHostRoute } from '../composeFlowCatalog';
import type { HostComposeKind } from '../compose';
import type { HostingKindFlow } from './hostingFlows';
import {
  defaultCapacityForKind,
  emptyCreateActivityDraft,
  getCreateFlowSteps,
  hydrateCreateActivityDraft,
  type CreateActivityDraft,
  type CreateActivityKind,
} from './hostingFlowEngine';
import { readHostingWizardSession, writeHostingWizardSession } from './composeWizardSession';
import { normalizeComposeFlowId } from '../composeFlowIds';
import {
  HOSTING_PUBLISH_FLOW_IDLE,
  hostingPublishFlowBlocksSessionPersist,
  type HostingPublishFlowStatus,
} from './hostingPublishFlowStatus';
import type { HostingActivityFlowStep } from './hostingActivityFlowTypes';
import type { HostingWizardPrefill } from './hostingWizardPrefill';

export const useHostingActivityFlowWizardLifecycle = (input: {
  open: boolean;
  user: { id: string } | null | undefined;
  onClose: () => void;
  closeMap: () => void;
  wizardPrefill: HostingWizardPrefill | null | undefined;
  editActivity: ActivityDTO | null | undefined;
  hostComposeKind: HostComposeKind | null | undefined;
  hostingKindFlow: HostingKindFlow | null | undefined;
  hostingFlowId: string | null;
  wizardSessionScope: string | undefined;
  wizardInitKey: string | null;
  hostingFlowIdForPersist: string | null;
  step: HostingActivityFlowStep;
  draft: CreateActivityDraft;
  selectedKind: CreateActivityKind | null;
  publishStatus: HostingPublishFlowStatus;
  setError: (value: string | null) => void;
  setPublishStatus: (value: HostingPublishFlowStatus) => void;
  setShowMonthView: (value: boolean) => void;
  setDraft: (value: CreateActivityDraft) => void;
  setSelectedKind: (value: CreateActivityKind | null) => void;
  setStep: (value: HostingActivityFlowStep) => void;
}) => {
  const wizardInitializedRef = useRef<string | null>(null);

  useEffect(() => {
    if (!input.open) {
      input.setError(null);
      input.setPublishStatus(HOSTING_PUBLISH_FLOW_IDLE);
      input.setShowMonthView(false);
      input.closeMap();
      return;
    }

    if (input.wizardInitKey && wizardInitializedRef.current === input.wizardInitKey) return;

    if (input.wizardPrefill?.draft.kind) {
      const prefillKind = input.wizardPrefill.draft.kind;
      input.setDraft(hydrateCreateActivityDraft(input.wizardPrefill.draft));
      input.setSelectedKind(prefillKind);
      const steps = input.hostingKindFlow
        ? input.hostingKindFlow.getSteps({
            placeLabelSource: input.wizardPrefill.draft.placeLabelSource,
            registryPlaceId: input.wizardPrefill.draft.registryPlaceId,
            communityHostFlow: input.wizardPrefill.draft.communityHostFlow,
          })
        : getCreateFlowSteps(prefillKind, input.wizardPrefill.draft.communityHostFlow);
      input.setStep(steps[0] ?? 'title');
      input.setError(null);
      input.setPublishStatus(HOSTING_PUBLISH_FLOW_IDLE);
      input.setShowMonthView(false);
      input.closeMap();
      wizardInitializedRef.current = input.wizardInitKey;
      return;
    }

    if (input.hostComposeKind && input.hostingFlowId) {
      const flowId = normalizeComposeFlowId(input.hostingFlowId);
      const saved = flowId
        ? readHostingWizardSession(flowId, input.wizardSessionScope)
        : null;
      if (saved?.draft?.kind) {
        input.setDraft(hydrateCreateActivityDraft(saved.draft));
        input.setSelectedKind(saved.selectedKind);
        input.setStep(saved.step as HostingActivityFlowStep);
        input.setError(null);
        input.setPublishStatus(HOSTING_PUBLISH_FLOW_IDLE);
        input.setShowMonthView(false);
        input.closeMap();
        wizardInitializedRef.current = input.wizardInitKey;
        return;
      }

      const seed = hostingPublishSeed(input.hostComposeKind);
      const createKind = seed.createKind;
      const participationMode =
        defaultParticipationForHostRoute(input.hostComposeKind) ?? seed.participationMode;
      const nextDraft: CreateActivityDraft = {
        ...emptyCreateActivityDraft(),
        kind: createKind,
        communityHostFlow: seed.communityHostFlow,
        participationMode,
        capacity: defaultCapacityForKind(createKind),
        joinMode: 'open',
      };
      input.setDraft(nextDraft);
      input.setSelectedKind(createKind);
      input.setStep(getCreateFlowSteps(createKind, seed.communityHostFlow)[0]);
      input.setError(null);
      input.setPublishStatus(HOSTING_PUBLISH_FLOW_IDLE);
      input.setShowMonthView(false);
      input.closeMap();
      wizardInitializedRef.current = input.wizardInitKey;
      return;
    }

    if (!input.user) {
      input.onClose();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- input bag decomposed; whole input retriggers wizard reset
  }, [
    input.open,
    input.user,
    input.onClose,
    input.wizardPrefill,
    input.editActivity,
    input.hostComposeKind,
    input.hostingKindFlow,
    input.hostingFlowId,
    input.wizardSessionScope,
    input.wizardInitKey,
    input.closeMap,
    input.setDraft,
    input.setSelectedKind,
    input.setStep,
    input.setError,
    input.setPublishStatus,
    input.setShowMonthView,
  ]);

  useEffect(() => {
    if (!input.open || !input.hostingFlowIdForPersist || hostingPublishFlowBlocksSessionPersist(input.publishStatus)) {
      return;
    }
    const flowId = normalizeComposeFlowId(input.hostingFlowIdForPersist);
    if (!flowId) return;
    const linkToParentActivityId =
      input.wizardPrefill?.linkToParentActivityId ??
      readHostingWizardSession(flowId, input.wizardSessionScope)?.linkToParentActivityId;
    writeHostingWizardSession(
      flowId,
      {
        step: input.step,
        draft: input.draft,
        selectedKind: input.selectedKind,
        ...(linkToParentActivityId ? { linkToParentActivityId } : {}),
        ...(input.wizardPrefill?.sourceActivityId ? { sourceActivityId: input.wizardPrefill.sourceActivityId } : {}),
      },
      input.wizardSessionScope
    );
  }, [
    input.open,
    input.hostingFlowIdForPersist,
    input.wizardSessionScope,
    input.step,
    input.draft,
    input.selectedKind,
    input.publishStatus,
    input.wizardPrefill?.linkToParentActivityId,
    input.wizardPrefill?.sourceActivityId,
  ]);
};