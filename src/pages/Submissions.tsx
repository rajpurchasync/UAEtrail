import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Loader2, Star } from 'lucide-react';
import { fetchMyPlaceSubmissions } from '../hooks/memberCatalogSubmitClientApi';
import type { LocationDTO } from '@uaetrail/shared-types';
import { ConsumerShell } from '../components/mobile/ConsumerShell';
import { GlassCard } from '../components/mobile/GlassCard';
import { PullToRefresh } from '../components/mobile/PullToRefresh';
import { placeDetailPath } from '@uaetrail/shared-types';
import { PROFILE_REVIEWS_PATH, PROFILE_SUBMISSIONS_PATH } from '../config/routingCatalog';
import { useProfileHubBackChrome } from '../hooks/useProfileHubBackChrome';
import { SuggestCatalogForm } from '../place/SuggestCatalogForm';
import { mobileBackNavState } from '../utils/mobileBackNav';

export const Submissions = () => {
  const backChrome = useProfileHubBackChrome();
  const submissionsBack = mobileBackNavState(PROFILE_SUBMISSIONS_PATH, 'Submissions');
  const [places, setPlaces] = useState<LocationDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const list = await fetchMyPlaceSubmissions();
      setPlaces(list);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load submissions.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <ConsumerShell
      layout="stack"
      title="Submissions"
      maxWidth="4xl"
      showJourney={false}
      back={backChrome}
    >
      <PullToRefresh onRefresh={load}>
        <div className="space-y-3 pb-nav-safe animate-fade-up">
          <Link to={PROFILE_REVIEWS_PATH} state={submissionsBack} data-nav-focus="submissions-reviews" className="block">
            <GlassCard padding className="glass-card-interactive !py-3.5">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
                  <Star className="h-5 w-5" aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-neutral-900">Reviews</p>
                  <p className="text-xs text-neutral-500">Places and shops you&apos;ve reviewed</p>
                </div>
                <ChevronRight className="h-4 w-4 text-neutral-300" aria-hidden />
              </div>
            </GlassCard>
          </Link>

          <SuggestCatalogForm />

          <GlassCard padding>
            <h2 className="text-sm font-bold text-neutral-900">Places you added</h2>
            <p className="mt-1 text-xs text-neutral-500">Trails, camps, and shops submitted for community review.</p>
          </GlassCard>

          {loading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-emerald-600" aria-hidden />
            </div>
          ) : error ? (
            <p className="text-sm text-red-600">{error}</p>
          ) : places.length === 0 ? (
            <GlassCard padding className="text-center !py-8">
              <p className="text-sm text-neutral-600">No place submissions yet. Use Add on the map.</p>
            </GlassCard>
          ) : (
            <ul className="space-y-2">
              {places.map((place) => {
                const path = placeDetailPath(place.activityType ?? 'hiking', place.id);
                return (
                  <li key={place.id}>
                    <Link to={path} state={submissionsBack} data-nav-focus={`submission-${place.id}`} className="block">
                      <GlassCard padding className="glass-card-interactive !py-3">
                        <div className="flex items-center justify-between gap-2">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-neutral-900">{place.name}</p>
                            <p className="text-xs capitalize text-neutral-500">{place.status ?? 'pending'}</p>
                          </div>
                          <ChevronRight className="h-4 w-4 shrink-0 text-neutral-300" aria-hidden />
                        </div>
                      </GlassCard>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </PullToRefresh>
    </ConsumerShell>
  );
};
