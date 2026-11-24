import { Link } from 'react-router-dom';
import { X } from 'lucide-react';
import { destinationHubPath } from '@uaetrail/shared-types';
import type { DiscoveryCardModel } from '../../../../discovery/discoveryCardModel';
import { EnvironmentImage } from '../../../../components/ui/EnvironmentImage';
import { ShareButton } from '../../../../components/ui/ShareButton';
import { ExploreWishlistSaveButton } from '../../ExploreWishlistSaveButton';
import { browseCatalogEntityName } from '../../../../list/browse/browseCatalogLabels';
import {
  resolvePlacePeekCuratedArea,
  resolvePlacePeekLocalLabel,
} from '../../../../place/placePeekPresentation';
import {
  placeCoverFallbackClass,
  resolvePlaceRegistryCoverUrl,
} from '../../../../place/peek/resolvePlaceRegistryCoverImage';
import { EXPLORE_PEEK } from '../../../../config/exploreTheme';

type PlacePeekHeroProps = {
  card: DiscoveryCardModel;
  embedMode?: boolean;
  /** Map pin bubble — shorter hero, share-only chrome. */
  compactMapPeek?: boolean;
  onClose: () => void;
  onBeforeDetailNavigate?: () => void;
};

export const PlacePeekHero = ({
  card,
  embedMode = false,
  compactMapPeek = false,
  onClose,
  onBeforeDetailNavigate,
}: PlacePeekHeroProps) => {
  const coverUrl = resolvePlaceRegistryCoverUrl(card);
  const title = browseCatalogEntityName(card);
  const curated = resolvePlacePeekCuratedArea(card);
  const localLabel = resolvePlacePeekLocalLabel(card);
  const emoji = card.emoji?.trim() || '📍';
  const isFacility = card.source === 'facility';
  return (
    <div
      className={`relative w-full shrink-0 overflow-hidden bg-neutral-100${
        embedMode ? ' aspect-[2/1]' : compactMapPeek ? ' h-24' : ' h-[min(32dvh,240px)]'
      }`}
    >
      {coverUrl ? (
        <EnvironmentImage src={coverUrl} alt="" className="h-full w-full object-cover" loading="lazy" />
      ) : (
        <div
          className={`flex h-full w-full items-center justify-center bg-gradient-to-br ${placeCoverFallbackClass(card.tone)}`}
          aria-hidden
        >
          <span className="text-5xl">{emoji}</span>
        </div>
      )}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-black/20" />

      <div className="absolute inset-x-0 top-0 z-10 flex items-start justify-between gap-2 px-3 pt-3">
        <span className={EXPLORE_PEEK.mediaEmojiBadge}>{emoji}</span>
        <div className="flex shrink-0 items-center gap-1.5">
          {!isFacility && !compactMapPeek ? <ExploreWishlistSaveButton card={card} /> : null}
          <ShareButton
            title={card.shareTitle}
            text={card.shareText ?? undefined}
            path={card.sharePath}
            iconOnly
            light={compactMapPeek}
            bare={compactMapPeek}
          />
          {!embedMode && !compactMapPeek ? (
            <button
              type="button"
              onClick={onClose}
              className={EXPLORE_PEEK.mediaIconBtn}
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          ) : null}
        </div>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 px-4 pb-4 pt-16 text-left text-white">
        {curated ? (
          <p className="text-sm font-semibold text-white/95 [text-shadow:0_1px_2px_rgba(0,0,0,.5)]">
            {curated.slug ? (
              <Link
                to={destinationHubPath(curated.slug)}
                onClick={() => onBeforeDetailNavigate?.()}
                className="pointer-events-auto underline decoration-white/40 underline-offset-2 hover:text-white"
              >
                {curated.name}
              </Link>
            ) : (
              curated.name
            )}
          </p>
        ) : null}
        <h2 className="mt-1 text-xl font-bold leading-snug [text-shadow:0_1px_3px_rgba(0,0,0,.55)] sm:text-2xl">
          {title}
        </h2>
        {localLabel ? (
          <p className="mt-1 text-sm font-medium text-white/90 [text-shadow:0_1px_2px_rgba(0,0,0,.45)]" dir="auto">
            {localLabel}
          </p>
        ) : null}
      </div>
    </div>
  );
};
