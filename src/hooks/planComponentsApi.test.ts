import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const read = (rel: string) => readFileSync(join(process.cwd(), rel), 'utf8');

const expectNoDirectApi = (rel: string) => {
  const source = read(rel);
  expect(source).not.toMatch(/\bapi\./);
};

describe('componentsClientApi (R8.1)', () => {
  it('plan upcoming strips use hooks layer', () => {
    expect(read('src/components/plan/PlanWishlistView.tsx')).toMatch(/PlanSuggestedRail/);
    expect(read('src/components/plan/PlanSuggestedRail.tsx')).toMatch(/usePlanWishlistSuggestions/);
    expectNoDirectApi('src/components/plan/PlanSuggestedRail.tsx');
    expect(read('src/components/plan/PlanSavedSection.tsx')).toMatch(/useMeWishlist/);
    expectNoDirectApi('src/components/plan/PlanSavedSection.tsx');
    expect(read('src/hooks/usePlanWishlistSuggestions.ts')).toMatch(/useMyJoinedActivities/);
    for (const file of [
      'src/components/activity/JoinedSection.tsx',
      'src/components/plan/PlanJoinedUpcoming.tsx',
      'src/hooks/useMemberJourneyMapPinIds.ts',
    ]) {
      expect(read(file)).toMatch(/useJoinedUpcomingPlanData|useMyJoinedActivities/);
      expect(read(file)).not.toMatch(/fetchJoinedUpcomingPlanData/);
      expectNoDirectApi(file);
    }
    expect(read('src/components/participant-intent/SeekingIntentsSection.tsx')).toMatch(
      /useMyParticipantIntents/
    );
    expectNoDirectApi('src/components/participant-intent/SeekingIntentsSection.tsx');
    expect(read('src/components/plan/PlanJoinedUpcoming.tsx')).toMatch(/useMyJoinedActivities/);
    expect(read('src/components/plan/PlanJoinedUpcoming.tsx')).toMatch(/useMyActivityJoinRequests/);
    expectNoDirectApi('src/components/plan/PlanJoinedUpcoming.tsx');
    expect(read('src/components/plan/PlanJoinedUpcoming.tsx')).not.toMatch(/\bapi\./);
    expect(read('src/components/plan/PlanHostingUpcoming.tsx')).toMatch(/useMyParticipantIntents/);
    expectNoDirectApi('src/components/plan/PlanHostingUpcoming.tsx');
    expect(read('src/components/plan/PlanHostingUpcoming.tsx')).not.toMatch(/\bapi\./);
    expect(read('src/plan/PlanPage.tsx')).toMatch(/useMemberGoals/);
    expectNoDirectApi('src/plan/PlanPage.tsx');
    expect(read('src/components/plan/PlanNeedsYouStrip.tsx')).toMatch(/useMemberCoordinationAttention/);
    expectNoDirectApi('src/components/plan/PlanNeedsYouStrip.tsx');
    expect(read('src/components/plan/PlanAvailabilitySection.tsx')).toMatch(/useMemberAvailability/);
    expectNoDirectApi('src/components/plan/PlanAvailabilitySection.tsx');
    expect(read('src/components/ui/TenantSwitcher.tsx')).toMatch(/tenantMembershipApi/);
    expect(read('src/components/ui/TenantSwitcher.tsx')).not.toMatch(/\bapi\./);
  });

  it('notifications, signup, and participant-intent sheets use hooks layer', () => {
    const bell = read('src/components/layout/NotificationBellPopover.tsx');
    expect(bell).toMatch(/notificationInboxApi/);
    expect(bell).toMatch(/inferNotificationPath/);
    expectNoDirectApi('src/components/layout/NotificationBellPopover.tsx');
    expect(read('src/components/signup/SignupProfileWizard.tsx')).toMatch(/signupProfileApi/);
    expectNoDirectApi('src/components/signup/SignupProfileWizard.tsx');
    for (const file of [
      'src/components/participant-intent/ParticipantIntentJoinRequestsSection.tsx',
      'src/components/participant-intent/ParticipantIntentEditForm.tsx',
      'src/components/participant-intent/ParticipantIntentManageSheet.tsx',
    ]) {
      expect(read(file)).toMatch(/participantIntentClientApi/);
      expectNoDirectApi(file);
    }
  });

  it('activity invite and host manage use hooks layer', () => {
    expect(read('src/components/activity/ActivityInviteModalBody.tsx')).toMatch(/activityInviteClientApi/);
    expectNoDirectApi('src/components/activity/ActivityInviteModalBody.tsx');
    for (const file of [
      'src/components/activity/ActivityCrewChatPostPolicyCard.tsx',
      'src/components/activity/detail/ActivityDetailHostBuddiesHub.tsx',
      'src/components/activity/ActivityManageSheet.tsx',
      'src/components/activity/ActivityParticipantsPanel.tsx',
    ]) {
      expect(read(file)).toMatch(/tenantActivityClientApi/);
      expectNoDirectApi(file);
    }
  });

  it('remaining surfaces use hooks layer (R8.1 exit)', () => {
    const cases: Array<{ file: string; hook: RegExp }> = [
      { file: 'src/components/organisation-console/AgencyTeamSection.tsx', hook: /organisationConsoleApi/ },
      { file: 'src/components/organisation-console/ProProfileApplicationFlow.tsx', hook: /organisationConsoleApi|memberProfileApi/ },
      { file: 'src/components/organisation-console/OrganisationPublicProfile.tsx', hook: /organisationConsoleApi/ },
      { file: 'src/components/organisation/ShopOrganisationPanel.tsx', hook: /shopOrganisationClientApi/ },
      { file: 'src/components/chat/GroupWallChatSettingsSheet.tsx', hook: /socialGroupSettingsApi/ },
      { file: 'src/components/layout/MobileMenu.tsx', hook: /accountSessionApi/ },
      { file: 'src/components/auth/ProtectedRoute.tsx', hook: /memberProfileApi/ },
      { file: 'src/components/admin/AdminUserDetailPanel.tsx', hook: /adminDrilldownApi/ },
      { file: 'src/components/ui/AssetKeyUpload.tsx', hook: /mediaUploadApi/ },
    ];
    for (const { file, hook } of cases) {
      expect(read(file)).toMatch(hook);
      expectNoDirectApi(file);
    }
  });

  it('reviews and content reports use hooks ClientApi', () => {
    expect(read('src/components/ui/ReviewSection.tsx')).toMatch(/entityReviewsClientApi/);
    expect(read('src/components/ui/ReviewSection.tsx')).not.toMatch(/reviewSubmit/);
    expectNoDirectApi('src/components/ui/ReviewSection.tsx');
    expect(read('src/components/ui/ReportContentDialog.tsx')).toMatch(/contentReportClientApi/);
    expect(read('src/components/ui/ReportContentDialog.tsx')).not.toMatch(/contentReportSubmit/);
    expectNoDirectApi('src/components/ui/ReportContentDialog.tsx');
  });

  it('profile and account settings use hooks layer', () => {
    expect(read('src/components/profile/ProfileVisibilitySection.tsx')).toMatch(/memberProfileApi/);
    expectNoDirectApi('src/components/profile/ProfileVisibilitySection.tsx');
    expect(read('src/components/profile/LogOutdoorOutingSheet.tsx')).toMatch(/memberJourneyMapApi/);
    expectNoDirectApi('src/components/profile/LogOutdoorOutingSheet.tsx');
    expect(read('src/components/profile/ProfileAccountSettingsSections.tsx')).toMatch(
      /accountSettingsApi/
    );
    expectNoDirectApi('src/components/profile/ProfileAccountSettingsSections.tsx');
    for (const file of [
      'src/components/account/AccountDataExportSection.tsx',
      'src/components/account/AccountDeleteSection.tsx',
    ]) {
      expect(read(file)).toMatch(/accountSettingsApi/);
      expectNoDirectApi(file);
    }
  });
});
