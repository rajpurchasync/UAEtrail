import { ActivityDetailCrewAside } from './tabs/ActivityDetailCrewAside';
import { ActivityDetailPricingSidebar } from './ActivityDetailPricingSidebar';
import type { useActivityDetailViewModel } from './useActivityDetailViewModel';

type Model = ReturnType<typeof useActivityDetailViewModel>;

type ActivityDetailSidebarColumnProps = {
  model: Model;
};

/** Host sidebar: crew roster + pricing/join (S13-W7). */
export const ActivityDetailSidebarColumn = ({ model }: ActivityDetailSidebarColumnProps) => (
  <div className={`space-y-4 ${model.mobileSidebarPanel}`}>
    <ActivityDetailCrewAside
      panelClassName={model.mobileCrewPanel}
      previewMode={model.previewMode}
      showMobileTabs={model.showMobileTabs}
      showCrewLockedHint={model.crewLockedHint}
      activityId={model.activity.id}
      activityTitle={model.activityTitle}
      hostCrewHub={model.requiresSignIn ? undefined : model.showHostManageHub ? model.hostCrewHub : undefined}
      hostCrewChatPolicy={model.requiresSignIn ? undefined : model.hostCrewChatPolicy}
    />
    <ActivityDetailPricingSidebar
      activity={model.activity}
      previewMode={model.previewMode}
      showMobileTabs={model.showMobileTabs}
      mobileCrewPanel={model.mobileCrewPanel}
      sharePayload={model.sharePayload}
      sidebarJoin={model.sidebarJoin}
      message={model.message}
      error={model.error}
      hostPath={model.hostPath}
      hostProfileHint={model.hostProfileHint}
      canOpenHostProfile={model.canOpenHostProfile}
      memberUserId={model.hostUserId}
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
