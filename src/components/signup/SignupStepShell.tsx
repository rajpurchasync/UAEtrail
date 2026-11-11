import { ChevronLeft, Mountain } from 'lucide-react';
import type { ReactNode } from 'react';
import { SIGNUP_PROFILE_STEP_COUNT } from '../../utils/signupProfileSteps';

interface SignupStepShellProps {
  stepNumber: number;
  title: string;
  hint?: string;
  onBack?: () => void;
  children: ReactNode;
  footer: ReactNode;
}

export const SignupStepShell = ({
  stepNumber,
  title,
  hint,
  onBack,
  children,
  footer,
}: SignupStepShellProps) => (
  <div className="auth-card bg-white rounded-[20px] shadow-ios overflow-hidden">
    <div className="border-b border-emerald-100/80 bg-gradient-to-br from-emerald-50/90 via-white to-teal-50/40 px-5 py-4">
      <div className="h-1 w-full rounded-full bg-neutral-100 mb-3 overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-600 transition-all duration-300"
          style={{ width: `${(stepNumber / SIGNUP_PROFILE_STEP_COUNT) * 100}%` }}
        />
      </div>
      <div className="flex items-start gap-3">
        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            className="-ml-1 mt-0.5 inline-flex items-center gap-0.5 rounded-full px-1 py-1 text-sm font-semibold text-neutral-700 hover:bg-white/80"
          >
            <ChevronLeft className="h-5 w-5" />
            Back
          </button>
        ) : (
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-700 shadow-sm shadow-emerald-600/20">
            <Mountain className="h-4 w-4 text-white" strokeWidth={2.25} />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-emerald-700/85">
            Step {stepNumber} of {SIGNUP_PROFILE_STEP_COUNT}
          </p>
          <h2 className="mt-0.5 text-lg font-bold tracking-tight text-neutral-900">{title}</h2>
          {hint ? <p className="mt-1 text-sm text-neutral-500">{hint}</p> : null}
        </div>
      </div>
    </div>
    <div className="space-y-4 p-5 pt-4">{children}</div>
    <div className="border-t border-neutral-100 px-5 py-4">{footer}</div>
  </div>
);
