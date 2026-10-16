import { useEffect, useMemo, useState } from 'react';
import type { AreaPublicDTO, MemberAvailabilityMatchPreviewDTO } from '@uaetrail/shared-types';
import { X } from 'lucide-react';
import { PlanAvailabilitySection } from '../../components/plan/PlanAvailabilitySection';
import { EXPLORE_FLOW, EXPLORE_Z } from '../../config/exploreTheme';
import { fetchPublishedAreas } from '../../hooks/areaHubClientApi';
import { fetchMyAvailabilityMatchPreview } from '../../hooks/memberAvailabilityApi';
import { areaIdForExploreAreaSlug } from '../exploreAreaFilter';
import { AvailabilityMatchPreview } from './AvailabilityMatchPreview';
import { ExploreResponsiveSheet } from './ExploreResponsiveSheet';

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
  const [publishedAreas, setPublishedAreas] = useState<AreaPublicDTO[]>([]);
  const [step, setStep] = useState<'form' | 'preview'>('form');
  const [preview, setPreview] = useState<MemberAvailabilityMatchPreviewDTO | null>(null);

  useEffect(() => {
    if (!open) return;
    setStep('form');
    setPreview(null);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    void fetchPublishedAreas()
      .then((areas) => {
        if (!cancelled) setPublishedAreas(areas);
      })
      .catch(() => {
        if (!cancelled) setPublishedAreas([]);
      });
    return () => {
      cancelled = true;
    };
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
      panelClassName="overflow-hidden px-0 pb-[calc(var(--safe-bottom)+1.5rem)] pt-0 lg:pb-8 lg:pt-3"
    >
      <div className="px-5 pt-2 lg:px-6 lg:pt-0">
        <header className={EXPLORE_FLOW.stepHeaderShell}>
          <button
            type="button"
            onClick={onClose}
            className="absolute right-0 top-2 -mr-2 rounded-full p-2.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
          <div className={EXPLORE_FLOW.stepTitleBlock}>
            <h2 className={EXPLORE_FLOW.stepTitle}>
              {step === 'preview' ? 'Matches for you' : 'When are you free?'}
            </h2>
            {step === 'form' ? (
              <p className={`mt-2 ${EXPLORE_FLOW.choiceCardSubtitle}`}>
                Pick days and what you’re open to — region and area are optional. No map pin.
              </p>
            ) : null}
          </div>
        </header>
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
