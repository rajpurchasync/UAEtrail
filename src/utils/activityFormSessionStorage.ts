import type { ActivityDTO } from '@uaetrail/shared-types';
import type { ActivityType } from '../config/activityTypes';
import type { ActivityFormState } from '../components/activities/activityFormState';

export type HikingDraftSnapshot = {
  form: ActivityFormState;
  step: number;
  locationTab: string;
  instructionTab: string;
  editingActivityId: string | null;
};

export type ActivityFormSessionSnapshot = {
  open: boolean;
  activityType: ActivityType | null;
  tenantId: string;
  editingActivityId: string | null;
  initialActivityType: ActivityType | null;
  hikingDraft: HikingDraftSnapshot | null;
};

const STORAGE_KEY = 'uaetrail.activity-form.session';

const getWindow = () => (typeof window === 'undefined' ? null : window);

export const loadActivityFormSession = (): ActivityFormSessionSnapshot | null => {
  const win = getWindow();
  if (!win) return null;
  const raw = win.sessionStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as ActivityFormSessionSnapshot;
  } catch {
    return null;
  }
};

export const saveActivityFormSession = (snapshot: ActivityFormSessionSnapshot): void => {
  const win = getWindow();
  if (!win) return;
  win.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
};

export const clearActivityFormSession = (): void => {
  const win = getWindow();
  if (!win) return;
  win.sessionStorage.removeItem(STORAGE_KEY);
};

export const saveHikingDraft = (
  draft: HikingDraftSnapshot,
  sessionPatch?: Partial<ActivityFormSessionSnapshot>
): void => {
  const current = loadActivityFormSession();
  saveActivityFormSession({
    open: true,
    activityType: 'hiking',
    tenantId: current?.tenantId ?? '',
    editingActivityId: draft.editingActivityId,
    initialActivityType: current?.initialActivityType ?? null,
    hikingDraft: draft,
    ...sessionPatch,
  });
};

export const draftFromActivity = (activity: ActivityDTO | null): string | null => activity?.id ?? null;