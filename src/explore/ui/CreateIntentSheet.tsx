import { ChevronLeft, ChevronRight, MapPinned, Mountain, UsersRound, X } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { ExploreResponsiveSheet } from './ExploreResponsiveSheet';
import {
  ADD_COMPOSE_OPTIONS,
  COMPOSE_MENU_KICKER,
  COMPOSE_MENU_OPTIONS,
  COMPOSE_MENU_TITLE,
  FIND_COMPOSE_OPTIONS,
  ORGANIZE_COMPOSE_OPTIONS,
  composeIntentTitle,
  isComposeMenu,
  type ComposeIntent,
  type ExploreCompose,
  type FindComposeKind,
  type OrganizeComposeKind,
} from '../compose';
import type { ContributeVenueKind } from '../contributeTypes';
import { EXPLORE_INTENT } from '../../config/exploreTheme';

interface CreateIntentSheetProps {
  route: ExploreCompose | null;
  onRouteChange: (route: ExploreCompose | null) => void;
  onClose: () => void;
}

const COMPOSE_INTENT_VISUAL: Record<
  ComposeIntent,
  { Icon: LucideIcon; theme: (typeof EXPLORE_INTENT)[keyof typeof EXPLORE_INTENT] }
> = {
  organize: { Icon: Mountain, theme: EXPLORE_INTENT.host },
  find: { Icon: UsersRound, theme: EXPLORE_INTENT.request },
  add: { Icon: MapPinned, theme: EXPLORE_INTENT.contribute },
};

const intentThemeFor = (intent: ComposeIntent) => COMPOSE_INTENT_VISUAL[intent].theme;

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

  const activeTheme = intent ? intentThemeFor(intent) : null;
  const headerTitle = intent ? composeIntentTitle(intent) : COMPOSE_MENU_TITLE;

  return (
    <ExploreResponsiveSheet
      open
      onClose={onClose}
      title={headerTitle}
      maxWidthClass="lg:max-w-md"
      panelClassName="overflow-hidden px-0 pb-[calc(var(--safe-bottom)+1.25rem)] pt-0 lg:pb-6 lg:pt-0"
    >
      <div
        className={`relative px-4 pb-4 pt-1 lg:px-6 lg:pb-0 lg:pt-2 ${
          intent
            ? 'border-b border-neutral-100/80 bg-gradient-to-br from-white via-white to-neutral-50'
            : 'border-b border-emerald-100/80 bg-gradient-to-br from-emerald-50/90 via-white to-teal-50/40'
        }`}
      >
        {!intent ? (
          <div
            className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600"
            aria-hidden
          />
        ) : null}

        <div className="relative mb-3 flex items-center justify-between gap-3 lg:mb-4">
          {intent ? (
            <button
              type="button"
              onClick={handleBack}
              className="-ml-1 inline-flex items-center gap-0.5 rounded-full px-1 py-1.5 text-sm font-semibold text-neutral-700 hover:bg-neutral-100"
            >
              <ChevronLeft className="h-5 w-5" />
              Back
            </button>
          ) : (
            <span className="inline-flex w-14 items-center gap-1.5">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-700 shadow-sm shadow-emerald-600/25">
                <Mountain className="h-3.5 w-3.5 text-white" strokeWidth={2.25} />
              </span>
            </span>
          )}
          <div className="absolute left-1/2 max-w-[72%] -translate-x-1/2 text-center">
            <h2 className="text-base font-bold tracking-tight text-neutral-900 lg:text-xl">{headerTitle}</h2>
            {!intent ? (
              <p className="mt-0.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-emerald-700/85">
                {COMPOSE_MENU_KICKER}
              </p>
            ) : activeTheme ? (
              <p className={`mt-0.5 text-xs font-medium ${activeTheme.label}`}>Pick a type to continue</p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="-mr-1 rounded-full p-2 text-neutral-400 hover:bg-neutral-100"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="px-4 pt-3 lg:px-6 lg:pt-4">
        {!intent ? (
          <div className="space-y-2.5">
            {COMPOSE_MENU_OPTIONS.map((option) => {
              const { Icon, theme } = COMPOSE_INTENT_VISUAL[option.intent];
              return (
                <button
                  key={option.intent}
                  type="button"
                  onClick={() => onRouteChange({ surface: 'menu', intent: option.intent })}
                  className={`flex w-full items-center gap-3 rounded-2xl border px-3 py-3 text-left transition active:scale-[0.99] lg:px-4 lg:py-3.5 ${theme.card}`}
                >
                  <span
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${theme.iconWrap}`}
                  >
                    <Icon className="h-5 w-5" strokeWidth={2.25} aria-hidden />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className={`block text-[15px] font-bold lg:text-base ${theme.label}`}>
                      {option.label}
                    </span>
                    <span className="mt-0.5 block text-xs leading-snug text-neutral-600 lg:text-sm">
                      {option.hint}
                    </span>
                  </span>
                  <ChevronRight className={`h-4 w-4 shrink-0 opacity-60 ${theme.label}`} aria-hidden />
                </button>
              );
            })}
          </div>
        ) : kindOptions && activeTheme ? (
          <div className="grid grid-cols-2 gap-2">
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
                className={`rounded-2xl border px-3 py-3 text-left transition active:scale-[0.98] lg:py-3.5 ${activeTheme.card}`}
              >
                <span className={`inline-flex h-9 w-9 items-center justify-center rounded-xl text-xl ${activeTheme.iconWrap}`}>
                  {option.emoji}
                </span>
                <p className={`mt-2 text-sm font-bold leading-snug ${activeTheme.label}`}>{option.label}</p>
              </button>
            ))}
          </div>
        ) : null}

        {!intent ? (
          <p className="mt-4 text-center text-[11px] font-medium text-neutral-400">
            Free to post · UAE &amp; GCC outdoors
          </p>
        ) : null}
      </div>
    </ExploreResponsiveSheet>
  );
};
