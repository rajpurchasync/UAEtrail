import { ChevronRight, X } from 'lucide-react';
import { ExploreResponsiveSheet } from './ExploreResponsiveSheet';
import { FlowSheetBackButton } from './ExploreFlowSheetChrome';
import {
  ADD_COMPOSE_OPTIONS,
  COMPOSE_MENU_OPTIONS,
  COMPOSE_MENU_THINKING_EMOJI,
  COMPOSE_MENU_TITLE,
  FIND_COMPOSE_OPTIONS,
  ORGANIZE_COMPOSE_OPTIONS,
  composeIntentTitle,
  isComposeMenu,
  type ExploreCompose,
  type FindComposeKind,
  type OrganizeComposeKind,
} from '../compose';
import type { ContributeVenueKind } from '../contributeTypes';
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

export const CreateIntentSheet = ({ route, onRouteChange, onClose }: CreateIntentSheetProps) => {
  const open = isComposeMenu(route);
  const intent = open ? route.intent : undefined;

  if (!open) return null;

  const handleBack = () => {
    if (intent) {
      onRouteChange({ surface: 'menu' });
      return;
    }
    onClose();
  };

  const kindOptions =
    intent === 'organize'
      ? ORGANIZE_COMPOSE_OPTIONS
      : intent === 'find'
        ? FIND_COMPOSE_OPTIONS
        : intent === 'add'
          ? ADD_COMPOSE_OPTIONS
          : null;

  const headerTitle = intent ? composeIntentTitle(intent) : COMPOSE_MENU_TITLE;

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
        {!intent ? (
          <>
            <ComposeMenuHero onClose={onClose} />

            <div className={`${menuGroupClass} divide-y divide-neutral-100`}>
              {COMPOSE_MENU_OPTIONS.map((option) => (
                <button
                  key={option.intent}
                  type="button"
                  onClick={() => onRouteChange({ surface: 'menu', intent: option.intent })}
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

            {kindOptions ? (
              <div className={EXPLORE_FLOW.choiceGrid2}>
                {kindOptions.map((option) => (
                  <button
                    key={option.kind}
                    type="button"
                    onClick={() => {
                      if (intent === 'organize') {
                        onRouteChange({ intent: 'organize', kind: option.kind as OrganizeComposeKind });
                        return;
                      }
                      if (intent === 'find') {
                        onRouteChange({ intent: 'find', kind: option.kind as FindComposeKind });
                        return;
                      }
                      onRouteChange({ intent: 'add', kind: option.kind as ContributeVenueKind });
                    }}
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
