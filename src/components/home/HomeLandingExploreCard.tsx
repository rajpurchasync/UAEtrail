import { Link } from 'react-router-dom';
import type { ExploreMapItemDTO } from '@uaetrail/shared-types';
import { buildExploreCardModel, buildExploreListMeta } from '../../explore/exploreCardModel';
import { EnvironmentImage } from '../ui/EnvironmentImage';
import {
  ExploreCardDetailList,
  ExploreCardHeadline,
  ExploreCardRatingRow,
  ExploreCardTypeBadge,
  ExploreVenueImageBadges,
} from '../explore/ExploreCardPresentation';

interface HomeLandingExploreCardProps {
  item: ExploreMapItemDTO;
  onNavigate?: () => void;
}

/** Home carousel card — same presentation as explore map/list. */
export const HomeLandingExploreCard = ({ item, onNavigate }: HomeLandingExploreCardProps) => {
  const card = buildExploreCardModel(item);
  const isCatalogRow = card.source === 'shop' || card.source === 'agency' || card.source === 'venue';
  const activityMeta = !isCatalogRow ? buildExploreListMeta(card) : null;

  return (
    <Link
      to={item.path}
      onClick={onNavigate}
      className="group glass-card-interactive flex h-full flex-col overflow-hidden hover:shadow-glass-lg"
    >
      {card.coverImage ? (
        <div className="relative aspect-[16/10] overflow-hidden bg-neutral-100">
          <EnvironmentImage
            src={card.coverImage}
            alt=""
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
            loading="lazy"
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-black/10" />
          <ExploreVenueImageBadges card={card} />
        </div>
      ) : null}

      <div className={`flex flex-1 flex-col gap-3 p-4 ${card.coverImage ? 'pt-3' : 'pt-4'}`}>
        <ExploreCardTypeBadge card={card} size="sm" />
        <ExploreCardHeadline sections={card.sections} size="sm" tone={card.tone} />
        {isCatalogRow ? (
          <>
            {card.subtitle ? (
              <p className="text-sm text-gray-600">{card.subtitle}</p>
            ) : null}
            <ExploreCardRatingRow card={card} compact />
            <ExploreCardDetailList details={card.sections.details} compact />
          </>
        ) : activityMeta ? (
          <p className="text-sm leading-relaxed text-gray-600">{activityMeta}</p>
        ) : (
          <ExploreCardDetailList
            details={card.sections.details}
            compact
            mapLatitude={card.mapLatitude}
            mapLongitude={card.mapLongitude}
          />
        )}
      </div>
    </Link>
  );
};
