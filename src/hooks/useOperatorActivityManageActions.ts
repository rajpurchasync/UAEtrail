/**
 * Tenant activity manage actions (publish, cancel, duplicate) — publishing console `/publishing/*` and `components/activity/*`.
 */
export {
  useHostActivityManageActions as useOperatorActivityManageActions,
  type HostActivityManageActions as OperatorActivityManageActions,
} from './useHostActivityManageActions';
