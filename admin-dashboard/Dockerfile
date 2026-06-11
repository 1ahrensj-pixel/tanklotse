FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:20-alpine AS build
WORKDIR /app
# NEXT_PUBLIC_* wird zur BUILD-Zeit ins Bundle eingebacken (API-Basis + CSP
# connect-src). Ohne dieses ARG sieht `npm run build` die Render/CI-Env nicht
# und faellt still auf Defaults zurueck → Admin kann die API nicht erreichen.
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
EXPOSE 3002
CMD ["node", "server.js"]
