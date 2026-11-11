import { ChevronRight } from 'lucide-react';

import { ExploreResponsiveSheet } from './ExploreResponsiveSheet';
import { FlowSheetHeader } from './ExploreFlowSheetChrome';
import { finishComposeFlowClose, requestComposeFlowClose } from './composeFlowClose';

import {

  COMPOSE_MENU_OPTIONS,

  COMPOSE_MENU_TITLE,

  ADD_PLACE_OPTIONS,

  ADD_TARGET_OPTIONS,

  SEEK_FIXED_COMPOSE_OPTIONS,

  CREATE_TRIP_HOST_COMPOSE_OPTIONS,

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

import type { SeekingComposeKind } from '@uaetrail/shared-types';

import { EXPLORE_COMPOSE, EXPLORE_FLOW, EXPLORE_Z } from '../../config/exploreTheme';

import { exploreFlowKindTileClass } from './exploreFlowUi';



interface CreateIntentSheetProps {

  route: ExploreCompose | null;

  onRouteChange: (route: ExploreCompose | null) => void;

  onClose: () => void;

}



const menuGroupClass =

  'overflow-hidden rounded-2xl border border-neutral-200/80 bg-white shadow-[0_1px_8px_rgba(15,23,42,.06)]';






const isSeekFixedKindStep = (
  route: ExploreCompose
): route is Extract<ExploreCompose, { surface: 'menu'; intent: 'seek'; mode: 'fixed' }> =>
  Boolean(
    isComposeMenu(route) &&
      route.intent === 'seek' &&
      'mode' in route &&
      route.mode === 'fixed'
  );



export const CreateIntentSheet = ({ route, onRouteChange, onClose }: CreateIntentSheetProps) => {

  const open = isComposeMenu(route);
  if (!open) return null;



  const headerTitle = composeMenuTitle(route);

  const composeInProgress = Boolean(route.intent);

  const finishClose = () => finishComposeFlowClose(onClose);

  const requestClose = () =>
    requestComposeFlowClose({ hasDraft: false, inProgress: composeInProgress }, finishClose);



  const showTopLevel = !route.intent;

  const showHostKinds = route.intent === 'host';

  const showSeekModes = route.intent === 'seek' && !isSeekFixedKindStep(route);

  const showSeekFixedKinds = isSeekFixedKindStep(route);

  const showAddTargets =

    route.intent === 'add' && !('target' in route);

  const showAddPlaceKinds =

    route.intent === 'add' &&

    'target' in route &&

    route.target === 'place';



  return (

    <ExploreResponsiveSheet

      open

      onClose={requestClose}

      title={headerTitle}

      maxWidthClass="lg:max-w-md"

      zClass={EXPLORE_Z.composeFlow}

      overlayFixed

      composePresentation="menu"

      viewportAdaptive

      showHandle={false}

      showCloseButton

      panelClassName="overflow-hidden px-0 pb-[calc(var(--safe-bottom)+1rem)] pt-0 lg:pb-8 lg:pt-3"

    >

      <div className="min-w-0">

        {showTopLevel ? (

          <>

            <FlowSheetHeader
              title={COMPOSE_MENU_TITLE}
              onClose={requestClose}
              pickerTitle
            />

            <div className={`${menuGroupClass} compose-menu-list w-full`}>

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

          </>

        ) : (

          <>

            <FlowSheetHeader
              title={headerTitle}
              onClose={requestClose}
              pickerTitle
            />



            {showHostKinds ? (

              <div className={EXPLORE_COMPOSE.pickerChoiceGrid}>

                {CREATE_TRIP_HOST_COMPOSE_OPTIONS.map((option) => (

                  <button

                    key={option.kind}

                    type="button"

                    onClick={() => onRouteChange(hostCompose(option.kind))}

                    className={exploreFlowKindTileClass(false)}

                  >

                    <span

                      className="text-3xl leading-none font-emoji"

                      aria-hidden

                    >

                      {option.emoji}

                    </span>

                    <p className={EXPLORE_FLOW.choiceCardTitle}>{option.label}</p>

                  </button>

                ))}

              </div>

            ) : null}



            {showSeekModes ? (

              <div className={`${menuGroupClass} compose-menu-list w-full`}>

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

              <div className={EXPLORE_COMPOSE.pickerChoiceGrid}>

                {SEEK_FIXED_COMPOSE_OPTIONS.map((option) => (

                  <button

                    key={option.kind}

                    type="button"

                    onClick={() => onRouteChange(seekFixedCompose(option.kind as SeekingComposeKind))}

                    className={exploreFlowKindTileClass(false)}

                  >

                    <span

                      className="text-3xl leading-none font-emoji"

                      aria-hidden

                    >

                      {option.emoji}

                    </span>

                    <p className={EXPLORE_FLOW.choiceCardTitle}>{option.label}</p>

                  </button>

                ))}

              </div>

            ) : null}



            {showAddTargets ? (

              <div className={`${menuGroupClass} compose-menu-list w-full`}>

                {ADD_TARGET_OPTIONS.map((option) => (

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

              <div className={EXPLORE_COMPOSE.pickerChoiceGrid}>

                {ADD_PLACE_OPTIONS.map((option) => (

                  <button

                    key={option.kind}

                    type="button"

                    onClick={() => onRouteChange(addPlaceCompose(option.kind))}

                    className={exploreFlowKindTileClass(false)}

                  >

                    <span

                      className="text-3xl leading-none font-emoji"

                      aria-hidden

                    >

                      {option.emoji}

                    </span>

                    <p className={EXPLORE_FLOW.choiceCardTitle}>{option.label}</p>

                  </button>

                ))}

              </div>

            ) : null}



          </>

        )}

      </div>

    </ExploreResponsiveSheet>

  );

};


