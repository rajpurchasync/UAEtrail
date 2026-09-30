import fs from 'fs';

const source = process.argv[2] || 'scripts/_CreateActivityFlow.restore.tsx';
const lines = fs.readFileSync(source, 'utf8').split(/\r?\n/);
const start = lines.findIndex((l) => l.includes("step === 'type' && !demandPrefill"));
const end = lines.findIndex((l) => l.includes("step === 'publish'") && l.includes('kind'));
let publishClose = -1;
for (let i = end; i < lines.length; i++) {
  const line = lines[i].replace(/\r$/, '');
  const next = lines[i + 1]?.replace(/\r$/, '').trim();
  if (line === '        )}' && next === '</ExploreResponsiveSheet>') {
    publishClose = i;
    break;
  }
}
if (publishClose < 0) {
  console.error('publish close not found', end);
  process.exit(1);
}
const body = lines.slice(start, publishClose + 1).join('\n');

const header = `/** Wizard step bodies — split per step under ./steps/ */
import {
  BadgeCheck,
  CalendarDays,
  Car,
  ClipboardCheck,
  Clock3,
  Lock,
  MapPin,
  MoreHorizontal,
  Mountain,
  Tent,
  UserRound,
  Users,
} from 'lucide-react';
import { MobileMonthCalendar } from '../../../components/mobile/MobileMonthCalendar';
import { FlowSheetChrome } from '../ExploreFlowSheetChrome';
import { FlowStepTextInput } from '../useFlowSheetPrimaryFieldFocus';
import { exploreFlowChoiceCardClass, exploreFlowKindTileClass } from '../exploreFlowUi';
import { EXPLORE_FLOW } from '../../../config/exploreTheme';
import {
  CAPACITY_PRESETS,
  createTitlePlaceholder,
  formatCapacityLabel,
  formatHikeCapacityLabel,
  OFFLINE_PRICE_NOTE,
  priceModeLabel,
  priceModeOptions,
  resolveRideshareVehicleLabel,
  resolveActivityTopicLabel,
  usesGoingFromOrganizeStep,
  type AudienceAccess,
  type CreateActivityKind,
  type JoinMode,
  type TimeMode,
} from '../organizeFlow';
import { HIKE_APPROVAL_NO_SUBTITLE, HIKE_PRIVATE_EVENT_INFO } from '../../createFlowCopy';
import { PARTICIPATION_TOGGLE_QUESTION } from '../../compose';
import {
  HikingAboutTrailStepBody,
  HikingAudienceStepBody,
  HikingDestinationStepBody,
  HikingDifficultyStepBody,
  HikingJoinKitStepBody,
  HikingSpotsStepBody,
} from '../organizeHikingWizardSteps';
import {
  CampingAboutStepBody,
  CampingDestinationStepBody,
  CampingJoinKitStepBody,
  CampingParticipantsStepBody,
  CampingTransportationStepBody,
} from '../organizeCampingWizardSteps';
import {
  EventAboutStepBody,
  EventChildrenAllowedField,
  EventDestinationStepBody,
  EventJoinKitStepBody,
} from '../organizeEventWizardSteps';
import { RideshareAudienceStepBody, RideshareSeatsStepBody, RideshareTransportationStepBody } from '../organizeRideshareWizardSteps';
import {
  ActivityInstructionsStepBody,
  ActivityTypeStepBody,
} from '../organizeActivitiesWizardSteps';
import {
  CARPOOL_PICKUP_HINT,
  EXTRA_DIRECTIONS_LABEL,
  fromLocationLabel,
  GOING_FROM_HINT,
  GOING_FROM_LABEL,
  GOING_FROM_NOTES_PREVIEW_LABEL,
  GOING_FROM_WITH_TIME_HINT,
  JOIN_RULES_LABEL,
  JOIN_RULES_PREVIEW_LABEL,
  ORGANIZE_INTRO_PROMPT,
  ORGANIZE_TYPE_SHEET_TITLE,
  PICKUP_POINT_LABEL,
  RIDE_RULES_LABEL,
  TO_LOCATION_LABEL,
  WHERE_STEP_CAMP_HINT,
  WHERE_STEP_HINT,
} from '../../createFlowCopy';
import { OrganizePinReviewLine } from '../organizeLocationReview';
import type { ReactNode } from 'react';
import type { OrganizeWizardContext } from './organizeWizardContext';
import { OrganizeWizardNextButton } from './OrganizeWizardNextButton';

const TYPE_OPTIONS: Array<{
  key: CreateActivityKind;
  title: string;
  subtitle: string;
  emoji: string;
}> = [
  { key: 'hiking', title: 'Hiking', subtitle: 'Trails & day hikes', emoji: '🥾' },
  { key: 'camping', title: 'Camping', subtitle: 'Overnight outdoors', emoji: '⛺' },
  { key: 'carpool', title: 'Rideshare', subtitle: 'Share a ride', emoji: '🚗' },
  { key: 'event', title: 'Other Outdoors', subtitle: 'Runs, meetups & more', emoji: '✨' },
];

const NextButton = OrganizeWizardNextButton;

export function renderOrganizeWizardStepSlice(ctx: OrganizeWizardContext): ReactNode {
  const {
    step,
    stepTitle,
    kind,
    draft,
    patchDraft,
    error,
    tenantId,
    registryPlaces,
    canPublish,
    canHostPaidActivities,
    hostGateLoading,
    submitting,
    dateOptions,
    showMonthView,
    setShowMonthView,
    hasFromPin,
    hasToPin,
    meetingPointMapOpen,
    setMeetingPointMapOpen,
    setWhereMapOpen,
    goNext,
    goBack,
    goToFirstStep,
    handleClose,
    handlePublish,
    renderRoutePicker,
    hikingFlow,
    campingFlow,
    eventFlow,
    activityFlow,
    rideshareFlow,
    structuredFlow,
    goingFromFlow,
    demandPrefill,
    organizeKind,
    stepTitleOptions,
    selectedKind,
    setSelectedKind,
  } = ctx;

  return (
    <>
${body}
    </>
  );
}
`;

fs.writeFileSync('src/explore/ui/organizeWizard/organizeWizardStepSlice.tsx', header);
console.log('restored', publishClose - start + 1, 'lines');
