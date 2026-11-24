import type { ReactNode } from 'react';
import { EXPLORE_MAP_PATH } from '../../config/routingCatalog';
import { APP_SCROLL_BODY_CLASS } from '../../config/layoutScroll';
import { LIST_CHROME } from '../../list/browse/listChromeTheme';
import { MobileBackButton } from '../../components/mobile/MobileBackButton';

/** Centered column — search home + results share one width. */
export const EXPLORE_SEARCH_PAGE_COLUMN = `${LIST_CHROME.maxWidth} mx-auto w-full min-w-0`;

type ExploreSearchPageLayoutProps = {
  children: ReactNode;
  /** Home scrolls the page; results keep the list feed as the inner scroller. */
  variant?: 'home' | 'results';
};

/** One chrome for `/explore/search` — back bar, scroll, and `max-w-lg` column. */
export const ExploreSearchPageLayout = ({ children, variant = 'home' }: ExploreSearchPageLayoutProps) => {
  const bodyScroll = variant === 'home';

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
      <header
        className={`sticky top-0 z-20 shrink-0 ${LIST_CHROME.chromeBg} ${LIST_CHROME.chromeBorder}`}
      >
        <div className={`${EXPLORE_SEARCH_PAGE_COLUMN} ${LIST_CHROME.horizontalPad} py-1.5`}>
          <MobileBackButton fallbackTo={EXPLORE_MAP_PATH} label="" />
        </div>
      </header>

      <div
        className={`${APP_SCROLL_BODY_CLASS} flex min-h-0 flex-1 flex-col ${
          bodyScroll ? 'overflow-y-auto overscroll-contain' : 'overflow-hidden'
        }`}
      >
        <div
          className={`${EXPLORE_SEARCH_PAGE_COLUMN} flex min-h-0 flex-1 flex-col gap-4 ${LIST_CHROME.horizontalPad} pb-nav-safe pt-3 ${
            bodyScroll ? '' : 'overflow-hidden'
          }`}
        >
          {children}
        </div>
      </div>
    </div>
  );
};