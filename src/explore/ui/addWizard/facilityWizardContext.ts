import type { AreaPublicDTO } from '@uaetrail/shared-types';
import type { FacilityAddDraft, FacilityAddStepId } from '../addFacilityFlow';

export type FacilityAddWizardContext = {
  step: FacilityAddStepId;
  headerTitle: string;
  draft: FacilityAddDraft;
  patchDraft: (patch: Partial<FacilityAddDraft>) => void;
  error: string | null;
  submitting: boolean;
  publishedAreas: AreaPublicDTO[];
  goNext: () => void;
  goBack: () => void;
  requestClose: () => void;
  handleSubmit: () => void;
  openLocationMap: () => void;
};
