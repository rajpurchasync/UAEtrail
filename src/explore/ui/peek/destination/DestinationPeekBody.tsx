import type { DiscoveryCardModel } from '../../../../discovery/discoveryCardModel';

export type DestinationPeekBodyProps = {
  card: Pick<DiscoveryCardModel, 'subtitle'>;
};

export const DestinationPeekBody = ({ card }: DestinationPeekBodyProps) =>
  card.subtitle ? (
    <p className="mt-3 text-sm leading-relaxed text-gray-600">{card.subtitle}</p>
  ) : null;
