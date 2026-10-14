import {
  publishesActivityAsIndividual,
  resolveActivityPublisherDisplayName,
} from './activity-publisher-display.js';
import {
  explorePersonHeadlineName,
  formatExplorePersonDisplayName,
  type ExploreMapPersonDTO,
} from './explore-person.js';
import type { HostPersonNameInput } from './host-display.js';
import {
  isRolePlaceholderDisplayName,
  ORGANIZER_FALLBACK_DISPLAY_NAME,
  resolveHostPersonDisplayName,
} from './host-display.js';
import type { PublishingProfileKind } from './publishing-profile-kind.js';

export type ActivityActorNameInput = {
  publishingProfileKind?: PublishingProfileKind | null;
  tenantName?: string | null;
  hostName?: string | null;
  createdByName?: string | null;
  featuredPerson?: ExploreMapPersonDTO | null;
};

const personFields = (input: ActivityActorNameInput): HostPersonNameInput => ({
  guideName: input.hostName,
  createdByName: input.createdByName,
  tenantName: input.tenantName,
});

/**
 * Headlines — "{person} is going …" / "{person} is looking for …".
 * Always a human name; never tenant / operator brand.
 */
export const resolveActivityHeadlinePersonName = (input: ActivityActorNameInput): string => {
  const person = resolveHostPersonDisplayName(personFields(input));
  if (person) return formatExplorePersonDisplayName(person);

  if (input.featuredPerson) {
    const headline = explorePersonHeadlineName(input.featuredPerson);
    const tenant = input.tenantName?.trim();
    if (tenant && headline.toLowerCase() === tenant.toLowerCase()) {
      return ORGANIZER_FALLBACK_DISPLAY_NAME;
    }
    if (headline !== 'Community member') return headline;
  }

  const host = input.hostName?.trim();
  if (host && !isRolePlaceholderDisplayName(host)) {
    const tenant = input.tenantName?.trim();
    if (!tenant || host.toLowerCase() !== tenant.toLowerCase()) {
      return formatExplorePersonDisplayName(host);
    }
  }

  return ORGANIZER_FALLBACK_DISPLAY_NAME;
};

/** Peek / list publisher row — person for community & pro guide; operator brand for agency / shop. */
export const resolveActivityPublisherRowPrimaryName = (input: ActivityActorNameInput): string => {
  const kind = input.publishingProfileKind ?? 'community';
  if (publishesActivityAsIndividual(kind) || kind === 'pro_guide') {
    return resolveActivityHeadlinePersonName(input);
  }
  return resolveActivityPublisherDisplayName({
    publishingProfileKind: kind,
    tenantName: input.tenantName ?? '',
    person: personFields(input),
  });
};

/** Map peek section label — Host (individual) vs Operator (agency / shop). */
export const exploreActivityPublisherSectionNoun = (
  kind?: PublishingProfileKind | null
): 'Host' | 'Operator' => {
  if (!kind || publishesActivityAsIndividual(kind) || kind === 'pro_guide') return 'Host';
  return 'Operator';
};
