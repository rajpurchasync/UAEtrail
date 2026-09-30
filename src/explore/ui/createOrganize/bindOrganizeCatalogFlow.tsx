import type { OrganizeComposeKind } from '../../compose';
import type { OrganizeCatalogFlow } from '../organizeFlows';
import {
  CreateActivityFlow,
  type CreateActivityFlowProps,
} from '../CreateActivityFlow';

type OrganizeBoundFlowProps = Omit<CreateActivityFlowProps, 'catalogFlow' | 'organizeKind'>;

export const bindOrganizeCatalogFlow = (
  catalogFlow: OrganizeCatalogFlow,
  organizeKind: OrganizeComposeKind
) => {
  const BoundOrganizeFlow = (props: OrganizeBoundFlowProps) => (
    <CreateActivityFlow {...props} catalogFlow={catalogFlow} organizeKind={organizeKind} />
  );
  BoundOrganizeFlow.displayName = `CreateOrganize${organizeKind}Flow`;
  return BoundOrganizeFlow;
};
