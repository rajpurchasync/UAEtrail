import { useEffect, useMemo, useRef, useState } from 'react';
import type { AvailabilitySlotCapacity, MemberAvailabilityMatchPreviewDTO } from '@uaetrail/shared-types';
import {
  AvailabilitySlotEditor,
  type AvailabilitySlotEditorHandle,
} from '../../availability/AvailabilitySlotEditor';
import {
  prefillOpenIntentCompose,
  writeIntentOpenComposeCapacity,
} from '../../availability/availabilitySlotComposeEngine';
import { fetchMyAvailabilityMatchPreview } from '../../hooks/memberAvailabilityApi';
import { useExplorePublishedDestinations } from '../useExplorePublishedDestinations';
import { destinationIdForExploreDestinationSlug } from '../exploreDestinationFilter';
import { AvailabilityMatchPreview } from './AvailabilityMatchPreview';
import { ComposeWizardShell, ComposeWizardStepChrome } from '../create/ComposeWizardShell';
import { composeWizardErrorFooter } from '../create/composeWizardStepFooter';
import { useIsMobile } from '../../hooks/useIsMobile';
import { useComposeWizardExitBack } from '../create/useComposeWizardExitBack';
import { finishComposeFlowClose, requestComposeFlowClose } from './composeFlowClose';
import { exploreFlowChoiceCardClass } from './exploreFlowUi';
import { EXPLORE_FLOW } from '../../config/exploreTheme';
import { ComposeWizardPrimaryButton } from './ComposeWizardPrimaryButton';
import { AVAILABILITY_MODE_OPTIONS, type ExploreCompose } from '../compose';
import { UPL_INTENT_OPEN_ACTION, UPL_INTENT_SCHEDULE_QUESTION } from '../../content/upl-glossary';
import { IntentComposeLaneStep } from './intentCompose/IntentComposeLaneStep';

type IntentOpenStep = 'schedule' | 'lane' | 'form-days' | 'form-details' | 'preview';

export type IntentOpenComposeSheetProps = {
  open: boolean;
  onClose: () => void;
  /** Map `?destination=` slug — optional destination prefill in the editor. */
  exploredestinationSlug?: string | null;
  /** Compose URL `capacity=guide` prefill for open slots. */
  intentOpenCapacityParam?: string | null;
  onComposeRouteChange?: (route: ExploreCompose) => void;
  onBackToIntent?: () => void;
};

/**
 * Explore FAB — `compose=intent:open` (open intent / share availability signal).
 * Uses the same compose wizard shell as fixed intent, place, and activity flows.
 */
export const IntentOpenComposeSheet = ({
  open,
  onClose,
  exploreDestinationSlug = null,
  intentOpenCapacityParam = null,
  onComposeRouteChange,
  onBackToIntent,
}: IntentOpenComposeSheetProps) => {
  const publishedDestinations = useExplorePublishedDestinations();
  const isMobile = useIsMobile();
  const [step, setStep] = useState<IntentOpenStep>('schedule');
  const [preview, setPreview] = useState<MemberAvailabilityMatchPreviewDTO | null>(null);
  const [scheduleMode, setScheduleMode] = useState<'open' | 'fixed' | null>(null);
  const [lane, setLane] = useState<AvailabilitySlotCapacity | null>(null);
  const [laneError, setLaneError] = useState<string | null>(null);
  const [scheduleError, setScheduleError] = useState<string | null>(null);
  const [daysStepError, setDaysStepError] = useState<string | null>(null);
  const openEditorRef = useRef<AvailabilitySlotEditorHandle>(null);

  const urlPrefillCapacity = useMemo((): AvailabilitySlotCapacity | null => {
    if (intentOpenCapacityParam === 'guide') return 'guide';
    if (intentOpenCapacityParam === 'participant') return 'participant';
    return null;
  }, [intentOpenCapacityParam]);

  useEffect(() => {
    if (!open) return;
    setPreview(null);
    setScheduleMode('open');
    setLane(urlPrefillCapacity);
    setLaneError(null);
    setScheduleError(null);
    if (urlPrefillCapacity) {
      writeIntentOpenComposeCapacity(urlPrefillCapacity);
      setStep('form-days');
      return;
    }
    setStep('schedule');
  }, [open, urlPrefillCapacity]);

  const prefillAreaId = useMemo(
    () => destinationIdForExploreDestinationSlug(publishedDestinations, exploreDestinationSlug),
    [publishedDestinations, exploreDestinationSlug]
  );

  const composePrefill = useMemo(() => {
    const capacity = lane ?? urlPrefillCapacity ?? 'participant';
    return prefillOpenIntentCompose({ capacityParam: capacity === 'guide' ? 'guide' : null });
  }, [lane, urlPrefillCapacity]);

  const finishClose = () => finishComposeFlowClose(onClose);
  const formStepActive = step === 'form-days' || step === 'form-details';
  const requestClose = () =>
    requestComposeFlowClose(
      { hasDraft: step !== 'schedule', inProgress: formStepActive },
      finishClose
    );
  const exitWizardBack = useComposeWizardExitBack(requestClose, onBackToIntent);

  const goBack = () => {
    if (step === 'preview') {
      setStep('form-details');
      return;
    }
    if (step === 'form-details') {
      setDaysStepError(null);
      setStep('form-days');
      return;
    }
    if (step === 'form-days') {
      if (urlPrefillCapacity) {
        exitWizardBack();
        return;
      }
      setStep('lane');
      return;
    }
    if (step === 'lane') {
      setStep('schedule');
      return;
    }
    exitWizardBack();
  };

  const headerTitle =
    step === 'schedule'
      ? UPL_INTENT_SCHEDULE_QUESTION
      : step === 'preview'
        ? 'Matches for you'
        : step === 'form-days'
          ? 'Select your days'
          : step === 'form-details'
            ? UPL_INTENT_OPEN_ACTION
            : undefined;

  const proceedFromSchedule = () => {
    if (!scheduleMode) {
      setScheduleError('Choose fixed or flexible to continue.');
      return;
    }
    setScheduleError(null);
    if (scheduleMode === 'fixed') {
      onComposeRouteChange?.({ surface: 'menu', composeKind: 'intent', mode: 'fixed' });
      return;
    }
    setStep('lane');
  };

  const proceedFromLane = () => {
    if (!lane) {
      setLaneError('Choose how you want to show up in Find crew.');
      return;
    }
    setLaneError(null);
    writeIntentOpenComposeCapacity(lane);
    setDaysStepError(null);
    setStep('form-days');
  };

  const proceedFromDays = () => {
    const err = openEditorRef.current?.validateDaysStep() ?? null;
    if (err) {
      setDaysStepError(err);
      return;
    }
    setDaysStepError(null);
    setStep('form-details');
  };

  const handleSaved = async () => {
    try {
      const data = await fetchMyAvailabilityMatchPreview();
      const hasSignals = data.hostedOutings.length > 0;
      if (hasSignals) {
        setPreview(data);
        setStep('preview');
        return;
      }
    } catch {
      // preview is optional — still close on save
    }
    onClose();
  };

  if (!open) return null;

  return (
    <ComposeWizardShell mapOpen={false} mapOverlay={null} onClose={requestClose} isMobile={isMobile}>
      {step === 'schedule' ? (
        <ComposeWizardStepChrome title={headerTitle} onClose={requestClose} onBack={goBack}>
          <div className="space-y-2">
            {AVAILABILITY_MODE_OPTIONS.map((option) => {
              const active = scheduleMode === option.mode;
              return (
                <button
                  key={option.mode}
                  type="button"
                  onClick={() => setScheduleMode(option.mode)}
                  className={`w-full text-left ${exploreFlowChoiceCardClass(active)}`}
                >
                  <p className={`${EXPLORE_FLOW.choiceCardTitle} flex items-center gap-2`}>
                    <span aria-hidden>{option.emoji}</span>
                    {option.label}
                  </p>
                  <p className={EXPLORE_FLOW.choiceCardSubtitle}>{option.hint}</p>
                </button>
              );
            })}
          </div>
          {composeWizardErrorFooter(
            scheduleError,
            <ComposeWizardPrimaryButton label="Next" onClick={proceedFromSchedule} />
          )}
        </ComposeWizardStepChrome>
      ) : null}

      {step === 'lane' ? (
        <IntentComposeLaneStep
          lane={lane}
          onLaneChange={(capacity) => {
            setLane(capacity);
            setLaneError(null);
          }}
          error={laneError}
          headerTitle={headerTitle}
          onClose={requestClose}
          onBack={goBack}
          onNext={proceedFromLane}
        />
      ) : null}

      {step === 'form-days' || step === 'form-details' ? (
        <ComposeWizardStepChrome title={headerTitle} onClose={requestClose} onBack={goBack}>
          <AvailabilitySlotEditor
            ref={openEditorRef}
            variant="fab"
            prefillAreaId={prefillAreaId}
            composePrefill={composePrefill}
            showCapacityChooser={false}
            editorSection={step === 'form-days' ? 'days' : 'details'}
            onSaved={handleSaved}
          />
          {step === 'form-days'
            ? composeWizardErrorFooter(
                daysStepError,
                <ComposeWizardPrimaryButton label="Next" onClick={proceedFromDays} />
              )
            : null}
        </ComposeWizardStepChrome>
      ) : null}

      {step === 'preview' && preview ? (
        <ComposeWizardStepChrome title={headerTitle} onClose={requestClose} onBack={goBack}>
          <AvailabilityMatchPreview preview={preview} onDone={onClose} />
        </ComposeWizardStepChrome>
      ) : null}
    </ComposeWizardShell>
  );
};