import type { DiscoveryCardModel } from '../../../../discovery/discoveryCardModel';

export type AreaPeekBodyProps = {
  card: Pick<DiscoveryCardModel, 'subtitle'>;
};

export const AreaPeekBody = ({ card }: AreaPeekBodyProps) =>
  card.subtitle ? (
    <p className="mt-3 text-sm leading-relaxed text-gray-600">{card.subtitle}</p>
  ) : null;
