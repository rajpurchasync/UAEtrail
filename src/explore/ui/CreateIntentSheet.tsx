import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { ExploreResponsiveSheet } from './ExploreResponsiveSheet';
import {
  ADD_COMPOSE_OPTIONS,
  COMPOSE_MENU_OPTIONS,
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

interface CreateIntentSheetProps {
  route: ExploreCompose | null;
  onRouteChange: (route: ExploreCompose | null) => void;
  onClose: () => void;
}

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

  return (
    <ExploreResponsiveSheet
      open
      onClose={onClose}
      maxWidthClass="lg:max-w-md"
      panelClassName="px-4 pb-[calc(var(--safe-bottom)+1.25rem)] pt-1 lg:px-6 lg:pb-6 lg:pt-2"
    >
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
          <span className="w-14" />
        )}
        <h2 className="absolute left-1/2 max-w-[70%] -translate-x-1/2 text-center text-base font-bold tracking-tight text-neutral-900 lg:text-xl">
          {intent ? composeIntentTitle(intent) : COMPOSE_MENU_TITLE}
        </h2>
        <button
          type="button"
          onClick={onClose}
          className="-mr-1 rounded-full p-2 text-neutral-400 hover:bg-neutral-100"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {!intent ? (
        <div className="space-y-2">
          {COMPOSE_MENU_OPTIONS.map((option) => (
            <button
              key={option.intent}
              type="button"
              onClick={() => onRouteChange({ surface: 'menu', intent: option.intent })}
              className="flex w-full items-center gap-3 rounded-2xl border border-neutral-200 bg-white px-3 py-3 text-left transition hover:border-emerald-200 hover:bg-emerald-50/40 lg:px-4 lg:py-3.5"
            >
              <span className="min-w-0 flex-1">
                <span className="block text-[15px] font-semibold text-neutral-900 lg:text-base">
                  {option.label}
                </span>
                <span className="mt-0.5 block text-xs leading-snug text-neutral-500 lg:text-sm">
                  {option.hint}
                </span>
              </span>
              <ChevronRight className="h-4 w-4 shrink-0 text-neutral-300" aria-hidden />
            </button>
          ))}
        </div>
      ) : kindOptions ? (
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
              className="rounded-2xl border border-neutral-200 bg-white px-3 py-3 text-left transition hover:border-emerald-300 hover:bg-emerald-50/50 lg:py-3.5"
            >
              <span className="text-2xl">{option.emoji}</span>
              <p className="mt-1.5 text-sm font-semibold leading-snug text-neutral-900">{option.label}</p>
            </button>
          ))}
        </div>
      ) : null}
    </ExploreResponsiveSheet>
  );
};
