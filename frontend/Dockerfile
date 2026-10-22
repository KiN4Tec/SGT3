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
COPY --chown=nodejs frontend/package.json frontend/package-lock.json /app/frontend/
COPY --chown=nodejs common/package.json common/package-lock.json /app/common/
RUN --mount=type=cache,uid=1001,target=/home/nodejs/.npm npm install

FROM base AS dev

COPY --from=installer --chown=nodejs /app /app
COPY --chown=nodejs common /app/common
COPY --chown=nodejs frontend /app/frontend

EXPOSE 3000

# Can be overridden in Docker compose.yml file
CMD ["npm", "run", "dev", "--workspace=frontend"]
