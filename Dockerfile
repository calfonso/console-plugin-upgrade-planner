# Multi-stage build for Upgrade Planner Dynamic Plugin

# Stage 1: Build backend
FROM registry.access.redhat.com/ubi9/nodejs-18:latest AS backend-builder

USER root
WORKDIR /app

COPY package.json yarn.lock tsconfig.json ./
COPY src/backend ./src/backend
COPY src/shared ./src/shared

RUN npm install -g yarn && \
    yarn install --frozen-lockfile && \
    yarn build:backend

# Stage 2: Build frontend
FROM registry.access.redhat.com/ubi9/nodejs-18:latest AS frontend-builder

USER root
WORKDIR /app

COPY package.json yarn.lock tsconfig.json webpack.config.ts console-extensions.json ./
COPY src/frontend ./src/frontend
COPY src/shared ./src/shared
COPY manifests ./manifests
COPY public ./public

RUN npm install -g yarn && \
    yarn install --frozen-lockfile && \
    yarn build:frontend

# Stage 3: Runtime image
FROM registry.access.redhat.com/ubi9/nodejs-18-minimal:latest

USER root

# Install runtime dependencies
WORKDIR /app

COPY package.json yarn.lock ./
RUN npm install -g yarn && \
    yarn install --production --frozen-lockfile && \
    yarn cache clean

# Copy built artifacts
COPY --from=backend-builder /app/dist/backend ./dist/backend
COPY --from=frontend-builder /app/dist/frontend ./dist/frontend

# Create non-root user
RUN chown -R 1001:0 /app && \
    chmod -R g=u /app

USER 1001

# Expose port
EXPOSE 9443

# Health check (using curl-minimal which is pre-installed)
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl-minimal -f http://localhost:9443/health || exit 1

# Start the backend server
CMD ["node", "dist/backend/backend/server.js"]
