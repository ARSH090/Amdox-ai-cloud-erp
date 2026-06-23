# Stage 1: Builder
FROM node:22-alpine AS builder
WORKDIR /app
COPY pnpm-lock.yaml package.json pnpm-workspace.yaml turbo.json ./
COPY apps/api ./apps/api
COPY packages ./packages
RUN corepack enable && pnpm install --frozen-lockfile
WORKDIR /app/apps/api
RUN pnpm run build && npx prisma generate

# Stage 2: Production (Distroless)
FROM gcr.io/distroless/nodejs22-debian12 AS production
WORKDIR /app
COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/apps/api/node_modules ./node_modules
COPY --from=builder /app/apps/api/prisma ./prisma
USER nonroot:nonroot
EXPOSE 3000
CMD ["dist/main.js"]
