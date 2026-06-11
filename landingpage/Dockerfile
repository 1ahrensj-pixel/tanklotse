FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:20-alpine AS build
WORKDIR /app
# NEXT_PUBLIC_* wird zur BUILD-Zeit ins Bundle eingebacken (Sitemap-Basis,
# Support-Mail). Ohne ARG sieht `npm run build` die Render/CI-Env nicht.
ARG NEXT_PUBLIC_SITE_URL
ARG NEXT_PUBLIC_SUPPORT_EMAIL
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL
ENV NEXT_PUBLIC_SUPPORT_EMAIL=$NEXT_PUBLIC_SUPPORT_EMAIL
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
# Kein COPY von public/: das Verzeichnis existiert in diesem Projekt nicht
# (Icons kommen aus app/icon.svg). Die fruehere Zeile
# `COPY ... 2>/dev/null || true` war ungueltige Dockerfile-Syntax und liess
# den Build crashen — COPY kennt keine Shell-Operatoren.
EXPOSE 3001
CMD ["node", "server.js"]
