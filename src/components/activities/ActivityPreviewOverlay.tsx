import { useMemo, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import type { ActivityDetailDTO, ActivityViewerAccessDTO } from '@uaetrail/shared-types';
import { ActivityDetailView } from '../activity/ActivityDetailView';
import { detailBackPath } from '../../config/routingCatalog';
import { resolveActivityDetailWirePresentation } from '../../activity/resolveActivityDetailWirePresentation';

type ActivityPreviewOverlayProps = {
  activity: ActivityDetailDTO;
  onClose: () => void;
  saving?: boolean;
  backLabel?: string;
} & (
  | {
      variant?: 'form';
      onSaveDraft: () => void;
      onPublish: () => void;
      publishAsSlot?: ReactNode;
    }
  | {
      variant: 'list';
      onEdit?: () => void;
      onSaveDraft?: () => void;
      onPublish?: () => void;
    }
);

/** Full-screen activity page preview (same layout as ActivityDetail). */
export const ActivityPreviewOverlay = (props: ActivityPreviewOverlayProps) => {
  const { activity, onClose, saving = false } = props;
  const variant = props.variant ?? 'form';
  const backLabel = props.backLabel ?? (variant === 'list' ? 'Back to activities' : 'Back to form');

  const previewWirePresentation = useMemo(() => {
    const viewerAccess: ActivityViewerAccessDTO = {
      exposure: 'full',
      level: 'host',
      gateReason: null,
      canViewFullActivity: true,
      canOpenDetailPage: true,
      joinMode: activity.joinMode ?? 'open',
      canAccessCrewSurfaces: true,
    };
    return resolveActivityDetailWirePresentation({
      activity,
      viewerAccess,
      isHostUser: true,
      previewMode: true,
      joinUiState: { kind: 'open' },
    });
  }, [activity]);

  if (typeof document === 'undefined') return null;

  const listFooter =
    props.variant === 'list' ? (
      activity.status === 'draft' && (props.onSaveDraft || props.onPublish) ? (
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
              Close
            </button>
            {props.onSaveDraft && (
              <button
                type="button"
                onClick={props.onSaveDraft}
                disabled={saving}
                className="flex-1 px-4 py-2.5 border border-emerald-600 rounded-lg text-sm font-medium text-emerald-700 hover:bg-emerald-50 disabled:opacity-60"
              >
                {saving ? 'Saving…' : 'Save as draft'}
              </button>
            )}
            {props.onPublish && (
              <button
                type="button"
                onClick={props.onPublish}
                disabled={saving}
                className="flex-1 px-4 py-2.5 bg-emerald-600 text-white rounded-lg text-sm font-semibold hover:bg-emerald-700 disabled:opacity-60"
              >
                {saving ? 'Publishing…' : 'Publish'}
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="rounded-2xl bg-white border border-gray-200 shadow-lg p-4 space-y-3">
          <div className="text-center">
            <p className="text-sm font-semibold text-gray-900">Activity preview</p>
            <p className="text-xs text-gray-600 mt-1">
              {activity.status === 'published'
                ? 'This is how the activity appears to participants.'
                : 'This is how your activity will look once published.'}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
            >
              Close
            </button>
            {props.onEdit && (
              <button
                type="button"
                onClick={props.onEdit}
                disabled={saving}
                className="flex-1 px-4 py-2.5 border border-emerald-600 rounded-lg text-sm font-medium text-emerald-700 hover:bg-emerald-50 disabled:opacity-60"
              >
                Edit
              </button>
            )}
          </div>
        </div>
      )
    ) : null;

  const formFooter =
    props.variant === 'list' ? null : (
      <div className="rounded-2xl bg-white border border-gray-200 shadow-lg p-4 space-y-3">
        <div className="text-center">
          <p className="text-sm font-semibold text-gray-900">Draft preview</p>
          <p className="text-xs text-gray-600 mt-1">
            This is how your activity will look once published.
          </p>
        </div>
        {variant === 'form' && props.publishAsSlot ? props.publishAsSlot : null}
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
            onClick={props.onSaveDraft}
            disabled={saving}
            className="flex-1 px-4 py-2.5 border border-emerald-600 rounded-lg text-sm font-medium text-emerald-700 hover:bg-emerald-50 disabled:opacity-60"
          >
            {saving ? 'Saving…' : 'Save as draft'}
          </button>
          <button
            type="button"
            onClick={props.onPublish}
            disabled={saving}
            className="flex-1 px-4 py-2.5 bg-emerald-600 text-white rounded-lg text-sm font-semibold hover:bg-emerald-700 disabled:opacity-60"
          >
            {saving ? 'Publishing…' : 'Publish'}
          </button>
        </div>
      </div>
    );

  const footerOverride = listFooter ?? formFooter;

  return createPortal(
    <div className="fixed inset-0 z-[100] overflow-y-auto bg-gray-50">
      <button
        type="button"
        onClick={onClose}
        className="fixed top-4 left-4 z-[110] rounded-full bg-white/95 border border-gray-200 shadow-md px-4 py-2 text-sm font-semibold text-emerald-700 hover:bg-white"
      >
        ← {backLabel}
      </button>
      <ActivityDetailView
        activity={activity}
        previewMode
        backTo={detailBackPath('activity')}
        backLabel={backLabel}
        wireFooterByTab={previewWirePresentation?.footerByTab ?? null}
        wireTabs={previewWirePresentation?.tabs ?? null}
        sidebarJoinOverride={
          footerOverride ? <div className="hidden md:block mt-4">{footerOverride}</div> : undefined
        }
      />
    </div>,
    document.body
  );
};
