import type { ActivityType } from '../config/activityTypes';
import type { ActivityFormState } from '../components/activities/activityFormState';

export type ActivityDraftSnapshot = {
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
  hikingDraft: ActivityDraftSnapshot | null;
  campingDraft: ActivityDraftSnapshot | null;
  eventDraft: ActivityDraftSnapshot | null;
};

const STORAGE_KEY = 'uaetrail.activity-form.session';

const getWindow = () => (typeof window === 'undefined' ? null : window);

export const loadActivityFormSession = (): ActivityFormSessionSnapshot | null => {
  const win = getWindow();
  if (!win) return null;
  const raw = win.sessionStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as ActivityFormSessionSnapshot;
    return {
      ...parsed,
      campingDraft: parsed.campingDraft ?? null,
      eventDraft: parsed.eventDraft ?? null,
    };
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
  draft: ActivityDraftSnapshot,
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
    campingDraft: current?.campingDraft ?? null,
    eventDraft: current?.eventDraft ?? null,
    ...sessionPatch,
  });
};

export const saveCampingDraft = (
  draft: ActivityDraftSnapshot,
  sessionPatch?: Partial<ActivityFormSessionSnapshot>
): void => {
  const current = loadActivityFormSession();
  saveActivityFormSession({
    open: true,
    activityType: 'camping',
    tenantId: current?.tenantId ?? '',
    editingActivityId: draft.editingActivityId,
    initialActivityType: current?.initialActivityType ?? null,
    hikingDraft: current?.hikingDraft ?? null,
    campingDraft: draft,
    eventDraft: current?.eventDraft ?? null,
    ...sessionPatch,
  });
};

export const saveEventDraft = (
  draft: ActivityDraftSnapshot,
  sessionPatch?: Partial<ActivityFormSessionSnapshot>
): void => {
  const current = loadActivityFormSession();
  saveActivityFormSession({
    open: true,
    activityType: 'event',
    tenantId: current?.tenantId ?? '',
    editingActivityId: draft.editingActivityId,
    initialActivityType: current?.initialActivityType ?? null,
    hikingDraft: current?.hikingDraft ?? null,
    campingDraft: current?.campingDraft ?? null,
    eventDraft: draft,
    ...sessionPatch,
  });
};
