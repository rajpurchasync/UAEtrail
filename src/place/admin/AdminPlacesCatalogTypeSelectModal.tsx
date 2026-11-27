import {
  FACILITY_PLACE_KINDS,
  PLACE_KIND_LABELS,
  facilityPlaceKindPinEmoji,
  type PlaceKind,
} from '@uaetrail/shared-types';
import { LOCATION_TYPE_LABELS } from '../../config/activityTypes';
import type { AdminCatalogSegment } from '../adminCatalogSegment';

export const AdminPlacesCatalogTypeSelectModal = ({
  catalogSegment,
  onClose,
  onSelectOutdoor,
  onSelectFacility,
}: {
  catalogSegment: AdminCatalogSegment;
  onClose: () => void;
  onSelectOutdoor: (type: 'hiking' | 'camping' | 'event') => void;
  onSelectFacility: (kind: PlaceKind) => void;
}) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
    <div
      className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-xl"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-white px-6 py-4">
        <h2 className="text-lg font-semibold text-gray-900">Select type</h2>
        <button type="button" onClick={onClose} className="text-xl text-gray-400 hover:text-gray-600">
          &times;
        </button>
      </div>

      {catalogSegment === 'facility' && (
        <div className="p-6">
          <p className="text-sm text-gray-600 mb-4 text-center">Choose facility type</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-w-3xl mx-auto">
            {FACILITY_PLACE_KINDS.map((kind) => (
              <button
                key={kind}
                type="button"
                onClick={() => onSelectFacility(kind)}
                className="border-2 border-gray-200 hover:border-emerald-400 rounded-xl p-4 text-center transition-all hover:shadow-md"
              >
                <div className="text-3xl mb-1">{facilityPlaceKindPinEmoji(kind)}</div>
                <p className="text-sm font-semibold text-gray-900">{PLACE_KIND_LABELS[kind]}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {catalogSegment === 'outdoor' && (
        <div className="p-8">
          <p className="mb-6 text-center text-sm text-gray-600">Choose what type of place you want to add</p>
          <div className="mx-auto grid max-w-3xl grid-cols-1 gap-6 sm:grid-cols-3">
            <button
              type="button"
              onClick={() => onSelectOutdoor('hiking')}
              className="group rounded-xl border-2 border-gray-200 p-8 text-center transition-all hover:border-emerald-400 hover:shadow-md"
            >
              <div className="mb-3 text-5xl">🥾</div>
              <h3 className="text-lg font-semibold text-gray-900 group-hover:text-emerald-700">Hiking Trail</h3>
              <p className="mt-1 text-xs text-gray-500">Trails, mountains, walks</p>
            </button>
            <button
              type="button"
              onClick={() => onSelectOutdoor('camping')}
              className="group rounded-xl border-2 border-gray-200 p-8 text-center transition-all hover:border-amber-400 hover:shadow-md"
            >
              <div className="mb-3 text-5xl">⛺</div>
              <h3 className="text-lg font-semibold text-gray-900 group-hover:text-amber-700">Camping place</h3>
              <p className="mt-1 text-xs text-gray-500">Campsites, outdoor stays</p>
            </button>
            <button
              type="button"
              onClick={() => onSelectOutdoor('event')}
              className="group rounded-xl border-2 border-gray-200 p-8 text-center transition-all hover:border-violet-400 hover:shadow-md"
            >
              <div className="mb-3 text-5xl">🏃</div>
              <h3 className="text-lg font-semibold text-gray-900 group-hover:text-violet-700">
                {LOCATION_TYPE_LABELS.event}
              </h3>
              <p className="mt-1 text-xs text-gray-500">Trail runs, triathlons, races</p>
            </button>
          </div>
        </div>
      )}
    </div>
  </div>
);