import { ChevronRight, X } from 'lucide-react';

import { ExploreResponsiveSheet } from './ExploreResponsiveSheet';

import { FlowSheetBackButton } from './ExploreFlowSheetChrome';

import {

  COMPOSE_MENU_OPTIONS,

  COMPOSE_MENU_THINKING_EMOJI,

  COMPOSE_MENU_TITLE,

  CONTRIBUTE_PLACE_OPTIONS,

  CONTRIBUTE_TARGET_OPTIONS,

  FIND_COMPOSE_OPTIONS,

  PLAN_COMPOSE_OPTIONS,

  SEEK_MODE_OPTIONS,

  addFacilityCompose,

  addPlaceCompose,

  composeMenuTitle,

  hostCompose,

  isComposeMenu,

  seekFixedCompose,

  seekFlexibleCompose,

  type ExploreCompose,

} from '../compose';

import type { SeekingPlanKind } from '@uaetrail/shared-types';

import { EXPLORE_COMPOSE, EXPLORE_FLOW, EXPLORE_Z } from '../../config/exploreTheme';

import { exploreFlowKindTileClass } from './exploreFlowUi';



interface CreateIntentSheetProps {

  route: ExploreCompose | null;

  onRouteChange: (route: ExploreCompose | null) => void;

  onClose: () => void;

}



const menuGroupClass =

  'overflow-hidden rounded-2xl border border-neutral-200/80 bg-white shadow-[0_1px_8px_rgba(15,23,42,.06)]';



const ComposeSheetCloseButton = ({ onClose, className = '' }: { onClose: () => void; className?: string }) => (

  <button

    type="button"

    onClick={onClose}

    className={`rounded-full p-2.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 ${className}`}

    aria-label="Close"

  >

    <X className="h-5 w-5" />

  </button>

);



const ComposeMenuHero = ({ onClose }: { onClose: () => void }) => (

  <header className={`${EXPLORE_FLOW.stepHeaderShell} mb-5`}>

    <ComposeSheetCloseButton onClose={onClose} className="absolute right-0 top-2 -mr-2" />

    <div className={EXPLORE_FLOW.stepTitleBlock}>

      <span className="mb-3 text-[2.5rem] font-emoji leading-none" aria-hidden>

        {COMPOSE_MENU_THINKING_EMOJI}

      </span>

      <h2 className={EXPLORE_FLOW.stepTitle}>{COMPOSE_MENU_TITLE}</h2>

    </div>

  </header>

);



const ComposeSheetHeader = ({ title, onClose }: { title: string; onClose: () => void }) => (

  <header className={EXPLORE_FLOW.stepHeaderShell}>

    <ComposeSheetCloseButton onClose={onClose} className="absolute right-0 top-2 -mr-2" />

    <div className={EXPLORE_FLOW.stepTitleBlock}>

      <h2 className={EXPLORE_FLOW.stepTitle}>{title}</h2>

    </div>

  </header>

);



const isSeekFixedKindStep = (

  route: ExploreCompose

): route is { surface: 'menu'; intent: 'seek'; mode: 'fixed' } =>

  route.surface === 'menu' && route.intent === 'seek' && 'mode' in route && route.mode === 'fixed';



export const CreateIntentSheet = ({ route, onRouteChange, onClose }: CreateIntentSheetProps) => {

  const open = isComposeMenu(route);

  if (!open) return null;



  const headerTitle = composeMenuTitle(route);



  const handleBack = () => {

    if (isSeekFixedKindStep(route)) {

      onRouteChange({ surface: 'menu', intent: 'seek' });

      return;

    }

    if (
      route.intent === 'add' &&
      'target' in route &&
      route.target === 'place' &&
      route.surface === 'menu'
    ) {
      onRouteChange({ surface: 'menu', intent: 'add' });
      return;
    }

    if (
      route.intent === 'host' ||
      route.intent === 'seek' ||
      route.intent === 'add' ||
      route.intent === 'contribute' ||
      route.intent === 'plan'
    ) {
      onRouteChange({ surface: 'menu' });
      return;
    }

    onClose();

  };



  const showTopLevel = !route.intent;

  const showHostKinds = route.intent === 'host' || route.intent === 'plan';

  const showSeekModes = route.intent === 'seek' && !isSeekFixedKindStep(route);

  const showSeekFixedKinds = isSeekFixedKindStep(route);

  const showAddTargets =

    (route.intent === 'add' || route.intent === 'contribute') && !('target' in route);

  const showAddPlaceKinds =

    (route.intent === 'add' || route.intent === 'contribute') &&

    'target' in route &&

    route.target === 'place';



  return (

    <ExploreResponsiveSheet

      open

      onClose={onClose}

      title={headerTitle}

      maxWidthClass="lg:max-w-md"

      zClass={EXPLORE_Z.composeFlow}

      overlayFixed

      panelClassName="overflow-hidden px-0 pb-[calc(var(--safe-bottom)+1.5rem)] pt-0 lg:pb-8 lg:pt-3"

    >

      <div className="px-5 pt-2 lg:px-6 lg:pt-0">

        {showTopLevel ? (

          <>

            <ComposeMenuHero onClose={onClose} />

            <div className={`${menuGroupClass} divide-y divide-neutral-100`}>

              {COMPOSE_MENU_OPTIONS.map((option) => (

                <button

                  key={option.top}

                  type="button"

                  onClick={() => onRouteChange({ surface: 'menu', intent: option.top })}

                  className="flex w-full items-center gap-4 px-4 py-4 text-left transition active:bg-emerald-50/40 lg:px-5 lg:py-[1.125rem]"

                >

                  <span

                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xl font-emoji leading-none ${EXPLORE_COMPOSE.menuIconWrap}`}

                    aria-hidden

                  >

                    {option.emoji}

                  </span>

                  <span className="min-w-0 flex-1">

                    <span className={`block ${EXPLORE_FLOW.menuRowTitle}`}>{option.label}</span>

                    <span className={`block ${EXPLORE_FLOW.choiceCardSubtitle} mt-1`}>{option.hint}</span>

                  </span>

                  <ChevronRight className="h-5 w-5 shrink-0 text-emerald-600/35" aria-hidden />

                </button>

              ))}

            </div>

            <p className="mt-5 px-1 text-center text-xs leading-relaxed text-neutral-400">

              Free to post · UAE &amp; GCC outdoors

            </p>

          </>

        ) : (

          <>

            <ComposeSheetHeader title={headerTitle} onClose={onClose} />



            {showHostKinds ? (

              <div className={EXPLORE_FLOW.choiceGrid2}>

                {PLAN_COMPOSE_OPTIONS.map((option) => (

                  <button

                    key={option.kind}

                    type="button"

                    onClick={() => onRouteChange(hostCompose(option.kind))}

                    className={exploreFlowKindTileClass(false)}

                  >

                    <span

                      className={`inline-flex h-9 w-9 items-center justify-center rounded-xl text-xl font-emoji leading-none ${EXPLORE_COMPOSE.kindIconWrap}`}

                      aria-hidden

                    >

                      {option.emoji}

                    </span>

                    <p className={`mt-2 ${EXPLORE_FLOW.choiceCardTitle}`}>{option.label}</p>

                  </button>

                ))}

              </div>

            ) : null}



            {showSeekModes ? (

              <div className={`${menuGroupClass} divide-y divide-neutral-100`}>

                {SEEK_MODE_OPTIONS.map((option) => (

                  <button

                    key={option.mode}

                    type="button"

                    onClick={() => {

                      if (option.mode === 'flexible') {

                        onRouteChange(seekFlexibleCompose());

                        return;

                      }

                      onRouteChange({ surface: 'menu', intent: 'seek', mode: 'fixed' });

                    }}

                    className="flex w-full items-center gap-4 px-4 py-4 text-left transition active:bg-emerald-50/40"

                  >

                    <span className="text-2xl font-emoji" aria-hidden>{option.emoji}</span>

                    <span className="min-w-0 flex-1">

                      <span className={`block ${EXPLORE_FLOW.menuRowTitle}`}>{option.label}</span>

                      <span className={`block ${EXPLORE_FLOW.choiceCardSubtitle} mt-1`}>{option.hint}</span>

                    </span>

                    <ChevronRight className="h-5 w-5 shrink-0 text-emerald-600/35" aria-hidden />

                  </button>

                ))}

              </div>

            ) : null}



            {showSeekFixedKinds ? (

              <div className={EXPLORE_FLOW.choiceGrid2}>

                {FIND_COMPOSE_OPTIONS.map((option) => (

                  <button

                    key={option.kind}

                    type="button"

                    onClick={() => onRouteChange(seekFixedCompose(option.kind as SeekingPlanKind))}

                    className={exploreFlowKindTileClass(false)}

                  >

                    <span

                      className={`inline-flex h-9 w-9 items-center justify-center rounded-xl text-xl font-emoji leading-none ${EXPLORE_COMPOSE.kindIconWrap}`}

                      aria-hidden

                    >

                      {option.emoji}

                    </span>

                    <p className={`mt-2 ${EXPLORE_FLOW.choiceCardTitle}`}>{option.label}</p>

                  </button>

                ))}

              </div>

            ) : null}



            {showAddTargets ? (

              <div className={`${menuGroupClass} divide-y divide-neutral-100`}>

                {CONTRIBUTE_TARGET_OPTIONS.map((option) => (

                  <button

                    key={option.target}

                    type="button"

                    onClick={() => {

                      if (option.target === 'facility') {

                        onRouteChange(addFacilityCompose('toilet'));

                        return;

                      }

                      onRouteChange({ surface: 'menu', intent: 'add', target: 'place' });

                    }}

                    className="flex w-full items-center gap-4 px-4 py-4 text-left transition active:bg-emerald-50/40"

                  >

                    <span className="text-2xl font-emoji" aria-hidden>{option.emoji}</span>

                    <span className="min-w-0 flex-1">

                      <span className={`block ${EXPLORE_FLOW.menuRowTitle}`}>{option.label}</span>

                      <span className={`block ${EXPLORE_FLOW.choiceCardSubtitle} mt-1`}>{option.hint}</span>

                    </span>

                    <ChevronRight className="h-5 w-5 shrink-0 text-emerald-600/35" aria-hidden />

                  </button>

                ))}

              </div>

            ) : null}



            {showAddPlaceKinds ? (

              <div className={EXPLORE_FLOW.choiceGrid2}>

                {CONTRIBUTE_PLACE_OPTIONS.map((option) => (

                  <button

                    key={option.kind}

                    type="button"

                    onClick={() => onRouteChange(addPlaceCompose(option.kind))}

                    className={exploreFlowKindTileClass(false)}

                  >

                    <span

                      className={`inline-flex h-9 w-9 items-center justify-center rounded-xl text-xl font-emoji leading-none ${EXPLORE_COMPOSE.kindIconWrap}`}

                      aria-hidden

                    >

                      {option.emoji}

                    </span>

                    <p className={`mt-2 ${EXPLORE_FLOW.choiceCardTitle}`}>{option.label}</p>

                  </button>

                ))}

              </div>

            ) : null}



            <FlowSheetBackButton onBack={handleBack} />

          </>

        )}

      </div>

    </ExploreResponsiveSheet>

  );

};


