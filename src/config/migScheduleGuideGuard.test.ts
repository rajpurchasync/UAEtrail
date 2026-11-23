import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = join(process.cwd());

describe('MIG-SCHEDULE-GUIDE guards', () => {
  it('host publish gate routes guide profile denial to /profile/guide', () => {
    const gate = readFileSync(join(ROOT, 'src/utils/memberPublishGate.ts'), 'utf8');
    expect(gate).toMatch(/guide_profile_required/);
    expect(gate).toMatch(/PROFILE_GUIDE_PATH/);
    expect(gate).toMatch(/guideProfileComplete/);
  });

  it('exposes PROFILE_GUIDE_PATH on surface paths', () => {
    const paths = readFileSync(join(ROOT, 'src/config/surfacePaths.ts'), 'utf8');
    expect(paths).toMatch(/PROFILE_GUIDE_PATH\s*=\s*'\/profile\/guide'/);
  });

  it('A2b: availability visibility wire uses friends only', () => {
    const shared = readFileSync(
      join(ROOT, 'packages/shared-types/src/member-availability.ts'),
      'utf8'
    );
    expect(shared).toMatch(/AvailabilityVisibility = 'public' \| 'friends' \| 'hidden'/);
    expect(shared).toMatch(/normalizeAvailabilityVisibility/);
    const editor = readFileSync(join(ROOT, 'src/availability/AvailabilitySlotEditor.tsx'), 'utf8');
    expect(editor).toMatch(/value="friends"/);
    expect(editor).not.toMatch(/value="buddies"/);
    const registrar = readFileSync(
      join(ROOT, 'apps/api/src/routes/user/registerMeAvailabilityRoutes.ts'),
      'utf8'
    );
    expect(registrar).toMatch(/'friends'/);
    expect(registrar).not.toMatch(/'buddies'/);
  });

  it('B1: slot wire shape + kinds deprecated on availability PUT', () => {
    const shared = readFileSync(
      join(ROOT, 'packages/shared-types/src/member-availability.ts'),
      'utf8'
    );
    expect(shared).toMatch(/capacity\?: AvailabilitySlotCapacity/);
    expect(shared).toMatch(/modalities\?: ScheduleModality/);
    expect(shared).toMatch(/Ignored on write/);
    const store = readFileSync(
      join(ROOT, 'apps/api/src/lib/member-availability-store.ts'),
      'utf8'
    );
    expect(store).toMatch(/deriveLegacyKindsFromSlots/);
    expect(store).toMatch(/hydrateMemberAvailabilitySlots/);
    const commands = readFileSync(
      join(ROOT, 'apps/api/src/services/me-availability-commands.ts'),
      'utf8'
    );
    expect(commands).toMatch(/validateMemberAvailabilityWrite/);
    const registrar = readFileSync(
      join(ROOT, 'apps/api/src/routes/user/registerMeAvailabilityRoutes.ts'),
      'utf8'
    );
    expect(registrar).toMatch(/modalities/);
    expect(registrar).toMatch(/capacity/);
    expect(registrar).toMatch(/engagementTerms/);
  });

  it('B2: unified editor + compose engine + single save path', () => {
    const engine = readFileSync(
      join(ROOT, 'src/availability/availabilitySlotComposeEngine.ts'),
      'utf8'
    );
    expect(engine).toMatch(/prefillOpenIntentCompose/);
    expect(engine).toMatch(/prefillFixedIntentCompose/);
    expect(engine).toMatch(/buildOpenAvailabilityUpsert/);
    expect(engine).toMatch(/saveFixedAvailabilitySlot/);
    const editor = readFileSync(join(ROOT, 'src/availability/AvailabilitySlotEditor.tsx'), 'utf8');
    expect(editor).toMatch(/buildOpenAvailabilityUpsert/);
    expect(editor).toMatch(/openEditorStateFromMemberAvailability/);
    expect(editor).toMatch(/capacity === 'guide'/);
    expect(editor).not.toMatch(/kinds\.includes\('guide'\)/);
    const intentOpen = readFileSync(
      join(ROOT, 'src/explore/ui/IntentOpenComposeSheet.tsx'),
      'utf8'
    );
    expect(intentOpen).toMatch(/AvailabilitySlotEditor/);
    const fixedEngine = readFileSync(
      join(ROOT, 'src/explore/ui/intentFixedFlowEngine.ts'),
      'utf8'
    );
    expect(fixedEngine).toMatch(/availabilitySlotComposeEngine/);
    const planShim = readFileSync(
      join(ROOT, 'src/components/plan/PlanAvailabilitySection.tsx'),
      'utf8'
    );
    expect(planShim).toMatch(/AvailabilitySlotEditor/);
    const save = readFileSync(join(ROOT, 'src/availability/saveMemberAvailability.ts'), 'utf8');
    expect(save).toMatch(/saveMemberAvailability/);
  });

  it('B3: unified member schedule calendar component + path', () => {
    const calendar = readFileSync(
      join(ROOT, 'src/availability/MemberScheduleCalendar.tsx'),
      'utf8'
    );
    expect(calendar).toMatch(/MemberScheduleCalendar/);
    expect(calendar).toMatch(/usePlanCalendarData/);
    const routing = readFileSync(join(ROOT, 'src/plan/planRouting.ts'), 'utf8');
    expect(routing).toMatch(/MEMBER_SCHEDULE_CALENDAR_PATH/);
    const profile = readFileSync(
      join(ROOT, 'src/components/profile/ProfileHubNavMenu.tsx'),
      'utf8'
    );
    expect(profile).toMatch(/MEMBER_SCHEDULE_CALENDAR_PATH/);
    const operator = readFileSync(join(ROOT, 'src/hosting/HostingHubView.tsx'), 'utf8');
    expect(operator).toMatch(/MEMBER_SCHEDULE_CALENDAR_PATH/);
    const markers = readFileSync(join(ROOT, 'src/plan/planCalendarMarkers.ts'), 'utf8');
    expect(markers).toMatch(/kind: 'block'/);
  });

  it('B4: discovery projection + slot-based explore index (not Mongo kinds filter)', () => {
    expect(
      readFileSync(
        join(ROOT, 'packages/shared-types/src/availability-discovery-projection.ts'),
        'utf8'
      )
    ).toMatch(/personMatchesAvailabilityKindQuery/);
    const store = readFileSync(join(ROOT, 'apps/api/src/lib/member-availability-store.ts'), 'utf8');
    expect(store).toMatch(/personMatchesAvailabilityKindQuery/);
    expect(store).toMatch(/discoveryKindsFromSlots/);
    expect(store).not.toMatch(/\{\s*kind:\s*query\.kind\s*\}/);
    const mapItems = readFileSync(
      join(ROOT, 'apps/api/src/lib/availability-fixed-map-items.ts'),
      'utf8'
    );
    expect(mapItems).toMatch(/primaryMapPinKindFromSlot/);
    expect(mapItems).not.toMatch(/primaryKind\(doc\.kinds\)/);
    const rowModel = readFileSync(join(ROOT, 'src/crew-discovery/memberBrowseRowModel.ts'), 'utf8');
    expect(rowModel).toMatch(/memberHasGuideCapacityInSlots/);
    expect(rowModel).toMatch(/filterAvailabilityByCapacity/);
    expect(rowModel).not.toMatch(/filterAvailabilityPeopleByGuideIntent/);
  });

  it('C1: guide engagement terms UI + Pro-paid validator', () => {
    expect(
      readFileSync(join(ROOT, 'packages/shared-types/src/availability-engagement-terms.ts'), 'utf8')
    ).toMatch(/formatGuideEngagementTermsBrowseLine/);
    const editor = readFileSync(join(ROOT, 'src/availability/AvailabilitySlotEditor.tsx'), 'utf8');
    expect(editor).toMatch(/GuideEngagementTermsFields/);
    expect(editor).toMatch(/canHostPaidActivities/);
    const slotVal = readFileSync(join(ROOT, 'packages/shared-types/src/availability-slot.ts'), 'utf8');
    expect(slotVal).toMatch(/paid_terms_not_allowed/);
    expect(slotVal).toMatch(/Paid outings require a verified business or Pro operator profile/);
    const gate = readFileSync(join(ROOT, 'apps/api/src/services/member-publish-gate.ts'), 'utf8');
    expect(gate).toMatch(/paid_publish_not_allowed/);
    expect(gate).toMatch(/Paid outings require a verified business or Pro operator profile/);
  });

  it('D1: demo seed personas match schedule block model', () => {
    const connections = readFileSync(
      join(ROOT, 'apps/api/scripts/seedConnectionsDemo.ts'),
      'utf8'
    );
    expect(connections).toMatch(/capacity: 'participant'/);
    expect(connections).toMatch(/engagementTerms:/);
    const fixed = readFileSync(join(ROOT, 'apps/api/scripts/seed-demo-availability-fixed.ts'), 'utf8');
    expect(fixed).toMatch(/modalities: projection\.modalities/);
    const archive = JSON.parse(
      readFileSync(join(ROOT, 'scripts/governance/platform-migration-archive.json'), 'utf8')
    ) as {
      migrations: { id: string; status: string }[];
    };
    const mig = archive.migrations?.find((row) => row.id === 'MIG-SCHEDULE-GUIDE');
    expect(mig?.status).toBe('complete');
  });
});