import { useCallback, useState, type MouseEvent, type PointerEvent } from 'react';
import { ChevronDown, Navigation } from 'lucide-react';
import { Dialog } from './Dialog';
import { navigationAppIcon } from './MapNavigationIcons';
import {
  buildNavigationUrl,
  listNavigationAppOptions,
  openNavigationUrl,
  type NavigationAppId,
  type NavigationMode,
} from '../../utils/mapLinks';
import { ViewOnMapLink } from './ViewOnMapLink';
import { getPreferredNavigationApp, setPreferredNavigationApp } from '../../utils/preferredNavigationApp';

export type DirectionsControlVariant = 'button' | 'link' | 'compact';

const stopEvent = (event: MouseEvent | PointerEvent) => {
  event.stopPropagation();
};

interface DirectionsControlProps {
  lat: number;
  lng: number;
  variant?: DirectionsControlVariant;
  /** Primary CTA label */
  label?: string;
  className?: string;
  buttonClassName?: string;
  linkClassName?: string;
  /** Secondary link on detail surfaces */
  includeViewOnMap?: boolean;
  viewOnMapLabel?: string;
  showAppPickerAffordance?: boolean;
  /** Primary button / link — hide compass icon on full-width peek CTAs. */
  showLeadingIcon?: boolean;
  navigationMode?: NavigationMode;
}

const DEFAULT_BUTTON_CLASS =
  'flex min-w-0 flex-1 items-center justify-center gap-2 rounded-2xl bg-emerald-500 py-3.5 text-base font-bold text-white';

const DEFAULT_LINK_CLASS =
  'inline-flex items-center gap-1 font-medium text-emerald-700 underline decoration-emerald-700/30 underline-offset-2 hover:text-emerald-800 hover:decoration-emerald-800';

export const DirectionsControl = ({
  lat,
  lng,
  variant = 'compact',
  label = 'Get directions',
  className = '',
  buttonClassName = DEFAULT_BUTTON_CLASS,
  linkClassName = DEFAULT_LINK_CLASS,
  includeViewOnMap = false,
  viewOnMapLabel = 'View on map',
  showAppPickerAffordance = true,
  showLeadingIcon = true,
  navigationMode = 'drive',
}: DirectionsControlProps) => {
  const [pickerOpen, setPickerOpen] = useState(false);

  const launchApp = useCallback(
    (app: NavigationAppId) => {
      setPreferredNavigationApp(app);
      openNavigationUrl(buildNavigationUrl(app, lat, lng, navigationMode));
      setPickerOpen(false);
    },
    [lat, lng, navigationMode]
  );

  const openPreferredOrPicker = useCallback(() => {
    const preferred = getPreferredNavigationApp();
    if (preferred) {
      openNavigationUrl(buildNavigationUrl(preferred, lat, lng, navigationMode));
      return;
    }
    setPickerOpen(true);
  }, [lat, lng, navigationMode]);

  const pickerAffordance =
    showAppPickerAffordance && variant !== 'link' ? (
      <button
        type="button"
        onClick={(event) => {
          stopEvent(event);
          setPickerOpen(true);
        }}
        onPointerDown={stopEvent}
        className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
        aria-label="Choose maps app"
      >
        <ChevronDown className="h-5 w-5" aria-hidden />
      </button>
    ) : null;

  const primaryButton = (
    <button
      type="button"
      onClick={(event) => {
        stopEvent(event);
        openPreferredOrPicker();
      }}
      onPointerDown={stopEvent}
      className={variant === 'button' ? buttonClassName : 'inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3.5 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-100'}
    >
      {showLeadingIcon ? <Navigation className="h-4 w-4 shrink-0" aria-hidden /> : null}
      {label}
    </button>
  );

  const primaryLink = (
    <button
      type="button"
      onClick={(event) => {
        stopEvent(event);
        openPreferredOrPicker();
      }}
      onPointerDown={stopEvent}
      className={linkClassName}
    >
      {showLeadingIcon ? <Navigation className="h-3.5 w-3.5 shrink-0" aria-hidden /> : null}
      {label}
    </button>
  );

  return (
    <>
      {variant === 'button' ? (
        <div className={`flex gap-2 ${className}`}>
          {primaryButton}
          {pickerAffordance}
        </div>
      ) : variant === 'link' ? (
        <span className={className}>{primaryLink}</span>
      ) : (
        <div className={`flex flex-wrap items-center gap-2 ${className}`}>
          <div className="flex min-w-0 flex-1 gap-2">
            {primaryButton}
            {pickerAffordance}
          </div>
          {includeViewOnMap ? (
            <ViewOnMapLink
              lat={lat}
              lng={lng}
              isolateClick
              className="text-sm font-semibold text-gray-600 underline decoration-gray-300 underline-offset-2 hover:text-gray-900"
            >
              {viewOnMapLabel}
            </ViewOnMapLink>
          ) : null}
        </div>
      )}

      <Dialog open={pickerOpen} onClose={() => setPickerOpen(false)} title="Open directions with">
        <p className="mb-4 text-sm text-neutral-600">
          We&apos;ll remember your choice for next time. Tap the arrow beside the button to change apps anytime.
        </p>
        <ul className="space-y-2">
          {listNavigationAppOptions().map((option) => (
            <li key={option.id}>
              <button
                type="button"
                onClick={() => launchApp(option.id)}
                className="flex w-full items-center gap-3 rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-left hover:bg-neutral-50"
              >
                {navigationAppIcon(option.id)}
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-neutral-900">{option.label}</span>
                  <span className="block text-xs text-neutral-500">{option.description}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      </Dialog>
    </>
  );
};
