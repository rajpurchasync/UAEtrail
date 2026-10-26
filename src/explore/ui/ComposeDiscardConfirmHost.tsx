import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { AppButton } from '../../components/mobile/AppButton';
import { EXPLORE_Z } from '../../config/exploreTheme';
import {
  COMPOSE_FLOW_DISCARD_MESSAGE,
  setComposeDiscardConfirmHandler,
} from './composeFlowClose';

/** In-app discard confirm — `window.confirm` is unreliable in mobile webviews and dev embeds. */
export const ComposeDiscardConfirmHost = () => {
  const [pendingClose, setPendingClose] = useState<(() => void) | null>(null);

  useEffect(() => {
    setComposeDiscardConfirmHandler((close) => setPendingClose(() => close));
    return () => setComposeDiscardConfirmHandler(null);
  }, []);

  if (!pendingClose) return null;

  const dismiss = () => setPendingClose(null);
  const confirm = () => {
    const close = pendingClose;
    setPendingClose(null);
    close();
  };

  return createPortal(
    <div
      className={`fixed inset-0 ${EXPLORE_Z.composeDiscardConfirm} flex items-end justify-center bg-black/40 p-4 pb-[calc(var(--safe-bottom)+1rem)] sm:items-center`}
      role="presentation"
      onClick={dismiss}
    >
      <div
        role="alertdialog"
        aria-labelledby="compose-discard-title"
        aria-describedby="compose-discard-desc"
        className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <h3 id="compose-discard-title" className="text-lg font-semibold text-gray-900">
          Discard draft?
        </h3>
        <p id="compose-discard-desc" className="mt-2 text-sm text-neutral-600">
          {COMPOSE_FLOW_DISCARD_MESSAGE}
        </p>
        <div className="mt-5 flex flex-col gap-2 sm:flex-row-reverse">
          <AppButton variant="destructive" fullWidth onClick={confirm}>
            Discard
          </AppButton>
          <AppButton variant="secondary" fullWidth onClick={dismiss}>
            Keep editing
          </AppButton>
        </div>
      </div>
    </div>,
    document.body
  );
};
