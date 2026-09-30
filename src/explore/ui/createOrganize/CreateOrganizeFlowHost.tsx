import type { ActivityDTO } from '@uaetrail/shared-types';
import type { OrganizeComposeKind } from '../../compose';
import { CreateActivityFlow } from '../CreateActivityFlow';
import {
  CreateOrganizeActivitiesFlow,
  CreateOrganizeCampingFlow,
  CreateOrganizeEventsFlow,
  CreateOrganizeHikingFlow,
  CreateOrganizeRideshareFlow,
} from './index';

export type CreateOrganizeFlowHostProps = {
  open: boolean;
  onClose: () => void;
  onPublished?: (activity: ActivityDTO) => void | Promise<void>;
  onOpenHostApplication?: () => void;
  onBackToIntent?: () => void;
  signInHref: string;
  organizeKind: OrganizeComposeKind | null;
  demandPrefill: import('../organizeWizardPrefill').OrganizeWizardPrefill | null;
};

/** Routes FAB organize compose to one catalog flow wizard (see `composeFlowCatalog`). */
export const CreateOrganizeFlowHost = ({
  open,
  onClose,
  onPublished,
  onOpenHostApplication,
  onBackToIntent,
  signInHref,
  organizeKind,
  demandPrefill,
}: CreateOrganizeFlowHostProps) => {
  const resolvedKind = organizeKind ?? demandPrefill?.draft.kind ?? null;

  const shared = {
    open,
    onClose,
    onPublished,
    onOpenHostApplication,
    onBackToIntent,
    signInHref,
    demandPrefill,
  };

  switch (resolvedKind) {
    case 'hiking':
      return <CreateOrganizeHikingFlow {...shared} />;
    case 'camping':
      return <CreateOrganizeCampingFlow {...shared} />;
    case 'event':
      return <CreateOrganizeEventsFlow {...shared} />;
    case 'activity':
      return <CreateOrganizeActivitiesFlow {...shared} />;
    case 'carpool':
      return <CreateOrganizeRideshareFlow {...shared} />;
    default:
      return <CreateActivityFlow {...shared} organizeKind={null} />;
  }
};
