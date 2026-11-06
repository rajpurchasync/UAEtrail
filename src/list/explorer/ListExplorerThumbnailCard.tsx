import type { DiscoveryCardModel } from '../../discovery/discoveryCardModel';
import { EXPLORE_TYPE } from '../../config/exploreTheme';
import { ListExplorerItemLink } from './ListExplorerItemLink';
import { listExplorerCardMeta } from './listExplorerCardMeta';
import { DiscoveryBrowsePosterBanner } from './DiscoveryBrowsePosterBanner';
import { EXPLORE_SHAPE } from '../../config/exploreTheme';

type ListExplorerThumbnailCardProps = {
  card: DiscoveryCardModel;
  onMapHover?: (exploreItemId: string | null) => void;
  showDistance?: boolean;
};

export const ListExplorerThumbnailCard = ({ card, onMapHover, showDistance = false }: ListExplorerThumbnailCardProps) => {
  const meta = listExplorerCardMeta(card);

  return (
    <ListExplorerItemLink
      to={card.path}
      exploreItemId={card.id}
      onMapHover={onMapHover}
      className={`${EXPLORE_SHAPE.control} group flex h-full flex-col overflow-hidden border border-neutral-200/80 bg-white shadow-[0_1px_8px_rgba(15,23,42,.06)] ring-1 ring-black/[0.02] transition active:scale-[0.99]`}
    >
      <DiscoveryBrowsePosterBanner card={card} showDistance={showDistance} imageHoverZoom />
      <div className="px-2.5 py-2 md:px-2 md:py-1.5">
        <h3 className={`line-clamp-2 text-[13px] font-bold leading-snug md:text-xs md:leading-snug ${EXPLORE_TYPE.title}`}>
          {meta.title}
        </h3>
      </div>
    </ListExplorerItemLink>
  );
};
