import { EXPLORE_FLOW } from '../../config/exploreTheme';

export { EXPLORE_FLOW };

export const exploreFlowChoiceCardClass = (active: boolean): string =>
  `${EXPLORE_FLOW.choiceCardBase} ${active ? EXPLORE_FLOW.choiceCardActive : EXPLORE_FLOW.choiceCardInactive}`;

export const exploreFlowKindTileClass = (active: boolean): string =>
  `${EXPLORE_FLOW.kindTile} ${active ? EXPLORE_FLOW.kindTileActive : EXPLORE_FLOW.kindTileIdle}`;
