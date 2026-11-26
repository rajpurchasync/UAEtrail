import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { useNavigate } from 'react-router-dom';
import { useProductLocation, useProductSearchParams } from '../routing/useEffectiveLocation';
import { useQueryClient } from '@tanstack/react-query';
import type { ActivityDTO } from '@uaetrail/shared-types';
import { useAuth } from '../context/AuthContext';
import { EXPLORE_MAP_PATH } from '../config/platform';
import type { AddSubmitResult } from '../discovery/discoveryPortExploreAddFlow';
import {
  addVenueKindFromRoute,
  isComposeWizardRoute,
} from '../discovery/discoveryPortExploreCompose';
import { ComposeHost } from '../discovery/discoveryPortExploreComposeSurface';
import { useComposeRoute } from '../discovery/discoveryPortExploreComposeSurface';
import { clearComposeWizardSessionForRoute } from '../discovery/discoveryPortExploreComposeSurface';
import { parseExploreDestinationSlug } from '../discovery/discoveryPortExploreBrowse';
import { GuestComposeSignInSheet } from '../discovery/discoveryPortExploreComposeGuest';
import type { HostingWizardPrefill } from '../discovery/discoveryPortExploreHosting';
import type { AvailabilityFixedSubmitResult } from '../discovery/discoveryPortExploreIntentFixedFlow';
import {
  parseFacilityOnPlaceId,
  parsePlanWithUserId,
} from '../discovery/discoveryPortExploreRouting';
import { useMemberStatus } from '../hooks/useMemberStatus';
import { reloadExploreMap } from '../hooks/useExploreMap';
import { useMinWidthMd } from '../hooks/useMinWidthMd';
import { buildSignInRedirect } from '../utils/authReturnContext';
import {
  memberPublishGateHref,
  memberPublishGateInputFromMemberStatus,
} from '../utils/memberPublishGate';

export type CreateFlowBridge = {
  hostingWizardPrefill?: HostingWizardPrefill | null;
  onCloseCreateFlow?: () => void;
  onHostingBackToIntent?: () => void;
  onActivityPublished?: (activity: ActivityDTO) => void | Promise<void>;
  onCreateLinkedRideshare?: (parent: ActivityDTO) => void;
  /** Fixed availability map post (`availability:fixed`) submitted — reload browse surfaces. */
  onAvailabilityFixedSubmitted?: (result: AvailabilityFixedSubmitResult) => void;
  onAddSubmitted?: (result: AddSubmitResult) => void;
  planWithFriendUserId?: string | null;
  composeDestinationSlug?: string | null;
  facilityOnPlaceId?: string | null;
  tenantId?: string | null;
};

type CreateFlowContextValue = {
  compose: ReturnType<typeof useComposeRoute>;
  registerBridge: (bridge: CreateFlowBridge | null) => void;
};

const CreateFlowContext = createContext<CreateFlowContextValue | null>(null);

/** Product-shell create session — overlay on the current route, not an Explore page. */
export const CreateFlowProvider = ({ children }: { children: ReactNode }) => {
  const { user, initializing: authInitializing } = useAuth();
  const navigate = useNavigate();
  const { pathname, search } = useProductLocation();
  const [searchParams, setSearchParams] = useProductSearchParams();
  const queryClient = useQueryClient();
  const isDesktop = useMinWidthMd();
  const {
    canPublish,
    profileComplete,
    guideProfileComplete,
    isCommunityHost,
    hostTiers,
    tenantId,
    refresh: refreshHostGate,
  } = useMemberStatus({ enabled: Boolean(user) });

  const compose = useComposeRoute({
    user,
    authInitializing,
    navigate,
    pathname,
    search,
    searchParams,
    setSearchParams,
  });

  const bridgeRef = useRef<CreateFlowBridge | null>(null);
  const [bridgeGeneration, setBridgeGeneration] = useState(0);
  const registerBridge = useCallback((next: CreateFlowBridge | null) => {
    const prev = bridgeRef.current;
    bridgeRef.current = next;
    if (
      Boolean(prev) !== Boolean(next) ||
      prev?.hostingWizardPrefill !== next?.hostingWizardPrefill ||
      prev?.tenantId !== next?.tenantId ||
      prev?.composeDestinationSlug !== next?.composeDestinationSlug ||
      prev?.facilityOnPlaceId !== next?.facilityOnPlaceId ||
      prev?.planWithFriendUserId !== next?.planWithFriendUserId
    ) {
      setBridgeGeneration((n) => n + 1);
    }
  }, []);
  const bridge = bridgeRef.current;
  void bridgeGeneration;

  const signInHref = useMemo(
    () => buildSignInRedirect({ pathname, search }).href,
    [pathname, search]
  );

  const navigateMemberPublishGate = useCallback(
    (returnPath: string) =>
      navigate(
        memberPublishGateHref(
          returnPath,
          memberPublishGateInputFromMemberStatus({
            viewerUserId: user?.id ?? null,
            profileComplete,
            guideProfileComplete,
            canPublish,
            isCommunityHost,
            hostTiers,
          })
        )
      ),
    [navigate, user?.id, profileComplete, guideProfileComplete, canPublish, isCommunityHost, hostTiers]
  );

  const defaultRefresh = useCallback(async () => {
    await reloadExploreMap(queryClient);
    void refreshHostGate();
  }, [queryClient, refreshHostGate]);

  const hostingWizardPrefill = bridge?.hostingWizardPrefill ?? null;
  const activityWizardOpen = Boolean(user) && Boolean(compose.activityComposeRoute);
  const composeWizardActive = Boolean(user) && isComposeWizardRoute(compose.composeRoute);
  const guestComposeSignInOpen =
    compose.guestComposeSignInOpen && !composeWizardActive;

  const onCloseCreateFlow = bridge?.onCloseCreateFlow ?? compose.closeCompose;
  const onHostingBackToIntent =
    bridge?.onHostingBackToIntent ??
    (() => {
      clearComposeWizardSessionForRoute(compose.activityComposeRoute);
      compose.setComposeRoute({ surface: 'menu', composeKind: 'activity' });
    });

  const skipGuestComposeSheet = isDesktop && !user && pathname === EXPLORE_MAP_PATH;

  const value = useMemo(
    () => ({ compose, registerBridge }),
    [compose, registerBridge]
  );

  return (
    <CreateFlowContext.Provider value={value}>
      {children}
      <ComposeHost
        composeRoute={compose.composeRoute}
        composeMenuOpen={compose.composeMenuOpen}
        activityWizardOpen={activityWizardOpen}
        intentFixedWizardOpen={Boolean(compose.intentFixedRoute) && Boolean(user)}
        placeWizardOpen={Boolean(compose.placeRoute) && Boolean(user)}
        intentOpenWizardOpen={compose.intentOpenWizard && Boolean(user)}
        activityComposeKind={compose.activityComposeRoute?.kind ?? null}
        intentFixedKind={compose.intentFixedRoute?.kind}
        addVenueKind={addVenueKindFromRoute(compose.placeRoute)}
        hostingWizardPrefill={hostingWizardPrefill}
        signInHref={signInHref}
        onComposeRouteChange={compose.handleComposeRouteChange}
        onCloseCompose={compose.closeCompose}
        onCloseCreateFlow={onCloseCreateFlow}
        wizardEnteredFromMenu={compose.wizardEnteredFromMenu}
        intentMenuSuppressed={compose.guestComposeSignInOpen}
        onHostingBackToIntent={onHostingBackToIntent}
        onAvailabilityBackToIntent={() => {
          clearComposeWizardSessionForRoute(compose.composeRoute);
          compose.setComposeRoute({ surface: 'menu', composeKind: 'intent' });
        }}
        onAddBackToIntent={() => {
          clearComposeWizardSessionForRoute(compose.placeRoute);
          compose.setComposeRoute({ surface: 'menu', composeKind: 'place' });
        }}
        onActivityPublished={async (activity) => {
          if (bridge?.onActivityPublished) {
            await bridge.onActivityPublished(activity);
          } else {
            await defaultRefresh();
          }
        }}
        onAvailabilityFixedSubmitted={(result) => {
          if (bridge?.onAvailabilityFixedSubmitted) bridge.onAvailabilityFixedSubmitted(result);
          else void defaultRefresh();
        }}
        onAddSubmitted={(result) => {
          if (bridge?.onAddSubmitted) bridge.onAddSubmitted(result);
          else void defaultRefresh();
        }}
        onCreateLinkedRideshare={bridge?.onCreateLinkedRideshare}
        tenantId={bridge?.tenantId ?? tenantId}
        planWithFriendUserId={bridge?.planWithFriendUserId ?? parsePlanWithUserId(searchParams)}
        composeDestinationSlug={bridge?.composeDestinationSlug ?? parseExploreDestinationSlug(searchParams)}
        intentOpenCapacityParam={searchParams.get('capacity')}
        facilityOnPlaceId={bridge?.facilityOnPlaceId ?? parseFacilityOnPlaceId(searchParams)}
        onOpenHostApplication={() => {
          onCloseCreateFlow();
          navigateMemberPublishGate(`${pathname}${search}`);
        }}
      />
      {!skipGuestComposeSheet ? (
        <GuestComposeSignInSheet
          open={guestComposeSignInOpen}
          onClose={compose.closeGuestComposeSignIn}
          authReturnPath={compose.guestComposeSignInReturnPath}
        />
      ) : null}
    </CreateFlowContext.Provider>
  );
};

export const useCreateFlow = (): CreateFlowContextValue => {
  const ctx = useContext(CreateFlowContext);
  if (!ctx) {
    throw new Error('useCreateFlow must be used under CreateFlowProvider (ProductShell).');
  }
  return ctx;
};

export const useCreateFlowOptional = (): CreateFlowContextValue | null =>
  useContext(CreateFlowContext);
