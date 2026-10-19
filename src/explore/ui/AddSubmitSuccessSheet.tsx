import { CheckCircle2 } from 'lucide-react';
import { EXPLORE_Z } from '../../config/exploreTheme';
import { ExploreResponsiveSheet } from './ExploreResponsiveSheet';
import {
  ADD_PENDING_NOTE_LOCATION,
  ADD_SUBMIT_SUCCESS_BODY_CAMP,
  ADD_SUBMIT_SUCCESS_BODY_FACILITY,
  ADD_SUBMIT_SUCCESS_BODY_SHOP,
  ADD_SUBMIT_SUCCESS_BODY_TRAIL,
  ADD_SUBMIT_SUCCESS_TITLE,
  ADD_SUBMIT_VIEW_CTA,
} from '../createFlowCopy';
import type { AddSubmitResult } from './addFlow';

type AddSubmitSuccessSheetProps = {
  open: boolean;
  onClose: () => void;
  result: AddSubmitResult;
  title: string;
  onViewPending: () => void | Promise<void>;
  variant?: 'default' | 'facility';
};

export const AddSubmitSuccessSheet = ({
  open,
  onClose,
  result,
  title,
  onViewPending,
  variant = 'default',
}: AddSubmitSuccessSheetProps) => {
  const location = result.location;
  const isShopPin = location.activityType === 'shop';
  const successBody =
    variant === 'facility'
      ? ADD_SUBMIT_SUCCESS_BODY_FACILITY
      : isShopPin
        ? ADD_SUBMIT_SUCCESS_BODY_SHOP
        : location.activityType === 'camping'
          ? ADD_SUBMIT_SUCCESS_BODY_CAMP
          : ADD_SUBMIT_SUCCESS_BODY_TRAIL;
  const pendingNote = ADD_PENDING_NOTE_LOCATION;

  return (
    <ExploreResponsiveSheet
      open={open}
      onClose={onClose}
      layout="centered"
      maxWidthClass="max-w-[min(100vw-2rem,22rem)] sm:max-w-md"
      zClass={EXPLORE_Z.composeFlow}
      overlayFixed
      showCloseButton
      showHandle={false}
      ariaLabel={ADD_SUBMIT_SUCCESS_TITLE}
      panelClassName="min-w-0 overflow-x-hidden px-5 pb-5 pt-10 sm:px-6 sm:pb-6"
    >
      <div className="flex min-w-0 flex-col">
        <div className="flex flex-col items-center text-center">
          <div
            className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-100 text-emerald-700"
            aria-hidden
          >
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <h2 className="mt-3 text-lg font-bold tracking-tight text-neutral-900">
            {ADD_SUBMIT_SUCCESS_TITLE}
          </h2>
          <p className="mt-2 max-w-[18rem] text-pretty text-sm leading-relaxed text-neutral-600">
            {successBody}
          </p>
        </div>

        <div className="mt-5 min-w-0 overflow-hidden rounded-xl border border-neutral-200 bg-neutral-50/90 px-4 py-3">
          <p className="text-base font-semibold leading-snug text-neutral-900 break-words">{title}</p>
          <p className="mt-1 text-xs text-amber-800">{pendingNote}</p>
        </div>

        <div className="mt-6">
          <button
            type="button"
            onClick={() => void onViewPending()}
            className="min-h-12 w-full rounded-xl bg-emerald-600 px-3 py-3 text-base font-bold text-white shadow-md shadow-emerald-600/20"
          >
            {ADD_SUBMIT_VIEW_CTA}
          </button>
        </div>
      </div>
    </ExploreResponsiveSheet>
  );
};
