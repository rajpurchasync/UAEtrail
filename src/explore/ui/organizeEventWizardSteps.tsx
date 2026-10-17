import { OrganizeVenuePlaceField } from './OrganizeVenuePlaceField';
import type { PlaceDTO } from '@uaetrail/shared-types';
import { EXPLORE_FLOW } from '../../config/exploreTheme';
import { JOIN_RULES_LABEL } from '../createFlowCopy';
import type { CreateActivityDraft } from './hostingFlowEngine';

export {
  HikingAudienceStepBody as EventAudienceStepBody,
  HikingSpotsStepBody as EventParticipantsStepBody,
} from './organizeHikingWizardSteps';

export {
  CampingTransportationStepBody as EventTransportationStepBody,
  CampingTransportationStepBody as HikingTransportationStepBody,
} from './organizeCampingWizardSteps';

type PatchDraft = (patch: Partial<CreateActivityDraft>) => void;

export const EventDestinationStepBody = ({
  draft,
  patchDraft,
  tenantId,
  registryPlaces,
}: {
  draft: CreateActivityDraft;
  patchDraft: PatchDraft;
  tenantId?: string | null;
  registryPlaces: PlaceDTO[];
}) => (
  <OrganizeVenuePlaceField
    draft={draft}
    patchDraft={patchDraft}
    tenantId={tenantId}
    registryPlaces={registryPlaces}
    placeType="event"
    customNameLabel="Venue or area name"
    customNamePlaceholder="e.g. Kite beach community run"
  />
);

export const EventAboutStepBody = ({
  draft,
  patchDraft,
}: {
  draft: CreateActivityDraft;
  patchDraft: PatchDraft;
}) => (
  <label className="block">
    <span className={`mb-2 block ${EXPLORE_FLOW.choiceCardTitle}`}>About this event</span>
    <textarea
      value={draft.aboutTrail}
      onChange={(event) => patchDraft({ aboutTrail: event.target.value })}
      rows={5}
      placeholder="What is it, who is it for, and what should people expect?"
      className="w-full rounded-2xl border border-neutral-200 px-4 py-3 text-base text-gray-900 outline-none focus:border-emerald-500"
      maxLength={3000}
    />
  </label>
);

export const EventJoinKitStepBody = ({
  draft,
  patchDraft,
}: {
  draft: CreateActivityDraft;
  patchDraft: PatchDraft;
}) => (
  <label className="block">
    <span className={`mb-2 block ${EXPLORE_FLOW.choiceCardTitle}`}>{JOIN_RULES_LABEL}</span>
    <textarea
      value={draft.joinKit}
      onChange={(event) => patchDraft({ joinKit: event.target.value })}
      rows={4}
      placeholder="What to bring, dress code, ID, etc."
      className="w-full rounded-2xl border border-neutral-200 px-4 py-3 text-base text-gray-900 outline-none focus:border-emerald-500"
      maxLength={2000}
    />
  </label>
);

export const EventChildrenAllowedField = ({
  draft,
  patchDraft,
}: {
  draft: CreateActivityDraft;
  patchDraft: PatchDraft;
}) => (
  <label className="mt-4 flex items-center gap-2 text-sm text-gray-800">
    <input
      type="checkbox"
      checked={draft.childrenAllowed}
      onChange={(event) => patchDraft({ childrenAllowed: event.target.checked })}
      className="rounded border-gray-300 text-emerald-600"
    />
    Children allowed
  </label>
);
