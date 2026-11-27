import { useCallback } from 'react';
import { defaultHikingPackingItems, type ActivityDTO } from '@uaetrail/shared-types';
import { dismissComposeMapIfOpen } from '../create/interactions';
import {
  defaultCapacityForKind,
  getCreateFlowSteps,
  validateDraftStep,
  type CreateActivityDraft,
  type CreateActivityKind,
  type CreateFlowStepId,
} from './hostingFlowEngine';
import type { HostingActivityFlowStep } from './hostingActivityFlowTypes';
import type { HostingWizardPrefill } from './hostingWizardPrefill';

type MapSession = { open: boolean };

export const useHostingActivityFlowNavigation = (input: {
  mapSession: MapSession;
  closeMap: () => void;
  setError: (message: string | null) => void;
  step: HostingActivityFlowStep;
  setStep: (step: HostingActivityFlowStep) => void;
  kind: CreateActivityKind | null | undefined;
  draft: CreateActivityDraft;
  selectedKind: CreateActivityKind | null;
  patchDraft: (patch: Partial<CreateActivityDraft>) => void;
  wizardPages: CreateFlowStepId[][];
  widePageSteps: CreateFlowStepId[];
  currentPageIndex: number;
  wizardPrefill: HostingWizardPrefill | null | undefined;
  editActivity: ActivityDTO | null | undefined;
  hostComposeKind: string | null | undefined;
  requestClose: () => void;
  exitWizardBack: () => void;
}) => {
  const {
    mapSession,
    closeMap,
    setError,
    step,
    setStep,
    kind,
    draft,
    selectedKind,
    patchDraft,
    wizardPages,
    widePageSteps,
    currentPageIndex,
    wizardPrefill,
    editActivity,
    hostComposeKind,
    requestClose,
    exitWizardBack,
  } = input;

  const goToFirstStep = useCallback(() => {
    if (!selectedKind) return;
    patchDraft({
      kind: selectedKind,
      capacity: defaultCapacityForKind(selectedKind),
      priceMode: 'free',
      priceAmount: 0,
      ...(selectedKind === 'rideshare'
        ? { joinMode: 'open' as const, participationMode: 'approval' as const }
        : {}),
      ...(selectedKind === 'hiking'
        ? { packingAckMode: 'strict' as const, packingItems: defaultHikingPackingItems() }
        : selectedKind === 'event'
          ? { packingAckMode: 'lenient' as const, packingItems: defaultHikingPackingItems() }
          : {}),
    });
    setStep(getCreateFlowSteps(selectedKind)[0]);
  }, [patchDraft, selectedKind, setStep]);

  const goBack = useCallback(() => {
    if (dismissComposeMapIfOpen(mapSession.open, closeMap)) {
      setError(null);
      return;
    }
    if (step === 'type' || currentPageIndex <= 0) {
      if (wizardPrefill || editActivity) {
        requestClose();
        return;
      }
      if (step === 'type' && !hostComposeKind) {
        exitWizardBack();
        return;
      }
      if (currentPageIndex <= 0) {
        exitWizardBack();
        return;
      }
      setStep('type');
      return;
    }
    setStep(wizardPages[currentPageIndex - 1][0]);
  }, [
    mapSession.open,
    closeMap,
    step,
    currentPageIndex,
    wizardPrefill,
    editActivity,
    hostComposeKind,
    requestClose,
    exitWizardBack,
    wizardPages,
    setError,
    setStep,
  ]);

  const goNext = useCallback(() => {
    if (!kind || step === 'type') return;
    for (const id of widePageSteps) {
      const validation = validateDraftStep(id, draft);
      if (validation) {
        setError(validation);
        return;
      }
    }
    setError(null);
    if (currentPageIndex < 0 || currentPageIndex >= wizardPages.length - 1) return;
    setStep(wizardPages[currentPageIndex + 1][0]);
  }, [kind, step, draft, currentPageIndex, wizardPages, widePageSteps, setError, setStep]);

  return { goToFirstStep, goBack, goNext };
};