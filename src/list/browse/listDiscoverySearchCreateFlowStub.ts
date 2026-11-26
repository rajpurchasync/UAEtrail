import type { CreateFlowBridge } from '../../create/CreateFlowProvider';
import { useComposeRoute } from '../../discovery/discoveryPortExploreComposeHooks';

type ComposeApi = ReturnType<typeof useComposeRoute>;

/** Search results list — no compose FAB; safe when `CreateFlowProvider` is absent during recovery. */
export const listDiscoverySearchComposeStub = (): ComposeApi =>
  ({
    handleCreateTap: () => undefined,
    setComposeRoute: () => undefined,
    closeCompose: () => undefined,
    closeGuestComposeSignIn: () => undefined,
    guestComposeSignInReturnPath: '',
    activityComposeRoute: null,
    guestComposeSignInOpen: false,
  }) as unknown as ComposeApi;

export const listDiscoverySearchRegisterBridgeStub = (_bridge: CreateFlowBridge | null) => undefined;