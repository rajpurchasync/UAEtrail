import { useEffect, useMemo, useState } from 'react';
import type { MemberAvailabilityMatchPreviewDTO } from '@uaetrail/shared-types';
import { AvailabilitySlotEditor } from '../../availability/AvailabilitySlotEditor';
import { prefillOpenIntentCompose } from '../../availability/availabilitySlotComposeEngine';
import { EXPLORE_Z } from '../../config/exploreTheme';
import { fetchMyAvailabilityMatchPreview } from '../../hooks/memberAvailabilityApi';
import { useExplorePublishedAreas } from '../useExplorePublishedAreas';
import { areaIdForExploreAreaSlug } from '../exploreAreaFilter';
import { AvailabilityMatchPreview } from './AvailabilityMatchPreview';
import { ExploreResponsiveSheet } from './ExploreResponsiveSheet';
import { FlowSheetHeader } from './ExploreFlowSheetChrome';
import { UPL_INTENT_OPEN_ACTION } from '../../content/upl-glossary';

export type IntentOpenComposeSheetProps = {
  open: boolean;
  onClose: () => void;
  /** Map `?area=` slug — optional area prefill in the editor. */
  exploreAreaSlug?: string | null;
  /** Compose URL `capacity=guide` prefill for open slots. */
  intentOpenCapacityParam?: string | null;
};

/**
 * Explore FAB — `compose=intent:open` (open intent / share availability signal).
 * Member availability schedule on profile/map (open days), not a map pin.
 */
export const IntentOpenComposeSheet = ({
  open,
  onClose,
  exploreAreaSlug = null,
  intentOpenCapacityParam = null,
}: IntentOpenComposeSheetProps) => {
  const publishedAreas = useExplorePublishedAreas();
  const [step, setStep] = useState<'form' | 'preview'>('form');
  const [preview, setPreview] = useState<MemberAvailabilityMatchPreviewDTO | null>(null);
  useEffect(() => {
    if (!open) return;
    setStep('form');
    setPreview(null);
  }, [open]);

  const prefillAreaId = useMemo(
    () => areaIdForExploreAreaSlug(publishedAreas, exploreAreaSlug),
    [publishedAreas, exploreAreaSlug]
  );

  const composePrefill = useMemo(
    () => prefillOpenIntentCompose({ capacityParam: intentOpenCapacityParam }),
    [intentOpenCapacityParam]
  );

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

  return (
    <ExploreResponsiveSheet
      open={open}
      onClose={onClose}
      title={UPL_INTENT_OPEN_ACTION}
      maxWidthClass="lg:max-w-lg"
      zClass={EXPLORE_Z.composeFlow}
      overlayFixed
      composePresentation="wizard"
      showHandle={false}
      showCloseButton={false}
      panelClassName="overflow-hidden px-0 pb-[calc(var(--safe-bottom)+1.5rem)] pt-0 lg:pb-8 lg:pt-3"
    >
      <div className="px-5 pt-2 lg:px-6 lg:pt-0">
        <FlowSheetHeader
          title={step === 'preview' ? 'Matches for you' : 'When are you free?'}
          onClose={onClose}
          onBack={step === 'preview' ? () => setStep('form') : undefined}
        />
        {open && step === 'form' ? (
          <AvailabilitySlotEditor
            variant="fab"
            prefillAreaId={prefillAreaId}
            composePrefill={composePrefill}
            onSaved={handleSaved}
          />
        ) : null}
        {step === 'preview' && preview ? (
          <AvailabilityMatchPreview preview={preview} onDone={onClose} />
        ) : null}
      </div>
    </ExploreResponsiveSheet>
  );
};