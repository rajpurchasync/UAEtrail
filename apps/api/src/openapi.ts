import swaggerJsdoc from 'swagger-jsdoc';
import { env } from './config/env.js';

/** Domain-facing tag names for Swagger UI grouping. HTTP paths stay stable (e.g. `/locations`). */
export const openApiTags = [
  { name: 'Places', description: 'Trails, camps, and event spots (`/locations`, `/admin/places`).' },
  { name: 'Activities', description: 'Scheduled activities and join requests.' },
  { name: 'Host', description: 'Host console, tenant profile, team, and applications (`/host/*`).' },
  { name: 'Shop', description: 'Shop organisations, products, and checkout (`/shop/*`).' },
  { name: 'Members', description: 'Auth accounts, profiles, and admin member tools.' },
  { name: 'Explore', description: 'Map discovery and public browse endpoints.' },
  { name: 'Social', description: 'Groups, favorites, and community features.' },
  { name: 'Media', description: 'Presigned upload and private media resolve.' },
  { name: 'Admin', description: 'Platform admin moderation and audit.' }
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
        url: `${env.API_BASE_URL}/api/v1`
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
      }
    }
  },
  apis: []
});
