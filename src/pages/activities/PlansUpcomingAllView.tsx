import { ActivitiesHubView } from './ActivitiesHubView';
import { HostedActivitiesSection } from './HostedActivitiesSection';
import { SelfPlansSection } from './SelfPlansSection';

type PlansUpcomingAllViewProps = {
  refreshKey: number;
  canHost: boolean;
};

/** Plans → Upcoming → All: hosted + joined upcoming outings. */
export const PlansUpcomingAllView = ({ refreshKey, canHost }: PlansUpcomingAllViewProps) => (
  <div className="space-y-8">
    {canHost ? (
      <section aria-labelledby="plans-all-hosted-heading">
        <h2
          id="plans-all-hosted-heading"
          className="mb-2 text-xs font-bold uppercase tracking-wide text-neutral-400"
        >
          Hosted
        </h2>
        <HostedActivitiesSection
          refreshKey={refreshKey}
          searchQuery=""
          timeScope="upcoming"
          layout="embedded"
        />
      </section>
    ) : null}

    <section aria-labelledby="plans-all-joined-heading">
      <h2
        id="plans-all-joined-heading"
        className="mb-2 text-xs font-bold uppercase tracking-wide text-neutral-400"
      >
        Joined
      </h2>
      <ActivitiesHubView refreshKey={refreshKey} searchQuery="" />
    </section>

    <section aria-labelledby="plans-all-seeking-heading">
      <h2
        id="plans-all-seeking-heading"
        className="mb-2 text-xs font-bold uppercase tracking-wide text-neutral-400"
      >
        Seeking
      </h2>
      <SelfPlansSection segment="upcoming" refreshKey={refreshKey} searchQuery="" />
    </section>
  </div>
);
