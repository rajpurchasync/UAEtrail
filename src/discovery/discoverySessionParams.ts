/**
 * W4 discovery session spine — shared URL query keys for `/explore` and `/list`.
 * Parsers and filter state remain in `list/browse/*` and `explore/*` until unified.
 */

/** List category rail (`activities` | `venues` | `people` | `agencies`). */
export const LIST_CAT_PARAM = 'listCat' as const;

/** Legacy inbound `browse=1` on `/explore` — rewritten to `/list`. */
export const BROWSE_DISCOVER_PARAM = 'browse' as const;

export const parseBrowseDiscoverOpen = (value: string | null): boolean => value === '1';