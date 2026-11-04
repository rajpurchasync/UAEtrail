import { EXPLORE_FLOW } from '../../config/exploreTheme';

export { EXPLORE_FLOW };

export const exploreFlowChoiceCardClass = (active: boolean): string =>
  `${EXPLORE_FLOW.choiceCardBase} ${active ? EXPLORE_FLOW.choiceCardActive : EXPLORE_FLOW.choiceCardInactive}`;

export const exploreFlowKindTileClass = (active: boolean): string =>
  `${EXPLORE_FLOW.kindTile} ${active ? EXPLORE_FLOW.kindTileActive : EXPLORE_FLOW.kindTileIdle}`;

export const exploreFlowComposeFieldClass = (extra = ''): string =>
  `${EXPLORE_FLOW.composeField}${extra ? ` ${extra}` : ''}`;

export const exploreFlowComposePrimaryClass = (tone: 'host' | 'flow'): string => {
  const bg = tone === 'host' ? 'bg-emerald-600' : 'bg-emerald-500';
  return `${EXPLORE_FLOW.composePrimary} ${bg}`;
};
