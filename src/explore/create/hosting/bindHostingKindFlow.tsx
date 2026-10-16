import type { OrganizeComposeKind } from '../../compose';
import type { HostingKindFlow } from '../../ui/hostingFlow';
import {
  CreateHostingActivityFlow,
  type CreateHostingActivityFlowProps,
} from '../../ui/CreateHostingActivityFlow';

type HostingBoundFlowProps = Omit<CreateHostingActivityFlowProps, 'hostingKindFlow' | 'organizeKind'>;

export const bindHostingKindFlow = (
  hostingKindFlow: HostingKindFlow,
  composeKind: OrganizeComposeKind
) => {
  const BoundHostingFlow = (props: HostingBoundFlowProps) => (
    <CreateHostingActivityFlow
      {...props}
      hostingKindFlow={hostingKindFlow}
      organizeKind={composeKind}
    />
  );
  BoundHostingFlow.displayName = `CreateHosting${composeKind}Flow`;
  return BoundHostingFlow;
};
