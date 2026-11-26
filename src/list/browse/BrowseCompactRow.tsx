import { ChevronRight, MapPin } from 'lucide-react';
import type { DiscoveryCardModel } from '../../discovery/discoveryCardModel';
import { EnvironmentImage } from '../../components/ui/EnvironmentImage';
import { SecureAvatar } from '../../components/ui/SecureAvatar';
import { DiscoveryCardTypeIcon } from '../../discovery/discoveryPortExploreCardTypeIcon';
import { EXPLORE_LIST_ROW, EXPLORE_TYPE } from '../../config/exploreTheme';
import { resolveBrowsePosterCoverUrl } from './browsePosterCover';
import { BrowseItemLink } from './BrowseItemLink';
import { browseCardMeta, browseRowWhenDisplay } from './browseCardMeta';
import { DiscoveryCardHostProfileNav } from '../../discovery/DiscoveryCardHostProfileNav';

type BrowseCompactRowProps = {
  card: DiscoveryCardModel;
  onMapHover?: (exploreItemId: string | null) => void;
};

/** List layout row — compact discovery card (`?layout=list`). */
export const BrowseCompactRow = ({ card, onMapHover }: BrowseCompactRowProps) => {
  const cover = resolveBrowsePosterCoverUrl(card);
  const meta = browseCardMeta(card);
  const whenParts = browseRowWhenDisplay(card);

  return (
    <BrowseItemLink
      to={card.path}
      exploreItemId={card.id}
      onMapHover={onMapHover}
      className={`${EXPLORE_LIST_ROW.shell} flex items-stretch gap-2 p-2 active:scale-[0.995] sm:gap-2.5 sm:p-2.5 md:gap-1.5 md:p-1.5 md:pr-2`}
    >
      <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-neutral-100 sm:h-14 sm:w-14 sm:rounded-xl md:h-10 md:w-10">
        {cover ? (
          <EnvironmentImage
            src={cover}
            catalogThumb
            alt=""
            className="h-full w-full object-cover"
            loading="lazy"
            decoding="async"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-neutral-100 text-lg sm:text-xl" aria-hidden>
            {card.emoji}
          </div>
        )}
        <DiscoveryCardTypeIcon
          tone={card.tone}
          source={card.source}
          kind={card.kind}
          emoji={card.emoji}
          size="overlay"
          className="absolute -bottom-0.5 -right-0.5 h-5 w-5 text-[10px] shadow-sm ring-2 ring-white sm:h-6 sm:w-6 sm:text-sm"
        />
      </div>
      <div className="flex min-w-0 flex-1 flex-col justify-center gap-0.5 overflow-hidden py-0.5">
        <h3
          className={`line-clamp-2 text-[clamp(0.75rem,2.8vw,0.9375rem)] font-bold leading-snug ${EXPLORE_TYPE.title}`}
        >
          {meta.title}
        </h3>
        {meta.location ? (
          <p className="mt-0 flex min-w-0 items-start gap-0.5 text-[clamp(0.625rem,2.4vw,0.8125rem)] font-medium leading-snug text-neutral-700">
            <MapPin
              className="mt-0.5 h-3 w-3 shrink-0 text-emerald-600 sm:h-3.5 sm:w-3.5"
              aria-hidden
            />
            <span className="min-w-0 line-clamp-2 break-words leading-snug">{meta.location}</span>
          </p>
        ) : null}
        {meta.hostName ? (
          <DiscoveryCardHostProfileNav
            card={card}
            embedInItemLink
            ariaLabel={`View ${meta.hostName} profile`}
            className="flex items-center gap-1 text-left text-[clamp(0.625rem,2.2vw,0.75rem)] font-medium leading-snug text-neutral-600 hover:text-emerald-800"
          >
            <SecureAvatar
              src={meta.hostAvatar}
              name={meta.hostName}
              className="h-3.5 w-3.5 shrink-0 text-[6px] sm:h-4 sm:w-4 sm:text-[7px]"
            />
            <span className="min-w-0 truncate underline decoration-neutral-300 underline-offset-2">
              {meta.hostName}
            </span>
          </DiscoveryCardHostProfileNav>
        ) : null}
        {meta.soldOut ? (
          <p className="text-[10px] font-bold uppercase tracking-wide text-red-600">Sold out</p>
        ) : null}
      </div>
      {whenParts ? (
        <div className="flex shrink-0 flex-col justify-center self-center pl-0.5 text-right leading-tight md:max-w-[7.25rem] lg:max-w-[8rem]">
          <p className="line-clamp-2 text-[clamp(0.625rem,2.2vw,0.8125rem)] font-semibold text-neutral-900">
            {whenParts.date}
          </p>
          {whenParts.time ? (
            <p className="mt-0.5 line-clamp-1 text-[10px] font-medium text-emerald-700 sm:text-[11px]">
              {whenParts.time}
            </p>
          ) : null}
        </div>
      ) : null}
      <ChevronRight className="h-3.5 w-3.5 shrink-0 self-center text-neutral-400 sm:h-4 sm:w-4" aria-hidden />
    </BrowseItemLink>
  );
};