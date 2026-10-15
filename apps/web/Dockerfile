# syntax=docker/dockerfile:1
# Web imajı: Next.js standalone çıktısı. NEXT_PUBLIC_* değerleri build sırasında gömülür.

FROM node:22-alpine AS build
RUN corepack enable
WORKDIR /repo
COPY . .
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_WS_URL
ARG NEXT_PUBLIC_APP_URL
ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @chorus/shared build && pnpm --filter @chorus/web build

FROM node:22-alpine AS runtime
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0
WORKDIR /repo
COPY --from=build /repo/apps/web/.next/standalone ./
COPY --from=build /repo/apps/web/.next/static ./apps/web/.next/static
EXPOSE 3000
CMD ["node", "apps/web/server.js"]
