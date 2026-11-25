import type { DestinationPublicDTO } from '@uaetrail/shared-types';
import type { LucideIcon } from 'lucide-react';
import { COMPOSE_MAP_INTENTS } from '../../create/interactions';
import type { AddVenueKind } from '../../addTypes';
import type { AddDraft, AddFlowStepId } from '../addFlow';

export type AddMapOpen = (
  intent: typeof COMPOSE_MAP_INTENTS.addLocation | typeof COMPOSE_MAP_INTENTS.addParking
) => void;

export type AddWizardContext = {
  kind: AddVenueKind;
  kindTitle: string;
  KindIcon: LucideIcon;
  draft: AddDraft;
  patchDraft: (patch: Partial<AddDraft>) => void;
  error: string | null;
  submitting: boolean;
  headerTitle: string;
  widePageSteps: AddFlowStepId[];
  pageHas: (id: AddFlowStepId) => boolean;
  flowSteps: AddFlowStepId[];
  publishedDestinations: DestinationPublicDTO[];
  goNext: () => void;
  goBack: () => void;
  goToStep: (step: AddFlowStepId) => void;
  requestClose: () => void;
  handleSubmit: () => void;
  openMap: AddMapOpen;
};
