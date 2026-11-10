import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const read = (rel: string) => readFileSync(join(process.cwd(), rel), 'utf8');

describe('asyncLoadingGuard', () => {
  it('exports shared AsyncLoadingState and loading primitives', () => {
    expect(read('src/components/ui/AsyncLoadingState.tsx')).toMatch(/export const AsyncLoadingState/);
    expect(read('src/components/ui/loadingPrimitives.tsx')).toMatch(/LoadingRing/);
    expect(read('src/components/ui/loadingPrimitives.tsx')).toMatch(/LoadingLabelRow/);
  });

  it('route and auth fallbacks use AsyncLoadingState', () => {
    expect(read('src/routing/appRouteChrome.tsx')).toMatch(/AsyncLoadingState/);
    expect(read('src/routing/planBrowseRoute.tsx')).toMatch(/AsyncLoadingState/);
    expect(read('src/components/auth/ProtectedRoute.tsx')).toMatch(/AsyncLoadingState/);
  });

  it('ConsumerLoadingSpinner delegates to AsyncLoadingState', () => {
    expect(read('src/components/mobile/ConsumerFeedback.tsx')).toMatch(
      /ConsumerLoadingSpinner[\s\S]*AsyncLoadingState/
    );
  });
});
