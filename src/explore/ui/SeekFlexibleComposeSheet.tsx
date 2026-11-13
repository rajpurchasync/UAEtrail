import { useEffect, useMemo, useState } from 'react';
import type { MemberAvailabilityMatchPreviewDTO } from '@uaetrail/shared-types';
import { PlanAvailabilitySection } from '../../components/plan/PlanAvailabilitySection';
import { EXPLORE_Z } from '../../config/exploreTheme';
import { fetchMyAvailabilityMatchPreview } from '../../hooks/memberAvailabilityApi';
import { useExplorePublishedAreas } from '../useExplorePublishedAreas';
import { areaIdForExploreAreaSlug } from '../exploreAreaFilter';
import { AvailabilityMatchPreview } from './AvailabilityMatchPreview';
import { ExploreResponsiveSheet } from './ExploreResponsiveSheet';
import { FlowSheetHeader } from './ExploreFlowSheetChrome';

type SeekFlexibleComposeSheetProps = {
  open: boolean;
  onClose: () => void;
  /** Map `?area=` slug — optional area prefill in the editor. */
  exploreAreaSlug?: string | null;
};

/** FAB path — share member availability (no map pin). */
export const SeekFlexibleComposeSheet = ({
  open,
  onClose,
  exploreAreaSlug = null,
}: SeekFlexibleComposeSheetProps) => {
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
      title="Share my availability"
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
          <PlanAvailabilitySection
            variant="fab"
            prefillAreaId={prefillAreaId}
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
