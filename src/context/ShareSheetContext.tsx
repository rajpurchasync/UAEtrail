import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { ActivityDTO } from '@uaetrail/shared-types';
import { ActivityInviteShareSheet } from '../components/activity/ActivityInviteShareSheet';
import { ActivityOutingShareSheet } from '../components/activity/ActivityOutingShareSheet';
import { EXPLORE_Z } from '../config/exploreTheme';
import type { ActivityOutingSharePayload } from '../components/activity/ActivityOutingShareMenuBody';
import {
  activityShareInputFromActivity,
  buildActivitySharePayload,
  type ActivityShareInput,
} from '../utils/activityShare';

export type ShareFlowOptions = {
  canSendBuddyInvites?: boolean;
  initialSelectedBuddyIds?: string[];
  /** When set, in-app invite opens friends + groups for this outing. */
  activity?: ActivityShareInput | null;
};

type ShareFlowState = {
  sharePayload: ActivityOutingSharePayload;
  activity: ActivityShareInput | null;
  canSendBuddyInvites: boolean;
  initialSelectedBuddyIds?: string[];
  phase: 'menu' | 'invite';
};

export type ShareSheetApi = {
  openShare: (payload: ActivityOutingSharePayload, options?: ShareFlowOptions) => void;
  openInvite: (input: ActivityShareInput, options?: ShareFlowOptions) => void;
  openShareFromActivity: (dto: ActivityDTO, options?: ShareFlowOptions) => void;
  openInviteFromActivity: (dto: ActivityDTO, options?: ShareFlowOptions) => void;
  closeInvite: () => void;
};

const ShareSheetContext = createContext<ShareSheetApi | null>(null);

function useShareSheetState(): ShareSheetApi & { sheet: ReactNode } {
  const [state, setState] = useState<ShareFlowState | null>(null);

  const openShare = useCallback((payload: ActivityOutingSharePayload, options?: ShareFlowOptions) => {
    setState({
      sharePayload: payload,
      activity: options?.activity ?? null,
      canSendBuddyInvites: options?.canSendBuddyInvites ?? false,
      initialSelectedBuddyIds: options?.initialSelectedBuddyIds,
      phase: 'menu',
    });
  }, []);

  const openInvite = useCallback((input: ActivityShareInput, options?: ShareFlowOptions) => {
    setState({
      sharePayload: buildActivitySharePayload(input),
      activity: input,
      canSendBuddyInvites: options?.canSendBuddyInvites ?? false,
      initialSelectedBuddyIds: options?.initialSelectedBuddyIds,
      phase: 'invite',
    });
  }, []);

  const openShareFromActivity = useCallback((dto: ActivityDTO, options?: ShareFlowOptions) => {
    const activity = activityShareInputFromActivity(dto);
    setState({
      sharePayload: buildActivitySharePayload(activity),
      activity,
      canSendBuddyInvites: options?.canSendBuddyInvites ?? false,
      initialSelectedBuddyIds: options?.initialSelectedBuddyIds,
      phase: 'menu',
    });
  }, []);

  const openInviteFromActivity = useCallback((dto: ActivityDTO, options?: ShareFlowOptions) => {
    const activity = activityShareInputFromActivity(dto);
    setState({
      sharePayload: buildActivitySharePayload(activity),
      activity,
      canSendBuddyInvites: options?.canSendBuddyInvites ?? false,
      initialSelectedBuddyIds: options?.initialSelectedBuddyIds,
      phase: 'invite',
    });
  }, []);

  const closeInvite = useCallback(() => setState(null), []);

  const openInviteFromMenu = useCallback(() => {
    setState((prev) => (prev?.activity ? { ...prev, phase: 'invite' } : prev));
  }, []);

  const sharePayload = state?.sharePayload ?? null;

  const sheet = useMemo(
    () => (
      <>
        <ActivityOutingShareSheet
          open={Boolean(state && state.phase === 'menu')}
          sharePayload={sharePayload}
          showInviteOnApp={Boolean(state?.canSendBuddyInvites && state.activity)}
          onInviteOnApp={state?.canSendBuddyInvites && state?.activity ? openInviteFromMenu : undefined}
          onClose={closeInvite}
          zClass={EXPLORE_Z.shareSheet}
        />
        <ActivityInviteShareSheet
          open={Boolean(state && state.phase === 'invite' && state.activity)}
          activity={state?.activity ?? null}
          canSendBuddyInvites={state?.canSendBuddyInvites ?? false}
          initialSelectedBuddyIds={state?.initialSelectedBuddyIds}
          onClose={closeInvite}
        />
      </>
    ),
    [state, sharePayload, openInviteFromMenu, closeInvite]
  );

  return useMemo(
    () => ({
      sheet,
      openShare,
      openInvite,
      openShareFromActivity,
      openInviteFromActivity,
      closeInvite,
    }),
    [sheet, openShare, openInvite, openShareFromActivity, openInviteFromActivity, closeInvite]
  );
}

export function ShareSheetProvider({ children }: { children: ReactNode }) {
  const shareSheetApi = useShareSheetState();
  return (
    <ShareSheetContext.Provider value={shareSheetApi}>
      {children}
      {shareSheetApi.sheet}
    </ShareSheetContext.Provider>
  );
}

export function useShareSheet(): ShareSheetApi {
  const ctx = useContext(ShareSheetContext);
  if (!ctx) {
    throw new Error('useShareSheet must be used inside ShareSheetProvider');
  }
  return ctx;
}

/** Optional — ShareButton falls back to inline menu when provider is absent (tests). */
export function useOptionalShareSheet(): ShareSheetApi | null {
  return useContext(ShareSheetContext);
}

/** @deprecated Prefer `useShareSheet` — alias kept for existing call sites. */
export function useActivityInviteShareSheet() {
  return useShareSheet();
}
