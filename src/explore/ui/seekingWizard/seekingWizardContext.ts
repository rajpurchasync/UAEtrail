import type { AreaPublicDTO } from '@uaetrail/shared-types';
import type { SeekingComposeKind } from '../../compose';
import { COMPOSE_MAP_INTENTS } from '../../create/interactions';
import type { SeekingDraft, SeekingFlowStepId, SeekingKind } from '../seekingFlowEngine';

export type SeekingWizardFlowStep = 'type' | SeekingFlowStepId;

export type SeekingMapOpen = (
  intent: typeof COMPOSE_MAP_INTENTS.seekFrom | typeof COMPOSE_MAP_INTENTS.seekTo
) => void;

export type SeekingWizardContext = {
  step: SeekingWizardFlowStep;
  seekKind: SeekingComposeKind | null;
  kind: SeekingKind | null;
  selectedKind: SeekingKind | null;
  setSelectedKind: (kind: SeekingKind | null) => void;
  draft: SeekingDraft;
  patchDraft: (patch: Partial<SeekingDraft>) => void;
  error: string | null;
  submitting: boolean;
  headerTitle: string;
  widePageSteps: SeekingFlowStepId[];
  pageHas: (id: SeekingFlowStepId) => boolean;
  flowSteps: SeekingFlowStepId[];
  dateOptions: Array<{ iso: string; label: string; day: number }>;
  showMonthView: boolean;
  setShowMonthView: (value: boolean | ((prev: boolean) => boolean)) => void;
  publishedAreas: AreaPublicDTO[];
  goNext: () => void;
  goBack: () => void;
  goToFirstStep: () => void;
  goToStep: (step: SeekingFlowStepId) => void;
  requestClose: () => void;
  handleSubmit: () => void;
  openMap: SeekingMapOpen;
};
