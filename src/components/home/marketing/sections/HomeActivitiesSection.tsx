import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { EXPLORE_MAP_PATH } from '../../../../config/routingCatalogLite';
import type { HomeLandingActivity } from '../../../../content/homeLanding';
import { HOME_ACTIVITIES } from '../../../../content/homeMarketing';
import { emirateLabelFromId } from '../../../../utils/homeLandingEmirate';
import { mapHomeLandingActivityToCard } from '../../../../utils/mapHomeLandingActivity';
import { HOME_LANDING_ACTIVITY_LIMIT } from '../../../../utils/selectDiverseHomeLandingActivities';
import { ActivityCardCarousel } from '../ActivityCardCarousel';
import { AppButton } from '../../../mobile/AppButton';
import { EmirateChips } from '../EmirateChips';
import { SectionHeader } from '../SectionHeader';

interface HomeActivitiesSectionProps {
  activities: HomeLandingActivity[];
  loading: boolean;
  error: boolean;
  onRetry: () => void;
}

export const HomeActivitiesSection = ({
  activities,
  loading,
  error,
  onRetry
}: HomeActivitiesSectionProps) => {
  const [emirate, setEmirate] = useState('all');

  const cards = useMemo(() => activities.map(mapHomeLandingActivityToCard), [activities]);

  const chipOptions = useMemo(() => {
    const counts = new Map<string, number>();
    const labels = new Map<string, string>();
    for (const card of cards) {
      if (!card.emirateId) continue;
      counts.set(card.emirateId, (counts.get(card.emirateId) ?? 0) + 1);
      if (card.emirate?.trim()) labels.set(card.emirateId, card.emirate.trim());
    }
    const emirates = [...counts.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .map(([id, count]) => ({
        id,
        label: labels.get(id) ?? emirateLabelFromId(id),
        count,
      }));
    if (emirates.length <= 1) return emirates.length === 0 ? [] : emirates;
    return [{ id: 'all', label: 'All' }, ...emirates];
  }, [cards]);

  const filtered = useMemo(() => {
    const list =
      emirate === 'all' ? cards : cards.filter((c) => c.emirateId === emirate);
    return list.slice(0, HOME_LANDING_ACTIVITY_LIMIT).map(({ emirateId: _e, ...card }) => card);
  }, [cards, emirate]);

  const emptyEmirate = emirate !== 'all' && filtered.length === 0 && !loading;

  return (
    <section
      className="bg-home-surface py-[var(--section-padding-y-mobile)] md:py-[var(--section-padding-y-desktop)]"
      aria-labelledby="home-activities-heading"
    >
      <div className="home-marketing-wrap">
        <SectionHeader
          id="home-activities-heading"
          title={HOME_ACTIVITIES.title}
          action={
            <Link to={EXPLORE_MAP_PATH} className="landing-text-cta shrink-0">
              {HOME_ACTIVITIES.viewAll}
            </Link>
          }
        />

        {error && cards.length === 0 ? (
          <div className="rounded-home-md border border-[var(--gray-200)] bg-home-muted p-8 text-center">
            <p className="text-home-ink">{HOME_ACTIVITIES.error}</p>
            <AppButton className="mt-4" onClick={onRetry}>{HOME_ACTIVITIES.retry}</AppButton>
          </div>
        ) : !loading && cards.length === 0 ? (
          <div
            className="rounded-home-md border border-dashed border-[var(--gray-200)] bg-home-muted/60 p-8 text-center text-neutral-600"
            role="status"
          >
            <p>{HOME_ACTIVITIES.emptyCatalog}</p>
            <Link to={EXPLORE_MAP_PATH} className="landing-text-cta mt-3 inline-block">
              {HOME_ACTIVITIES.viewAll.replace(' →', '')}
            </Link>
          </div>
        ) : (
          <>
            {chipOptions.length > 1 ? (
              <EmirateChips options={chipOptions} value={emirate} onChange={setEmirate} />
            ) : null}
            <div className="mt-5 transition-opacity duration-[var(--duration-hover)] md:mt-6">
              <ActivityCardCarousel
                cards={filtered}
                loading={loading}
                skeletonCount={HOME_LANDING_ACTIVITY_LIMIT}
                emptyState={
                  emptyEmirate ? (
                    <p className="text-neutral-600">
                      {HOME_ACTIVITIES.emptyFilter(emirateLabelFromId(emirate))}
                      {' · '}
                      <Link to={EXPLORE_MAP_PATH} className="landing-text-cta">
                        {HOME_ACTIVITIES.viewAll.replace(' →', '')}
                      </Link>
                    </p>
                  ) : undefined
                }
              />
            </div>
          </>
        )}
      </div>
    </section>
  );
};
