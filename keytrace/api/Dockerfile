FROM node:20-alpine AS builder

WORKDIR /app

# Copy root workspace and package manifests
COPY package.json ./
COPY packages/shared/package.json ./packages/shared/
COPY api/package.json ./api/

RUN npm install --workspace=packages/shared --workspace=api

# Copy source files
COPY packages/shared ./packages/shared
COPY api ./api

# Build shared and api
RUN npm run build --workspace=packages/shared
RUN npm run build --workspace=api

# Production Runner
FROM node:20-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=4000

COPY package.json ./
COPY packages/shared/package.json ./packages/shared/
COPY api/package.json ./api/

RUN npm install --workspace=packages/shared --workspace=api --omit=dev

COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/api/dist ./api/dist

EXPOSE 4000

USER node

CMD ["node", "api/dist/server.js"]
