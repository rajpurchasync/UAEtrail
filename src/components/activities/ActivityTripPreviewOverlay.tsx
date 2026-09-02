import type { ActivityDetailDTO } from '@uaetrail/shared-types';
import { TripDetailView } from '../trip/TripDetailView';

interface ActivityTripPreviewOverlayProps {
  trip: ActivityDetailDTO;
  onClose: () => void;
}

/** Full-screen activity page preview (same layout as TripDetail). */
export const ActivityTripPreviewOverlay = ({ trip, onClose }: ActivityTripPreviewOverlayProps) => (
  <div className="fixed inset-0 z-[70] overflow-y-auto bg-gray-50">
    <button
      type="button"
      onClick={onClose}
      className="fixed top-4 left-4 z-[80] rounded-full bg-white/95 border border-gray-200 shadow-md px-4 py-2 text-sm font-semibold text-emerald-700 hover:bg-white"
    >
      ← Back to form
    </button>
    <TripDetailView
      trip={trip}
      previewMode
      backTo="/activities"
      backLabel="Back to form"
      footerOverride={
        <div className="rounded-2xl bg-amber-50 border border-amber-200 p-4 text-center">
          <p className="text-sm font-semibold text-amber-900">Draft preview</p>
          <p className="text-xs text-amber-800 mt-1">This is how your activity will look once published.</p>
          <button
            type="button"
            onClick={onClose}
            className="mt-3 px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700"
          >
            Back to form
          </button>
        </div>
      }
    />
  </div>
);
