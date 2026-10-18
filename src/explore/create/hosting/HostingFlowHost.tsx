import type { ActivityDTO } from '@uaetrail/shared-types';
import type { OrganizeComposeKind } from '../../compose';
import { CreateHostingActivityFlow } from '../../ui/CreateHostingActivityFlow';
import {
  CreateHostingActivitiesFlow,
  CreateHostingCampingFlow,
  CreateHostingEventsFlow,
  CreateHostingHikingFlow,
  CreateHostingRideshareFlow,
} from './index';

export type HostingFlowHostProps = {
  open: boolean;
  onClose: () => void;
  onPublished?: (activity: ActivityDTO) => void | Promise<void>;
  onOpenHostApplication?: () => void;
  onBackToIntent?: () => void;
  signInHref: string;
  planHostingKind: OrganizeComposeKind | null;
  hostingWizardPrefill: import('../../ui/organizeWizardPrefill').OrganizeWizardPrefill | null;
  onCreateLinkedRideshare?: (parentActivity: ActivityDTO) => void;
  planWithBuddyUserId?: string | null;
};

/** Routes plan hosting compose to one catalog wizard (`composeFlowCatalog` → `hostingFlow`). */
export const HostingFlowHost = ({
  open,
  onClose,
  onPublished,
  onOpenHostApplication,
  onBackToIntent,
  signInHref,
  planHostingKind,
  hostingWizardPrefill,
  onCreateLinkedRideshare,
  planWithBuddyUserId = null,
}: HostingFlowHostProps) => {
  const resolvedKind = planHostingKind ?? hostingWizardPrefill?.draft.kind ?? null;

  const shared = {
    open,
    onClose,
    onPublished,
    onOpenHostApplication,
    onBackToIntent,
    signInHref,
    seekingPrefill: hostingWizardPrefill,
    onCreateLinkedRideshare,
    planWithBuddyUserId,
  };

  switch (resolvedKind) {
    case 'hiking':
      return <CreateHostingHikingFlow {...shared} />;
    case 'camping':
      return <CreateHostingCampingFlow {...shared} />;
    case 'event':
      return <CreateHostingEventsFlow {...shared} />;
    case 'activity':
      return <CreateHostingActivitiesFlow {...shared} />;
    case 'rideshare':
      return <CreateHostingRideshareFlow {...shared} />;
    default:
      return <CreateHostingActivityFlow {...shared} organizeKind={null} />;
  }
};
