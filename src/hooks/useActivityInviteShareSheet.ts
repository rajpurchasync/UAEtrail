import {
  useOptionalShareSheet,
  useShareSheet,
  type ShareFlowOptions,
  type ShareSheetApi,
} from '../context/ShareSheetContext';

export { useShareSheet, type ShareFlowOptions, type ShareSheetApi };

const noopShareSheet: ShareSheetApi = {
  openShare: () => {},
  openInvite: () => {},
  openShareFromActivity: () => {},
  openInviteFromActivity: () => {},
  closeInvite: () => {},
};

/** Activity / plan share flows — prefers app `ShareSheetProvider`, no-ops if absent (tests). */
export function useActivityInviteShareSheet(): ShareSheetApi {
  return useOptionalShareSheet() ?? noopShareSheet;
}
