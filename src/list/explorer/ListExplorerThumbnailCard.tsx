import { Clock, MapPin } from 'lucide-react';
import type { DiscoveryCardModel } from '../../discovery/discoveryCardModel';
import { EnvironmentImage } from '../../components/ui/EnvironmentImage';
import { SecureAvatar } from '../../components/ui/SecureAvatar';
import { DiscoveryCardTypeIcon } from '../../explore/ui/DiscoveryCardTypeIcon';
import { EXPLORE_SHAPE, EXPLORE_TYPE } from '../../config/exploreTheme';
import { resolveBrowsePosterCoverUrl } from '../browsePosterCover';
import { ListExplorerItemLink } from './ListExplorerItemLink';
import { listExplorerCardMeta } from './listExplorerCardMeta';
import { usePlaceDistanceLabel } from './listPlaceDistance';
import { ListExplorerDistanceChip } from './ListExplorerDistanceChip';

type ListExplorerThumbnailCardProps = {
  card: DiscoveryCardModel;
  onMapHover?: (exploreItemId: string | null) => void;
  showDistance?: boolean;
};

export const ListExplorerThumbnailCard = ({ card, onMapHover, showDistance = false }: ListExplorerThumbnailCardProps) => {
  const cover = resolveBrowsePosterCoverUrl(card);
  const meta = listExplorerCardMeta(card);
  const distance = usePlaceDistanceLabel(card.mapLatitude, card.mapLongitude);
  const showBottom = Boolean(meta.location || meta.when || meta.price || distance || (showDistance && distance));

  return (
    <ListExplorerItemLink
      to={card.path}
      exploreItemId={card.id}
      onMapHover={onMapHover}
      className={`${EXPLORE_SHAPE.control} group flex h-full flex-col overflow-hidden border border-neutral-200/80 bg-white shadow-[0_1px_8px_rgba(15,23,42,.06)] ring-1 ring-black/[0.02] transition active:scale-[0.99]`}
    >
      <div className="relative h-[9.75rem] w-full shrink-0 overflow-hidden bg-neutral-100 sm:h-[8.75rem] md:h-32 lg:h-[7.25rem]">
        {cover ? (
          <EnvironmentImage
            src={cover}
            alt=""
            className="h-full w-full object-cover object-center transition duration-300 group-hover:scale-[1.03]"
            loading="lazy"
            decoding="async"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-neutral-100 to-neutral-200">
            <span className="select-none text-3xl md:text-2xl" aria-hidden>
              {card.emoji}
            </span>
          </div>
        )}
        <DiscoveryCardTypeIcon
          tone={card.tone}
          source={card.source}
          kind={card.kind}
          emoji={card.emoji}
          size="overlay"
          className="absolute left-1 top-1 h-5 w-5 text-xs shadow-sm ring-2 ring-white/90 md:h-[1.125rem] md:w-[1.125rem]"
        />
        {meta.hostName ? (
          <div className="absolute right-1.5 top-1.5 flex max-w-[68%] flex-col items-end gap-1">
            <div className="flex max-w-full items-center gap-1 rounded-full bg-black/55 py-0.5 pl-0.5 pr-1.5 shadow-sm ring-1 ring-white/15">
              <SecureAvatar
                src={meta.hostAvatar}
                name={meta.hostName}
                className="h-5 w-5 shrink-0 text-[8px] ring-1 ring-white/80"
              />
              <span className="min-w-0 truncate text-[10px] font-semibold leading-none text-white">
                {meta.hostName}
              </span>
            </div>
            {meta.soldOut ? (
              <span className="rounded-md bg-red-600 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white shadow-sm">
                Sold out
              </span>
            ) : null}
          </div>
        ) : meta.soldOut ? (
          <span className="absolute right-1.5 top-1.5 rounded-md bg-red-600 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white shadow-sm">
            Sold out
          </span>
        ) : null}
        {showBottom ? (
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 via-black/40 to-transparent px-2 pb-1.5 pt-8">
            <div className="flex items-end gap-1.5">
              <div className="min-w-0 flex-1">
                {meta.location || distance ? (
                  <p className="flex flex-wrap items-center gap-1 text-[10px] font-semibold leading-tight text-white">
                    {meta.location ? (
                      <>
                        <MapPin className="h-3 w-3 shrink-0 text-emerald-300" aria-hidden />
                        <span className="min-w-0 truncate">{meta.location}</span>
                      </>
                    ) : null}
                    {distance ? <ListExplorerDistanceChip label={distance} variant="dark" /> : null}
                  </p>
                ) : null}
                {meta.when ? (
                  <p className="mt-0.5 flex items-center gap-1 text-[10px] font-medium leading-tight text-white/90">
                    <Clock className="h-3 w-3 shrink-0 text-white/80" aria-hidden />
                    <span className="truncate">{meta.when}</span>
                  </p>
                ) : null}
              </div>
              {meta.price ? (
                <span className="shrink-0 rounded-md bg-white/95 px-1.5 py-0.5 text-[10px] font-bold leading-none text-neutral-900 shadow-sm">
                  {meta.price}
                </span>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>
      <div className="px-2.5 py-2 md:px-2 md:py-1.5">
        <h3 className={`line-clamp-2 text-[13px] font-bold leading-snug md:text-xs md:leading-snug ${EXPLORE_TYPE.title}`}>
          {meta.title}
        </h3>
      </div>
    </ListExplorerItemLink>
  );
};
