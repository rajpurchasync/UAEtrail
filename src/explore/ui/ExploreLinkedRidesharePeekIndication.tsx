import { Car, ChevronRight } from 'lucide-react';
import {
  EXPLORE_LINKED_PARENT_PLAN_PEEK_PREFIX,
  EXPLORE_LINKED_RIDESHARES_PEEK_TITLE,
  EXPLORE_RIDESHARE_AVAILABLE_LABEL,
  EXPLORE_VIEW_LINKED_PLAN_CTA,
  EXPLORE_VIEW_LINKED_RIDESHARE_CTA,
} from '../createFlowCopy';
import type { ExploreCardModel } from '../exploreCardModel';
import { linkedParentRidesharePeekCopy } from '../exploreLinkedParentRideshareCopy';

type ExploreLinkedRidesharePeekIndicationProps = {
  card: ExploreCardModel;
  onOpenExploreItem?: (exploreItemId: string) => void;
};

const panelClass =
  'mt-3 w-full rounded-xl border border-sky-200 bg-sky-50/90 px-3.5 py-3 text-left';
const buttonPanelClass = `${panelClass} transition active:bg-sky-100/90`;

/** Bidirectional linked rideshare cue on map peek / item sheet (parent outing ↔ rideshare). */
export const ExploreLinkedRidesharePeekIndication = ({
  card,
  onOpenExploreItem,
}: ExploreLinkedRidesharePeekIndicationProps) => {
  const open = onOpenExploreItem;

  if (card.kind === 'rideshare' && card.activity?.linkedParentActivity) {
    const parent = card.activity.linkedParentActivity;
    const linkedCopy = linkedParentRidesharePeekCopy(parent.activityType, parent.title);
    const parentExploreId = `activity:${parent.id}`;
    const body = (
      <>
        <p className="text-xs font-semibold uppercase tracking-wide text-sky-800">{linkedCopy.eyebrow}</p>
        {linkedCopy.showTitleSubtitle ? (
          <p className="mt-1 text-sm font-medium text-gray-900">{parent.title}</p>
        ) : null}
        <p className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-sky-800">
          {EXPLORE_VIEW_LINKED_PLAN_CTA}
          <ChevronRight className="h-4 w-4" aria-hidden />
        </p>
      </>
    );
    if (!open) {
      return <div className={panelClass}>{body}</div>;
    }
    return (
      <button type="button" className={buttonPanelClass} onClick={() => open(parentExploreId)}>
        {body}
      </button>
    );
  }

  const linked = card.linkedRideshares;
  if (!linked?.length) return null;

  const showRideshareAvailable =
    card.requirementBadges?.includes('Rideshare available') && card.source === 'activity';

  return (
    <div className={panelClass}>
      <div className="flex items-start gap-2">
        <Car className="mt-0.5 h-4 w-4 flex-shrink-0 text-sky-700" aria-hidden />
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-sky-800">
            {showRideshareAvailable ? EXPLORE_RIDESHARE_AVAILABLE_LABEL : EXPLORE_LINKED_RIDESHARES_PEEK_TITLE}
          </p>
          <ul className="mt-2 space-y-2">
            {linked.map((row) => (
              <li key={row.exploreItemId}>
                {open ? (
                  <button
                    type="button"
                    onClick={() => open(row.exploreItemId)}
                    className="flex w-full items-center justify-between gap-2 text-left text-sm font-medium text-gray-900"
                  >
                    <span className="truncate">{row.title}</span>
                    <span className="inline-flex shrink-0 items-center gap-0.5 text-xs font-semibold text-sky-800">
                      {EXPLORE_VIEW_LINKED_RIDESHARE_CTA}
                      <ChevronRight className="h-3.5 w-3.5" aria-hidden />
                    </span>
                  </button>
                ) : (
                  <p className="text-sm font-medium text-gray-900">{row.title}</p>
                )}
              </li>
            ))}
          </ul>
          {card.activity?.title ? (
            <p className="mt-2 text-xs text-gray-600">
              {EXPLORE_LINKED_PARENT_PLAN_PEEK_PREFIX} {card.activity.title}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
};
