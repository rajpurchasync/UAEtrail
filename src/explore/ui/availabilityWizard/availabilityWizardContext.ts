import type { AreaPublicDTO } from '@uaetrail/shared-types';
import type { AvailabilityFixedComposeKind } from '../../compose';
import { COMPOSE_MAP_INTENTS } from '../../create/interactions';
import type {
  AvailabilityFixedDraft,
  AvailabilityFixedFlowStepId,
  AvailabilityFixedKind,
  IntentFixedWizardStepId,
} from '../intentFixedFlowEngine';

export type AvailabilityWizardFlowStep = 'type' | IntentFixedWizardStepId;

export type AvailabilityMapOpen = (
  intent: typeof COMPOSE_MAP_INTENTS.seekFrom | typeof COMPOSE_MAP_INTENTS.seekTo
) => void;

export type AvailabilityWizardContext = {
  step: AvailabilityWizardFlowStep;
  availabilityFixedKind: AvailabilityFixedComposeKind | null;
  kind: AvailabilityFixedKind | null;
  selectedKind: AvailabilityFixedKind | null;
  setSelectedKind: (kind: AvailabilityFixedKind | null) => void;
  draft: AvailabilityFixedDraft;
  patchDraft: (patch: Partial<AvailabilityFixedDraft>) => void;
  error: string | null;
  submitting: boolean;
  headerTitle: string;
  widePageSteps: IntentFixedWizardStepId[];
  pageHas: (id: IntentFixedWizardStepId) => boolean;
  flowSteps: IntentFixedWizardStepId[];
  canHostPaidActivities: boolean;
  dateOptions: Array<{ iso: string; label: string; day: number }>;
  showMonthView: boolean;
  setShowMonthView: (value: boolean | ((prev: boolean) => boolean)) => void;
  publishedAreas: AreaPublicDTO[];
  goNext: () => void;
  goBack: () => void;
  goToFirstStep: () => void;
  goToStep: (step: IntentFixedWizardStepId) => void;
  requestClose: () => void;
  handleSubmit: () => void;
  openMap: AvailabilityMapOpen;
};