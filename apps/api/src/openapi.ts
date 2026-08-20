import swaggerJsdoc from 'swagger-jsdoc';
import { env } from './config/env.js';

export const openApiSpec = swaggerJsdoc({
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'UAE Trails API',
      version: '1.0.0',
      description: 'REST API for UAE Trails admin, organizer, and visitor workflows.'
    },
    servers: [
      {
        url: `${env.API_BASE_URL}/api/v1`
      }
    ],
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
