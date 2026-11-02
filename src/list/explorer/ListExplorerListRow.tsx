import { ChevronRight, MapPin } from 'lucide-react';
import type { DiscoveryCardModel } from '../../discovery/discoveryCardModel';
import { EnvironmentImage } from '../../components/ui/EnvironmentImage';
import { SecureAvatar } from '../../components/ui/SecureAvatar';
import { DiscoveryCardTypeIcon } from '../../explore/ui/DiscoveryCardTypeIcon';
import { EXPLORE_LIST_ROW, EXPLORE_TYPE } from '../../config/exploreTheme';
import { resolveBrowsePosterCoverUrl } from '../browsePosterCover';
import { ListExplorerItemLink } from './ListExplorerItemLink';
import { listExplorerCardMeta } from './listExplorerCardMeta';
import { usePlaceDistanceLabel } from './listPlaceDistance';

type ListExplorerListRowProps = {
  card: DiscoveryCardModel;
};

const splitWhen = (when: string | null): { date: string; time: string | null } | null => {
  if (!when) return null;
  const at = when.match(/^(.*?)\s+at\s+(.+)$/);
  if (!at) return { date: when, time: null };
  return { date: at[1], time: at[2] };
};

export const ListExplorerListRow = ({ card }: ListExplorerListRowProps) => {
  const cover = resolveBrowsePosterCoverUrl(card);
  const meta = listExplorerCardMeta(card);
  const whenParts = splitWhen(meta.when);
  const distance = usePlaceDistanceLabel(card.mapLatitude, card.mapLongitude);

  return (
    <ListExplorerItemLink
      to={card.path}
      exploreItemId={card.id}
      className={`${EXPLORE_LIST_ROW.shell} flex items-center gap-3 p-2.5 pr-3 active:scale-[0.995]`}
    >
      <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-neutral-100">
        {cover ? (
          <EnvironmentImage
            src={cover}
            alt=""
            className="h-full w-full object-cover"
            loading="lazy"
            decoding="async"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-neutral-100 text-xl" aria-hidden>
            {card.emoji}
          </div>
        )}
        <DiscoveryCardTypeIcon
          tone={card.tone}
          source={card.source}
          kind={card.kind}
          emoji={card.emoji}
          size="overlay"
          className="absolute -bottom-0.5 -right-0.5 h-6 w-6 text-sm shadow-sm ring-2 ring-white"
        />
      </div>
      <div className="min-w-0 flex-1">
        <h3 className={`truncate text-[15px] font-bold leading-snug ${EXPLORE_TYPE.title}`}>
          {meta.title}
        </h3>
        {meta.location ? (
          <p className={`mt-0.5 flex items-center gap-1 truncate text-sm font-medium ${EXPLORE_TYPE.muted}`}>
            <MapPin className="h-3.5 w-3.5 shrink-0 text-emerald-600" aria-hidden />
            <span className="truncate">{meta.location}</span>
            {distance ? <span className="shrink-0 tabular-nums text-neutral-500">{distance}</span> : null}
          </p>
        ) : null}
        {meta.hostName ? (
          <p className="mt-0.5 flex items-center gap-1 truncate text-xs font-medium text-neutral-600">
            <SecureAvatar
              src={meta.hostAvatar}
              name={meta.hostName}
              className="h-4 w-4 shrink-0 text-[7px]"
            />
            <span className="truncate">{meta.hostName}</span>
          </p>
        ) : null}
        {meta.soldOut ? (
          <p className="mt-0.5 text-[11px] font-bold uppercase tracking-wide text-red-600">Sold out</p>
        ) : null}
      </div>
      {whenParts ? (
        <div className="shrink-0 text-right leading-tight">
          <p className="whitespace-nowrap text-[13px] font-semibold text-neutral-900">{whenParts.date}</p>
          {whenParts.time ? (
            <p className="mt-0.5 whitespace-nowrap text-xs font-medium text-emerald-700">{whenParts.time}</p>
          ) : null}
        </div>
      ) : null}
      <ChevronRight className="h-4 w-4 shrink-0 text-neutral-400" aria-hidden />
    </ListExplorerItemLink>
  );
};
