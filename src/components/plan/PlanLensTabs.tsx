import { AppSegmented } from '../mobile/AppSegmented';
import { PLAN_LENS_SEGMENTS, type PlanLens } from '../../plan/planLens';

type PlanLensTabsProps = {
  active: PlanLens;
  onChange: (lens: PlanLens) => void;
};

export const PlanLensTabs = ({ active, onChange }: PlanLensTabsProps) => (
  <AppSegmented
    segments={PLAN_LENS_SEGMENTS}
    value={active}
    onChange={onChange}
    className="w-full"
  />
);
