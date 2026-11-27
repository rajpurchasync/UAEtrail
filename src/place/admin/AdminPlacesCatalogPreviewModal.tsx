import {
  PlaceDTO,
  formatCatalogEditRankingSummary,
  memberProfilePath,
  placeDetailPath,
  resolveCatalogSubmitterUserId,
  type CatalogEditRankingDTO,
} from '@uaetrail/shared-types';
import { Link } from 'react-router-dom';
import { AdminPlaceRidesLinkPanel } from '../../components/admin/AdminPlaceRidesLinkPanel';
import {
  activityTypeBadgeClass,
  activityTypeLabel,
  isTrailLike,
} from './adminPlacesCatalogConstants';
import { AdminPlacesCatalogStatusBadge } from './adminPlacesCatalogUi';

type SubmitterPreview = {
  id?: string;
  displayName?: string | null;
  ranking?: CatalogEditRankingDTO | null;
} | null;

export const AdminPlacesCatalogPreviewModal = ({
  previewLoc,
  previewSubmitter,
  onClose,
  onEdit,
}: {
  previewLoc: PlaceDTO;
  previewSubmitter: SubmitterPreview;
  onClose: () => void;
  onEdit: (loc: PlaceDTO) => void;
}) => (
  <div
    className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
    onClick={onClose}
  >
    <div
      className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[80vh] overflow-y-auto"
      onClick={(e) => e.stopPropagation()}
    >
      {previewLoc.images?.[0] && (
        <img src={previewLoc.images[0]} alt="" className="w-full h-48 object-cover rounded-t-lg" />
      )}
      {(previewLoc.images?.length ?? 0) > 1 && (
        <div className="flex gap-2 overflow-x-auto px-4 py-2 border-b bg-gray-50">
          {previewLoc.images!.map((src, index) => (
            <img
              key={`${src}-${index}`}
              src={src}
              alt=""
              className="h-16 w-24 shrink-0 rounded object-cover border border-gray-200"
            />
          ))}
        </div>
      )}
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">{previewLoc.name}</h2>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">
            &times;
          </button>
        </div>
        <div className="flex gap-2 flex-wrap">
          <span
            className={`px-2 py-0.5 rounded text-xs font-medium ${activityTypeBadgeClass(previewLoc.activityType)}`}
          >
            {activityTypeLabel(previewLoc.activityType)}
          </span>
          <AdminPlacesCatalogStatusBadge status={previewLoc.status} />
          {previewLoc.difficulty && (
            <span className="px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700 capitalize">
              {previewLoc.difficulty}
            </span>
          )}
        </div>
        <p className="text-sm text-gray-500">{previewLoc.region}</p>
        {previewLoc.latitude != null && previewLoc.longitude != null && (
          <p className="text-xs text-gray-500">
            Map pin: {previewLoc.latitude.toFixed(5)}, {previewLoc.longitude.toFixed(5)}
          </p>
        )}
        {resolveCatalogSubmitterUserId(previewLoc) ? (
          <div className="space-y-1 rounded-lg border border-neutral-100 bg-neutral-50 px-3 py-2">
            <p className="text-xs text-gray-500">
              Submitted by{' '}
              <Link
                to={memberProfilePath(resolveCatalogSubmitterUserId(previewLoc)!)!}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-emerald-800 hover:underline"
              >
                {previewSubmitter?.displayName ||
                  previewSubmitter?.id ||
                  resolveCatalogSubmitterUserId(previewLoc)}
              </Link>
            </p>
            <p className="text-xs text-gray-600">
              Edit Ranking:{' '}
              {previewSubmitter?.ranking
                ? formatCatalogEditRankingSummary(previewSubmitter.ranking)
                : 'Loading…'}
            </p>
          </div>
        ) : null}
        <p className="text-sm text-gray-700 whitespace-pre-line">{previewLoc.description}</p>
        {isTrailLike(previewLoc.activityType) && (
          <div className="grid grid-cols-3 gap-3 text-sm">
            {previewLoc.distance != null && (
              <div className="bg-gray-50 rounded-lg p-2 text-center">
                <p className="text-xs text-gray-500">Distance</p>
                <p className="font-medium">{previewLoc.distance} km</p>
              </div>
            )}
            {previewLoc.elevation != null && (
              <div className="bg-gray-50 rounded-lg p-2 text-center">
                <p className="text-xs text-gray-500">Elevation</p>
                <p className="font-medium">{previewLoc.elevation}m</p>
              </div>
            )}
            {previewLoc.duration != null && (
              <div className="bg-gray-50 rounded-lg p-2 text-center">
                <p className="text-xs text-gray-500">Duration</p>
                <p className="font-medium">{previewLoc.duration} hrs</p>
              </div>
            )}
          </div>
        )}
        {(previewLoc.surfaceType?.length ?? 0) > 0 && (
          <div>
            <p className="text-xs text-gray-500 mb-1">Surface</p>
            <div className="flex gap-1 flex-wrap">
              {previewLoc.surfaceType!.map((s) => (
                <span key={s} className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded text-xs">
                  {s}
                </span>
              ))}
            </div>
          </div>
        )}
        {(previewLoc.tags?.length ?? 0) > 0 && (
          <div>
            <p className="text-xs text-gray-500 mb-1">Tags</p>
            <div className="flex gap-1 flex-wrap">
              {previewLoc.tags!.map((t) => (
                <span key={t} className="bg-purple-50 text-purple-700 px-2 py-0.5 rounded text-xs">
                  {t}
                </span>
              ))}
            </div>
          </div>
        )}
        {(previewLoc.accessibleBy?.length ?? 0) > 0 && (
          <div>
            <p className="text-xs text-gray-500 mb-1">Accessible by</p>
            <div className="flex gap-1 flex-wrap">
              {previewLoc.accessibleBy!.map((a) => (
                <span key={a} className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-xs">
                  {a}
                </span>
              ))}
            </div>
          </div>
        )}
        {previewLoc.parkingLink && (
          <div>
            <p className="text-xs text-gray-500 mb-1">Parking</p>
            <a
              href={previewLoc.parkingLink}
              target="_blank"
              rel="noreferrer"
              className="text-sm text-emerald-600 hover:underline"
            >
              View on Google Maps →
            </a>
          </div>
        )}
        <AdminPlaceRidesLinkPanel placeId={previewLoc.id} />
        <div className="flex flex-wrap gap-3 pt-2 border-t">
          <a
            href={placeDetailPath(previewLoc.activityType, previewLoc.id)}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-50 text-emerald-800 font-medium"
          >
            Open as submitter preview ↗
          </a>
          <button
            type="button"
            onClick={() => {
              onClose();
              onEdit(previewLoc);
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
          >
            Edit
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  </div>
);