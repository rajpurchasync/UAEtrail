import { Link } from 'react-router-dom';
import { ActivityInviteLauncher } from '../ActivityInviteLauncher';
import { ActivityPostCheckInReviewPrompts } from '../ActivityPostCheckInReviewPrompts';
import { ActivityDetailTabBar } from './ActivityDetailTabBar';
import { ActivityDetailMobileHero } from './ActivityDetailMobileHero';
import { ActivityDetailPlanAboutCard } from './tabs/ActivityDetailPlanAboutCard';
import { ActivityDetailPlaceTabPanels } from './tabs/ActivityDetailPlaceTabPanels';
import { ActivityDetailTransportTabPanels } from './tabs/ActivityDetailTransportTabPanels';
import { ActivityDetailBuddiesAside } from './tabs/ActivityDetailBuddiesAside';
import { ActivityDetailPlanExtras } from './tabs/ActivityDetailPlanExtras';
import { ActivityDetailPricingSidebar } from './ActivityDetailPricingSidebar';
import type { useActivityDetailViewModel } from './useActivityDetailViewModel';

type Model = ReturnType<typeof useActivityDetailViewModel>;

/** Tab chrome + main/sidebar columns (R6). */
export const ActivityDetailBody = (model: Model) => (
  <>
    {model.showMobileTabs && model.onMobileTabChange ? (
      <ActivityDetailTabBar
        active={model.mobileTab}
        onChange={model.onMobileTabChange}
        showTransportTab
      />
    ) : null}
    {model.showMobileTabs && !model.isEmbedded ? (
      <ActivityDetailMobileHero
        date={model.activity.date}
        title={model.activityTitle}
        statusChips={model.heroFactChips}
        venueLine={
          model.registryPlacePath && model.registryPlaceName ? (
            <Link to={model.registryPlacePath} className="font-medium text-emerald-800">
              {model.registryPlaceName}
            </Link>
          ) : (
            model.activity.locationName
          )
        }
      />
    ) : null}
    <div
      className={`max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6 ${
        model.isEmbedded ? 'px-0 py-2' : 'px-4 py-6'
      }`}
    >
      <div className="lg:col-span-2 space-y-4">
        {model.showInviteShare && model.canSendJoinInvites ? (
          <ActivityInviteLauncher
            activity={{
              id: model.activity.id,
              title: model.activity.title || model.activity.locationName,
              activityType: model.activity.activityType,
              date: model.activity.date,
              locationName: model.activity.locationName,
            }}
            canSendBuddyInvites
          />
        ) : null}

        {model.showParticipantReviewPrompts ? (
          <ActivityPostCheckInReviewPrompts
            items={model.participantReviewPrompts}
            panelClassName={model.mobilePlanPanel}
            onMobileTabChange={model.onMobileTabChange}
          />
        ) : null}

        <ActivityDetailPlanAboutCard
          panelClassName={model.mobilePlanPanel}
          activity={model.activity}
          showMobileTabs={model.showMobileTabs}
          showPlanTransportTeaser={model.showPlanTransportTeaser}
          onMobileTabChange={model.onMobileTabChange}
        />

        <ActivityDetailPlaceTabPanels
          panelClassName={model.mobilePlacePanel}
          activity={model.activity}
          previewMode={model.previewMode}
          showMobileTabs={model.showMobileTabs}
          showPlaceCrewBody={model.showPlaceCrewBody}
          showPlaceLockedOnMobile={model.showPlaceLockedOnMobile}
          registryPlacePath={model.registryPlacePath}
          registryPlaceName={model.registryPlaceName}
          hasAccessCoordinates={model.hasAccessCoordinates}
          accessLat={model.accessLat}
          accessLng={model.accessLng}
          openInGoogleMapsUrl={model.openInGoogleMapsUrl}
          onMobileTabChange={model.onMobileTabChange}
        />

        <ActivityDetailTransportTabPanels
          panelClassName={model.mobileTransportPanel}
          activity={model.activity}
          transportReachLines={model.transportReachLines}
          showTransportEncouragementMobile={model.showTransportEncouragementMobile}
          showTransportHostProUpsell={model.showTransportHostProUpsell}
          showTransportParticipantProUpsell={model.showTransportParticipantProUpsell}
        />

        <ActivityDetailPlanExtras
          panelClassName={model.mobilePlanPanel}
          activity={model.activity}
          previewMode={model.previewMode}
          activityReviews={model.activityReviews}
          canWriteActivityReview={model.canWriteActivityReview}
          onActivityReviewSubmitted={model.onActivityReviewSubmitted}
        />
      </div>

      <div className={`space-y-4 ${model.mobileSidebarPanel}`}>
        <ActivityDetailBuddiesAside
          panelClassName={model.mobileBuddiesPanel}
          previewMode={model.previewMode}
          showMobileTabs={model.showMobileTabs}
          showCrewLockedHint={model.buddiesCrewLockedHint}
          activityId={model.activity.id}
          activityTitle={model.activity.title || model.activity.locationName}
          hostBuddiesHub={model.showHostManageHub ? model.hostBuddiesHub : undefined}
          hostCrewChatPolicy={model.hostCrewChatPolicy}
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
          rosterParticipants={model.rosterParticipants}
          showRosterProUpsell={model.showRosterProUpsell}
        />
      </div>
    </div>
  </>
);
