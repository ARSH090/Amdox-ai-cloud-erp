# Stage 1: Builder
FROM node:22-alpine AS builder
WORKDIR /app
COPY pnpm-lock.yaml package.json pnpm-workspace.yaml turbo.json ./
COPY apps/web ./apps/web
COPY packages ./packages
RUN corepack enable && pnpm install --frozen-lockfile
WORKDIR /app/apps/web
RUN pnpm run build

# Stage 2: Production (Distroless)
FROM gcr.io/distroless/nodejs22-debian12 AS production
WORKDIR /app
COPY --from=builder /app/apps/web/.next/standalone ./
COPY --from=builder /app/apps/web/.next/static ./.next/static
COPY --from=builder /app/apps/web/public ./public
USER nonroot:nonroot
EXPOSE 3000
CMD ["server.js"]
