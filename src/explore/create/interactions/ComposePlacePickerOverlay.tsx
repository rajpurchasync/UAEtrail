import { lazy, Suspense } from 'react';
import { EXPLORE_Z } from '../../../config/exploreTheme';
import { CONSUMER_MAIN_OVERLAY_INSET } from '../composeDesktopInset';
import type { CreatePlacePickerProps } from '../../ui/CreatePlacePicker';

const CreatePlacePicker = lazy(() =>
  import('../../ui/CreatePlacePicker').then((m) => ({ default: m.CreatePlacePicker }))
);

type ComposePlacePickerOverlayProps = CreatePlacePickerProps & {
  open: boolean;
};

/** Single lazy mount for {@link CreatePlacePicker} — do not lazy-load the picker in wizard files. */
export const ComposePlacePickerOverlay = ({ open, ...picker }: ComposePlacePickerOverlayProps) => {
  if (!open) return null;
  return (
    <div className={`${CONSUMER_MAIN_OVERLAY_INSET} ${EXPLORE_Z.composeFlow} bg-neutral-100`}>
      <Suspense fallback={<div className="h-full w-full animate-pulse bg-emerald-50" />}>
        <CreatePlacePicker {...picker} />
      </Suspense>
    </div>
  );
};
