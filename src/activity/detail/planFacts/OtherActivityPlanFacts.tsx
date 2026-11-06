import type { ActivityDetailDTO } from '@uaetrail/shared-types';
import { ActivityKindFactsGrid } from './ActivityKindFactsGrid';
import { resolveOtherPlanFacts } from '../activityKindRequirementFacts';

type Props = {
  activity: ActivityDetailDTO;
  panelClassName: string;
};

export const OtherActivityPlanFacts = ({ activity, panelClassName }: Props) => {
  const facts = resolveOtherPlanFacts(activity);
  const hasGrid = facts.topicLine || facts.activityTypeLabel;
  const hasExtras = facts.extraLines.length > 0;

  if (!hasGrid && !hasExtras) return null;

  return (
    <>
      {hasGrid ? (
        <ActivityKindFactsGrid
          title="About this plan"
          panelClassName={panelClassName}
          accentClass="text-violet-700"
          items={[
            { label: 'Format', value: facts.activityTypeLabel },
            { label: 'Topic', value: facts.topicLine },
          ]}
        />
      ) : null}
      {hasExtras ? (
        <div className={`bg-white rounded-2xl border border-gray-100 p-5 sm:p-6 lg:rounded-xl lg:p-3 ${panelClassName}`}>
          <h2 className="text-lg font-bold text-gray-900 mb-3 lg:mb-2 lg:text-[13px] lg:font-semibold lg:uppercase lg:tracking-wide lg:text-neutral-500">Good to know</h2>
          <ul className="list-disc list-inside space-y-1 text-gray-700 text-sm">
            {facts.extraLines.map((line, i) => (
              <li key={i}>{line}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </>
  );
};
