import type { useActivityDetailViewModel } from './useActivityDetailViewModel';
import { ActivityDetailMobileHero } from './ActivityDetailMobileHero';
import { ActivityDetailEngagementStrips } from './ActivityDetailEngagementStrips';
import { Link } from 'react-router-dom';

type Model = ReturnType<typeof useActivityDetailViewModel>;

type ActivityDetailMarketingFoldProps = {
  model: Model;
};

/** Consumer `/activity/:id` — hero facts + peek strips above Plan · Place · Buddies · Transport. */
export const ActivityDetailMarketingFold = ({ model }: ActivityDetailMarketingFoldProps) => {
  if (!model.showConsumerMarketingFold || model.isEmbedded || model.previewMode) {
    return null;
  }

  return (
    <div className="max-w-6xl mx-auto px-4 pt-4 pb-2 space-y-3">
      {model.heroImage ? (
        <div className="md:hidden overflow-hidden rounded-2xl border border-neutral-100">
          <img
            src={model.heroImage}
            alt=""
            className="h-44 w-full object-cover"
            loading="eager"
          />
        </div>
      ) : null}
      {model.showMobileTabs ? (
        <ActivityDetailMobileHero
          date={model.activity.date}
          title={model.activityTitle}
          statusChips={model.heroFactChips}
          venueLine={
            model.registryPlacePath && model.registryPlaceName ? (
              <Link to={model.registryPlacePath} className="font-medium text-emerald-800">
                {model.registryPlaceName}
              </Link>
            ) : (
              model.activity.locationName
            )
          }
        />
      ) : null}
      <ActivityDetailEngagementStrips
        activity={model.activity}
        viewerAccess={model.viewerAccess}
        wireStrips={model.wireStrips}
        joinUiState={model.joinUiState}
        requiresSignIn={model.requiresSignIn}
        onOfferLinkedRideshare={model.onOfferLinkedRideshare}
      />
    </div>
  );
};
