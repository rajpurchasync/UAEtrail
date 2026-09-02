import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { ActivityDTO, LocationDTO, TenantListDTO } from '@uaetrail/shared-types';
import type { ActivityType } from '../config/activityTypes';
import { getActiveTenantId } from '../api/tenant';
import { CreateActivityModal } from '../components/activities';
import {
  clearActivityFormSession,
  loadActivityFormSession,
  saveActivityFormSession,
  type ActivityFormSessionSnapshot,
} from '../utils/activityFormSessionStorage';

export type OpenActivityFormOptions = {
  tenantId?: string;
  initialActivityType?: ActivityType | null;
  editingActivity?: ActivityDTO | null;
  /** Host organizations the user may publish under (platform admin). */
  hostOrganizations?: TenantListDTO[];
  /** @deprecated Use hostOrganizations */
  publishingOrganizations?: TenantListDTO[];
  venueLocations?: LocationDTO[];
};

type ActivityFormSessionContextValue = {
  open: boolean;
  openCreate: (options?: OpenActivityFormOptions) => void;
  openEdit: (activity: ActivityDTO, options?: OpenActivityFormOptions) => void;
  close: () => void;
  session: ActivityFormSessionSnapshot | null;
  onSaved: (() => void) | null;
  setOnSaved: (handler: (() => void) | null) => void;
  options: OpenActivityFormOptions;
};

const ActivityFormSessionContext = createContext<ActivityFormSessionContextValue | undefined>(undefined);

const defaultSession = (): ActivityFormSessionSnapshot => ({
  open: false,
  activityType: null,
  tenantId: getActiveTenantId(),
  editingActivityId: null,
  initialActivityType: null,
  hikingDraft: null,
});

const resolveHostOrganizations = (opts: OpenActivityFormOptions): TenantListDTO[] | undefined =>
  opts.hostOrganizations ?? opts.publishingOrganizations;

export const ActivityFormSessionProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<ActivityFormSessionSnapshot>(() => {
    const loaded = loadActivityFormSession();
    if (loaded?.hikingDraft) return { ...loaded, open: true };
    return loaded ?? defaultSession();
  });
  const [options, setOptions] = useState<OpenActivityFormOptions>({});
  const [onSaved, setOnSaved] = useState<(() => void) | null>(null);
  const [editingActivity, setEditingActivity] = useState<ActivityDTO | null>(null);

  useEffect(() => {
    if (session.open) {
      saveActivityFormSession(session);
    }
  }, [session]);

  const openCreate = useCallback((opts: OpenActivityFormOptions = {}) => {
    const hostOrganizations = resolveHostOrganizations(opts);
    setOptions({ ...opts, hostOrganizations });
    setEditingActivity(opts.editingActivity ?? null);
    setSession((prev) => ({
      ...prev,
      open: true,
      tenantId: opts.tenantId ?? getActiveTenantId(),
      editingActivityId: opts.editingActivity?.id ?? null,
      initialActivityType: opts.initialActivityType ?? null,
      activityType: opts.initialActivityType ?? null,
      hikingDraft: null,
    }));
  }, []);

  const openEdit = useCallback((activity: ActivityDTO, opts: OpenActivityFormOptions = {}) => {
    const hostOrganizations = resolveHostOrganizations(opts);
    setOptions({ ...opts, hostOrganizations });
    setEditingActivity(activity);
    setSession((prev) => ({
      ...prev,
      open: true,
      tenantId: opts.tenantId ?? activity.tenantId ?? getActiveTenantId(),
      editingActivityId: activity.id,
      initialActivityType: null,
      activityType: (activity.activityType as ActivityType) ?? 'hiking',
      hikingDraft: null,
    }));
  }, []);

  const close = useCallback(() => {
    clearActivityFormSession();
    setSession(defaultSession());
    setEditingActivity(null);
    setOptions({});
  }, []);

  const value = useMemo(
    () => ({
      open: session.open,
      openCreate,
      openEdit,
      close,
      session,
      onSaved,
      setOnSaved,
      options,
    }),
    [session, openCreate, openEdit, close, onSaved, options]
  );

  const handleSaved = () => {
    onSaved?.();
  };

  const hostOrganizations = resolveHostOrganizations(options);

  return (
    <ActivityFormSessionContext.Provider value={value}>
      {children}
      <CreateActivityModal
        open={session.open}
        onClose={close}
        onSaved={handleSaved}
        tenantId={options.tenantId ?? session.tenantId}
        initialActivityType={options.initialActivityType ?? session.initialActivityType}
        editingActivity={editingActivity ?? options.editingActivity ?? null}
        hostOrganizations={hostOrganizations}
        venueLocations={options.venueLocations}
        sessionSnapshot={session}
        onSessionChange={setSession}
      />
    </ActivityFormSessionContext.Provider>
  );
};

export const useActivityFormSession = (): ActivityFormSessionContextValue => {
  const ctx = useContext(ActivityFormSessionContext);
  if (!ctx) {
    throw new Error('useActivityFormSession must be used within ActivityFormSessionProvider');
  }
  return ctx;
};
