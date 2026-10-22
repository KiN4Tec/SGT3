ARG NODE_VERSION=24

FROM node:${NODE_VERSION} AS base

# Create a non-root user for security
RUN groupadd --gid 1001 nodejs && \
    useradd -ms /bin/bash --uid 1001 -g nodejs nodejs
USER nodejs

WORKDIR /app

FROM base AS installer

# Install project dependencies using BuildKit cache mount
COPY --chown=nodejs .npmrc package.json package-lock.json /app/
COPY --chown=nodejs common/package.json common/package-lock.json /app/common/
COPY --chown=nodejs backend/package.json backend/package-lock.json /app/backend/
RUN --mount=type=cache,uid=1001,target=/home/nodejs/.npm npm install

FROM base AS dev

COPY --from=installer --chown=nodejs /app /app
COPY --chown=nodejs common /app/common
COPY --chown=nodejs backend /app/backend

RUN cd /app/backend && npx wrangler d1 execute sgt3_d1 --local --file schema.sql

EXPOSE 3000

# Can be overridden in Docker compose.yml file
CMD ["npm", "run", "dev", "--workspace=backend"]
