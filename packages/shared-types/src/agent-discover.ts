/** Stable public contract for AI agents and automated discovery (v1). */

export type AgentDiscoverEntityKind = 'activity' | 'place';

export type AgentDiscoverPlaceKind = 'trail' | 'camp' | 'venue' | 'shop';

export type AgentDiscoverItemDTO = {
  kind: AgentDiscoverEntityKind;
  id: string;
  title: string;
  summary: string;
  url: string;
  region?: string | null;
  /** Scheduled outing type (hiking, camping, event, rideshare). */
  activityType?: string | null;
  /** ISO local date for outings (YYYY-MM-DD). */
  date?: string | null;
  time?: string | null;
  placeKind?: AgentDiscoverPlaceKind | null;
};

export type AgentDiscoverResponseDTO = {
  schema_version: '1.0';
  query: string;
  total: number;
  results: AgentDiscoverItemDTO[];
};

export type AgentManifestDTO = {
  schema_version: '1.0';
  name: string;
  description: string;
  website: string;
  product_home: string;
  documentation: {
    llms_txt: string;
    llms_full_txt: string;
    openapi_json: string | null;
  };
  discovery: {
    search_url: string;
    method: 'GET';
    parameters: {
      q: { required: true; description: string; max_length: number };
      kind: { required: false; default: 'all'; values: Array<'all' | AgentDiscoverEntityKind> };
      region: { required: false; description: string };
      limit: { required: false; default: number; max: number };
    };
    response_schema_version: '1.0';
  };
  sitemaps: string[];
  allowed_scrape_paths: string[];
  disallowed_paths: string[];
};
