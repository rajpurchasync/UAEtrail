import type { ReactNode } from 'react';

/** Error line + primary action used by Seek / Add step chrome. */
export const composeWizardErrorFooter = (
  error: string | null | undefined,
  action: ReactNode,
  actionClassName = 'mt-5 pb-2'
) => (
  <>
    {error ? <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
    <div className={actionClassName}>{action}</div>
  </>
);
