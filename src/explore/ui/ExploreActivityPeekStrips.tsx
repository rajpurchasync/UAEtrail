import { Car, Users } from 'lucide-react';
import type { ExploreCardModel } from '../exploreCardModel';
import {
  ACTIVITY_PEEK_SECTION_BUDDIES,
  ACTIVITY_PEEK_SECTION_LOGISTICS,
} from '../../content/activityPeekCopy';
import { ExploreLinkedRidesharePeekIndication } from './ExploreLinkedRidesharePeekIndication';
import { ExploreCardCapacityRow, ExploreCardPeopleRow } from './ExploreCardPresentation';

const stripShell = 'mt-3 rounded-xl border border-neutral-100 bg-neutral-50/80 px-3 py-2.5';
const stripLabel = 'mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-neutral-500';

type ExploreActivityPeekStripsProps = {
  card: ExploreCardModel;
  onGuestGatedAction?: () => void;
  onOpenExploreItem?: (exploreItemId: string) => void;
};

/** Activity map peek — people + logistics strips (facts stay in peek hero/meta). */
export const ExploreActivityPeekStrips = ({
  card,
  onGuestGatedAction,
  onOpenExploreItem,
}: ExploreActivityPeekStripsProps) => (
  <div className="space-y-2">
    <section className={stripShell} aria-label={ACTIVITY_PEEK_SECTION_BUDDIES}>
      <div className={stripLabel}>
        <Users className="h-3.5 w-3.5" aria-hidden />
        {ACTIVITY_PEEK_SECTION_BUDDIES}
      </div>
      <ExploreCardPeopleRow card={card} onGuestGatedAction={onGuestGatedAction} />
    </section>
    <section className={stripShell} aria-label={ACTIVITY_PEEK_SECTION_LOGISTICS}>
      <div className={stripLabel}>
        <Car className="h-3.5 w-3.5" aria-hidden />
        {ACTIVITY_PEEK_SECTION_LOGISTICS}
      </div>
      <ExploreLinkedRidesharePeekIndication card={card} onOpenExploreItem={onOpenExploreItem} />
      <ExploreCardCapacityRow card={card} />
    </section>
  </div>
);
