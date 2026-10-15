import { ChevronRight } from 'lucide-react';
import {
  EXPLORE_LINKED_PARENT_PLAN_PEEK_PREFIX,
  EXPLORE_RIDESHARE_AVAILABLE_LABEL,
  EXPLORE_VIEW_LINKED_PLAN_CTA,
} from '../../../createFlowCopy';
import type { DiscoveryCardModel } from '../../../../discovery/discoveryCardModel';
import { linkedParentRidesharePeekCopy } from '../../../exploreLinkedParentRideshareCopy';

export type ActivityPeekLinkedTransportProps = {
  card: DiscoveryCardModel;
  onOpenLinkedPin?: (pinItemId: string) => void;
};

const panelClass =
  'mt-3 w-full rounded-xl border border-sky-200 bg-sky-50/90 px-3.5 py-3 text-left';
const buttonPanelClass = `${panelClass} transition active:bg-sky-100/90`;

export const activityPeekHasLinkedTransportAffordance = (
  card: DiscoveryCardModel
): boolean => {
  if (card.kind === 'rideshare' && card.activity?.linkedParentActivity) return true;
  return Boolean(card.linkedRideshares?.length);
};

/** Linked parent plan / rideshare rows on activity pin summary. */
export const ActivityPeekLinkedTransport = ({
  card,
  onOpenLinkedPin,
}: ActivityPeekLinkedTransportProps) => {
  const open = onOpenLinkedPin;

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
  if (!linked?.length || card.kind === 'rideshare') return null;

  const openLinked = (exploreItemId: string) => {
    if (open) open(exploreItemId);
  };

  if (linked.length === 1) {
    if (!open) {
      return (
        <p className="text-sm font-semibold text-sky-800">{EXPLORE_RIDESHARE_AVAILABLE_LABEL}</p>
      );
    }
    return (
      <button
        type="button"
        onClick={() => openLinked(linked[0]!.exploreItemId)}
        className="inline-flex items-center gap-1 text-sm font-semibold text-sky-800 hover:underline"
      >
        {EXPLORE_RIDESHARE_AVAILABLE_LABEL}
        <ChevronRight className="h-4 w-4 shrink-0" aria-hidden />
      </button>
    );
  }

  return (
    <ul className="space-y-2">
      {linked.map((row) =>
        open ? (
          <li key={row.exploreItemId}>
            <button
              type="button"
              onClick={() => openLinked(row.exploreItemId)}
              className="inline-flex items-center gap-1 text-sm font-semibold text-sky-800 hover:underline"
            >
              {EXPLORE_RIDESHARE_AVAILABLE_LABEL}
              <span className="font-medium text-gray-700">· {row.title}</span>
              <ChevronRight className="h-4 w-4 shrink-0" aria-hidden />
            </button>
          </li>
        ) : (
          <li key={row.exploreItemId} className="text-sm font-medium text-gray-900">
            {row.title}
          </li>
        )
      )}
      {card.activity?.title ? (
        <li className="text-xs text-gray-600">
          {EXPLORE_LINKED_PARENT_PLAN_PEEK_PREFIX} {card.activity.title}
        </li>
      ) : null}
    </ul>
  );
};
