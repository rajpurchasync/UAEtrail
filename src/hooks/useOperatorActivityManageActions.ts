/**
 * Tenant activity manage actions (publish, cancel, duplicate) — prefer in `/operator/*` and `components/activity/*`.
 */
export {
  useHostActivityManageActions as useOperatorActivityManageActions,
  type HostActivityManageActions as OperatorActivityManageActions,
} from './useHostActivityManageActions';
