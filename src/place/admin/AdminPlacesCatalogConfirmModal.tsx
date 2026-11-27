import { PlaceDTO, type DestinationDTO } from '@uaetrail/shared-types';

export type AdminPlacesConfirmAction = {
  type: 'status' | 'delete' | 'publish';
  loc: PlaceDTO;
};

export const AdminPlacesCatalogConfirmModal = ({
  confirmAction,
  adminAreas,
  onCancel,
  onConfirm,
}: {
  confirmAction: AdminPlacesConfirmAction;
  adminAreas: DestinationDTO[];
  onCancel: () => void;
  onConfirm: () => void;
}) => (
  <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={onCancel}>
    <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6" onClick={(e) => e.stopPropagation()}>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        {confirmAction.type === 'delete'
          ? 'Delete place?'
          : confirmAction.type === 'publish'
            ? 'Approve place?'
            : confirmAction.loc.status === 'active'
              ? 'Deactivate place?'
              : 'Activate place?'}
      </h3>
      <p className="text-sm text-gray-600 mb-1">
        {confirmAction.type === 'delete'
          ? 'This will permanently remove the place.'
          : confirmAction.type === 'publish'
            ? 'Approving makes it public. Ensure difficulty (hikes), child/pet tags, and parking are complete.'
            : confirmAction.loc.status === 'active'
              ? 'This will hide the place.'
              : 'This will make the place visible.'}
      </p>
      {(confirmAction.type === 'publish' ||
        (confirmAction.type === 'status' && confirmAction.loc.status !== 'active')) &&
      (confirmAction.loc.destinationStatus === 'draft' ||
        adminAreas.find((area) => area.id === confirmAction.loc.destinationId)?.status === 'draft') ? (
        <p className="mb-3 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-950">
          This place is linked to a <span className="font-semibold">new destination</span>
          {confirmAction.loc.destinationName ? ` (${confirmAction.loc.destinationName})` : ''}. Approving will
          also publish that area on Explore.
        </p>
      ) : null}
      <p className="text-sm font-medium text-gray-900 mb-4">{confirmAction.loc.name}</p>
      <div className="flex gap-3 justify-end">
        <button type="button" onClick={onCancel} className="px-4 py-2 border rounded-md text-sm text-gray-700 hover:bg-gray-50">
          Cancel
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className={`px-4 py-2 rounded-md text-sm text-white ${
            confirmAction.type === 'delete' ? 'bg-red-600 hover:bg-red-700' : 'bg-emerald-600 hover:bg-emerald-700'
          }`}
        >
          {confirmAction.type === 'delete'
            ? 'Delete'
            : confirmAction.type === 'publish'
              ? 'Approve'
              : confirmAction.loc.status === 'active'
                ? 'Deactivate'
                : 'Activate'}
        </button>
      </div>
    </div>
  </div>
);