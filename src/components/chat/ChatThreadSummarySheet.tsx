import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { X } from 'lucide-react';
import { CHAT_SPLIT_OVERLAY_INSET } from '../../config/consumerOverlayInset';

export type ChatThreadSummarySheetAction = {
  label: string;
  icon?: ReactNode;
  variant?: 'primary' | 'secondary';
  onClick?: () => void;
  to?: string;
  state?: unknown;
};

type ChatThreadSummarySheetProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: ReactNode;
  leading?: ReactNode;
  detail?: ReactNode;
  actions: ChatThreadSummarySheetAction[];
};

export const ChatThreadSummarySheet = ({
  open,
  onClose,
  title,
  subtitle,
  leading,
  detail,
  actions,
}: ChatThreadSummarySheetProps) => {
  if (!open) return null;

  return (
    <div
      className={`${CHAT_SPLIT_OVERLAY_INSET} z-[1400] flex flex-col justify-end bg-black/40`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="chat-thread-summary-title"
    >
      <button type="button" className="flex-1" aria-label="Close summary" onClick={onClose} />
      <div className="max-h-[85dvh] overflow-y-auto rounded-t-2xl bg-white shadow-xl pb-safe">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h2 id="chat-thread-summary-title" className="text-base font-semibold text-neutral-900">
            About
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full bg-neutral-100 text-neutral-600 shadow-sm ring-1 ring-black/5 hover:bg-neutral-200"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex flex-col items-center gap-3 px-6 py-6 text-center">
          {leading}
          <div className="min-w-0">
            <p className="truncate text-lg font-semibold text-neutral-900">{title}</p>
            {subtitle ? <div className="mt-1 text-sm text-neutral-500">{subtitle}</div> : null}
          </div>
          {detail ? <div className="w-full text-left text-sm text-neutral-600">{detail}</div> : null}
        </div>

        <div className="flex flex-col gap-2 border-t px-4 py-4">
          {actions.map((action) => {
            const className =
              action.variant === 'primary'
                ? 'flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-semibold text-white hover:bg-emerald-700'
                : 'flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 text-sm font-medium text-neutral-800 hover:bg-neutral-50';

            if (action.to) {
              return (
                <Link
                  key={action.label}
                  to={action.to}
                  state={action.state}
                  className={className}
                  onClick={() => {
                    action.onClick?.();
                    onClose();
                  }}
                >
                  {action.icon}
                  {action.label}
                </Link>
              );
            }

            return (
              <button
                key={action.label}
                type="button"
                className={className}
                onClick={() => {
                  action.onClick?.();
                  if (!action.to) onClose();
                }}
              >
                {action.icon}
                {action.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
