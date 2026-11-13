import { DetailPageLoadingState } from '../../components/ui/DetailPageLoadingState';
import { DETAIL_LOADING_GENERIC } from '../../content/detailLoadingCopy';
import { detailBackPath } from '../../config/routingCatalog';
import { APP_PAGE_MIN_H_CLASS } from '../../config/layoutScroll';
import { DetailPageShell } from './DetailPageShell';

type ConsumerEntityDetailLoadingProps = {
  backTo?: string;
  /** Stable chrome while data loads — avoids peek-stack back label flicker. */
  backLabel?: string;
  headerChrome?: { emoji: string; label: string };
  label?: string;
};

/** Entity detail routes: modal chrome + skeleton until the page model is ready. */
export const ConsumerEntityDetailLoading = ({
  backTo = detailBackPath('explore'),
  backLabel = 'Back',
  headerChrome,
  label = DETAIL_LOADING_GENERIC,
}: ConsumerEntityDetailLoadingProps) => (
  <div className={`${APP_PAGE_MIN_H_CLASS} flex min-h-0 flex-1 flex-col overflow-hidden`}>
    <DetailPageShell
      backTo={backTo}
      backLabel={backLabel}
      headerChrome={headerChrome}
      preferDeclaredBackLabel
      centerContent
    >
      <DetailPageLoadingState label={label} variant="embedded" />
    </DetailPageShell>
  </div>
);
