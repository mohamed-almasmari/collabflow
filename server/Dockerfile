FROM node:24-bookworm-slim AS base

WORKDIR /app

RUN apt-get update -y \
    && apt-get install -y --no-install-recommends openssl \
    && rm -rf /var/lib/apt/lists/*


FROM base AS builder

COPY package.json package-lock.json ./

RUN npm ci

COPY tsconfig.json ./
COPY prisma7.config.ts ./

COPY prisma ./prisma
COPY src ./src

RUN DATABASE_URL="postgresql://placeholder:placeholder@localhost:5432/collabflow_build" \
    npm run prisma:generate

RUN npm run build


FROM base AS runtime

ENV NODE_ENV=production

COPY package.json package-lock.json ./

RUN npm ci --omit=dev \
    && npm cache clean --force

COPY prisma7.config.ts ./
COPY prisma ./prisma

COPY --from=builder /app/dist ./dist

EXPOSE 3000

USER node

CMD ["node", "dist/server.js"]