import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { ExploreCardModel } from '../../explore/exploreCardModel';
import { EnvironmentImage } from '../../components/ui/EnvironmentImage';
import { browsePosterFallbackClass, resolveBrowsePosterCoverUrl } from '../browsePosterCover';
import { LIST_DISCOVER_HOME } from '../listDiscoverHomeTheme';
import {
  ListPosterDiscoverHeroEyebrow,
  ListPosterDiscoverHeroRequirements,
  ListPosterDiscoverScheduleBody,
  resolveListPosterCopy,
} from './poster/ListPosterHeroChrome';
import { resolveListVenuePosterCopy } from '../listVenuePosterPresentation';
import { ListFeedCatalogEntityHeader } from './feed/ListFeedCatalogEntityHeader';

interface ListDiscoverRailPreviewCardProps {
  card: ExploreCardModel;
}

/** Discover home — type + location + requirement tags on image; schedule in body below. */
export const ListDiscoverRailPreviewCard = ({ card }: ListDiscoverRailPreviewCardProps) => {
  const coverUrl = resolveBrowsePosterCoverUrl(card);
  const [imageFailed, setImageFailed] = useState(false);
  const showPhoto = Boolean(coverUrl) && !imageFailed;
  const copy = resolveListPosterCopy(card);
  const catalogCopy =
    card.source === 'venue' || card.source === 'shop' ? resolveListVenuePosterCopy(card) : null;

  return (
    <article className={LIST_DISCOVER_HOME.railArticle}>
      <Link
        to={card.path}
        className={`${LIST_DISCOVER_HOME.frame} touch-manipulation active:opacity-95`}
        aria-label={`View ${catalogCopy?.heroTitle ?? copy.heroTitle}`}
      >
        {catalogCopy ? (
          <div className="mb-2 px-0.5">
            <ListFeedCatalogEntityHeader card={card} name={catalogCopy.heroTitle} />
          </div>
        ) : null}
        <div className={LIST_DISCOVER_HOME.mediaHalf}>
          {showPhoto ? (
            <EnvironmentImage
              src={coverUrl ?? undefined}
              alt=""
              className="absolute inset-0 z-0 block h-full w-full object-cover object-center"
              loading="lazy"
              decoding="async"
              onError={() => setImageFailed(true)}
            />
          ) : (
            <div
              className={`absolute inset-0 z-0 flex items-center justify-center ${browsePosterFallbackClass(card.tone)}`}
              aria-hidden
            >
              <span className="select-none text-4xl leading-none opacity-90">{card.emoji}</span>
            </div>
          )}

          {catalogCopy ? null : (
            <ListPosterDiscoverHeroEyebrow
              activityTypeLabel={copy.activityTypeLabel}
              placeLine={copy.placeLine}
            />
          )}
          <ListPosterDiscoverHeroRequirements
            labels={catalogCopy?.requirementLabels ?? copy.requirementLabels}
          />
        </div>

        <ListPosterDiscoverScheduleBody schedule={copy.schedule} className={LIST_DISCOVER_HOME.body} />
      </Link>
    </article>
  );
};
