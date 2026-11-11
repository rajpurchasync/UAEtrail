import { ActivityDetailBuddiesAside } from './tabs/ActivityDetailBuddiesAside';
import { ActivityDetailPricingSidebar } from './ActivityDetailPricingSidebar';
import type { useActivityDetailViewModel } from './useActivityDetailViewModel';

type Model = ReturnType<typeof useActivityDetailViewModel>;

type ActivityDetailSidebarColumnProps = {
  model: Model;
};

/** Host sidebar: crew roster + pricing/join (S13-W7). */
export const ActivityDetailSidebarColumn = ({ model }: ActivityDetailSidebarColumnProps) => (
  <div className={`space-y-4 ${model.mobileSidebarPanel}`}>
    <ActivityDetailBuddiesAside
      panelClassName={model.mobileBuddiesPanel}
      previewMode={model.previewMode}
      showMobileTabs={model.showMobileTabs}
      showCrewLockedHint={model.buddiesCrewLockedHint}
      activityId={model.activity.id}
      hostBuddiesHub={model.requiresSignIn ? undefined : model.showHostManageHub ? model.hostBuddiesHub : undefined}
      hostCrewChatPolicy={model.requiresSignIn ? undefined : model.hostCrewChatPolicy}
    />
    <ActivityDetailPricingSidebar
      activity={model.activity}
      previewMode={model.previewMode}
      showMobileTabs={model.showMobileTabs}
      mobileBuddiesPanel={model.mobileBuddiesPanel}
      sharePayload={model.sharePayload}
      sidebarJoin={model.sidebarJoin}
      message={model.message}
      error={model.error}
      hostPath={model.hostPath}
      hostProfileHint={model.hostProfileHint}
      canOpenHostProfile={model.canOpenHostProfile}
      hostUserId={model.hostUserId}
      showHostProfileProUpsell={model.showHostProfileProUpsell}
      proSocialMembershipPath={model.proSocialMembershipPath}
      showHostCheckInPrompt={model.showHostCheckInPrompt}
      hostRateableCount={model.hostReviewHints.rateableCount}
      hostActivityEnded={model.hostReviewHints.activityEnded}
      showParticipantReviewPrompts={model.showParticipantReviewPrompts}
      participantReviewPrompts={model.participantReviewPrompts}
      onMobileTabChange={model.onMobileTabChange}
      hostCrewChatPolicy={model.hostCrewChatPolicy}
      canAccessCrewSurfaces={model.canAccessCrewSurfaces}
      participants={model.participants}
      showRosterProUpsell={model.showRosterProUpsell}
      hideHostProfile={model.publicDetail || model.requiresSignIn}
      hideParticipantsRoster={model.publicDetail}
    />
  </div>
);
