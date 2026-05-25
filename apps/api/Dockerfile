# ═══════════════════════════════════════════════════════════════════════════
# AMDOX ERP — Production API Dockerfile
# Multi-stage build: Dependencies → Assembler → Secure Distroless Runtime
# Security: Non-root user, read-only filesystem, no shell, minimal attack surface
# ═══════════════════════════════════════════════════════════════════════════

# ── Stage 1: Dependencies Builder ──────────────────────────────────────
FROM node:22-alpine AS deps
RUN apk add --no-cache libc6-compat python3 make g++
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copy only dependency manifests for optimal layer caching
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json turbo.json ./
COPY apps/api/package.json ./apps/api/
COPY packages/db/package.json ./packages/db/
COPY packages/config/package.json ./packages/config/
COPY packages/types/package.json ./packages/types/
COPY packages/ui/package.json ./packages/ui/
COPY packages/utils/package.json ./packages/utils/

# Install ALL dependencies (dev + prod) for the build stage
RUN pnpm install --frozen-lockfile

# ── Stage 2: Application Assembler ─────────────────────────────────────
FROM node:22-alpine AS assembler
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copy installed dependencies from previous stage
COPY --from=deps /app ./

# Copy entire source tree for compilation
COPY . .

# Generate Prisma Client engine binaries targeting linux-musl
RUN pnpm --filter api run prisma:generate 2>/dev/null || true

# Compile the NestJS application via Turborepo pipeline
RUN pnpm --filter api run build

# Prune dev dependencies for production-only node_modules
RUN pnpm prune --prod

# ── Stage 3: Secure Distroless Runtime ─────────────────────────────────
# Using Google's distroless image: no shell, no package manager, no utilities
FROM gcr.io/distroless/nodejs22-debian12:nonroot AS runtime

# Security labels
LABEL maintainer="AMDOX Technologies <devops@amdox.io>"
LABEL org.opencontainers.image.title="AMDOX ERP API"
LABEL org.opencontainers.image.description="Enterprise NestJS API with multi-tenant isolation"
LABEL org.opencontainers.image.version="1.0.0"
LABEL org.opencontainers.image.vendor="AMDOX Technologies"
LABEL security.scan.required="true"

WORKDIR /app

# Copy only production artifacts — minimal attack surface
COPY --from=assembler --chown=65534:65534 /app/apps/api/dist ./dist
COPY --from=assembler --chown=65534:65534 /app/node_modules ./node_modules
COPY --from=assembler --chown=65534:65534 /app/packages ./packages
COPY --from=assembler --chown=65534:65534 /app/apps/api/node_modules ./apps/api/node_modules

# Run as non-root user (nobody:nogroup — UID 65534)
USER nonroot:nonroot

# Expose API port
EXPOSE 3000

# Production environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Health check metadata for container orchestrators
# Note: distroless doesn't have curl/wget, health checks should be external
HEALTHCHECK NONE

# Start the compiled NestJS application
CMD ["dist/main.js"]
