import type { HostComposeKind } from '../../compose';
import type { HostingKindFlow } from '../../ui/hostingFlows';
import {
  CreateHostingActivityFlow,
  type CreateHostingActivityFlowProps,
} from '../../ui/CreateHostingActivityFlow';

type HostingBoundFlowProps = Omit<CreateHostingActivityFlowProps, 'hostingKindFlow' | 'hostComposeKind'>;

export const bindHostingKindFlow = (
  hostingKindFlow: HostingKindFlow,
  composeKind: HostComposeKind
) => {
  const BoundHostingFlow = (props: HostingBoundFlowProps) => (
    <CreateHostingActivityFlow
      {...props}
      hostingKindFlow={hostingKindFlow}
      hostComposeKind={composeKind}
    />
  );
  BoundHostingFlow.displayName = `CreateHosting${composeKind}Flow`;
  return BoundHostingFlow;
};
