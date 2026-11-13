import { HostActivityCancelDialog } from '../../components/activity/HostActivityCancelDialog';
import { ExploreJoinOverlays } from '../ui/ExploreJoinOverlays';
import type { useExploreSelectionActions } from '../ui/useExploreSelectionActions';

type SelectionState = ReturnType<typeof useExploreSelectionActions>;

type Props = {
  selection: SelectionState;
  hostRemoveParticipantNotice: string | null;
  useDesktopGuestGatePanel: boolean;
};

/** Join overlays and host dialogs. Create wizards live on {@link CreateFlowProvider}. */
export const ExploreExperienceOverlays = ({
  selection,
  hostRemoveParticipantNotice,
  useDesktopGuestGatePanel,
}: Props) => (
  <>
    <HostActivityCancelDialog
      activity={selection.hostRemoveConfirm}
      participantNotice={hostRemoveParticipantNotice}
      busy={selection.hostRemoveBusy}
      onClose={() => selection.setHostRemoveConfirm(null)}
      onConfirm={() => void selection.confirmHostRemove()}
    />

    <ExploreJoinOverlays
      activity={selection.selected?.activity}
      exploreMapItemId={selection.selected?.id}
      joinActions={selection.joinActions}
      onJoinSuccess={selection.handlePeekJoinSuccess}
      useDesktopGuestGatePanel={useDesktopGuestGatePanel}
    />
  </>
);
