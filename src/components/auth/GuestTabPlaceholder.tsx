import { PageMeta } from '../seo/PageMeta';
import { ExploreGuestSignInCard } from '../../explore/ui/ExploreGuestSignInCard';
import type { GuestBrowseGateIntent } from '../../content/guestBrowseGateCopy';

type GuestTabPlaceholderProps = {
  title: string;
  description?: string;
  intent?: GuestBrowseGateIntent;
};

/** Signed-out mobile tab — map works; other tabs show join / log in. */
export const GuestTabPlaceholder = ({
  title,
  description,
  intent = 'peek-details',
}: GuestTabPlaceholderProps) => (
  <div className="flex min-h-[50dvh] flex-col bg-neutral-50 pb-bottom-nav-safe md:min-h-0 md:pb-8">
    <PageMeta title={title} noIndex />
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-5 py-10">
      {description ? (
        <p className="mb-4 text-center text-sm text-neutral-600">{description}</p>
      ) : null}
      <ExploreGuestSignInCard intent={intent} />
    </div>
  </div>
);
