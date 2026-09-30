import { EXPLORE_FLOW } from '../../config/exploreTheme';
import { JOIN_RULES_LABEL } from '../createFlowCopy';
import { exploreFlowChoiceCardClass } from './exploreFlowUi';
import {
  ACTIVITY_ORGANIZE_TOPIC_OPTIONS,
  type ActivityOrganizeTopic,
  type CreateActivityDraft,
} from './organizeFlow';

type PatchDraft = (patch: Partial<CreateActivityDraft>) => void;

export const ActivityTypeStepBody = ({
  draft,
  patchDraft,
}: {
  draft: CreateActivityDraft;
  patchDraft: PatchDraft;
}) => (
  <>
    <p className="mb-3 text-sm text-gray-600">What kind of plan are you putting on the map?</p>
    <div className={`${EXPLORE_FLOW.choiceGrid2}`}>
      {ACTIVITY_ORGANIZE_TOPIC_OPTIONS.map((option) => {
        const active = draft.activityTopic === option.value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => patchDraft({ activityTopic: option.value as ActivityOrganizeTopic })}
            className={exploreFlowChoiceCardClass(active)}
          >
            <p className={EXPLORE_FLOW.choiceCardTitle}>{option.title}</p>
            <p className={EXPLORE_FLOW.choiceCardSubtitle}>{option.subtitle}</p>
          </button>
        );
      })}
    </div>
  </>
);

export const ActivityInstructionsStepBody = ({
  draft,
  patchDraft,
}: {
  draft: CreateActivityDraft;
  patchDraft: PatchDraft;
}) => (
  <>
    <p className="mb-3 text-sm text-gray-600">
      Optional — gear, rules, and anything joiners should know before they request a spot.
    </p>
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-gray-700">{JOIN_RULES_LABEL}</span>
      <textarea
        value={draft.joinKit}
        onChange={(event) => patchDraft({ joinKit: event.target.value })}
        rows={5}
        placeholder="What to bring, meet-up cues, pace, safety…"
        className="w-full rounded-2xl border border-neutral-200 px-4 py-3 text-base text-gray-900 outline-none focus:border-emerald-500"
        maxLength={1200}
      />
    </label>
  </>
);
