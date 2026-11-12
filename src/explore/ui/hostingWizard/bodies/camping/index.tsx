import { HostingDestinationField } from '../../../HostingDestinationField';
import type { PlaceDTO } from '@uaetrail/shared-types';
import { EXPLORE_FLOW } from '../../../../../config/exploreTheme';
import { exploreFlowChoiceCardClass } from '../../../exploreFlowUi';
import { JOIN_RULES_LABEL } from '../../../../createFlowCopy';
import {
  VEHICLE_ACCESS_OPTIONS,
  type CreateActivityDraft,
  type VehicleAccess,
} from '../../../hostingFlowEngine';

export {
  HikingAudienceStepBody as CampingAudienceStepBody,
  HikingSpotsStepBody as CampingParticipantsStepBody,
} from '../hiking';

type PatchDraft = (patch: Partial<CreateActivityDraft>) => void;

export const CampingDestinationStepBody = ({
  draft,
  patchDraft,
  tenantId,
  catalogPlaces,
  onOpenSpotMap,
}: {
  draft: CreateActivityDraft;
  patchDraft: PatchDraft;
  tenantId?: string | null;
  catalogPlaces: PlaceDTO[];
  onOpenSpotMap?: () => void;
}) => (
  <HostingDestinationField
    draft={draft}
    patchDraft={patchDraft}
    tenantId={tenantId}
    catalogPlaces={catalogPlaces}
    placeType="camping"
    customNameLabel="Camp or area name"
    customNamePlaceholder="e.g. Al Qudra lakes overnight"
    onOpenSpotMap={onOpenSpotMap}
  />
);

export const CampingAboutStepBody = ({
  draft,
  patchDraft,
}: {
  draft: CreateActivityDraft;
  patchDraft: PatchDraft;
}) => (
  <textarea
    value={draft.aboutTrail}
    onChange={(event) => patchDraft({ aboutTrail: event.target.value })}
    rows={5}
    placeholder="What to expect, overnight plan, vibe, facilities…"
    aria-label="About this camp"
    className="w-full rounded-2xl border border-neutral-200 px-4 py-3 text-base"
    maxLength={2000}
  />
);

export const CampingJoinKitStepBody = ({
  draft,
  patchDraft,
}: {
  draft: CreateActivityDraft;
  patchDraft: PatchDraft;
}) => (
  <textarea
    value={draft.joinKit}
    onChange={(event) => patchDraft({ joinKit: event.target.value })}
    rows={5}
    placeholder="Tent, sleeping bag, food, fire rules, quiet hours…"
    aria-label={JOIN_RULES_LABEL}
    className="w-full rounded-2xl border border-neutral-200 px-4 py-3 text-base"
    maxLength={1000}
  />
);

export const CampingTransportationStepBody = ({
  draft,
  patchDraft,
  hint = 'How can people reach the camp?',
}: {
  draft: CreateActivityDraft;
  patchDraft: PatchDraft;
  hint?: string;
}) => (
  <>
    <p className="mb-3 text-sm text-neutral-600 md:mb-2 md:text-xs">{hint}</p>
    <div className="flex flex-col gap-3 md:flex-row md:gap-2">
      {VEHICLE_ACCESS_OPTIONS.map((option) => {
        const active = draft.vehicleAccess === option.value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => patchDraft({ vehicleAccess: option.value as VehicleAccess })}
            className={`${exploreFlowChoiceCardClass(active)} md:flex-1 md:min-w-0 md:px-2 md:py-2`}
          >
            <p className={`${EXPLORE_FLOW.choiceCardTitle} md:text-xs`}>{option.title}</p>
            <p className={`${EXPLORE_FLOW.choiceCardSubtitle} md:hidden`}>{option.subtitle}</p>
          </button>
        );
      })}
    </div>
  </>
);
