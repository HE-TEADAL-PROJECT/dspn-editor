# ── Stage 1: build the frontend ──────────────────────────────────────────────
FROM node:22-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# ── Stage 2: production image ─────────────────────────────────────────────────
FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY server/ ./server/
COPY --from=builder /app/dist ./dist

RUN mkdir -p /data/projects

ENV NODE_ENV=production
ENV PROJECT_ROOT=/data/projects
ENV PORT=3001

EXPOSE 3001

CMD ["node", "server/index.js"]
