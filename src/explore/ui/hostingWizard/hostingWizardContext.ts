import type { HostTierFlags, OwnedHostProfileDTO, PlaceDTO, PublishingProfileKind } from '@uaetrail/shared-types';
import type { ReactNode } from 'react';
import type { HostComposeKind } from '../../compose';
import type { HostingKindFlow } from '../hostingFlows';
import type {
  CreateActivityDraft,
  CreateActivityKind,
  CreateFlowStepId,
  CreateFlowStepTitleOptions,
  buildDateOptions,
} from '../hostingFlowEngine';

export type HostingWizardFlowStep = 'type' | CreateFlowStepId;

import type { HostingWizardPrefill } from '../hostingWizardPrefill';

export type HostingWizardSeekingPrefill = HostingWizardPrefill | null;

export type HostingWizardContext = {
  step: HostingWizardFlowStep;
  stepTitle: string;
  kind: CreateActivityKind | null;
  draft: CreateActivityDraft;
  patchDraft: (patch: Partial<CreateActivityDraft>) => void;
  hostingKindFlow: HostingKindFlow | null;
  hostComposeKind: HostComposeKind | null;
  seekingPrefill: HostingWizardSeekingPrefill;
  error: string | null;
  tenantId: string | null;
  publishTenantOptions: OwnedHostProfileDTO[];
  publishTenantId: string | null;
  setPublishTenantId: (tenantId: string) => void;
  memberDisplayName: string | null;
  registryPlaces: PlaceDTO[];
  canPublish: boolean;
  hostTiers: HostTierFlags;
  publishingProfileKind: PublishingProfileKind | null;
  canHostPaidActivities: boolean;
  hostGateLoading: boolean;
  submitting: boolean;
  stepTitleOptions: CreateFlowStepTitleOptions;
  dateOptions: ReturnType<typeof buildDateOptions>;
  showMonthView: boolean;
  setShowMonthView: (value: boolean | ((prev: boolean) => boolean)) => void;
  hasFromPin: boolean;
  hasToPin: boolean;
  meetingPointMapOpen: boolean;
  setMeetingPointMapOpen: (open: boolean) => void;
  setWhereMapOpen: (open: boolean) => void;
  setRouteMapTarget: (target: 'from' | 'to' | null) => void;
  selectedKind: CreateActivityKind | null;
  setSelectedKind: (kind: CreateActivityKind | null) => void;
  goNext: () => void;
  goBack: () => void;
  goToFirstStep: () => void;
  handleClose: () => void;
  handlePublish: () => void;
  renderRoutePicker: (endpoint: 'from' | 'to') => ReactNode;
  hikingFlow: boolean;
  campingFlow: boolean;
  eventFlow: boolean;
  activityFlow: boolean;
  rideshareFlow: boolean;
  structuredFlow: boolean;
  goingFromFlow: boolean;
  isEditMode: boolean;
};
