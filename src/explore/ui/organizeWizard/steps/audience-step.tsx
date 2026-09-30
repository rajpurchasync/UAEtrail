import { BadgeCheck, ClipboardCheck, Lock, MoreHorizontal, UserRound, Users } from 'lucide-react';
import {
  OrganizeWizardChrome,
  OrganizeWizardStepError,
  OrganizeWizardStepNext
} from '../OrganizeWizardChrome';
import { exploreFlowChoiceCardClass } from '../../exploreFlowUi';
import { EXPLORE_FLOW } from '../../../../config/exploreTheme';
import { type AudienceAccess, type JoinMode } from '../../organizeFlow';
import { HIKE_APPROVAL_NO_SUBTITLE, HIKE_PRIVATE_EVENT_INFO } from '../../../createFlowCopy';
import { PARTICIPATION_TOGGLE_QUESTION } from '../../../compose';
import { HikingAudienceStepBody } from '../../organizeHikingWizardSteps';
import { RideshareAudienceStepBody } from '../../organizeRideshareWizardSteps';
import type { ReactNode } from 'react';
import type { OrganizeWizardContext } from '../organizeWizardContext';

export function renderAudienceStep(ctx: OrganizeWizardContext): ReactNode | null {
    const {
    step,
    stepTitle,
    kind,
    draft,
    patchDraft,
    error,
    goNext,
    goBack,
    handleClose,
    activityFlow,
    rideshareFlow,
    structuredFlow,
  } = ctx;

  if (!(step === 'audience' && kind)) {
    return null;
  }

  return (
          <OrganizeWizardChrome title={stepTitle} onClose={handleClose} onBack={goBack}>
            {(structuredFlow || activityFlow) ? (
              <HikingAudienceStepBody draft={draft} patchDraft={patchDraft} />
            ) : rideshareFlow ? (
              <RideshareAudienceStepBody draft={draft} patchDraft={patchDraft} />
            ) : (
              <>
            <div className="mb-4">
              <p className={`mb-2 ${EXPLORE_FLOW.choiceCardTitle}`}>{PARTICIPATION_TOGGLE_QUESTION}</p>
              <div className={EXPLORE_FLOW.choiceGrid2}>
                {([
                  {
                    key: 'approval' as const,
                    title: 'Yes',
                    subtitle: 'They request — you OK',
                    icon: ClipboardCheck,
                  },
                  {
                    key: 'rsvp' as const,
                    title: 'No',
                    subtitle: HIKE_APPROVAL_NO_SUBTITLE,
                    icon: BadgeCheck,
                  },
                ]).map((option) => {
                  const active = draft.participationMode === option.key;
                  const Icon = option.icon;
                  return (
                    <button
                      key={option.key}
                      type="button"
                      onClick={() => patchDraft({ participationMode: option.key })}
                      className={exploreFlowChoiceCardClass(active)}
                    >
                      <Icon className={`h-5 w-5 ${active ? 'text-emerald-600' : 'text-gray-500'}`} />
                      <p className={`mt-2 ${EXPLORE_FLOW.choiceCardTitle}`}>{option.title}</p>
                      <p className={EXPLORE_FLOW.choiceCardSubtitle}>{option.subtitle}</p>
                    </button>
                  );
                })}
              </div>
            </div>
            {!draft.genericBuddy && kind !== 'carpool' && (
              <div className={EXPLORE_FLOW.choiceGrid2}>
                {([
                  { key: 'open' as JoinMode, title: 'Public', subtitle: 'Listed on the explore map', icon: Users },
                  { key: 'private' as JoinMode, title: 'Private', subtitle: 'Link only — hidden from map', icon: Lock },
                ]).map((option) => {
                  const active = draft.joinMode === option.key;
                  const Icon = option.icon;
                  return (
                    <button
                      key={option.key}
                      type="button"
                      onClick={() =>
                        patchDraft(
                          option.key === 'private'
                            ? { joinMode: 'private', participationMode: 'rsvp' }
                            : { joinMode: option.key }
                        )
                      }
                      className={exploreFlowChoiceCardClass(active)}
                    >
                      <Icon className={`h-5 w-5 ${active ? 'text-emerald-600' : 'text-gray-500'}`} />
                      <p className={`mt-2 ${EXPLORE_FLOW.choiceCardTitle}`}>{option.title}</p>
                      <p className={EXPLORE_FLOW.choiceCardSubtitle}>{option.subtitle}</p>
                    </button>
                  );
                })}
              </div>
            )}

            {!draft.genericBuddy && kind !== 'carpool' && draft.joinMode === 'private' && (
              <p className="mt-4 rounded-xl bg-neutral-50 px-3 py-2 text-sm text-gray-600">
                {HIKE_PRIVATE_EVENT_INFO}
              </p>
            )}

            {!draft.genericBuddy && (draft.joinMode === 'open' || kind === 'carpool') && (
              <div className={`space-y-3 ${kind !== 'carpool' ? 'mt-4' : ''}`}>
                {kind === 'carpool' && (
                  <p className="text-sm text-gray-600">Who can request a seat in your ride?</p>
                )}
                <p className={`${EXPLORE_FLOW.choiceCardTitle}`}>Public options</p>
                <div className={EXPLORE_FLOW.choiceGrid2}>
                  {([
                    {
                      key: 'anyone' as AudienceAccess,
                      title: 'Anyone',
                      subtitle: 'Open to all',
                      icon: Users,
                    },
                    {
                      key: 'women_only' as AudienceAccess,
                      title: 'Women only',
                      subtitle: 'For women',
                      icon: UserRound,
                    },
                    ...(kind === 'event' || kind === 'carpool'
                      ? [
                          {
                            key: 'others' as AudienceAccess,
                            title: 'Others',
                            subtitle: 'Custom restriction',
                            icon: MoreHorizontal,
                          },
                        ]
                      : []),
                  ]).map((option) => {
                    const Icon = option.icon;
                    return (
                      <button
                        key={option.key}
                        type="button"
                        onClick={() =>
                          patchDraft({
                            audienceAccess: option.key,
                            audienceOtherNote: option.key === 'others' ? draft.audienceOtherNote : '',
                          })
                        }
                        className={exploreFlowChoiceCardClass(draft.audienceAccess === option.key)}
                      >
                        <Icon
                          className={`h-5 w-5 ${
                            draft.audienceAccess === option.key ? 'text-emerald-600' : 'text-gray-500'
                          }`}
                        />
                        <p className={`mt-2 ${EXPLORE_FLOW.choiceCardTitle}`}>{option.title}</p>
                        <p className={EXPLORE_FLOW.choiceCardSubtitle}>{option.subtitle}</p>
                      </button>
                    );
                  })}
                </div>
                {(kind === 'event' || kind === 'carpool') && draft.audienceAccess === 'others' && (
                  <label className="block">
                    <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                      {kind === 'carpool' ? 'Who can join?' : 'Who can attend?'}
                    </span>
                    <input
                      value={draft.audienceOtherNote}
                      onChange={(event) => patchDraft({ audienceOtherNote: event.target.value })}
                      placeholder={
                        kind === 'carpool'
                          ? 'e.g. Colleagues only, same company, no smokers…'
                          : 'e.g. Members only, 18+, experienced runners…'
                      }
                      className="w-full rounded-2xl border border-neutral-200 px-4 py-3 text-sm text-gray-900 outline-none focus:border-emerald-500"
                      maxLength={120}
                    />
                  </label>
                )}
                <label className="flex items-center gap-3 rounded-xl border border-neutral-200 px-3 py-3">
                  <input
                    type="checkbox"
                    checked={draft.childrenAllowed}
                    onChange={(event) => patchDraft({ childrenAllowed: event.target.checked })}
                    className="rounded border-gray-300 text-emerald-600"
                  />
                  <span className="text-sm text-gray-800">Children allowed</span>
                </label>
                <label className="flex items-center gap-3 rounded-xl border border-neutral-200 px-3 py-3">
                  <input
                    type="checkbox"
                    checked={draft.petsAllowed}
                    onChange={(event) => patchDraft({ petsAllowed: event.target.checked })}
                    className="rounded border-gray-300 text-emerald-600"
                  />
                  <span className="text-sm text-gray-800">Pets allowed</span>
                </label>
              </div>
            )}
              </>
            )}

            <OrganizeWizardStepError error={error} />
            <OrganizeWizardStepNext
                disabled={
                  !structuredFlow &&
                  (draft.joinMode === 'open' || kind === 'carpool') &&
                  draft.audienceAccess === 'others' &&
                  !draft.audienceOtherNote.trim()
                }
                onClick={goNext}
               />
          </OrganizeWizardChrome>
  );
}
