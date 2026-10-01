import { ConsumerInlineEmpty } from '../../components/mobile/ConsumerFeedback';
import { explorePath } from '../../explore/routing';

/** Personal plans you initiate (find-a-group / demand) — expanded in a later iteration. */
export const TripsSelfSection = ({ segment }: { segment: 'upcoming' | 'completed' }) => (
  <ConsumerInlineEmpty
    message={
      segment === 'upcoming'
        ? 'Plans you start from the map will show here — find a crew or post what you’re looking for.'
        : 'Your past self-started plans will appear here once this view is wired up.'
    }
    actionLabel="Open the map"
    actionTo={explorePath({ compose: 'menu' })}
  />
);

