import swaggerJsdoc from 'swagger-jsdoc';
import { env } from './config/env.js';

/** Domain-facing tag names for Swagger UI grouping. HTTP paths stay stable (e.g. `/locations`). */
export const openApiTags = [
  { name: 'Places', description: 'Trails, camps, and event spots (`/locations`, `/admin/places`).' },
  { name: 'Activities', description: 'Scheduled activities and join requests.' },
  {
    name: 'Operator',
    description:
      'Publishing console — tenant activities, team, places (`/operator/*`). Legacy `/host/*` returns `Deprecation: true` with `Link` to `/operator/*`.',
  },
  { name: 'Host', description: 'Deprecated alias for Operator tag — prefer `/operator/*` paths in new clients.' },
  { name: 'Shop', description: 'Shop organisations, products, and checkout (`/shop/*`).' },
  { name: 'Members', description: 'Auth accounts, profiles, and admin member tools.' },
  { name: 'Explore', description: 'Map discovery and public browse endpoints.' },
  { name: 'Social', description: 'Reviews, buddies, and groups.' },
  { name: 'Engagement', description: 'Wishlist saves, entity follows, goals, badges, and map pins.' },
  { name: 'Media', description: 'Presigned upload and private media resolve.' },
  { name: 'Admin', description: 'Platform admin moderation and audit.' },
  { name: 'Agent', description: 'Public discovery for AI assistants and automated agents (no auth).' }
] as const;

export const openApiSpec = swaggerJsdoc({
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'UAE Trails API',
      version: '1.0.0',
      description:
        'REST API for UAE Trails — places, activities, hosts (guides, agencies, shops), and members. ' +
        'Domain-facing tags group endpoints by product concept; legacy path segments (`/locations`, `/organizer`, `/merchant`) remain stable for existing clients.'
    },
    servers: [
      {
        url: `${env.API_BASE_URL}/api`
      }
    ],
    tags: [...openApiTags],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      },
      schemas: {
        MediaResolveResponse: {
          type: 'object',
          properties: {
            data: {
              type: 'object',
              required: ['url', 'expiresAt', 'key'],
              properties: {
                url: {
                  type: 'string',
                  format: 'uri',
                  description: 'Time-limited S3 GET URL (MinIO hosts rewritten for local Vite/Nginx).'
                },
                expiresAt: { type: 'string', format: 'date-time' },
                key: { type: 'string' }
              }
            }
          }
        },
        ApiError: {
          type: 'object',
          properties: {
            error: {
              type: 'object',
              properties: {
                code: { type: 'string' },
                message: { type: 'string' }
              }
            }
          }
        }
      }
    },
    paths: {
      '/admin/places': {
        get: {
          tags: ['Places', 'Admin'],
          summary: 'List places (admin, paginated)',
          description:
            'Preferred admin list path. Legacy alias: `GET /admin/locations`. Response DTO keys remain location-shaped until a dedicated place schema lands.',
          security: [{ bearerAuth: [] }],
          responses: {
            200: { description: 'Paginated place list.' }
          }
        },
        post: {
          tags: ['Places', 'Admin'],
          summary: 'Create a place (admin)',
          description: 'Preferred admin create path. Legacy alias: `POST /admin/locations`.',
          security: [{ bearerAuth: [] }],
          responses: {
            201: { description: 'Place created.' }
          }
        }
      },
      '/admin/locations': {
        get: {
          tags: ['Places', 'Admin'],
          summary: 'List places (admin, legacy path)',
          deprecated: true,
          description: 'Deprecated — use `GET /admin/places`.',
          security: [{ bearerAuth: [] }],
          responses: {
            200: { description: 'Paginated place list.' }
          }
        }
      },
      '/places/registry': {
        get: {
          tags: ['Places', 'Explore'],
          summary: 'Venue registry for organize/host pickers',
          description:
            'Merged list for trail/camp/event pickers: published registry places (`registryListed`), the caller’s draft submissions when authenticated, and the full admin catalog for platform admins. Filter with `activityType` (hiking, camping, event). Legacy browse list remains `GET /places` (paginated, registry-listed venues only).',
          security: [{ bearerAuth: [] }, {}],
          parameters: [
            {
              name: 'activityType',
              in: 'query',
              schema: { type: 'string', enum: ['hiking', 'camping', 'event'] },
              description: 'Venue kind on the place record.'
            },
            {
              name: 'countryCode',
              in: 'query',
              schema: { type: 'string', minLength: 2, maxLength: 2 },
              description: 'ISO country filter (default AE catalog).'
            }
          ],
          responses: {
            200: {
              description: 'Deduped place rows sorted by name.',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      data: { type: 'array', items: { type: 'object' } }
                    }
                  }
                }
              }
            }
          }
        }
      },
      '/shop/organisation/profile': {
        get: {
          tags: ['Shop', 'Host'],
          summary: 'Get managed shop organisation profile',
          description:
            'Preferred manage path. Scope via `shopId` or `tenantId` query. Legacy alias: `GET /shop/merchant/profile?merchantId=`.',
          security: [{ bearerAuth: [] }],
          responses: {
            200: { description: 'Shop profile with dual keys `shopId` and `merchantId`.' }
          }
        }
      },
      '/shop/shops/{id}': {
        get: {
          tags: ['Shop'],
          summary: 'Public shop page payload',
          description: 'Preferred public path. Legacy alias: `GET /shop/merchants/{id}`.',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            200: { description: 'Public shop profile and active products.' }
          }
        }
      },
      '/me/wishlist': {
        get: {
          tags: ['Engagement', 'Members'],
          summary: 'List wishlist items',
          description:
            'Private venue and activity saves (`user_favorites` collection). Not demand bookmarks or entity follows.',
          security: [{ bearerAuth: [] }],
          responses: { 200: { description: 'Hydrated wishlist rows.' } }
        },
        post: {
          tags: ['Engagement', 'Members'],
          summary: 'Add wishlist item',
          description: 'Body: exactly one of `locationId` or `activityId`. Optional match-alert watch fields.',
          security: [{ bearerAuth: [] }],
          responses: { 201: { description: 'Created or existing row.' } }
        }
      },
      '/me/wishlist/{id}': {
        patch: {
          tags: ['Engagement', 'Members'],
          summary: 'Update wishlist alert preference',
          description: 'Body: `{ alertOnMatch: boolean }`.',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Updated row.' } }
        },
        delete: {
          tags: ['Engagement', 'Members'],
          summary: 'Remove wishlist item',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Removed.' } }
        }
      },
      '/me/wishlist/check': {
        get: {
          tags: ['Engagement', 'Members'],
          summary: 'Check wishlist save state',
          security: [{ bearerAuth: [] }],
          responses: { 200: { description: '{ saved, wishlistItemId }' } }
        }
      },
      '/me/entity-follows': {
        get: {
          tags: ['Engagement', 'Members'],
          summary: 'List entity follows',
          description: 'Followed places, host brands, and shops for publish alerts.',
          security: [{ bearerAuth: [] }],
          responses: { 200: { description: 'Hydrated follow rows.' } }
        },
        post: {
          tags: ['Engagement', 'Members'],
          summary: 'Follow an entity',
          description: 'Body: exactly one of `locationId`, `tenantId`, `merchantId`.',
          security: [{ bearerAuth: [] }],
          responses: { 201: { description: 'Follow row.' } }
        }
      },
      '/me/entity-follows/{id}': {
        delete: {
          tags: ['Engagement', 'Members'],
          summary: 'Unfollow an entity',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Removed.' } }
        }
      },
      '/me/entity-follows/check': {
        get: {
          tags: ['Engagement', 'Members'],
          summary: 'Check entity follow state',
          security: [{ bearerAuth: [] }],
          responses: { 200: { description: '{ following, followId }' } }
        }
      },
      '/me/following': {
        get: {
          tags: ['Engagement', 'Members', 'Social'],
          summary: 'List people you follow',
          description: 'Member follow graph (`user_follows`). Distinct from entity follows and wishlist.',
          security: [{ bearerAuth: [] }],
          responses: { 200: { description: 'Member follow summaries.' } }
        }
      },
      '/me/following/{userId}': {
        post: {
          tags: ['Engagement', 'Members', 'Social'],
          summary: 'Follow a member',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'userId', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 201: { description: 'Follow row.' } }
        },
        delete: {
          tags: ['Engagement', 'Members', 'Social'],
          summary: 'Unfollow a member',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'userId', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Unfollowed.' } }
        }
      },
      '/me/goals': {
        get: {
          tags: ['Engagement', 'Members'],
          summary: 'List personal outdoor goals',
          description: 'Up to 3 concurrent goals per member (`user_goals`). Progress from join/host counts in the goal window.',
          security: [{ bearerAuth: [] }],
          responses: { 200: { description: '{ data: MemberGoalDTO[] }' } }
        },
        post: {
          tags: ['Engagement', 'Members'],
          summary: 'Create a personal goal',
          security: [{ bearerAuth: [] }],
          responses: { 201: { description: 'Created goal.' } }
        }
      },
      '/me/goals/{id}': {
        patch: {
          tags: ['Engagement', 'Members'],
          summary: 'Update a personal goal',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Updated goal.' } }
        },
        delete: {
          tags: ['Engagement', 'Members'],
          summary: 'Delete a personal goal',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Removed.' } }
        }
      },
      '/me/goals/active': {
        get: {
          tags: ['Engagement', 'Members'],
          summary: 'Get primary goal (legacy)',
          description: 'Legacy single-goal read. Prefer `GET /me/goals` for the full list.',
          security: [{ bearerAuth: [] }],
          responses: { 200: { description: 'Primary goal or null.' } }
        },
        put: {
          tags: ['Engagement', 'Members'],
          summary: 'Upsert primary goal (legacy)',
          security: [{ bearerAuth: [] }],
          responses: { 200: { description: 'Upserted primary goal.' } }
        },
        delete: {
          tags: ['Engagement', 'Members'],
          summary: 'Clear primary goal (legacy)',
          security: [{ bearerAuth: [] }],
          responses: { 200: { description: 'Cleared.' } }
        }
      },
      '/me/export': {
        get: {
          tags: ['Members'],
          summary: 'Download account data (JSON)',
          description:
            'Includes profile, activity requests, participations, wishlist, entity follows, member following, goals, badges, journey map pins, shop orders, and push subscription count.',
          security: [{ bearerAuth: [] }],
          responses: { 200: { description: 'JSON attachment.' } }
        }
      },
      '/media/resolve': {
        get: {
          tags: ['Media'],
          summary: 'Resolve a storage key to a short-lived GET URL',
          description:
            "Avatars, waivers, and private photos live in `uaetrail-private`. Access follows the owner's `profileVisibility` (`public`, `group_members`, `private`). `group_members` requires shared group or event membership. Authorized callers receive a 1-hour presigned GET URL.",
          security: [{ bearerAuth: [] }, {}],
          parameters: [
            {
              name: 'key',
              in: 'query',
              required: true,
              schema: { type: 'string' },
              description: 'Object key or stored media URL containing the key.'
            }
          ],
          responses: {
            200: {
              description: 'Authorized. Returns a 1-hour presigned GET URL.',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/MediaResolveResponse' }
                }
              }
            },
            400: {
              description: 'Invalid key.',
              content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiError' } } }
            },
            403: {
              description: 'Caller is not allowed to view this object.',
              content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiError' } } }
            }
          }
        }
      },
      '/media/presign-upload': {
        post: {
          tags: ['Media'],
          summary: 'Issue a presigned PUT URL',
          description:
            "Routes `avatar`, `waiver`, and `private_photo` to `uaetrail-private`; all other kinds go to `uaetrail-public`.",
          security: [{ bearerAuth: [] }],
          responses: {
            200: { description: 'Presign payload with key, uploadUrl, publicUrl, and bucket.' }
          }
        }
      },
      '/agent/manifest.json': {
        get: {
          tags: ['Agent'],
          summary: 'Agent manifest',
          description:
            'Machine-readable entry point for AI crawlers: search API, sitemaps, llms.txt, and scrape boundaries.',
          responses: {
            200: { description: 'AgentManifestDTO JSON (schema_version 1.0).' }
          }
        }
      },
      '/agent/discover': {
        get: {
          tags: ['Agent'],
          summary: 'Search public outings and places',
          description:
            'Free-text search over published activities and registry-listed places. Prefer result URLs for citations.',
          parameters: [
            { name: 'q', in: 'query', required: true, schema: { type: 'string', maxLength: 64 } },
            {
              name: 'kind',
              in: 'query',
              schema: { type: 'string', enum: ['all', 'activity', 'place'], default: 'all' }
            },
            { name: 'region', in: 'query', schema: { type: 'string', maxLength: 80 } },
            { name: 'limit', in: 'query', schema: { type: 'integer', minimum: 1, maximum: 25, default: 10 } }
          ],
          responses: {
            200: { description: 'AgentDiscoverResponseDTO JSON (schema_version 1.0).' }
          }
        }
      }
    }
  },
  apis: []
});
