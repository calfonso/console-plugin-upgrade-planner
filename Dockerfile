# Multi-stage build for Upgrade Planner Dynamic Plugin

# Stage 1: Build backend
FROM registry.access.redhat.com/ubi9/nodejs-18:latest AS backend-builder

USER root
WORKDIR /app

COPY package.json package-lock.json tsconfig.json ./
COPY src/backend ./src/backend
COPY src/shared ./src/shared

RUN npm ci --legacy-peer-deps && \
    npm run build:backend

# Stage 2: Build frontend
FROM registry.access.redhat.com/ubi9/nodejs-18:latest AS frontend-builder

USER root
WORKDIR /app

COPY package.json package-lock.json tsconfig.json webpack.config.ts console-extensions.json ./
COPY src/frontend ./src/frontend
COPY src/shared ./src/shared
COPY manifests ./manifests

RUN npm ci --legacy-peer-deps && \
    npm run build:frontend

# Stage 3: Runtime image
FROM registry.access.redhat.com/ubi9/nodejs-18-minimal:latest

USER root

# Install runtime dependencies
WORKDIR /app

COPY package.json ./
RUN npm install --production --legacy-peer-deps && \
    npm cache clean --force

# Copy built artifacts
COPY --from=backend-builder /app/dist/backend ./dist/backend
COPY --from=frontend-builder /app/dist/frontend ./dist/frontend

# Create non-root user
RUN chown -R 1001:0 /app && \
    chmod -R g=u /app

USER 1001

# Expose ports
EXPOSE 9000 9001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:9000/health || exit 1

# Start the backend server
CMD ["node", "dist/backend/backend/server.js"]
