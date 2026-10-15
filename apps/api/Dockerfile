# syntax=docker/dockerfile:1
# API imajı: monorepo'dan yalnızca @chorus/api ve üretim bağımlılıkları kopyalanır.

FROM node:22-alpine AS build
RUN corepack enable
WORKDIR /repo
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @chorus/shared build && pnpm --filter @chorus/api build
RUN pnpm --filter @chorus/api deploy --prod /out

FROM node:22-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /app
COPY --from=build /out ./
COPY --from=build /repo/apps/api/drizzle ./drizzle
EXPOSE 4000
# Migration'lar her başlangıçta idempotent olarak uygulanır, ardından sunucu açılır
CMD ["sh", "-c", "node dist/db/migrate.js && node dist/main.js"]
