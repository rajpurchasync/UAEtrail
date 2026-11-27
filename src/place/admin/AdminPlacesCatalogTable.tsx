import {
  PlaceDTO,
  PLACE_KIND_LABELS,
  facilityPlaceKindPinEmoji,
  placeKindFromLocationRow,
  type DestinationDTO,
} from '@uaetrail/shared-types';
import { Check, Pencil, Power, Trash2 } from 'lucide-react';
import { AdminIconButton } from '../../components/admin/AdminIconButton';
import { AdminTablePager, type AdminPageSize } from '../../components/admin/AdminTablePager';
import type { AdminCatalogSegment } from '../adminCatalogSegment';
import {
  activityTypeBadgeClass,
  activityTypeLabel,
  isCatalogMapPlace,
} from './adminPlacesCatalogConstants';
import { AdminPlacesCatalogStatusBadge } from './adminPlacesCatalogUi';
import type { AdminPlacesConfirmAction } from './AdminPlacesCatalogConfirmModal';

export const AdminPlacesCatalogTable = ({
  catalogSegment,
  loading,
  filtered,
  pagedPlaces,
  areaNameById,
  adminAreas,
  page,
  pageSize,
  onPage,
  onPageSize,
  onPreview,
  onEdit,
  onConfirmAction,
}: {
  catalogSegment: AdminCatalogSegment;
  loading: boolean;
  filtered: PlaceDTO[];
  pagedPlaces: PlaceDTO[];
  areaNameById: Map<string, string>;
  adminAreas: DestinationDTO[];
  page: number;
  pageSize: AdminPageSize;
  onPage: (page: number) => void;
  onPageSize: (size: AdminPageSize) => void;
  onPreview: (loc: PlaceDTO) => void;
  onEdit: (loc: PlaceDTO) => void;
  onConfirmAction: (action: AdminPlacesConfirmAction) => void;
}) => (
  <>
    <div className="bg-white border rounded-lg overflow-x-auto desktop-scrollbar-x">
      <table className="min-w-full text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="text-left px-4 py-3">Place name</th>
            <th className="text-left px-4 py-3">Region</th>
            <th className="text-left px-4 py-3">Area</th>
            <th className="text-left px-4 py-3">Type</th>
            <th className="text-left px-4 py-3">Status</th>
            <th className="text-left px-4 py-3">Actions</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                <p>
                  <span className="inline-block w-5 h-5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mr-2" />
                  Loading...
                </p>
              </td>
            </tr>
          ) : filtered.length === 0 ? (
            <tr>
              <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                No places found
              </td>
            </tr>
          ) : (
            pagedPlaces.map((loc) => (
              <tr
                key={loc.id}
                className="border-t hover:bg-gray-50 cursor-pointer"
                onClick={() => onPreview(loc)}
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    {loc.images?.[0] ? (
                      <img src={loc.images[0]} alt="" className="w-10 h-10 rounded-lg object-cover" />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400 text-lg">
                        {loc.activityType === 'hiking' ? '🥾' : loc.activityType === 'event' ? '🏃' : '⛺'}
                      </div>
                    )}
                    <span className="font-medium text-gray-900">{loc.name}</span>
                    {isCatalogMapPlace(loc) && (
                      <span className="rounded bg-sky-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-sky-900">
                        Map catalog
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-700">{loc.region}</td>
                <td className="px-4 py-3 text-gray-600 text-xs">
                  {loc.destinationId ? (
                    <>
                      {areaNameById.get(loc.destinationId) ?? loc.destinationName ?? '—'}
                      {loc.destinationStatus === 'draft' ||
                      adminAreas.find((area) => area.id === loc.destinationId)?.status === 'draft' ? (
                        <span className="ml-1 font-semibold text-amber-800">(new)</span>
                      ) : null}
                    </>
                  ) : (
                    '—'
                  )}
                </td>
                <td className="px-4 py-3">
                  {catalogSegment === 'facility' ? (
                    <span className="px-2 py-0.5 rounded text-xs font-medium bg-sky-50 text-sky-900">
                      {facilityPlaceKindPinEmoji(placeKindFromLocationRow(loc))}{' '}
                      {PLACE_KIND_LABELS[placeKindFromLocationRow(loc)]}
                    </span>
                  ) : (
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-medium ${activityTypeBadgeClass(loc.activityType)}`}
                    >
                      {activityTypeLabel(loc.activityType)}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <AdminPlacesCatalogStatusBadge status={loc.status} />
                </td>
                <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                  <div className="flex gap-1.5 flex-wrap">
                    <AdminIconButton label="Edit" icon={Pencil} onClick={() => onEdit(loc)} />
                    {loc.status === 'draft' && (
                      <AdminIconButton
                        label="Approve"
                        icon={Check}
                        tone="emerald"
                        onClick={() => onConfirmAction({ type: 'publish', loc })}
                      />
                    )}
                    {loc.status !== 'draft' && (
                      <AdminIconButton
                        label={loc.status === 'active' ? 'Deactivate' : 'Activate'}
                        icon={Power}
                        tone={loc.status === 'active' ? 'gray' : 'green'}
                        onClick={() => onConfirmAction({ type: 'status', loc })}
                      />
                    )}
                    <AdminIconButton
                      label="Delete"
                      icon={Trash2}
                      tone="red"
                      onClick={() => onConfirmAction({ type: 'delete', loc })}
                    />
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
    <AdminTablePager
      page={page}
      pageSize={pageSize}
      total={filtered.length}
      onPage={onPage}
      onPageSize={(size) => {
        onPageSize(size);
        onPage(1);
      }}
    />
    <p className="text-xs text-gray-500">
      Click a row to preview{catalogSegment === 'facility' ? ' a facility' : ' a place'}.
    </p>
  </>
);