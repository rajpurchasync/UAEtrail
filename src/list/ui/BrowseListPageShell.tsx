import type { ReactNode } from 'react';
import { listDiscoveryEmbeddedOnExplore, type ListDiscoverySurface } from '../listDiscoverySurface';

interface BrowseListPageShellProps {
  chrome: ReactNode;
  floatingAction?: ReactNode;
  children: ReactNode;
  feedFullBleed?: boolean;
  surface?: ListDiscoverySurface;
}

/** Super-app shell: white chrome, gray feed, optional floating action. */
export const BrowseListPageShell = ({
  chrome,
  floatingAction = null,
  children,
  feedFullBleed = false,
  surface = 'standalone',
}: BrowseListPageShellProps) => {
  const embeddedOnExplore = listDiscoveryEmbeddedOnExplore(surface);
  const exploreSidebar = surface === 'exploreSidebar';

  const feedPadBottom = embeddedOnExplore
    ? 'pb-[calc(var(--safe-bottom,0px)+16px)]'
    : feedFullBleed
      ? 'max-md:pb-[calc(var(--bottom-nav-height,56px)+var(--safe-bottom,0px)+20px)]'
      : 'max-md:pb-[calc(var(--bottom-nav-height,56px)+var(--safe-bottom,0px)+72px)]';

  const feedWidthClass = exploreSidebar
    ? 'max-w-none px-3 pb-4 pt-2'
    : feedFullBleed
      ? 'px-0 py-0 md:px-6 md:py-4'
      : embeddedOnExplore
        ? 'max-w-lg px-4 pb-4 pt-2 md:max-w-xl md:px-5 md:py-4 lg:max-w-lg'
        : 'max-w-lg px-4 py-4 md:max-w-xl md:px-6 md:py-6 lg:max-w-lg';

  return (
    <div
      className={`relative flex min-h-0 w-full max-w-full flex-col overflow-x-hidden bg-neutral-50 ${
        embeddedOnExplore ? 'h-full flex-1' : 'h-full'
      }`}
    >
      {chrome}
      <div
        className={`min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-y-contain scroll-smooth touch-pan-y [-webkit-overflow-scrolling:touch] md:pb-8 ${feedPadBottom}`}
      >
        <div className={`mx-auto w-full ${feedWidthClass}`}>{children}</div>
      </div>
      {floatingAction}
    </div>
  );
};
