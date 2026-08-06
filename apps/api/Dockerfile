FROM node:20-alpine AS build

WORKDIR /app

COPY . .

RUN npm install

RUN npm run build:api

FROM node:20-alpine

WORKDIR /app
ENV NODE_ENV=production

COPY --from=build /app/package*.json ./
COPY --from=build /app/apps/api/package.json apps/api/package.json
COPY --from=build /app/apps/api/tsconfig.json apps/api/tsconfig.json
COPY --from=build /app/packages/shared-types packages/shared-types
COPY --from=build /app/apps/api/dist apps/api/dist
COPY --from=build /app/apps/api/src apps/api/src
COPY --from=build /app/apps/api/scripts apps/api/scripts
COPY --from=build /app/node_modules node_modules
COPY --from=build /app/apps/api/node_modules apps/api/node_modules

EXPOSE 4000

COPY apps/api/docker-entrypoint.sh /docker-entrypoint.sh
RUN sed -i 's/\r$//' /docker-entrypoint.sh && chmod +x /docker-entrypoint.sh

CMD ["/docker-entrypoint.sh"]
