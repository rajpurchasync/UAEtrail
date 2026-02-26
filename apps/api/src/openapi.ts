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
      }
    }
  },
  apis: []
});
