import { createPortal } from 'react-dom';
import type { ActivityDetailDTO } from '@uaetrail/shared-types';
import { ActivityDetailView } from '../activity/ActivityDetailView';

interface ActivityTripPreviewOverlayProps {
  trip: ActivityDetailDTO;
  onClose: () => void;
  onSaveDraft: () => void;
  onPublish: () => void;
  saving?: boolean;
}

/** Full-screen activity page preview (same layout as TripDetail). */
export const ActivityTripPreviewOverlay = ({
  trip,
  onClose,
  onSaveDraft,
  onPublish,
  saving = false,
}: ActivityTripPreviewOverlayProps) => {
  if (typeof document === 'undefined') return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] overflow-y-auto bg-gray-50">
      <button
        type="button"
        onClick={onClose}
        className="fixed top-4 left-4 z-[110] rounded-full bg-white/95 border border-gray-200 shadow-md px-4 py-2 text-sm font-semibold text-emerald-700 hover:bg-white"
      >
        ← Back to form
      </button>
      <ActivityDetailView
        trip={trip}
        previewMode
        backTo="/activities"
        backLabel="Back to form"
        footerOverride={
          <div className="rounded-2xl bg-white border border-gray-200 shadow-lg p-4 space-y-3">
            <div className="text-center">
              <p className="text-sm font-semibold text-gray-900">Draft preview</p>
              <p className="text-xs text-gray-600 mt-1">
                This is how your activity will look once published.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={saving}
                className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
              >
                Back to form
              </button>
              <button
                type="button"
                onClick={onSaveDraft}
                disabled={saving}
                className="flex-1 px-4 py-2.5 border border-emerald-600 rounded-lg text-sm font-medium text-emerald-700 hover:bg-emerald-50 disabled:opacity-60"
              >
                {saving ? 'Saving…' : 'Save as draft'}
              </button>
              <button
                type="button"
                onClick={onPublish}
                disabled={saving}
                className="flex-1 px-4 py-2.5 bg-emerald-600 text-white rounded-lg text-sm font-semibold hover:bg-emerald-700 disabled:opacity-60"
              >
                {saving ? 'Publishing…' : 'Publish'}
              </button>
            </div>
          </div>
        }
      />
    </div>,
    document.body
  );
};
