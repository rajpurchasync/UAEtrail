import { useEffect, useMemo, useState } from 'react';
import { CalendarDays } from 'lucide-react';
import { AppButton } from '../mobile/AppButton';
import { Dialog } from '../ui/Dialog';
import { PRODUCT_SIGNUP_STEP_DOB } from '../../content/productNorthStar';
import {
  MEMBER_DOB_MONTHS,
  clampMemberDobDay,
  defaultMemberDobDraft,
  formatMemberDobDisplay,
  formatMemberDobIso,
  isMemberDobIsoAllowed,
  memberDobYearOptions,
  parseMemberDobIso,
  type MemberDobParts,
} from '../../utils/memberDateOfBirthPicker';

interface MemberDateOfBirthFieldProps {
  value: string;
  onChange: (iso: string) => void;
  disabled?: boolean;
  /** Slightly larger touch target on signup step. */
  size?: 'default' | 'step';
}

const selectClass =
  'ios-input w-full min-h-[52px] appearance-none rounded-xl border border-neutral-200 bg-white px-3 text-[16px] font-medium text-neutral-900';

export const MemberDateOfBirthField = ({
  value,
  onChange,
  disabled = false,
  size = 'default',
}: MemberDateOfBirthFieldProps) => {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<MemberDobParts>(() => defaultMemberDobDraft());

  const display = value ? formatMemberDobDisplay(value) : null;
  const yearOptions = useMemo(() => memberDobYearOptions(), []);

  useEffect(() => {
    if (!open) return;
    const parsed = value ? parseMemberDobIso(value) : null;
    setDraft(parsed ?? defaultMemberDobDraft());
  }, [open, value]);

  const dayOptions = useMemo(() => {
    const maxDay = clampMemberDobDay(draft.year, draft.month, 31);
    return Array.from({ length: maxDay }, (_, index) => index + 1);
  }, [draft.month, draft.year]);

  const patchDraft = (patch: Partial<MemberDobParts>) => {
    setDraft((prev) => {
      const next = { ...prev, ...patch };
      next.day = clampMemberDobDay(next.year, next.month, next.day);
      return next;
    });
  };

  const applyDraft = () => {
    const iso = formatMemberDobIso(draft);
    if (!isMemberDobIsoAllowed(iso)) return;
    onChange(iso);
    setOpen(false);
  };

  const triggerMinH = size === 'step' ? 'min-h-[56px]' : 'min-h-[50px]';

  return (
    <>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(true)}
        className={`ios-input flex w-full items-center justify-between gap-3 rounded-xl border border-neutral-200 bg-white px-4 text-left ${triggerMinH} ${
          size === 'step' ? 'text-[17px]' : 'text-[15px]'
        } disabled:opacity-60`}
      >
        <span className={display ? 'font-semibold text-neutral-900' : 'text-neutral-400'}>
          {display ?? PRODUCT_SIGNUP_STEP_DOB}
        </span>
        <CalendarDays className="h-5 w-5 shrink-0 text-emerald-600" strokeWidth={2.25} aria-hidden />
      </button>

      <Dialog open={open} onClose={() => setOpen(false)} title={PRODUCT_SIGNUP_STEP_DOB} variant="form">
        <div className="space-y-3">
          <div>
            <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-neutral-400">
              Month
            </label>
            <select
              className={selectClass}
              value={draft.month}
              onChange={(event) => patchDraft({ month: Number(event.target.value) })}
            >
              {MEMBER_DOB_MONTHS.map((label, index) => (
                <option key={label} value={index + 1}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-neutral-400">
                Day
              </label>
              <select
                className={selectClass}
                value={draft.day}
                onChange={(event) => patchDraft({ day: Number(event.target.value) })}
              >
                {dayOptions.map((day) => (
                  <option key={day} value={day}>
                    {day}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-neutral-400">
                Year
              </label>
              <select
                className={selectClass}
                value={draft.year}
                onChange={(event) => patchDraft({ year: Number(event.target.value) })}
              >
                {yearOptions.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
        <AppButton type="button" className="mt-5" fullWidth onClick={applyDraft}>
          Done
        </AppButton>
      </Dialog>
    </>
  );
};
